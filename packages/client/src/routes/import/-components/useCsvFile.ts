import type { CsvRecord } from "../-utils/parseCsv";

import { useState } from "react";

import { guessHasHeader, parseCsvRecords } from "../-utils/parseCsv";

export interface LoadedCsv {
  fileName: string;
  records: CsvRecord[];
}

/** The uploaded file's records and whether its first row is a header (guessed, user-overridable). */
export function useCsvFile() {
  const [loaded, setLoaded] = useState<LoadedCsv | null>(null);
  const [hasHeader, setHasHeader] = useState(true);

  const load = async (file: File): Promise<LoadedCsv> => {
    const records = parseCsvRecords(await file.text());
    const next = {
      fileName: file.name,
      records,
    };
    setLoaded(next);
    setHasHeader(guessHasHeader(records));
    return next;
  };

  return {
    loaded,
    hasHeader,
    setHasHeader,
    load,
    clear: () => setLoaded(null),
  };
}
