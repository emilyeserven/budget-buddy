import type { ParsedCsv } from "../-utils/parseCsv";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Every data row of the file, collapsed by default, with each row's record number. */
export function AllRowsSection({
  csv,
}: { csv: ParsedCsv }) {
  return (
    <Collapsible className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="group"
        >
          {`All rows in the file (${csv.rows.length})`}
          <ChevronDown
            className="
              transition-transform
              group-data-[state=open]:rotate-180
            "
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="max-h-[70vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                {csv.labels.map((label, index) => (
                  <TableHead key={index}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {csv.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell
                    className="text-right text-muted-foreground tabular-nums"
                  >
                    {rowIndex + csv.firstLine}
                  </TableCell>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
