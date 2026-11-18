/**
 * Drizzle schema — the single source of truth for the database.
 *
 * `drizzle-kit push` diffs this file against the live database on every boot and applies the
 * additive delta. Read the `db-schema-change` skill before editing: a NEW table, a NOT NULL column,
 * or a unique constraint on a populated table needs an idempotent pre-step in `migrate.ts` or the
 * non-interactive production push will silently skip it.
 *
 * Enum-like columns are plain `text` with a TS-level `enum` (from the keyed enum objects in
 * `@app/types`), not `pgEnum`, so adding a variant never needs an `ALTER TYPE` migration.
 */
import type { ColumnMapEntry } from "@app/types";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import {
  AccountType,
  DateFormat,
  DefaultSplit,
  EntityType,
  enumValues,
  SplitType,
} from "@app/types";
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
};

/** Merchants, institutions, friends, household members — anyone a transaction involves. */
export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: text("type", {
    enum: enumValues(EntityType),
  }).notNull(),
  defaultSplitterId: uuid("default_splitter_id").references((): AnyPgColumn => entities.id, {
    onDelete: "set null",
  }),
  defaultSplit: text("default_split", {
    enum: enumValues(DefaultSplit),
  }),
  specialSplitType: text("special_split_type", {
    enum: enumValues(SplitType),
  }),
  specialSplitValue: numeric("special_split_value", {
    precision: 12,
    scale: 2,
    mode: "number",
  }),
  ...timestamps,
});

/** How one institution's/account's CSV export maps onto transaction columns. */
export const csvFormats = pgTable("csv_formats", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  institutionId: uuid("institution_id").references(() => entities.id, {
    onDelete: "set null",
  }),
  accountId: uuid("account_id").references((): AnyPgColumn => accounts.id, {
    onDelete: "set null",
  }),
  columnMap: jsonb("column_map").$type<ColumnMapEntry[]>().notNull(),
  /** Null when the export has no header row. */
  headers: jsonb("headers").$type<string[]>(),
  dateFormat: text("date_format", {
    enum: enumValues(DateFormat),
  }).notNull(),
  ...timestamps,
});

/** A card or bank account. */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type", {
    enum: enumValues(AccountType),
  }).notNull(),
  institutionId: uuid("institution_id").notNull().references(() => entities.id),
  ownerId: uuid("owner_id").notNull().references(() => entities.id),
  invertAmounts: boolean("invert_amounts").notNull().default(false),
  csvFormatId: uuid("csv_format_id").references((): AnyPgColumn => csvFormats.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

/** One charge or deposit. */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  date: date("date", {
    mode: "string",
  }).notNull(),
  time: time("time"),
  total: numeric("total", {
    precision: 12,
    scale: 2,
    mode: "number",
  }).notNull(),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  description: text("description"),
  splitterId: uuid("splitter_id").references(() => entities.id, {
    onDelete: "set null",
  }),
  splitType: text("split_type", {
    enum: enumValues(SplitType),
  }),
  splitValue: numeric("split_value", {
    precision: 12,
    scale: 2,
    mode: "number",
  }),
  payeeId: uuid("payee_id").notNull().references(() => entities.id),
  extra: jsonb("extra").$type<Record<string, string>>(),
  rawCSV: text("raw_csv"),
  ...timestamps,
}, t => [index("transactions_account_date_idx").on(t.accountId, t.date)]);
