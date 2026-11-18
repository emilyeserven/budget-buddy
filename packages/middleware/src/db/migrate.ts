/**
 * Runtime migrations — imperative, idempotent schema fix-ups that run on every boot, BEFORE the
 * gateway's `drizzle-kit push`.
 *
 * `push` is the source of truth for the schema: it diffs `schema.ts` against the live database and
 * applies every *additive* change (new tables, columns, constraints, indexes) on its own. What it
 * cannot do safely or non-interactively is the *destructive* / special cases — dropping a column or
 * table, `ALTER TYPE … ADD VALUE`, renames, data-preserving transforms — and a few additive cases
 * that make push prompt (a NEW table against a populated database, a NOT NULL column, a unique
 * constraint on existing data). Those belong here: each is a small step that transforms the
 * database so push's subsequent diff stays purely additive (so push never blocks on an interactive
 * prompt in a non-TTY deploy, and needs no `--force`).
 *
 * Every step runs on every start, so each MUST be idempotent — guard with `IF EXISTS` /
 * `IF NOT EXISTS`, check before mutating, etc. Each `db.execute()` must contain exactly ONE SQL
 * statement. Add one by pushing to `migrations`, e.g.:
 *
 *   { name: "drop legacy items.color", run: db => db.execute(sql`ALTER TABLE "items" DROP COLUMN IF EXISTS "color"`) }
 *
 * See the `db-schema-change` skill for the full decision table.
 *
 * Run via `migrate:prod` (compiled) or `migrate:dev` (tsx); the gateway runs it on boot.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const {
  Pool,
} = pg;

const connectionString
  = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/app";

interface RuntimeMigration {
  name: string;
  run: (db: NodePgDatabase) => Promise<unknown>;
}

// Ordered list of idempotent, destructive/push-incompatible steps.
const migrations: RuntimeMigration[] = [
  // CSV-ingest tables. Pre-created so push never hits its "new table on a populated database"
  // prompt. FK columns are plain uuid here; push adds the constraints and indexes afterwards.
  {
    name: "pre-create entities table",
    run: db => db.execute(sql`CREATE TABLE IF NOT EXISTS "entities" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "type" text NOT NULL,
      "default_splitter_id" uuid,
      "default_split" text,
      "special_split_type" text,
      "special_split_value" numeric(12, 2),
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "entities_name_unique" UNIQUE("name")
    )`),
  },
  {
    name: "pre-create csv_formats table",
    run: db => db.execute(sql`CREATE TABLE IF NOT EXISTS "csv_formats" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "institution_id" uuid,
      "account_id" uuid,
      "column_map" jsonb NOT NULL,
      "headers" jsonb NOT NULL,
      "date_format" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`),
  },
  {
    name: "pre-create accounts table",
    run: db => db.execute(sql`CREATE TABLE IF NOT EXISTS "accounts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "type" text NOT NULL,
      "institution_id" uuid NOT NULL,
      "owner_id" uuid NOT NULL,
      "invert_amounts" boolean DEFAULT false NOT NULL,
      "csv_format_id" uuid,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`),
  },
  {
    name: "pre-create transactions table",
    run: db => db.execute(sql`CREATE TABLE IF NOT EXISTS "transactions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "date" date NOT NULL,
      "time" time,
      "total" numeric(12, 2) NOT NULL,
      "account_id" uuid NOT NULL,
      "description" text,
      "splitter_id" uuid,
      "split_type" text,
      "split_value" numeric(12, 2),
      "payee_id" uuid NOT NULL,
      "extra" jsonb,
      "raw_csv" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`),
  },
];

async function main(): Promise<void> {
  if (migrations.length === 0) {
    console.log("[migrate] no runtime migrations to apply");
    return;
  }

  const pool = new Pool({
    connectionString,
  });
  const db = drizzle(pool);
  try {
    for (const migration of migrations) {
      console.log(`[migrate] applying: ${migration.name}…`);
      await migration.run(db);
    }
    console.log("[migrate] runtime migrations up to date");
  }
  finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
