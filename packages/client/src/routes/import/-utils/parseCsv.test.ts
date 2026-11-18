// @vitest-environment node
import { describe, expect, it } from "vitest";

import { parseCsv } from "./parseCsv";

describe("parseCsv", () => {
  it("trims headers and cells and keeps each row's raw line", () => {
    const csv = parseCsv("Posted, Clock, Value\n2025-03-12,09:41:07,750.00\n");
    expect(csv.headers).toEqual(["Posted", "Clock", "Value"]);
    expect(csv.rows).toEqual([["2025-03-12", "09:41:07", "750.00"]]);
    expect(csv.rawLines).toEqual(["2025-03-12,09:41:07,750.00"]);
  });

  it("drops fields past the header width (trailing comma) and pads short rows", () => {
    const csv = parseCsv("A,B,C\r\n1,2,3,\r\n4\r\n");
    expect(csv.rows).toEqual([["1", "2", "3"], ["4", "", ""]]);
    expect(csv.rawLines).toEqual(["1,2,3,", "4"]);
  });

  it("keeps quoted commas and skips blank lines and a BOM", () => {
    const csv = parseCsv("\uFEFFName,Amount\n\n\"Initech, Inc. DIRECT DEP\",1.00\n");
    expect(csv.headers).toEqual(["Name", "Amount"]);
    expect(csv.rows).toEqual([["Initech, Inc. DIRECT DEP", "1.00"]]);
    expect(csv.rawLines).toEqual(["\"Initech, Inc. DIRECT DEP\",1.00"]);
  });

  it("returns an empty result for empty text", () => {
    expect(parseCsv("")).toEqual({
      headers: [],
      rows: [],
      rawLines: [],
    });
  });
});
