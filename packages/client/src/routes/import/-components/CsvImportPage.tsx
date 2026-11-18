import type { ImportResult } from "@app/types";

import { Link } from "@tanstack/react-router";

import { AccountChooser } from "./AccountChooser";
import { CsvPreviewTable } from "./CsvPreviewTable";
import { FormatChooser } from "./FormatChooser";
import { MappingOptions } from "./MappingOptions";
import { NormalizedPreview } from "./NormalizedPreview";
import { useCsvImport } from "./useCsvImport";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResultBanner({
  result,
}: { result: ImportResult }) {
  return (
    <div className="rounded-md border p-4 text-sm">
      <p>{`Imported ${result.imported} transactions; skipped ${result.skipped} already imported; created ${result.createdPayees} payees.`}</p>
      <Link
        to="/transactions"
        className="underline"
      >
        View transactions
      </Link>
    </div>
  );
}

/**
 * CSV import: upload a file, preview it, read it with a matching saved format or map its columns
 * (saving a new format), choose the account, review the normalized rows, then import. Rows already
 * imported for the account are skipped server-side.
 */
export function CsvImportPage() {
  const ctrl = useCsvImport();
  const csv = ctrl.loaded?.csv;
  const canImport = Boolean(ctrl.normalized && ctrl.normalized.rows.length > 0 && ctrl.accountId);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Import CSV</h1>
      <Input
        type="file"
        accept=".csv,text/csv"
        aria-label="CSV file"
        className="max-w-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void ctrl.loadFile(file);
          e.target.value = "";
        }}
      />
      {ctrl.result ? <ResultBanner result={ctrl.result} /> : null}
      {csv
        ? (
          <>
            <p className="text-sm text-muted-foreground">{`${ctrl.loaded?.fileName}: ${csv.rows.length} rows, ${csv.headers.length} columns`}</p>
            <FormatChooser
              matches={ctrl.matches}
              selected={ctrl.format}
              onChoose={ctrl.chooseFormat}
            />
            {ctrl.format
              ? (
                <CsvPreviewTable
                  csv={csv}
                  columnMap={ctrl.format.columnMap}
                />
              )
              : (
                <>
                  <CsvPreviewTable
                    csv={csv}
                    choices={ctrl.mapping.choices}
                    onChoiceChange={ctrl.mapping.setChoice}
                  />
                  <MappingOptions
                    mapping={ctrl.mapping}
                    problems={ctrl.mappingProblems}
                  />
                </>
              )}
            <AccountChooser
              value={ctrl.accountId}
              onChange={ctrl.setAccountId}
            />
            {ctrl.normalized ? <NormalizedPreview normalized={ctrl.normalized} /> : null}
            <Button
              type="button"
              disabled={!canImport || ctrl.isImporting}
              onClick={() => void ctrl.submit()}
            >
              {ctrl.isImporting ? "Importing…" : "Import"}
            </Button>
          </>
        )
        : null}
    </div>
  );
}
