import { Radar } from "lucide-react";
import Link from "next/link";
import { GITHUB_URL, SITE_NAME } from "@/lib/site";
import { GithubIcon } from "./github-icon";

export function RadarHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3"
          aria-label={SITE_NAME}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25 transition-colors group-hover:bg-primary/25">
            <Radar className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight sm:text-base">
              {SITE_NAME}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Мониторинг активных серверов SA-MP и CRMP
            </span>
          </span>
        </Link>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Репозиторий проекта на GitHub"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GithubIcon className="h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
