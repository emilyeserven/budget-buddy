import type { ColumnChoice } from "../-utils/columnChoices";
import type { ParsedCsv } from "../-utils/parseCsv";
import type { CsvFormat, DateFormat, ImportResult } from "@app/types";

import { useMemo, useState } from "react";

import { useColumnMapping } from "./useColumnMapping";
import { toColumnMap, validateColumnMap } from "../-utils/columnChoices";
import { matchFormats } from "../-utils/matchFormats";
import { normalizeRows } from "../-utils/normalizeRows";
import { parseCsv } from "../-utils/parseCsv";

import { useCsvFormats } from "@/hooks/useCsvFormats";
import { useImportTransactions } from "@/hooks/useTransactions";

export interface LoadedCsv {
  fileName: string;
  csv: ParsedCsv;
}

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
 * Controller for the CSV import page: the loaded file, which saved format (or manual mapping) reads
 * it, the target account, the normalized rows, and the import mutation.
 */
export function useCsvImport() {
  const {
    data: formats = [],
  } = useCsvFormats();
  const importMutation = useImportTransactions();
  const mapping = useColumnMapping();
  const [loaded, setLoaded] = useState<LoadedCsv | null>(null);
  const [formatId, setFormatId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const matches = useMemo(() => (loaded ? matchFormats(formats, loaded.csv) : []), [formats, loaded]);
  const format = matches.find(f => f.id === formatId) ?? null;
  const resolved = resolveMapping(format, mapping.choices, mapping.dateFormat);
  const normalized = useMemo(
    () => (loaded && resolved.mappingProblems.length === 0
      ? normalizeRows(loaded.csv, resolved.columnMap, resolved.dateFormat)
      : null),
    [loaded, resolved.columnMap, resolved.dateFormat, resolved.mappingProblems.length],
  );

  const chooseFormat = (next: CsvFormat | null) => {
    setFormatId(next?.id ?? null);
    if (next?.accountId) setAccountId(next.accountId);
  };

  const loadFile = async (file: File) => {
    const csv = parseCsv(await file.text());
    setLoaded({
      fileName: file.name,
      csv,
    });
    setResult(null);
    mapping.reset(csv);
    chooseFormat(matchFormats(formats, csv)[0] ?? null);
  };

  const submit = async () => {
    if (!loaded || !normalized || !accountId) return;
    const imported = await importMutation.mutateAsync({
      accountId,
      csvFormatId: format?.id ?? null,
      newFormat: format
        ? null
        : {
          name: mapping.formatName.trim() || null,
          columnMap: resolved.columnMap,
          headers: loaded.csv.headers,
          dateFormat: resolved.dateFormat,
        },
      rows: normalized.rows,
    });
    setResult(imported);
    setLoaded(null);
  };

  return {
    loaded,
    matches,
    format,
    chooseFormat,
    mapping,
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
