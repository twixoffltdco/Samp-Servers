/**
 * Ядро "радара": типы, загрузка и нормализация данных мастер-листа SA-MP/open.mp.
 *
 * Источник по умолчанию — открытый API https://api.open.mp/servers
 * (мастер-лист SA-MP 0.3.7 / 0.3.DL / open.mp). URL можно переопределить
 * переменной окружения RADAR_UPSTREAM_URL, если нужно читать другой API.
 *
 * Формат апстрима — JSON-массив с короткими ключами:
 *   ip  — "1.2.3.4:7777", hn — hostname, pc — players count, pm — max players,
 *   gm — gamemode, la — language, pa — passworded, vn — version, omp — open.mp.
 */

export type SortKey = "players" | "name";

export type RadarServer = {
  /** Адрес в формате "ip:port" — используется для поиска и копирования. */
  address: string;
  hostname: string;
  players: number;
  maxPlayers: number;
  /** Сырое название режима от владельца сервера. */
  gamemode: string;
  /** Короткая метка режима: RP, DM, Freeroam и т.д. */
  mode: string;
  version: string;
  language: string;
  passworded: boolean;
  openmp: boolean;
};

export type ServersPayload = {
  /** live — данные мастер-листа, mock — демонстрационные данные. */
  source: "live" | "mock";
  /** ISO-время последнего успешного обновления. */
  updatedAt: string;
  servers: RadarServer[];
};

const UPSTREAM_URL = process.env.RADAR_UPSTREAM_URL || "https://api.open.mp/servers";
const REQUEST_TIMEOUT_MS = 10_000;

type RawServer = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

const MODE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\btdm\b/i, "TDM"],
  [/death\s*match|\bdm\b/i, "DM"],
  [/role\s*play|\brp\b/i, "RP"],
  [/free\s*roam|\bfr\b/i, "Freeroam"],
  [/stunt|derby/i, "Stunt"],
  [/\brac(e|ing)\b|drift/i, "Race"],
  [/\bctf\b/i, "CTF"],
  [/\bwar\b|battle/i, "War"],
];

/** Определяет короткую метку режима по gamemode или названию сервера. */
export function detectMode(gamemode: string, hostname: string): string {
  const haystack = `${gamemode} ${hostname}`;
  for (const [pattern, label] of MODE_RULES) {
    if (pattern.test(haystack)) return label;
  }
  const raw = gamemode.slice(0, 24);
  return raw || "Другое";
}

/** Возвращает null для пустых (0 онлайн) и некорректных записей — жёсткий фильтр. */
export function normalizeServer(raw: RawServer): RadarServer | null {
  const address = asString(raw.ip);
  if (!address || !address.includes(":")) return null;

  const players = asNumber(raw.pc);
  const maxPlayers = asNumber(raw.pm);
  if (players <= 0) return null;

  const gamemode = asString(raw.gm);
  const hostname = asString(raw.hn) || address;

  return {
    address,
    hostname,
    players: maxPlayers > 0 ? Math.min(players, maxPlayers) : players,
    maxPlayers,
    gamemode,
    mode: detectMode(gamemode, hostname),
    version: asString(raw.vn) || "unknown",
    language: asString(raw.la),
    passworded: raw.pa === true,
    openmp: raw.omp === true,
  };
}

export async function fetchActiveServers(): Promise<ServersPayload> {
  const response = await fetch(UPSTREAM_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    // Кэшируем ответ на 60 секунд, чтобы не долбить мастер-лист от каждого клиента.
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Upstream responded with ${response.status}`);
  }

  const data: unknown = await response.json();
  const list: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { servers?: unknown[] })?.servers)
      ? ((data as { servers: unknown[] }).servers)
      : [];

  const servers = list
    .filter((item): item is RawServer => typeof item === "object" && item !== null)
    .map(normalizeServer)
    .filter((item): item is RadarServer => item !== null);

  return { source: "live", updatedAt: new Date().toISOString(), servers };
}

/** Сортировка списка: по онлайну (убывание) или по названию. */
export function sortServers(servers: RadarServer[], sort: SortKey): RadarServer[] {
  const sorted = [...servers];
  if (sort === "players") {
    sorted.sort((a, b) => b.players - a.players);
  } else {
    const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });
    sorted.sort((a, b) => collator.compare(a.hostname, b.hostname));
  }
  return sorted;
}

/** Поиск по названию, IP и режиму без учёта регистра. */
export function filterServers(servers: RadarServer[], query: string): RadarServer[] {
  const q = query.trim().toLowerCase();
  if (!q) return servers;
  return servers.filter((server) =>
    `${server.hostname} ${server.address} ${server.mode}`.toLowerCase().includes(q)
  );
}
