import type { ImportTransactionRow } from "@app/types";

import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { DateFormat, EntityType, TransactionColumn } from "@app/types";
import { accounts, csvFormats, entities, transactions } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/transactions.ts` import path against the in-memory fake `db` (see `items.test.ts` for
 * the recipe): count-based dedup, payee find-or-create, sign inversion, and saving a new format.
 */

type Row = Record<string, unknown>;

const entityRows: Row[] = [];
const accountRows: Row[] = [];
const formatRows: Row[] = [];
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
    rows: formatRows,
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
  importTransactions, listTransactions,
} = await import("@/services/transactions");

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

function reset(account: Row = {}): void {
  resetFakeIds();
  for (const rows of [entityRows, accountRows, formatRows, transactionRows]) rows.length = 0;
  entityRows.push({
    id: "bank",
    name: "Acme Bank",
    type: EntityType.Commercial,
  }, {
    id: "me",
    name: "Me",
    type: EntityType.Household,
  });
  accountRows.push({
    id: ACCOUNT_ID,
    name: "Checking",
    type: "checking",
    institutionId: "bank",
    ownerId: "me",
    invertAmounts: false,
    csvFormatId: null,
    ...account,
  });
}

function csvRow(overrides: Partial<ImportTransactionRow> = {}): ImportTransactionRow {
  return {
    name: "NORTHWIND UTILITIES ONLINE",
    date: "2025-03-10",
    time: null,
    total: -42.17,
    description: null,
    payeeName: "NORTHWIND UTILITIES",
    extra: null,
    rawCSV: "2025-03-10,-42.17,NORTHWIND UTILITIES ONLINE",
    ...overrides,
  };
}

test("a re-import of an overlapping file skips the overlap and keeps the new rows", async () => {
  reset();
  const first = [csvRow(), csvRow({
    date: "2025-03-11",
    name: "GLOBEX SOFTWARE",
    payeeName: "GLOBEX SOFTWARE",
  })];
  const result1 = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: first,
  });
  assert.deepEqual([result1.imported, result1.skipped], [2, 0]);

  const result2 = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [...first, csvRow({
      date: "2025-03-12",
      name: "SERVICE CHARGE",
      payeeName: "SERVICE CHARGE",
    })],
  });
  assert.deepEqual([result2.imported, result2.skipped], [1, 2]);
  assert.equal(transactionRows.length, 3);
});

test("genuine repeats in one file are all kept, and only the surplus over stored rows is imported", async () => {
  reset();
  const result1 = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow(), csvRow()],
  });
  assert.equal(result1.imported, 2);

  const result2 = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow(), csvRow(), csvRow()],
  });
  assert.deepEqual([result2.imported, result2.skipped], [1, 2]);
  assert.equal(transactionRows.length, 3);
});

test("a different total or time on the same day is a different transaction", async () => {
  reset();
  await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow()],
  });
  const result = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow({
      total: -18.75,
    }), csvRow({
      time: "13:05:52",
    })],
  });
  assert.equal(result.imported, 2);
});

test("payees are matched by name and missing ones created once as commercial entities", async () => {
  reset();
  const result = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow(), csvRow({
      date: "2025-03-11",
    }), csvRow({
      payeeName: "Acme Bank",
    })],
  });
  assert.equal(result.createdPayees, 1);
  const northwind = entityRows.filter(row => row.name === "NORTHWIND UTILITIES");
  assert.equal(northwind.length, 1);
  assert.equal(northwind[0].type, EntityType.Commercial);
  assert.equal(transactionRows[2].payeeId, "bank");
});

test("an empty payee falls back to the name, and an empty name to the payee", async () => {
  reset();
  await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow({
      payeeName: "  ",
      name: "PIXEL ARCADE",
    }), csvRow({
      name: "",
      payeeName: "BLUE HERON CAFE",
    })],
  });
  assert.deepEqual(entityRows.slice(2).map(row => row.name), ["PIXEL ARCADE", "BLUE HERON CAFE"]);
  assert.equal(transactionRows[1].name, "BLUE HERON CAFE");
});

test("an account with invertAmounts flips stored totals and dedups on the flipped value", async () => {
  reset({
    invertAmounts: true,
  });
  await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow({
      total: 12.5,
    })],
  });
  assert.equal(transactionRows[0].total, -12.5);
  const again = await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow({
      total: 12.5,
    })],
  });
  assert.equal(again.skipped, 1);
});

test("a new format is saved, named after the account, and linked to it", async () => {
  reset();
  const result = await importTransactions({
    accountId: ACCOUNT_ID,
    newFormat: {
      columnMap: [{
        columnIndex: 0,
        transactionCol: TransactionColumn.Date,
      }],
      headers: ["Date"],
      dateFormat: DateFormat.US,
    },
    rows: [csvRow()],
  });
  assert.equal(formatRows.length, 1);
  assert.equal(formatRows[0].name, "Checking");
  assert.equal(formatRows[0].institutionId, "bank");
  assert.equal(accountRows[0].csvFormatId, result.csvFormatId);
});

test("importing into an unknown account is a 404", async () => {
  reset();
  await assert.rejects(importTransactions({
    accountId: "missing",
    rows: [csvRow()],
  }), {
    code: "notFound",
    statusCode: 404,
  });
});

test("listTransactions joins payee and account names", async () => {
  reset();
  await importTransactions({
    accountId: ACCOUNT_ID,
    rows: [csvRow()],
  });
  const [listed] = await listTransactions();
  assert.equal(listed.payeeName, "NORTHWIND UTILITIES");
  assert.equal(listed.accountName, "Checking");
});
