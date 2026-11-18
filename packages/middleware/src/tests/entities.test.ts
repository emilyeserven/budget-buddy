import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { EntityType } from "@app/types";
import { accounts, csvFormats, entities, transactions } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/entities.ts` exercised against the shared in-memory fake `db` (`testDbHelpers.ts`) —
 * there is no live-Postgres harness. `mock.module` swaps `@/db` before the service module is first
 * imported (ESM import caching), so the mock must be installed up front and the service imported
 * dynamically afterwards. This is the reference recipe for a DB-touching service test.
 */

type Row = Record<string, unknown>;

const entityRows: Row[] = [];
const accountRows: Row[] = [];
const transactionRows: Row[] = [];

const db = createFakeDb([
  {
    table: entities,
    rows: entityRows,
  },
  {
    table: accounts,
    rows: accountRows,
  },
  {
    table: csvFormats,
    rows: [],
  },
  {
    table: transactions,
    rows: transactionRows,
  },
]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  createEntity, deleteEntity,
} = await import("@/services/entities");

function reset(): void {
  resetFakeIds();
  for (const rows of [entityRows, accountRows, transactionRows]) rows.length = 0;
  entityRows.push({
    id: "bank",
    name: "Acme Bank",
    type: EntityType.Commercial,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

test("createEntity rejects a duplicate name with a 409", async () => {
  reset();
  await assert.rejects(createEntity({
    name: " Acme Bank ",
    type: EntityType.Commercial,
  }), {
    code: "duplicateName",
    statusCode: 409,
  });
});

test("deleteEntity refuses while an account references it", async () => {
  reset();
  accountRows.push({
    id: "acct",
    institutionId: "bank",
    ownerId: "someone",
  });
  await assert.rejects(deleteEntity("bank"), {
    code: "conflict",
    statusCode: 409,
  });
  assert.equal(entityRows.length, 1);
});

test("deleteEntity removes an unreferenced entity", async () => {
  reset();
  await deleteEntity("bank");
  assert.equal(entityRows.length, 0);
});
