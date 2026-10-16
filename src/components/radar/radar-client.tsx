"use client";

import { RefreshCw, Search, SearchX, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MOCK_SERVERS } from "@/lib/mock-servers";
import {
  filterServers,
  sortServers,
  type ServersPayload,
  type SortKey,
} from "@/lib/radar";
import { ServerCard } from "./server-card";

const REFRESH_INTERVAL_MS = 60_000;

const playerCountFormat = new Intl.NumberFormat("ru-RU");
const updatedAtFormat = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "players", label: "По онлайну" },
  { key: "name", label: "По названию" },
];

function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="h-2.5 w-16 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
          <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
          <div className="h-1.5 w-full animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

export function RadarClient() {
  const [payload, setPayload] = useState<ServersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usedLocalMock, setUsedLocalMock] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("players");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Чистый загрузчик без setState — применением данных занимаются колбэки.
  const fetchPayload = useCallback(async (): Promise<ServersPayload> => {
    try {
      const response = await fetch("/api/servers", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as ServersPayload;
      if (!Array.isArray(data.servers)) throw new Error("Unexpected payload");
      return data;
    } catch {
      // Наш API недоступен (например, статический хостинг) — включаем
      // локальный мок, чтобы UI оставался демонстрируемым.
      return {
        source: "mock",
        updatedAt: new Date().toISOString(),
        servers: MOCK_SERVERS,
      };
    }
  }, []);

  const applyPayload = useCallback((data: ServersPayload) => {
    setPayload(data);
    setUsedLocalMock(data.source === "mock");
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      applyPayload(await fetchPayload());
    } finally {
      setRefreshing(false);
    }
  }, [applyPayload, fetchPayload]);

  useEffect(() => {
    let cancelled = false;
    fetchPayload()
      .then((data) => {
        if (cancelled) return;
        applyPayload(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyPayload, fetchPayload]);

  // Автообновление для режима мониторинга; в скрытой вкладке не тикаем.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden) void fetchPayload().then(applyPayload);
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [applyPayload, fetchPayload]);

  const servers = useMemo(() => payload?.servers ?? [], [payload]);
  const visibleServers = useMemo(
    () => sortServers(filterServers(servers, query), sort),
    [servers, query, sort]
  );
  const totalPlayers = useMemo(
    () => servers.reduce((sum, server) => sum + server.players, 0),
    [servers]
  );

  const showMockNotice = payload?.source === "mock";
  const updatedAt = payload ? updatedAtFormat.format(new Date(payload.updatedAt)) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Активные сервера
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Сервера без онлайна скрыты. Обновление — раз в минуту.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="hidden text-xs text-muted-foreground sm:inline" aria-hidden="true">
              обновлено в {updatedAt}
            </span>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
              aria-hidden="true"
            />
            Обновить
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию или IP…"
            aria-label="Поиск по названию сервера или IP"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Сортировка"
          className="flex h-10 items-center rounded-lg border border-border bg-card p-0.5"
        >
          {SORT_OPTIONS.map((option) => {
            const active = sort === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(option.key)}
                className={`h-full rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {showMockNotice && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-300"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {usedLocalMock
              ? "Не удалось получить данные API — показаны локальные демо-данные."
              : "Мастер-лист недоступен — показаны демонстрационные данные."}
          </p>
        </div>
      )}

      {!payload || loading ? (
        <SkeletonGrid />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Найдено{" "}
            <span className="font-semibold text-foreground">
              {playerCountFormat.format(visibleServers.length)}
            </span>{" "}
            из {playerCountFormat.format(servers.length)} серверов ·{" "}
            <span className="font-semibold text-foreground">
              {playerCountFormat.format(totalPlayers)}
            </span>{" "}
            игроков онлайн
          </p>

          {visibleServers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground">
                Попробуйте изменить запрос или сбросить поиск.
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Сбросить поиск
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleServers.map((server) => (
                <ServerCard key={server.address} server={server} onNotify={notify} />
              ))}
            </div>
          )}
        </>
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
