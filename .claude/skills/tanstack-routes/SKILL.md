---
name: tanstack-routes
description: >-
  TanStack Router file-based routing conventions for the client — how route files are named
  (`index`, `$param`, `_pathless` layouts, `route.tsx`, `(group)` folders, `_` un-nesting, `$` splat,
  `-` ignored files), where route-only code lives (`-components` / `-utils` / `-constants` folders
  colocated with the route, promoted up the tree as it gets shared, and moved to `src/components` /
  `src/lib` once unrelated branches share it), typed search params, redirects, and regenerating
  `routeTree.gen.ts`. Use when asked to "add a page/route", "add a detail/edit page", "add a nested or
  layout route", "where should this component/helper live", "move a component next to its route",
  "why isn't my route showing up", "the route tree is out of date", or "add a ?tab= search param".
---

# TanStack Router routes: naming + colocation

The client uses **file-based routing**: every file under `packages/client/src/routes/` is a route
unless its name (or a parent folder's name) starts with `-`. The `tanstackRouter` Vite plugin
(`packages/client/vite.config.ts`, `autoCodeSplitting: true`) generates
`packages/client/src/routeTree.gen.ts` from the folder. Official reference:
[TanStack Router — File Naming Conventions](https://tanstack.com/router/latest/docs/framework/react/routing/file-naming-conventions).

**Never hand-edit `routeTree.gen.ts`.** It regenerates during `pnpm dev` / `pnpm build`, or on demand:

```bash
pnpm --filter=@app/client routeTree
```

Commit the regenerated file with the route change. CI typechecks against it, so a stale tree fails
`pnpm typecheck` (`<Link to>` and `createFileRoute("…")` paths are type-checked against it).

## Current tree (the reference)

```
routes/
  __root.tsx                  root route (RouterContext with queryClient) → RootLayout
  -rootLayout.tsx             ignored by the generator: the root's layout component
  -components/
    HomePage.tsx (+ .test/.stories)   used only by the "/" route
  index.tsx                   "/"
  entities/
    index.tsx                 "/entities/" (reached with <Link to="/entities">)
    -components/
      EntitiesManager.tsx     used only by the /entities route…
      EntitiesManager.test.tsx   …so it, its test, and its story live beside that route
      EntitiesManager.stories.tsx
  accounts/                   same shape: index.tsx + -components/AccountsManager.*
  transactions/               same shape: index.tsx + -components/TransactionsTable.*
  import/
    index.tsx                 "/import/"
    -components/              CsvImportPage, CsvPreviewTable, useCsvImport, useColumnMapping, …
    -utils/                   parseCsv, matchFormats, normalizeRows (each with its .test.ts)
```

## File naming

| Name | Meaning | Example → URL |
|---|---|---|
| `__root.tsx` | The root route. Exactly one. | `routes/__root.tsx` |
| `index.tsx` | The index of its folder (the page at the folder's own URL). | `entities/index.tsx` → `/entities` |
| `foo.tsx` / `foo/index.tsx` | A static segment. | `about.tsx` → `/about` |
| `a.b.tsx` (flat dots) | Nesting without folders: each `.` is a `/`. | `entities.$entityId.tsx` → `/entities/:entityId` |
| `$param` | A dynamic segment, read with `Route.useParams()`. | `entities/$entityId.tsx` → `/entities/:entityId` |
| `route.tsx` | The **layout** route for a folder: it renders `<Outlet />` and wraps every file in that folder. | `entities/route.tsx` wraps `entities/index.tsx` and `entities/$entityId.tsx` |
| `_name` (prefix) | **Pathless layout**: wraps its children but adds no URL segment. | `entities/_hub.tsx` + `entities/_hub.archived.tsx` → `/entities/archived` |
| `name_` (suffix) | **Un-nest**: the URL keeps the segment but the route doesn't render inside that segment's layout. | `entities_.$entityId.edit.tsx` → `/entities/:entityId/edit`, not wrapped by `entities/route.tsx` |
| `(group)` folder | Organizes files only; no URL segment and no layout. | `(admin)/settings/index.tsx` → `/settings` |
| `$.tsx` | Splat / catch-all; the rest of the path is in `params._splat`. | `files/$.tsx` → `/files/*` |
| `-name` (prefix) | **Ignored by the generator.** Not a route; use it for colocated code. | `-rootLayout.tsx`, `-components/` |

The id you pass to `createFileRoute` must match the file's generated id. Write the file with an empty
`createFileRoute()` and run `routeTree`, or copy the id from `routeTree.gen.ts`. Index ids end in `/`
(`createFileRoute("/entities/")`), and `(group)` / `_` ids keep those tokens (`"/(admin)/settings/"`,
`"/entities_/$entityId/edit"`). `<Link to>` takes the clean URL (`"/entities"`, `"/settings"`).

**Folders vs flat dots.** Both styles produce the same tree; pick per subtree and stay consistent.
**Use folders whenever the route has colocated code** (a `-components` folder needs a folder to sit
in), so most feature routes end up as folders. Flat dots are fine for leaf routes that have none.

**Anything that isn't a route must be `-`-prefixed**, or live in a `-` folder. That includes tests and
stories that sit near routes. A stray `routes/entities/foo.test.tsx` triggers a "does not export a Route"
warning on every generate. Put it in `-components/` instead.

## Writing a route file

Keep the route file thin: it declares the route and wires the page component. Logic and JSX live in
`-components` (or `src/components`).

```tsx
// routes/entities/$entityId.tsx (hypothetical detail page)
import { createFileRoute } from "@tanstack/react-router";

import { EntityDetail } from "./-components/EntityDetail";

export const Route = createFileRoute("/entities/$entityId")({
  component: EntityDetailPage,
});

function EntityDetailPage() {
  const { entityId } = Route.useParams();
  return <EntityDetail id={entityId} />;
}
```

- **Data**: fetch with the TanStack Query hooks in `src/hooks/` (see **`client-data-hooks`**), not
  route `loader`s. The router context carries `queryClient` (`__root.tsx`) if a loader is ever
  needed to prefetch.
- **Typed search params**: declare `validateSearch` so `Route.useSearch()` is typed and junk input
  falls back to a default. Use a small hand-written validator (`isEnumValue` from `@app/types` fits a keyed-const enum):

  ```tsx
  const TABS = ["details", "history"] as const;
  type Tab = typeof TABS[number];

  export const Route = createFileRoute("/entities/$entityId")({
    validateSearch: (search: Record<string, unknown>): { tab: Tab } => ({
      tab: TABS.includes(search.tab as Tab) ? search.tab as Tab : "details",
    }),
    component: EntityDetailPage,
  });
  ```

  Prefer a `?tab=` search param over one route file per tab.
- **Redirects**: `beforeLoad: () => { throw redirect({ to: "/entities" }); }`. Use it for an index that
  should forward to a default child, and for old URLs kept alive after a rename.
- **Layouts** (`route.tsx` / `_pathless`) render `<Outlet />` where the child goes. Put shared chrome
  here (a header, a tab strip), not repeated in every child.
- **Lint**: route files are exempt from `react-refresh/only-export-components` (they export `Route`).
  `-`-prefixed files and folders are **not** exempt, so they stay normal component modules
  (`eslint.config.js`).
- **Navigation**: add top-level pages to `APP_PAGES` in `src/lib/pages.ts` (and its `AppPage["to"]`
  union) — the sidebar's `NAV_ITEMS` (`src/components/AppSidebar.tsx`) and the Home tiles render from it.

## Colocation: `-components`, `-utils`, `-constants`

Code that only routes use lives **next to the route that uses it**, in `-` folders the generator
ignores:

```
routes/entities/
  index.tsx
  $entityId.tsx
  -components/   React components (with their .test.tsx / .stories.tsx beside them)
  -utils/        pure helpers (with their .test.ts beside them)
  -constants/    constants, option lists, as-const tuples
```

Placement rules, applied the same way to components, utils, and constants:

1. **Used by a single route → that route's own `-components` / `-utils` / `-constants` folder.**
   Don't put single-route code in `src/components/` or `src/lib/`.
2. **Used by a parent route and others under it → promote it to the highest `-` folder that covers
   every user.** That's the folder of the nearest route that is an ancestor of all of them. Example:
   used by `entities/index.tsx` and `entities/$entityId.tsx` → `entities/-components/`. Used by
   `entities/$entityId/index.tsx` and `entities/$entityId/edit.tsx` → `entities/$entityId/-components/`.
   Promote **only as high as needed**: if two siblings under `entities/` share it, it goes in
   `entities/-components/`, not the root's.
3. **Used across `-` folders that don't share the same direct parent route → move it to the shared
   app folders**: components → `src/components/`, utils and constants → `src/lib/`. Don't reach
   across branches (`routes/accounts/-components/` importing from `routes/entities/-components/`), and
   don't park cross-branch code in the root `routes/-components/`.
4. **Moving goes both ways.** When the last user outside a folder goes away, move the code back down
   to the route that still uses it.
5. **Move the whole unit**: the component plus its `.test.tsx` and `.stories.tsx`, or the helper plus
   its `.test.ts`. Use `@/…` imports for app-wide code (`@/hooks/useEntities`, `@/test-utils/factories`)
   and relative `./` imports within a `-` folder, so the move only touches the files that actually
   import it.

Shared building blocks (`src/components/ui/` primitives, `AppSidebar`, `ThemeToggle`, app-wide hooks
in `src/hooks/`, stores, `src/lib/api/`) are not route-scoped and stay where they are.

Tooling already handles `-` folders: Vitest and Storybook glob the whole of `src/`, and fallow reaches
route files through `routeTree.gen.ts` (via `main.tsx`), so an unused file in a `-components` folder is
still reported as dead code. Don't add a `routes/**` entry glob to `.fallowrc.jsonc`: it would mark
every colocated file as an entry point and hide dead code.

## Adding a page (checklist)

1. Create the route file (`routes/<path>/index.tsx` or `$param.tsx`), plus `route.tsx` if the folder
   needs a shared layout.
2. Put its component(s) in the route's `-components/`, with a test and story beside them (see
   **`test-structure`**, **`storybook-story`**).
3. `pnpm --filter=@app/client routeTree`, then fix the `createFileRoute` id if the generator renamed it.
4. Add an `APP_PAGES` entry (`src/lib/pages.ts`) if it's top-level.
5. `pnpm typecheck && pnpm lint && pnpm --filter=@app/client test`.

For a whole new entity (API + hooks + page), start from **`add-entity`**, which calls into this skill
for its route step.
