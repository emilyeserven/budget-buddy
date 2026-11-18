---
name: client-data-hooks
description: >-
  Wire a client data hook (`packages/client/src/hooks/use<Entity>.ts`) in `@app/client` — the
  per-entity TanStack Query convention: a module-level query-key const in `hooks/queryKeys.ts`, the
  `createCrudApi(endpoint)` API factory, a `useX()` list query, `useCreate/Update/DeleteX` mutations
  with toasts, and the **invalidation graph** (each entity
  invalidates itself *plus every query that embeds its data*). Use when asked to "add/copy a data hook
  for X", "why is my list stale after saving X", "what should my mutation invalidate", "wire onSuccess
  invalidation", "add an extra endpoint to an API module", or when the `add-entity` skill's client
  hook step needs unpacking. Mirrors `hooks/useEntities.ts` + `lib/api/entities.ts`. Also
  covers maintaining a hook — "add a cross-entity invalidation", "a rename doesn't refresh the other
  list".
---

# Client data hooks

Every entity has an API module `packages/client/src/lib/api/<entity>.ts` and a data-hook file
`packages/client/src/hooks/use<Entity>.ts`. Copy the reference pair — **`lib/api/entities.ts`** +
**`hooks/useEntities.ts`** — rather than writing from scratch.

The non-mechanical part is the **invalidation graph** (§4): *who invalidates whom, and why*. A hook
whose data is embedded in another entity's response, but which only invalidates its own key, produces
a silent stale-UI bug that copy-from-sibling won't catch. That's the failure mode this skill exists to
prevent.

## 1. The API layer — `createCrudApi`

`createCrudApi<T, C, U>(endpoint)` in `packages/client/src/lib/api/client.ts` returns:

```ts
export const entitiesApi = createCrudApi<Entity, CreateEntityInput, UpdateEntityInput>("entities");
// → { list, create, update, remove }
```

- `list()` → `GET /api/<endpoint>` (`T[]`), `create(input)` → `POST`, `update(id, input)` → `PATCH
  /api/<endpoint>/:id`, `remove(id)` → `DELETE`.
- **The delete method is `remove`**, not `delete` (reserved word).
- **There is no `get(id)`** — single-entity lookups are a `.find` over the cached list (e.g.
  `data?.find(e => e.id === id)`), not a network call. Add a method only if the list is too large to
  hold.
- Type parameters come from the entity's `@app/types` module — never redeclare the shapes client-side.

Base plumbing in `client.ts`: `request<T>(path, init)` prefixes `/api`, sets
`Content-Type: application/json` **only when a body is present**, throws `ApiError` on a non-`ok`
response (passing through the server's `code`/`detail`/`params`), and returns `undefined` on 204.
`uploadFile(path, file)` is the multipart escape hatch (no content-type, so the browser adds the
boundary).

**Non-CRUD API modules** — when an entity doesn't expose the full CRUD surface, declare only the
methods it has with `request` (`lib/api/transactions.ts` is `list` + `import`; `lib/api/csvFormats.ts`
is `list` only). To add a method to a CRUD entity, spread the factory:

```ts
export const widgetsApi = {
  ...createCrudApi<Widget, CreateWidgetInput, UpdateWidgetInput>("widgets"),
  tree: () => request<WidgetNode[]>("/widgets/tree"),
};
```

**Error text** — caught errors become toast text via `describeError(err)` (`lib/apiError.ts`). See the
**`api-errors`** skill for the envelope and code → phrase mapping; don't re-derive it here.

## 2. Query keys

- **One exported `as const` array per entity, all in `hooks/queryKeys.ts`**: `export const
  ENTITIES_QUERY_KEY = ["entities"] as const;`. They live together because the invalidation graph
  crosses entities. Reuse the const for every read and invalidation — never retype the literal inline.
- The key string names the entity (`"entities"`, `"accounts"`, `"csvFormats"`).
- Nested keys **spread the base** so invalidating the base also invalidates them:
  `[...WIDGETS_QUERY_KEY, "tree"]`, `[...WIDGETS_QUERY_KEY, id, "children"]`.
- A cross-entity invalidation imports the other entity's key from `hooks/queryKeys.ts` — never from
  another hook file.
- The shared `queryClient` (`lib/queryClient.ts`) defaults to `staleTime: 30_000` and
  `refetchOnWindowFocus: false` — so after a write, **invalidation is the only thing that refreshes**
  another view promptly.

## 3. The hook set

```ts
export function useEntities() {
  return useQuery({ queryKey: ENTITIES_QUERY_KEY, queryFn: entitiesApi.list });
}
```

- Export only hooks something uses — an unused export trips the `fallow` dead-code gate, so don't
  add lookup helpers speculatively.
- **Mutations** use a `{ id, input }` variable shape for update, and wire invalidation in `onSuccess`.
- **One invalidation helper per hook file** — `useEntitiesInvalidation()` in `hooks/useEntities.ts`
  is a hook-closure returning `() => Promise.all([...keys].map(queryKey =>
  queryClient.invalidateQueries({ queryKey })))`. Every mutation calls it, so when a
  dependent appears (§4) there is exactly one place to add it. If create/update/delete legitimately
  need *different* key sets, make that explicit (separate helpers or a parameter) rather than inlining
  ad-hoc lists — divergent inline lists are exactly where an omission hides.

## 4. The invalidation graph

Each mutation invalidates **its own key** plus the keys of every query whose response **embeds** this
entity's data. Decide the dependents by these rules, not by copying a sibling:

- **Is this entity's data embedded in another entity's response?** (e.g. accounts come back with
  `institutionName`/`ownerName`, transactions with `accountName`/`payeeName`/`splitterName`.) ⇒
  invalidate that other key on **update, delete, and any bulk op**. Create needs it only if the new
  row can already be referenced — the existing hooks simply reuse one helper for all three. The
  symptom of missing this: renaming X doesn't refresh the list that shows X's name.
- **Check the embedded shape before deciding.** If the other entity embeds only X's
  `name`, then an image/description change to X does **not** need to invalidate it — only a
  rename does. Mirror the shared type in `@app/types`, and leave a comment when you deliberately skip a
  key so the asymmetry isn't "fixed" later.
- **Join/assignment writes** (an `[key, ownerType, ownerId]`-style per-owner query) can
  `setQueryData` the owner key from the response and then invalidate the parent list(s) that show
  counts or names.
- **Server-derived aggregates** (counts, trees) live under nested keys of the base — spreading the base
  key means invalidating the base covers them.
- **Writes that create other entities** invalidate those too — `useImportTransactions()` invalidates
  transactions, entities (new payees), CSV formats (a saved format) and accounts (a linked format).
- **Self-contained entities** (nothing embeds them) invalidate only themselves.

When you add a dependent, keep a short table like this in the PR description (or a comment above the
helper) so the graph stays reviewable:

| Entity (hook) | Own key | Also invalidates | Why |
|---|---|---|---|
| Entities (`useEntities`) | `entities` | `accounts`, `transactions` | accounts embed institution/owner names; transactions embed payee/splitter names |
| Accounts (`useAccounts`) | `accounts` | `transactions` | transactions embed the account name |
| Import (`useImportTransactions`) | `transactions` | `entities`, `csvFormats`, `accounts` | import creates payees and formats, links a format to the account |

## 5. Toasts

Fire toasts **from the mutation hook**, not the call site, so a bare `.mutate()` can't be silent. Use
`notifySuccess` / `notifyError` from `lib/notifications.ts`, with `describeError(err)` for the error
text. The `useEntities.ts` convention:

- **create** → `notifySuccess(`Created "${entity.name}"`)` + `onError: notifyError(...)`.
- **delete** → `notifySuccess("Deleted entity")` + `onError`.
- **update** → **no toast in the hook** when the UI auto-saves per field: the call site fires a
  field-named `notifyFieldSaved("Name")` / `notifyFieldSaveError(...)` from `lib/autoSave.ts`
  (see `useSaveEntityField` in `EntitiesManager.tsx`), and a generic "saved" toast would double up.

The two-layer notify contract (sonner toast + persistent notification log) and how to test it are
owned by the **`toast-notifications`** skill. In tests, never `vi.mock` `lib/notifications` /
`lib/autoSave` directly — assert on the real store or use `test-utils/toastSpies.ts` (see
**`test-structure`**).

## Verify

```
pnpm --filter=@app/client typecheck
pnpm --filter=@app/client test
```

Then spot-check the graph: for the entity you touched, confirm every mutation's invalidation covers
its own key **and** every key whose response embeds it, on update **and** delete.
