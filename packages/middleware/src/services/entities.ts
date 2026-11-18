import type { CreateEntityInput, Entity, UpdateEntityInput } from "@app/types";

import { EntityType } from "@app/types";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, csvFormats, entities, transactions } from "@/db/schema";
import { ConflictError, DuplicateNameError, NotFoundError } from "@/utils/errors";

type EntityRow = typeof entities.$inferSelect;

/** The `db` handle or a transaction handle — services accept either. */
type Db = Pick<typeof db, "select" | "insert">;

/** Map a DB row to the wire shape (dates → ISO strings). */
function toEntity(row: EntityRow): Entity {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    defaultSplitterId: row.defaultSplitterId ?? null,
    defaultSplit: row.defaultSplit ?? null,
    specialSplitType: row.specialSplitType ?? null,
    specialSplitValue: row.specialSplitValue ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

async function assertNameFree(name: string, exceptId?: string): Promise<void> {
  const rows = await db.select().from(entities).where(eq(entities.name, name));
  if (rows.some(row => row.id !== exceptId)) throw new DuplicateNameError("entity", name);
}

export async function listEntities(): Promise<Entity[]> {
  const rows = await db.select().from(entities).orderBy(asc(entities.name));
  return rows.map(toEntity);
}

export async function getEntity(id: string): Promise<Entity> {
  const [row] = await db.select().from(entities).where(eq(entities.id, id));
  if (!row) throw new NotFoundError("Entity");
  return toEntity(row);
}

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  const name = input.name.trim();
  await assertNameFree(name);
  const now = new Date();
  const [row] = await db.insert(entities).values({
    name,
    type: input.type,
    defaultSplitterId: input.defaultSplitterId ?? null,
    defaultSplit: input.defaultSplit ?? null,
    specialSplitType: input.specialSplitType ?? null,
    specialSplitValue: input.specialSplitValue ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return toEntity(row);
}

export async function updateEntity(id: string, input: UpdateEntityInput): Promise<Entity> {
  const existing = await getEntity(id);
  const patch: Partial<typeof entities.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    await assertNameFree(name, id);
    patch.name = name;
  }
  if (input.type !== undefined) patch.type = input.type;
  if (input.defaultSplitterId !== undefined) patch.defaultSplitterId = input.defaultSplitterId;
  if (input.defaultSplit !== undefined) patch.defaultSplit = input.defaultSplit;
  if (input.specialSplitType !== undefined) patch.specialSplitType = input.specialSplitType;
  if (input.specialSplitValue !== undefined) patch.specialSplitValue = input.specialSplitValue;
  const [row] = await db.update(entities).set(patch).where(eq(entities.id, id)).returning();
  return toEntity(row);
}

// One query per referencing column (rather than `or(...)`) keeps this simple to fake in tests.
const REFERENCING_COLUMNS = [
  [accounts, accounts.institutionId],
  [accounts, accounts.ownerId],
  [transactions, transactions.payeeId],
  [transactions, transactions.splitterId],
  [entities, entities.defaultSplitterId],
] as const;

async function isReferenced(id: string): Promise<boolean> {
  for (const [table, column] of REFERENCING_COLUMNS) {
    const [row] = await db.select().from(table).where(eq(column, id)).limit(1);
    if (row) return true;
  }
  return false;
}

export async function deleteEntity(id: string): Promise<void> {
  await getEntity(id);
  if (await isReferenced(id)) {
    throw new ConflictError("This entity is still used by an account, transaction, or another entity", {
      entity: "Entity",
    });
  }
  await db.update(csvFormats).set({
    institutionId: null,
  }).where(eq(csvFormats.institutionId, id));
  await db.delete(entities).where(eq(entities.id, id));
}

/**
 * Resolve payee names to entity ids, creating each missing one as a commercial entity.
 * Returns the name → id map and how many entities were created.
 */
export async function findOrCreateEntitiesByName(
  tx: Db,
  names: string[],
): Promise<{ ids: Map<string, string>;
  created: number; }> {
  const unique = [...new Set(names.map(name => name.trim()).filter(Boolean))];
  const ids = new Map<string, string>();
  if (unique.length === 0) {
    return {
      ids,
      created: 0,
    };
  }
  const existing = await tx.select().from(entities).where(inArray(entities.name, unique));
  for (const row of existing) ids.set(row.name, row.id);
  const missing = unique.filter(name => !ids.has(name));
  if (missing.length > 0) {
    const now = new Date();
    const inserted = await tx.insert(entities).values(missing.map(name => ({
      name,
      type: EntityType.Commercial,
      createdAt: now,
      updatedAt: now,
    }))).returning();
    for (const row of inserted) ids.set(row.name, row.id);
  }
  return {
    ids,
    created: missing.length,
  };
}
