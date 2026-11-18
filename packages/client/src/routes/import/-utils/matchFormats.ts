import type { ParsedCsv } from "./parseCsv";
import type { CsvFormat } from "@app/types";

import { inferColumnType, TransactionColumn, ValueType } from "@app/types";

/** How many rows are sampled when checking a column's type. */
const SAMPLE_ROWS = 50;

/** The value type a mapped column must have; text-like fields accept anything. */
const REQUIRED_TYPE: Partial<Record<string, ValueType>> = {
  [TransactionColumn.Date]: ValueType.Date,
  [TransactionColumn.DateTime]: ValueType.DateTime,
  [TransactionColumn.Time]: ValueType.Time,
  [TransactionColumn.Total]: ValueType.Number,
};

/** The inferred type of every column of the CSV, from its first rows. */
export function inferColumnTypes(csv: ParsedCsv): ValueType[] {
  const sample = csv.rows.slice(0, SAMPLE_ROWS);
  return csv.headers.map((_, index) => inferColumnType(sample.map(row => row[index] ?? "")));
}

function formatFits(format: CsvFormat, columnTypes: ValueType[]): boolean {
  if (format.headers.length !== columnTypes.length) return false;
  return format.columnMap.every((entry) => {
    const required = REQUIRED_TYPE[entry.transactionCol];
    const actual = columnTypes[entry.columnIndex];
    if (actual === undefined) return false;
    return required === undefined || actual === required || actual === ValueType.Empty;
  });
}

function sameHeaders(format: CsvFormat, headers: string[]): boolean {
  return format.headers.length === headers.length
    && format.headers.every((header, i) => header.trim().toLowerCase() === headers[i].trim().toLowerCase());
}

/**
 * Saved formats whose column map fits this CSV's column types, best first: formats whose header
 * row also matches exactly rank ahead of type-only matches.
 */
export function matchFormats(formats: CsvFormat[], csv: ParsedCsv): CsvFormat[] {
  const columnTypes = inferColumnTypes(csv);
  const fitting = formats.filter(format => formatFits(format, columnTypes));
  const exact = fitting.filter(format => sameHeaders(format, csv.headers));
  return [...exact, ...fitting.filter(format => !exact.includes(format))];
}
