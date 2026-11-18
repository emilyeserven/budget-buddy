import type { ParsedCsv } from "./parseCsv";
import type { ColumnMapEntry, DateFormat, ImportTransactionRow } from "@app/types";

import {
  isEnumValue,
  normalizeDate,
  normalizeTime,
  parseAmount,
  splitDateTime,
  TransactionColumn,
} from "@app/types";

/** A row that couldn't be read, by its 1-based line number in the file (header = line 1). */
export interface RowProblem {
  line: number;
  message: string;
}

export interface NormalizedRows {
  rows: ImportTransactionRow[];
  problems: RowProblem[];
}

/** Cell values grouped by mapped field; text fields mapped more than once are joined. */
function collect(cells: string[], columnMap: ColumnMapEntry[]) {
  const fields = new Map<string, string[]>();
  const extra: Record<string, string> = {};
  for (const entry of columnMap) {
    const value = cells[entry.columnIndex]?.trim() ?? "";
    if (isEnumValue(TransactionColumn, entry.transactionCol)) {
      fields.set(entry.transactionCol, [...(fields.get(entry.transactionCol) ?? []), value]);
    }
    else if (value) {
      extra[entry.transactionCol] = value;
    }
  }
  const text = (col: TransactionColumn) => (fields.get(col) ?? []).filter(Boolean).join(" · ");
  return {
    text,
    extra: Object.keys(extra).length > 0 ? extra : null,
  };
}

function readDateTime(text: (col: TransactionColumn) => string, dateFormat: DateFormat) {
  const dateTime = text(TransactionColumn.DateTime);
  if (dateTime) return splitDateTime(dateTime, dateFormat);
  const time = text(TransactionColumn.Time);
  return {
    date: normalizeDate(text(TransactionColumn.Date), dateFormat),
    time: time ? normalizeTime(time) : null,
  };
}

/**
 * Turn CSV rows into import rows via the column map: dates → `YYYY-MM-DD`, times → `HH:MM:SS`,
 * datetimes split, amounts parsed. Payee falls back to name then description (and name to payee
 * then description). Rows without a readable date or total are reported, not imported.
 */
export function normalizeRows(csv: ParsedCsv, columnMap: ColumnMapEntry[], dateFormat: DateFormat): NormalizedRows {
  const rows: ImportTransactionRow[] = [];
  const problems: RowProblem[] = [];
  csv.rows.forEach((cells, index) => {
    const line = index + 2;
    const {
      text, extra,
    } = collect(cells, columnMap);
    const {
      date, time,
    } = readDateTime(text, dateFormat);
    const total = parseAmount(text(TransactionColumn.Total));
    const description = text(TransactionColumn.Description);
    const name = text(TransactionColumn.Name) || text(TransactionColumn.Payee) || description;
    const payeeName = text(TransactionColumn.Payee) || name;
    if (!date) problems.push({
      line,
      message: "unreadable date",
    });
    else if (total === null) problems.push({
      line,
      message: "unreadable total",
    });
    else if (!payeeName) problems.push({
      line,
      message: "no payee, name, or description",
    });
    else {
      rows.push({
        name,
        date,
        time,
        total,
        description: description || null,
        payeeName,
        extra,
        rawCSV: csv.rawLines[index] ?? "",
      });
    }
  });
  return {
    rows,
    problems,
  };
}
