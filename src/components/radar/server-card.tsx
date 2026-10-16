"use client";

import { Check, Copy, Lock, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RadarServer } from "@/lib/radar";

/** Копирование в буфер обмена с fallback для незащищённого контекста. */
async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // падаем в резервный способ ниже
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function fillPercent(players: number, maxPlayers: number): number {
  if (maxPlayers <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((players / maxPlayers) * 100)));
}

type ServerCardProps = {
  server: RadarServer;
  onNotify: (message: string) => void;
};

export function ServerCard({ server, onNotify }: ServerCardProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    const ok = await copyText(server.address);
    if (ok) {
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
      onNotify(`IP скопирован: ${server.address}`);
    } else {
      onNotify(`Не удалось скопировать: ${server.address}`);
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-400">Online</span>

        <span className="ml-auto flex items-center gap-2">
          {server.passworded && (
            <span
              title="Сервер защищён паролем"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Сервер с паролем</span>
            </span>
          )}
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {server.version}
          </span>
        </span>
      </div>

      <div className="min-w-0">
        <h3
          className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground sm:text-[15px]"
          title={server.hostname}
        >
          {server.hostname}
        </h3>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={server.address}>
          {server.address}
        </p>
      </div>

      <div className="mt-auto space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold tabular-nums text-card-foreground">{server.players}</span>
          <span className="text-muted-foreground">/ {server.maxPlayers} игроков</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={fillPercent(server.players, server.maxPlayers)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Заполненность сервера ${server.address}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${fillPercent(server.players, server.maxPlayers)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {server.mode}
        </span>
        {server.language && (
          <span className="truncate rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {server.language}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:active:scale-100"
        aria-label={`Скопировать адрес ${server.address}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? "Скопировано" : "Скопировать IP"}
      </button>
    </article>
  );
}
