import { Link } from "@tanstack/react-router";

import { APP_PAGES } from "@/lib/pages";

/** Home: one tile per main page. */
export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Budget Buddy</h1>
      <ul
        className="
          grid gap-4
          sm:grid-cols-2
        "
      >
        {APP_PAGES.map(page => (
          <li key={page.to}>
            <Link
              to={page.to}
              className="
                flex h-full gap-4 rounded-lg border bg-card p-5
                transition-colors
                hover:bg-accent
                focus-visible:ring-[3px] focus-visible:ring-ring/50
                focus-visible:outline-none
              "
            >
              <page.icon
                className="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden
              />
              <span className="space-y-1">
                <span className="block font-medium">{page.label}</span>
                <span className="block text-sm text-muted-foreground">{page.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
