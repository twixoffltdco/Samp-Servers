import { GITHUB_URL, LICENSE_NAME, SITE_NAME } from "@/lib/site";
import { GithubIcon } from "./github-icon";

export function RadarFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} {SITE_NAME} · Код распространяется под лицензией{" "}
          <a
            href={`${GITHUB_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {LICENSE_NAME}
          </a>
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>Данные: открытый мастер-лист SA-MP / open.mp</span>
          <a
            href="/api/servers"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            API
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
