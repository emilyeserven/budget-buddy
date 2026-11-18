// @vitest-environment node
import { TransactionColumn } from "@app/types";
import { describe, expect, it } from "vitest";

import { fromColumnMap, IGNORE, toColumnMap, validateColumnMap } from "./columnChoices";

describe("column choices", () => {
  it("round-trips fields and custom names, omitting ignored and blank custom columns", () => {
    const map = toColumnMap([
      {
        kind: "field",
        field: TransactionColumn.Date,
      },
      IGNORE,
      {
        kind: "custom",
        name: " Status ",
      },
      {
        kind: "custom",
        name: "  ",
      },
    ]);
    expect(map).toEqual([
      {
        columnIndex: 0,
        transactionCol: "date",
      },
      {
        columnIndex: 2,
        transactionCol: "Status",
      },
    ]);
    expect(fromColumnMap(map, 4)).toEqual([
      {
        kind: "field",
        field: TransactionColumn.Date,
      },
      IGNORE,
      {
        kind: "custom",
        name: "Status",
      },
      IGNORE,
    ]);
  });

  it("requires a date, a total, and something to name the payee", () => {
    expect(validateColumnMap([])).toEqual([
      "Map a Date or Date + time column.",
      "Map a Total column.",
      "Map at least one of Payee, Name, or Description.",
    ]);
    expect(validateColumnMap([
      {
        columnIndex: 0,
        transactionCol: TransactionColumn.DateTime,
      },
      {
        columnIndex: 1,
        transactionCol: TransactionColumn.Total,
      },
      {
        columnIndex: 2,
        transactionCol: TransactionColumn.Description,
      },
    ])).toEqual([]);
  });

  it("rejects a date column mapped twice or alongside a datetime", () => {
    const problems = validateColumnMap([
      {
        columnIndex: 0,
        transactionCol: TransactionColumn.Date,
      },
      {
        columnIndex: 1,
        transactionCol: TransactionColumn.Date,
      },
      {
        columnIndex: 2,
        transactionCol: TransactionColumn.DateTime,
      },
    ]);
    expect(problems).toContain("Only one column can be \"Date\".");
    expect(problems).toContain("Map either a Date or a Date + time column, not both.");
  });
});
