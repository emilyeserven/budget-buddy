import type {
  DedupFields,
  ImportResult,
  ImportTransactionRow,
  ImportTransactionsInput,
  Transaction,
} from "@app/types";

import { dedupKey } from "@app/types";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { entityNames } from "@/services/accounts";
import { createCsvFormat } from "@/services/csvFormats";
import { findOrCreateEntitiesByName } from "@/services/entities";
import { NotFoundError, ValidationError } from "@/utils/errors";

type TransactionRow = typeof transactions.$inferSelect;

/** Rows per INSERT — keeps each statement well under Postgres' bind-parameter limit. */
const INSERT_CHUNK = 500;

function toTransaction(
  row: TransactionRow,
  entityName: Map<string, string>,
  accountName: Map<string, string>,
): Transaction {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    time: row.time ?? null,
    total: Number(row.total),
    accountId: row.accountId,
    accountName: accountName.get(row.accountId) ?? "",
    description: row.description ?? null,
    splitterId: row.splitterId ?? null,
    splitterName: row.splitterId ? (entityName.get(row.splitterId) ?? null) : null,
    splitType: row.splitType ?? null,
    splitValue: row.splitValue ?? null,
    payeeId: row.payeeId,
    payeeName: entityName.get(row.payeeId) ?? "",
    extra: row.extra ?? null,
    rawCSV: row.rawCSV ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/** Every transaction, newest first, with account/payee/splitter names joined in. */
export async function listTransactions(): Promise<Transaction[]> {
  const [rows, names, accountRows] = await Promise.all([
    db.select().from(transactions).orderBy(desc(transactions.date), desc(transactions.time)),
    entityNames(),
    db.select().from(accounts),
  ]);
  const accountName = new Map(accountRows.map(row => [row.id, row.name]));
  return rows.map(row => toTransaction(row, names, accountName));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Trim text fields, default an empty name to the payee, and apply the account's sign flip. */
function prepareRow(row: ImportTransactionRow, invert: boolean): ImportTransactionRow {
  const payeeName = row.payeeName.trim() || row.name.trim() || (row.description ?? "").trim();
  if (!payeeName) throw new ValidationError("Every row needs a payee, name, or description");
  return {
    ...row,
    payeeName,
    name: row.name.trim() || payeeName,
    total: round2(invert ? -row.total : row.total),
  };
}

/**
 * Drop rows already stored for the account. Matching is by count: each stored transaction cancels
 * one file row with the same {@link dedupKey}, so an overlapping re-import is skipped while
 * genuine same-day repeats beyond what's stored are still imported.
 */
function withoutAlreadyImported<T extends DedupFields>(rows: T[], existing: DedupFields[]): T[] {
  const remaining = new Map<string, number>();
  for (const row of existing) {
    const key = dedupKey(row);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }
  return rows.filter((row) => {
    const key = dedupKey(row);
    const count = remaining.get(key) ?? 0;
    if (count === 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
}

/** Import normalized CSV rows into an account, skipping rows that were already imported. */
export async function importTransactions(input: ImportTransactionsInput): Promise<ImportResult> {
  return db.transaction(async (tx) => {
    const [account] = await tx.select().from(accounts).where(eq(accounts.id, input.accountId));
    if (!account) throw new NotFoundError("Account");

    let csvFormatId = input.csvFormatId ?? null;
    if (input.newFormat) {
      const format = await createCsvFormat({
        ...input.newFormat,
        accountId: account.id,
        institutionId: input.newFormat.institutionId ?? account.institutionId,
      }, tx);
      csvFormatId = format.id;
    }
    if (csvFormatId && !account.csvFormatId) {
      await tx.update(accounts).set({
        csvFormatId,
        updatedAt: new Date(),
      }).where(eq(accounts.id, account.id));
    }

    const rows = input.rows.map(row => prepareRow(row, account.invertAmounts));
    const dates = [...new Set(rows.map(row => row.date))];
    const existing = dates.length === 0
      ? []
      : await tx.select().from(transactions)
        .where(and(eq(transactions.accountId, account.id), inArray(transactions.date, dates)));
    const fresh = withoutAlreadyImported(rows, existing.map(row => ({
      date: row.date,
      time: row.time,
      name: row.name,
      total: Number(row.total),
    })));

    const payees = await findOrCreateEntitiesByName(tx, fresh.map(row => row.payeeName));
    const now = new Date();
    const values = fresh.map(row => ({
      name: row.name,
      date: row.date,
      time: row.time,
      total: row.total,
      accountId: account.id,
      description: row.description,
      payeeId: payees.ids.get(row.payeeName)!,
      extra: row.extra,
      rawCSV: row.rawCSV,
      createdAt: now,
      updatedAt: now,
    }));
    for (let i = 0; i < values.length; i += INSERT_CHUNK) {
      await tx.insert(transactions).values(values.slice(i, i + INSERT_CHUNK));
    }

    return {
      imported: fresh.length,
      skipped: rows.length - fresh.length,
      createdPayees: payees.created,
      csvFormatId,
    };
  });
}
