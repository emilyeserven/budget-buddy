import Papa from "papaparse";

/** A parsed CSV: trimmed headers, data rows padded/truncated to the header width, raw lines. */
export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  /** The original text of each data row (parallel to `rows`), stored as `rawCSV`. */
  rawLines: string[];
}

const EDGE_NEWLINES = /^[\r\n]+|[\r\n]+$/g;

function fitRow(cells: string[], width: number): string[] {
  const fitted = cells.slice(0, width).map(cell => cell.trim());
  while (fitted.length < width) fitted.push("");
  return fitted;
}

/**
 * Parse CSV text. The first non-empty row is the header; it fixes the column count, so trailing
 * extra fields (e.g. a dangling trailing comma) are dropped. Papa's `step` cursor gives each row's
 * byte range, which is sliced from the source to keep the exact raw line.
 */
export function parseCsv(text: string): ParsedCsv {
  const source = text.replace(/^\uFEFF/, "");
  const records: { cells: string[];
    raw: string; }[] = [];
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
  const [header, ...data] = records;
  if (!header) {
    return {
      headers: [],
      rows: [],
      rawLines: [],
    };
  }
  const width = header.cells.length;
  return {
    headers: fitRow(header.cells, width),
    rows: data.map(record => fitRow(record.cells, width)),
    rawLines: data.map(record => record.raw),
  };
}
