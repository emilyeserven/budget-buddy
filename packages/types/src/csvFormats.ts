/**
 * CSV formats — how one institution's/account's CSV export maps onto Transaction columns.
 */

/** The Transaction fields a CSV column can map to. `datetime` is split into date + time. */
export const TransactionColumn = {
  Name: "name",
  Date: "date",
  Time: "time",
  DateTime: "datetime",
  Total: "total",
  Description: "description",
  Payee: "payee",
} as const;
export type TransactionColumn = typeof TransactionColumn[keyof typeof TransactionColumn];

/** Supported date layouts for CSV date (and datetime) columns. */
export const DateFormat = {
  Iso: "YYYY-MM-DD",
  US: "MM/DD/YYYY",
  EU: "DD/MM/YYYY",
} as const;
export type DateFormat = typeof DateFormat[keyof typeof DateFormat];

/**
 * One mapped column. `transactionCol` is a {@link TransactionColumn}, or any other string to keep
 * the value as a custom field (stored in the transaction's `extra` under that key). Unmapped
 * columns are simply absent from the column map.
 */
export interface ColumnMapEntry {
  columnIndex: number;
  transactionCol: TransactionColumn | (string & {});
}

/** A CSV format as returned by the API. */
export interface CsvFormat {
  id: string;
  name: string;
  institutionId: string | null;
  accountId: string | null;
  columnMap: ColumnMapEntry[];
  /**
   * The header row the format was created from (used to rank exact matches first), or null when
   * the export has no header row — every row is then data.
   */
  headers: string[] | null;
  dateFormat: DateFormat;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/csv-formats` body (also embedded in an import as `newFormat`). */
export interface CreateCsvFormatInput {
  /** Optional — defaults to the account's name, else the institution's name. */
  name?: string | null;
  institutionId?: string | null;
  accountId?: string | null;
  columnMap: ColumnMapEntry[];
  /** Omit or null when the export has no header row. */
  headers?: string[] | null;
  dateFormat: DateFormat;
}
