---
name: add-entity
description: >-
  Add a new entity end to end in this app — a shared type module in `@app/types`, a Drizzle table
  (plus the `migrate.ts` pre-create a new table needs), a service with name-uniqueness and
  referenced-delete checks, a Fastify route module registered in `app.ts`, a middleware fake-db test,
  the client API module + TanStack Query hook, a component + file route, an `APP_PAGES` entry (sidebar
  + Home tile), and the test factory / MSW handler / story / test. Use when asked to "add a new
  entity/table/resource/content type", "add CRUD for X", "scaffold X like entities", or "give X its own
  page". Mirrors the reference entity, `entities`. Also the map for maintaining an entity — renaming,
  adding a field, or removing it (each step below is a sync point; the sibling skills it links cover
  field-level detail).
---

# Add an entity

The reference entity is **`entities`** (`id, name, type, defaultSplitterId, defaultSplit,
specialSplitType, specialSplitValue, createdAt, updatedAt`), wired through every layer. A new entity
copies that surface file by file. Below, `widgets` / `Widget` stands for your new entity — replace it
throughout. (`accounts` and `transactions` are fuller examples of the same shape: server-side joined
names, bulk import.)

Build order is **types → middleware → client** (`pnpm build` and `pnpm typecheck` build `@app/types`
first), so keep the shared types compiling before moving on.

## Checklist

### 1. Shared types — `packages/types/src/widgets.ts`

Copy `packages/types/src/entities.ts`: the wire shape (`Widget`, dates as ISO strings), `CreateWidgetInput`,
and `UpdateWidgetInput = Partial<CreateWidgetInput>`. Any string union that crosses the package
boundary is a keyed const object —
`export const WidgetKind = { Foo: "foo" } as const; export type WidgetKind = typeof WidgetKind[keyof typeof WidgetKind];`
(see `EntityType`) — spread into wire schemas with `enumValues(X)` from `packages/types/src/enums.ts`.
Then re-export the module from `packages/types/src/index.ts` **with a `.js` extension** —
`export * from "./widgets.js";` — the package emits native ESM, so an extensionless specifier builds
locally but breaks consumers. `index.ts` only re-exports; never declare types there.

### 2. Schema — `packages/middleware/src/db/schema.ts` (+ `migrate.ts`)

Add the `pgTable` beside `entities`: `uuid` id with `defaultRandom()`, `name` (`.notNull().unique()` if
names must be unique), enum columns as `text("col", { enum: enumValues(X) })`, FKs via
`.references(() => other.id)`, and the shared `...timestamps` spread (`withTimezone`
`createdAt`/`updatedAt`).

**Also pre-create the table in `packages/middleware/src/db/migrate.ts` — required, not optional.**
Against a populated database `drizzle-kit push` treats a new table as a "truncate?" prompt; in the
non-TTY production deploy it bails while exiting 0, silently skipping the table (and any other additive
change in that run), and every query then 500s with `relation … does not exist`. Add an idempotent
`CREATE TABLE IF NOT EXISTS` step mirroring the schema (see the `pre-create entities table` step),
with **no `REFERENCES` to a push-created table** (declare FK columns as plain `uuid`; push adds the
constraint). The full rules are in the **`db-schema-change`** skill. Then `pnpm push:dev`.

### 3. Service — `packages/middleware/src/services/widgets.ts`

Copy `services/entities.ts`. It gives the canonical shape:

- a `toWidget(row)` mapper (Date → ISO string, `?? null` for nullable columns) — the only place a row
  becomes the wire type;
- `list/get/create/update/delete` functions; `create`/`update` trim the name and check it with an
  `assertNameFree(name, exceptId?)` helper; `update` builds a `patch` from only the defined input
  fields;
- failures are **thrown** `AppError` subclasses from `utils/errors.ts` —
  `NotFoundError("Widget")`, `DuplicateNameError("widget", name)`, and `ConflictError` (409) when a
  delete would orphan rows that still reference it (`deleteEntity`'s `isReferenced` check) — never
  error bodies built in the route (see **`api-errors`**).

If the response needs another table's data (a name for a FK), join it here, not in the client —
`services/accounts.ts` returns `institutionName`/`ownerName` this way.

### 4. Routes — `packages/middleware/src/routes/widgets.ts`

Copy `routes/entities.ts`: module-level `as const` JSON-schema consts (response schema, `idParams`, one
shared body-properties object reused by `createBody`/`updateBody`, both `additionalProperties:
false`, enum fields as `enum: enumValues(X)`), `const tags = ["widgets"]`, and request generics typed
with the `@app/types` inputs. Then in `packages/middleware/src/app.ts`:

- `import { widgetRoutes } from "@/routes/widgets";` and `await app.register(widgetRoutes);` — an
  unregistered module just 404s;
- add `{ name: "widgets", description: "…" }` to the swagger `openapi.tags` array.

**Every field must be in the body schema** or AJV's `removeAdditional` silently strips it — the
**`add-endpoint`** skill covers this trap and the status-code conventions.

### 5. Middleware test — `packages/middleware/src/tests/widgets.test.ts`

Copy `tests/entities.test.ts`: register every table the service touches with `createFakeDb` from
`tests/testDbHelpers.ts`, `mock.module("@/db", …)` **before** dynamically importing the service, and
cover the domain rules (duplicate-name 409, delete-while-referenced 409, not-found). See
**`test-structure`** for the harness and **`what-not-to-test`** for what to skip. Run
`pnpm --filter=@app/middleware test`.

### 6. Client API — `packages/client/src/lib/api/widgets.ts`

```ts
export const widgetsApi = createCrudApi<Widget, CreateWidgetInput, UpdateWidgetInput>("widgets");
```

The endpoint string is the route path after `/api/`.

### 7. Client hook — `packages/client/src/hooks/useWidgets.ts`

Copy `hooks/useEntities.ts`: add `WIDGETS_QUERY_KEY` to `hooks/queryKeys.ts`, then `useWidgets()`,
one `useWidgetsInvalidation()` helper, and `useCreate/Update/DeleteWidget` (create/delete toast;
update is silent because edit surfaces toast per field). **Decide the invalidation graph** — if any
other entity's response embeds widget data, its key must be invalidated too (entities fan out to
accounts and transactions). See **`client-data-hooks`**.

### 8. Route + colocated component

Follow the **`tanstack-routes`** skill for naming and colocation. Mirroring Entities:

- `packages/client/src/routes/widgets/index.tsx`, copying `routes/entities/index.tsx`:
  `createFileRoute("/widgets/")({ component: WidgetsManager })`.
- `packages/client/src/routes/widgets/-components/WidgetsManager.tsx`, modeled on
  `routes/entities/-components/EntitiesManager.tsx`: a create form with plain `useState` + `Input` +
  `EnumSelect` (`components/EnumSelect.tsx`) and an explicit submit, and a `DataTable` whose cells
  auto-save per field — text on blur, selects on change, no-op when unchanged — via
  `notifyFieldSaved`/`notifyFieldSaveError` (no Save button; see **`toast-notifications`**). It lives
  in the route's `-components` folder because only this route uses it; promote it per the colocation
  rules if another route starts importing it. If it grows past fallow's complexity cap, split it per
  **`decompose-over-cap`**.
- Regenerate the route tree: `pnpm --filter=@app/client routeTree` (the Vite plugin also does it during
  `dev`/`build`). Never hand-edit `routeTree.gen.ts`.

### 9. Navigation — `packages/client/src/lib/pages.ts`

Add `"/widgets"` to the `AppPage["to"]` union and a `{ to: "/widgets", label: "Widgets", description:
"…", icon: <LucideIcon> }` entry to `APP_PAGES`. Both the sidebar (`NAV_ITEMS` in
`components/AppSidebar.tsx`) and the Home tiles (`routes/-components/HomePage.tsx`) render from it.

### 10. Factory, MSW handler, story, test

- **Factory** — add `makeWidget(overrides)` to `packages/client/src/test-utils/factories.ts` beside
  `makeEntity`. Tests, stories and mocks build objects only through it — never inline literals that
  re-list every field (they drift silently when the type changes).
- **MSW handlers** — add `sampleWidgets` and GET/POST/PATCH/DELETE `/api/widgets` handlers to
  `apiHandlers` in `packages/client/src/test-utils/story-mocks.ts`. MSW is story-only; unit tests stub
  `fetch`.
- **Story** — `routes/widgets/-components/WidgetsManager.stories.tsx`, copying `EntitiesManager.stories.tsx` (Default +
  Empty via `parameters.msw.handlers`). See **`storybook-story`**.
- **Test** — `routes/widgets/-components/WidgetsManager.test.tsx`, copying `EntitiesManager.test.tsx`
  (`vi.stubGlobal("fetch", …)` + `renderWithRouter` from `test-utils/router.tsx`, asserting on the real
  notification store). A pure `.test.ts` with no DOM gets the `// @vitest-environment node` pragma —
  see **`vitest-node-environment`**.

## Removing or renaming an entity

Walk the same ten steps in reverse. Dropping the table needs a guarded `DROP TABLE IF EXISTS` step in
`migrate.ts` (push never drops data itself — see the `drop starter items table` step); a rename of a
table/column is likewise a `migrate.ts` step, not a schema-only edit. Then run `pnpm fallow` to catch
leftover exports and dependencies.

## Verify

Run the **`verify`** skill, or at minimum:

```
pnpm typecheck
pnpm test
pnpm lint:fix            # always from the repo root
pnpm push:dev            # twice — the second run must be a no-op
```

Then `pnpm dev`, open `/widgets` from the sidebar, create / edit / delete a row, and check the
`widgets` group at `/docs`.
