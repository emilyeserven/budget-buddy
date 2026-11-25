/** Transactions — one charge/deposit, owned by an Account and charged by a payee Entity. */
import type { CreateCsvFormatInput } from "./csvFormats.js";
import type { SplitType } from "./entities.js";

/** A transaction as returned by the API, with related names joined server-side. */
export interface Transaction {
  id: string;
  name: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM:SS`, or null when the source had no time. */
  time: string | null;
  total: number;
  accountId: string;
  accountName: string;
  description: string | null;
  splitterId: string | null;
  splitterName: string | null;
  splitType: SplitType | null;
  splitValue: number | null;
  payeeId: string;
  payeeName: string;
  /** Custom (non-Transaction) columns kept from the CSV, keyed by their mapped name. */
  extra: Record<string, string> | null;
  /** The original CSV line this transaction was imported from. */
  rawCSV: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One normalized CSV row, ready to import. */
export interface ImportTransactionRow {
  name: string;
  date: string;
  time: string | null;
  /** As it appears in the CSV — the account's `invertAmounts` is applied server-side. */
  total: number;
  description: string | null;
  /** Matched to an Entity by exact name; a missing one is created as a commercial entity. */
  payeeName: string;
  extra: Record<string, string> | null;
  rawCSV: string;
}

/** `POST /api/transactions/import` body. */
export interface ImportTransactionsInput {
  accountId: string;
  /** The saved format the rows were read with, if any. */
  csvFormatId?: string | null;
  /** A format to save alongside the import (its `accountId` is filled in from `accountId`). */
  newFormat?: CreateCsvFormatInput | null;
  rows: ImportTransactionRow[];
}

/** `POST /api/transactions/import` response. */
export interface ImportResult {
  imported: number;
  /** Rows matching transactions already stored for the account. */
  skipped: number;
  createdPayees: number;
  csvFormatId: string | null;
}
