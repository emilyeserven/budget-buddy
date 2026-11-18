import type { ColumnChoice } from "../-utils/columnChoices";
import type { ParsedCsv } from "../-utils/parseCsv";

import { useState } from "react";

import { DateFormat, detectDateFormat, ValueType } from "@app/types";

import { IGNORE } from "../-utils/columnChoices";
import { inferColumnTypes } from "../-utils/matchFormats";

/** Detect the date layout from every column that looks like a date or datetime. */
function detectFromCsv(csv: ParsedCsv): DateFormat {
  const types = inferColumnTypes(csv);
  const samples = csv.rows.flatMap(row =>
    row.filter((_, i) => types[i] === ValueType.Date || types[i] === ValueType.DateTime));
  return detectDateFormat(samples);
}

/** Manual column-mapping state: one choice per column, the date layout, and an optional name. */
export function useColumnMapping() {
  const [choices, setChoices] = useState<ColumnChoice[]>([]);
  const [dateFormat, setDateFormat] = useState<DateFormat>(DateFormat.US);
  const [formatName, setFormatName] = useState("");

  // Pads with IGNORE: toggling the header row can widen the column count after a reset.
  const setChoice = (index: number, choice: ColumnChoice) =>
    setChoices((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push(IGNORE);
      next[index] = choice;
      return next;
    });

  const reset = (csv: ParsedCsv) => {
    setChoices(csv.labels.map(() => IGNORE));
    setDateFormat(detectFromCsv(csv));
    setFormatName("");
  };

  return {
    choices,
    setChoice,
    dateFormat,
    setDateFormat,
    formatName,
    setFormatName,
    reset,
  };
}
