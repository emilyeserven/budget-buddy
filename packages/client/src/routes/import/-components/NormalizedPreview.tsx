import type { NormalizedRows } from "../-utils/normalizeRows";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/labels";

const PREVIEW_ROWS = 5;
const PROBLEMS_SHOWN = 5;

/** The first rows as they'll be imported, plus any rows that couldn't be read. */
export function NormalizedPreview({
  normalized,
}: { normalized: NormalizedRows }) {
  const {
    rows, problems,
  } = normalized;
  return (
    <section className="space-y-2">
      <h2 className="font-medium">{`Ready to import: ${rows.length} rows`}</h2>
      {problems.length > 0
        ? (
          <div className="text-sm text-destructive">
            <p>{`${problems.length} rows can't be read and will be skipped:`}</p>
            <ul className="list-disc pl-5">
              {problems.slice(0, PROBLEMS_SHOWN).map(problem => (
                <li key={problem.line}>{`Line ${problem.line}: ${problem.message}`}</li>
              ))}
            </ul>
          </div>
        )
        : null}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, PREVIEW_ROWS).map((row, index) => (
              <TableRow key={index}>
                <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                <TableCell className="whitespace-nowrap">{row.time ?? "—"}</TableCell>
                <TableCell className="max-w-64 truncate">{row.name}</TableCell>
                <TableCell className="max-w-48 truncate">{row.payeeName}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.total)}</TableCell>
                <TableCell className="max-w-64 truncate">{row.description ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
