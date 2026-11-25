import type { Account, CreateAccountInput, UpdateAccountInput } from "@app/types";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, csvFormats, entities, transactions } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/utils/errors";

type AccountRow = typeof accounts.$inferSelect;

/** Map a DB row to the wire shape, joining institution/owner names from `names`. */
function toAccount(row: AccountRow, names: Map<string, string>): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    institutionId: row.institutionId,
    institutionName: names.get(row.institutionId) ?? "",
    ownerId: row.ownerId,
    ownerName: names.get(row.ownerId) ?? "",
    invertAmounts: row.invertAmounts,
    csvFormatId: row.csvFormatId ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/** Entity id → name, for joining names into account/transaction rows. */
export async function entityNames(): Promise<Map<string, string>> {
  const rows = await db.select().from(entities);
  return new Map(rows.map(row => [row.id, row.name]));
}

async function assertEntitiesExist(names: Map<string, string>, ids: (string | undefined)[]): Promise<void> {
  for (const id of ids) {
    if (id !== undefined && !names.has(id)) throw new ValidationError("Unknown institution or owner");
  }
}

export async function listAccounts(): Promise<Account[]> {
  const [rows, names] = await Promise.all([
    db.select().from(accounts).orderBy(asc(accounts.name)),
    entityNames(),
  ]);
  return rows.map(row => toAccount(row, names));
}

export async function getAccountRow(id: string): Promise<AccountRow> {
  const [row] = await db.select().from(accounts).where(eq(accounts.id, id));
  if (!row) throw new NotFoundError("Account");
  return row;
}

export async function getAccount(id: string): Promise<Account> {
  return toAccount(await getAccountRow(id), await entityNames());
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const names = await entityNames();
  await assertEntitiesExist(names, [input.institutionId, input.ownerId]);
  const now = new Date();
  const [row] = await db.insert(accounts).values({
    name: input.name.trim(),
    type: input.type,
    institutionId: input.institutionId,
    ownerId: input.ownerId,
    invertAmounts: input.invertAmounts ?? false,
    csvFormatId: input.csvFormatId ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return toAccount(row, names);
}

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  await getAccountRow(id);
  const names = await entityNames();
  await assertEntitiesExist(names, [input.institutionId, input.ownerId]);
  const patch: Partial<typeof accounts.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.type !== undefined) patch.type = input.type;
  if (input.institutionId !== undefined) patch.institutionId = input.institutionId;
  if (input.ownerId !== undefined) patch.ownerId = input.ownerId;
  if (input.invertAmounts !== undefined) patch.invertAmounts = input.invertAmounts;
  if (input.csvFormatId !== undefined) patch.csvFormatId = input.csvFormatId;
  const [row] = await db.update(accounts).set(patch).where(eq(accounts.id, id)).returning();
  return toAccount(row, names);
}

export async function deleteAccount(id: string): Promise<void> {
  await getAccountRow(id);
  const [transaction] = await db.select().from(transactions).where(eq(transactions.accountId, id)).limit(1);
  if (transaction) {
    throw new ConflictError("This account still has transactions", {
      entity: "Account",
    });
  }
  await db.update(csvFormats).set({
    accountId: null,
  }).where(eq(csvFormats.accountId, id));
  await db.delete(accounts).where(eq(accounts.id, id));
}
