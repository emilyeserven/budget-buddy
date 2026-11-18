import { inferColumnType, inferValueType, ValueType } from "@app/types";
import Papa from "papaparse";

/** One CSV record: its cells and the exact source text it came from. */
export interface CsvRecord {
  cells: string[];
  raw: string;
}

/** A CSV viewed with or without a header row. */
export interface ParsedCsv {
  /** The trimmed header row, or null when the file has no header (every record is data). */
  headers: string[] | null;
  /** Column names for display: the headers, or "Column 1", "Column 2", … when there are none. */
  labels: string[];
  /** Data rows, padded/truncated to the column count. */
  rows: string[][];
  /** The original text of each data row (parallel to `rows`), stored as `rawCSV`. */
  rawLines: string[];
  /** The 1-based record number of the first data row (2 with a header, else 1). */
  firstLine: number;
}

const EDGE_NEWLINES = /^[\r\n]+|[\r\n]+$/g;

/** Rows checked when sizing a headerless file or guessing whether row 1 is a header. */
const SAMPLE_ROWS = 50;

/**
 * Split CSV text into records. Papa's `step` cursor gives each record's byte range, which is sliced
 * from the source to keep the exact raw line. Blank lines and a leading BOM are dropped.
 */
export function parseCsvRecords(text: string): CsvRecord[] {
  const source = text.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  let previousCursor = 0;
  Papa.parse<string[]>(source, {
    skipEmptyLines: "greedy",
    step: (result) => {
      const cursor = result.meta.cursor;
      records.push({
        cells: result.data,
        raw: source.slice(previousCursor, cursor).replace(EDGE_NEWLINES, ""),
      });
      previousCursor = cursor;
    },
  });
  return records;
}

function fitRow(cells: string[], width: number): string[] {
  const fitted = cells.slice(0, width).map(cell => cell.trim());
  while (fitted.length < width) fitted.push("");
  return fitted;
}

/**
 * View records with or without a header row. With a header, it fixes the column count, so trailing
 * extra fields (a dangling trailing comma) are dropped; without one, the widest of the first rows
 * sets it.
 */
export function toParsedCsv(records: CsvRecord[], hasHeader: boolean): ParsedCsv {
  const [first, ...rest] = records;
  const data = hasHeader ? rest : records;
  const width = hasHeader
    ? (first?.cells.length ?? 0)
    : Math.max(0, ...records.slice(0, SAMPLE_ROWS).map(record => record.cells.length));
  const headers = hasHeader && first ? fitRow(first.cells, width) : null;
  return {
    headers,
    labels: headers ?? Array.from({
      length: width,
    }, (_, i) => `Column ${i + 1}`),
    rows: data.map(record => fitRow(record.cells, width)),
    rawLines: data.map(record => record.raw),
    firstLine: hasHeader ? 2 : 1,
  };
}

/** Parse CSV text in one step (header row assumed unless told otherwise). */
export function parseCsv(text: string, hasHeader = true): ParsedCsv {
  return toParsedCsv(parseCsvRecords(text), hasHeader);
}

const TYPED: ValueType[] = [ValueType.Date, ValueType.DateTime, ValueType.Time, ValueType.Number];

/**
 * Guess whether the first record is a header: true when some column is typed (dates, times,
 * numbers) in the rows below but holds text in the first row. A file whose columns are all text is
 * assumed to have a header.
 */
export function guessHasHeader(records: CsvRecord[]): boolean {
  const [first, ...rest] = records;
  if (!first || rest.length === 0) return true;
  const sample = rest.slice(0, SAMPLE_ROWS);
  const anyTyped = first.cells.some((_, i) => TYPED.includes(inferColumnType(sample.map(r => r.cells[i] ?? ""))));
  if (!anyTyped) return true;
  return first.cells.some((cell, i) => {
    const bodyType = inferColumnType(sample.map(r => r.cells[i] ?? ""));
    return TYPED.includes(bodyType) && inferValueType(cell) === ValueType.Text;
  });
}
