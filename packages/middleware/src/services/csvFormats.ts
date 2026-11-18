import type { CreateCsvFormatInput, CsvFormat } from "@app/types";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, csvFormats, entities } from "@/db/schema";
import { ValidationError } from "@/utils/errors";

type CsvFormatRow = typeof csvFormats.$inferSelect;

/** The `db` handle or a transaction handle. */
type Db = Pick<typeof db, "select" | "insert">;

function toCsvFormat(row: CsvFormatRow): CsvFormat {
  return {
    id: row.id,
    name: row.name,
    institutionId: row.institutionId ?? null,
    accountId: row.accountId ?? null,
    columnMap: row.columnMap,
    headers: row.headers ?? null,
    dateFormat: row.dateFormat,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function listCsvFormats(): Promise<CsvFormat[]> {
  const rows = await db.select().from(csvFormats).orderBy(asc(csvFormats.name));
  return rows.map(toCsvFormat);
}

/** Default a nameless format to its account's name, else its institution's name. */
async function defaultName(tx: Db, input: CreateCsvFormatInput): Promise<string> {
  const given = input.name?.trim();
  if (given) return given;
  if (input.accountId) {
    const [account] = await tx.select().from(accounts).where(eq(accounts.id, input.accountId));
    if (account) return account.name;
  }
  if (input.institutionId) {
    const [institution] = await tx.select().from(entities).where(eq(entities.id, input.institutionId));
    if (institution) return institution.name;
  }
  throw new ValidationError("A CSV format needs a name, an account, or an institution");
}

export async function createCsvFormat(input: CreateCsvFormatInput, tx: Db = db): Promise<CsvFormat> {
  const now = new Date();
  const [row] = await tx.insert(csvFormats).values({
    name: await defaultName(tx, input),
    institutionId: input.institutionId ?? null,
    accountId: input.accountId ?? null,
    columnMap: input.columnMap,
    headers: input.headers ?? null,
    dateFormat: input.dateFormat,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return toCsvFormat(row);
}
