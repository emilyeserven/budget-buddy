import type { CsvRecord, ParsedCsv } from "./parseCsv";
import type { CsvFormat } from "@app/types";

import { inferColumnType, TransactionColumn, ValueType } from "@app/types";

import { guessHasHeader, toParsedCsv } from "./parseCsv";

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
  return csv.labels.map((_, index) => inferColumnType(sample.map(row => row[index] ?? "")));
}

function sameHeaders(format: CsvFormat, records: CsvRecord[]): boolean {
  const header = records[0]?.cells.map(cell => cell.trim().toLowerCase()) ?? [];
  return format.headers !== null
    && format.headers.length === header.length
    && format.headers.every((name, i) => name.trim().toLowerCase() === header[i]);
}

/**
 * Does the format read these records? The file is viewed the way the format expects (with or
 * without a header). A format with headers needs the same column count and a first row that is (or
 * looks like) a header; a headerless one only needs every mapped column to exist. Either way each mapped column must hold the right type of value.
 */
function formatFits(format: CsvFormat, records: CsvRecord[]): boolean {
  const csv = toParsedCsv(records, format.headers !== null);
  if (csv.rows.length === 0) return false;
  if (format.headers !== null) {
    if (format.headers.length !== csv.labels.length) return false;
    // Don't let a headered format swallow a headerless file's first data row as its header.
    if (!sameHeaders(format, records) && !guessHasHeader(records)) return false;
  }
  const columnTypes = inferColumnTypes(csv);
  return format.columnMap.every((entry) => {
    const actual = columnTypes[entry.columnIndex];
    if (actual === undefined) return false;
    const required = REQUIRED_TYPE[entry.transactionCol];
    return required === undefined || actual === required || actual === ValueType.Empty;
  });
}

/**
 * Saved formats that read this file, best first: formats whose header row matches the file's
 * first row exactly rank ahead of type-only matches.
 */
export function matchFormats(formats: CsvFormat[], records: CsvRecord[]): CsvFormat[] {
  const fitting = formats.filter(format => formatFits(format, records));
  const exact = fitting.filter(format => sameHeaders(format, records));
  return [...exact, ...fitting.filter(format => !exact.includes(format))];
}
