import type { ColumnMapEntry } from "@app/types";

import { isEnumValue, TransactionColumn } from "@app/types";

/** What the user picked in one column's mapping dropdown. */
export type ColumnChoice
  = | { kind: "ignore" }
    | { kind: "field";
      field: TransactionColumn; }
      | { kind: "custom";
        name: string; };

export const IGNORE: ColumnChoice = {
  kind: "ignore",
};

/** Human labels for the mapping dropdown. */
export const TRANSACTION_COLUMN_LABELS: Record<TransactionColumn, string> = {
  [TransactionColumn.Name]: "Name",
  [TransactionColumn.Date]: "Date",
  [TransactionColumn.Time]: "Time",
  [TransactionColumn.DateTime]: "Date + time",
  [TransactionColumn.Total]: "Total",
  [TransactionColumn.Description]: "Description",
  [TransactionColumn.Payee]: "Payee",
};

/** Per-column choices → the stored column map (ignored and blank custom columns are omitted). */
export function toColumnMap(choices: ColumnChoice[]): ColumnMapEntry[] {
  const entries: ColumnMapEntry[] = [];
  choices.forEach((choice, columnIndex) => {
    if (choice.kind === "field") {
      entries.push({
        columnIndex,
        transactionCol: choice.field,
      });
    }
    else if (choice.kind === "custom" && choice.name.trim()) {
      entries.push({
        columnIndex,
        transactionCol: choice.name.trim(),
      });
    }
  });
  return entries;
}

/** A stored column map → one choice per column. */
export function fromColumnMap(columnMap: ColumnMapEntry[], columnCount: number): ColumnChoice[] {
  const choices: ColumnChoice[] = Array.from({
    length: columnCount,
  }, () => IGNORE);
  for (const entry of columnMap) {
    if (entry.columnIndex >= columnCount) continue;
    choices[entry.columnIndex] = isEnumValue(TransactionColumn, entry.transactionCol)
      ? {
        kind: "field",
        field: entry.transactionCol,
      }
      : {
        kind: "custom",
        name: entry.transactionCol,
      };
  }
  return choices;
}

const SINGLE_USE: TransactionColumn[] = [
  TransactionColumn.Date,
  TransactionColumn.Time,
  TransactionColumn.DateTime,
  TransactionColumn.Total,
];

/** Problems that block an import with this column map (empty when it's usable). */
export function validateColumnMap(columnMap: ColumnMapEntry[]): string[] {
  const count = (col: TransactionColumn) => columnMap.filter(e => e.transactionCol === col).length;
  const problems: string[] = [];
  for (const col of SINGLE_USE) {
    if (count(col) > 1) problems.push(`Only one column can be "${TRANSACTION_COLUMN_LABELS[col]}".`);
  }
  const dateColumns = count(TransactionColumn.Date) + count(TransactionColumn.DateTime);
  if (dateColumns === 0) problems.push("Map a Date or Date + time column.");
  if (dateColumns > 1) problems.push("Map either a Date or a Date + time column, not both.");
  if (count(TransactionColumn.Total) === 0) problems.push("Map a Total column.");
  if (count(TransactionColumn.Payee) + count(TransactionColumn.Name) + count(TransactionColumn.Description) === 0) {
    problems.push("Map at least one of Payee, Name, or Description.");
  }
  return problems;
}
