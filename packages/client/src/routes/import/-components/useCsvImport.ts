import type { ColumnChoice } from "../-utils/columnChoices";
import type { CsvFormat, DateFormat, ImportResult } from "@app/types";

import { useMemo, useState } from "react";

import { useColumnMapping } from "./useColumnMapping";
import { useCsvFile } from "./useCsvFile";
import { IGNORE, toColumnMap, validateColumnMap } from "../-utils/columnChoices";
import { matchFormats } from "../-utils/matchFormats";
import { normalizeRows } from "../-utils/normalizeRows";
import { toParsedCsv } from "../-utils/parseCsv";

import { useCsvFormats } from "@/hooks/useCsvFormats";
import { useImportTransactions } from "@/hooks/useTransactions";

/** The column map, date format and validation for the current file + mapping choice. */
function resolveMapping(format: CsvFormat | null, choices: ColumnChoice[], manualDateFormat: DateFormat) {
  const columnMap = format ? format.columnMap : toColumnMap(choices);
  return {
    columnMap,
    dateFormat: format ? format.dateFormat : manualDateFormat,
    mappingProblems: validateColumnMap(columnMap),
  };
}

/**
 * Controller for the CSV import page: the loaded file (with or without a header row), which saved
 * format (or manual mapping) reads it, the target account, the normalized rows, and the import.
 */
export function useCsvImport() {
  const {
    data: formats = [],
  } = useCsvFormats();
  const importMutation = useImportTransactions();
  const file = useCsvFile();
  const mapping = useColumnMapping();
  const [formatId, setFormatId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const records = file.loaded?.records;
  const matches = useMemo(() => (records ? matchFormats(formats, records) : []), [formats, records]);
  const format = matches.find(f => f.id === formatId) ?? null;
  // A saved format decides whether row 1 is a header; otherwise the user's checkbox does.
  const hasHeader = format ? format.headers !== null : file.hasHeader;
  const csv = useMemo(() => (records ? toParsedCsv(records, hasHeader) : null), [records, hasHeader]);
  const choices = csv ? csv.labels.map((_, i) => mapping.choices[i] ?? IGNORE) : [];
  const resolved = resolveMapping(format, choices, mapping.dateFormat);
  const normalized = useMemo(
    () => (csv && resolved.mappingProblems.length === 0
      ? normalizeRows(csv, resolved.columnMap, resolved.dateFormat)
      : null),
    [csv, resolved.columnMap, resolved.dateFormat, resolved.mappingProblems.length],
  );

  const chooseFormat = (next: CsvFormat | null) => {
    setFormatId(next?.id ?? null);
    if (next?.accountId) setAccountId(next.accountId);
  };

  const loadFile = async (upload: File) => {
    const loaded = await file.load(upload);
    setResult(null);
    mapping.reset(toParsedCsv(loaded.records, true));
    chooseFormat(matchFormats(formats, loaded.records)[0] ?? null);
  };

  const submit = async () => {
    if (!csv || !normalized || !accountId) return;
    const imported = await importMutation.mutateAsync({
      accountId,
      csvFormatId: format?.id ?? null,
      newFormat: format
        ? null
        : {
          name: mapping.formatName.trim() || null,
          columnMap: resolved.columnMap,
          headers: csv.headers,
          dateFormat: resolved.dateFormat,
        },
      rows: normalized.rows,
    });
    setResult(imported);
    file.clear();
  };

  return {
    fileName: file.loaded?.fileName ?? null,
    csv,
    hasHeader,
    setHasHeader: file.setHasHeader,
    matches,
    format,
    chooseFormat,
    mapping,
    choices,
    ...resolved,
    accountId,
    setAccountId,
    normalized,
    loadFile,
    submit,
    isImporting: importMutation.isPending,
    result,
  };
}

export type CsvImportController = ReturnType<typeof useCsvImport>;
