import type { ColumnChoice } from "../-utils/columnChoices";
import type { ParsedCsv } from "../-utils/parseCsv";
import type { ColumnMapEntry } from "@app/types";

import { isEnumValue, TransactionColumn } from "@app/types";

import { ColumnMappingSelect } from "./ColumnMappingSelect";
import { TRANSACTION_COLUMN_LABELS } from "../-utils/columnChoices";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PREVIEW_ROWS = 5;

interface CsvPreviewTableProps {
  csv: ParsedCsv;
  /** Manual mapping: one editable dropdown per column. */
  choices?: ColumnChoice[];
  onChoiceChange?: (index: number, choice: ColumnChoice) => void;
  /** A saved format's map, shown read-only above the columns. */
  columnMap?: ColumnMapEntry[];
}

function mappedLabel(columnMap: ColumnMapEntry[], index: number): string {
  const entry = columnMap.find(e => e.columnIndex === index);
  if (!entry) return "Ignored";
  return isEnumValue(TransactionColumn, entry.transactionCol)
    ? TRANSACTION_COLUMN_LABELS[entry.transactionCol]
    : `Custom: ${entry.transactionCol}`;
}

function MappingCell({
  index, header, choices, onChoiceChange, columnMap,
}: Omit<CsvPreviewTableProps, "csv"> & { index: number;
  header: string; }) {
  if (choices && onChoiceChange) {
    return (
      <ColumnMappingSelect
        header={header}
        choice={choices[index]}
        onChange={choice => onChoiceChange(index, choice)}
      />
    );
  }
  return <span className="text-xs text-muted-foreground">{mappedLabel(columnMap ?? [], index)}</span>;
}

/** The first rows of the CSV with every column, plus the column mapping above each header. */
export function CsvPreviewTable({
  csv, ...mapping
}: CsvPreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {csv.headers.map((header, index) => (
              <TableHead
                key={`map-${index}`}
                className="h-auto py-2 align-top"
              >
                <MappingCell
                  index={index}
                  header={header}
                  {...mapping}
                />
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {csv.headers.map((header, index) => (
              <TableHead key={`header-${index}`}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {csv.rows.slice(0, PREVIEW_ROWS).map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, index) => (
                <TableCell
                  key={index}
                  className="max-w-64 truncate"
                  title={cell}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
