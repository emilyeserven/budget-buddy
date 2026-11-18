import type { CsvImportController } from "./useCsvImport";
import type { ImportResult } from "@app/types";

import { Link } from "@tanstack/react-router";

import { AccountChooser } from "./AccountChooser";
import { AllRowsSection } from "./AllRowsSection";
import { CsvPreviewTable } from "./CsvPreviewTable";
import { FormatChooser } from "./FormatChooser";
import { HeaderToggle } from "./HeaderToggle";
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

/** The preview with the format's read-only mapping, or editable dropdowns plus mapping options. */
function MappingSection({
  ctrl,
}: { ctrl: CsvImportController }) {
  if (!ctrl.csv) return null;
  if (ctrl.format) {
    return (
      <CsvPreviewTable
        csv={ctrl.csv}
        columnMap={ctrl.format.columnMap}
      />
    );
  }
  return (
    <>
      <CsvPreviewTable
        csv={ctrl.csv}
        choices={ctrl.choices}
        onChoiceChange={ctrl.mapping.setChoice}
      />
      <MappingOptions
        mapping={ctrl.mapping}
        problems={ctrl.mappingProblems}
      />
    </>
  );
}

/** Everything shown once a file is loaded: format, header, mapping, account, review, all rows. */
function LoadedFile({
  ctrl,
}: { ctrl: CsvImportController }) {
  const csv = ctrl.csv;
  if (!csv) return null;
  const canImport = Boolean(ctrl.normalized && ctrl.normalized.rows.length > 0 && ctrl.accountId);
  return (
    <>
      <p className="text-sm text-muted-foreground">{`${ctrl.fileName}: ${csv.rows.length} rows, ${csv.labels.length} columns`}</p>
      <FormatChooser
        matches={ctrl.matches}
        selected={ctrl.format}
        onChoose={ctrl.chooseFormat}
      />
      <HeaderToggle
        checked={ctrl.hasHeader}
        onChange={ctrl.setHasHeader}
        lockedBy={ctrl.format?.name}
      />
      <MappingSection ctrl={ctrl} />
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
      <AllRowsSection csv={csv} />
    </>
  );
}

/**
 * CSV import: upload a file, preview it, read it with a matching saved format or map its columns
 * (saving a new format), choose the account, review the normalized rows, then import. Rows already
 * imported for the account are skipped server-side. The full file is viewable at the bottom.
 */
export function CsvImportPage() {
  const ctrl = useCsvImport();
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
      <LoadedFile ctrl={ctrl} />
    </div>
  );
}
