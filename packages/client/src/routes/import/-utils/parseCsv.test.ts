// @vitest-environment node
import { describe, expect, it } from "vitest";

import { guessHasHeader, parseCsv, parseCsvRecords } from "./parseCsv";

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
    expect(parseCsv("")).toMatchObject({
      headers: null,
      labels: [],
      rows: [],
      rawLines: [],
    });
  });
});

describe("headerless CSVs", () => {
  it("treats every record as data, labels columns, and sizes to the widest row", () => {
    const csv = parseCsv("3/11/2025,CORNER BAKERY,6.50\n3/10/2025,GLOBEX SOFTWARE,7.99,\n", false);
    expect(csv.headers).toBeNull();
    expect(csv.labels).toEqual(["Column 1", "Column 2", "Column 3", "Column 4"]);
    expect(csv.rows).toEqual([
      ["3/11/2025", "CORNER BAKERY", "6.50", ""],
      ["3/10/2025", "GLOBEX SOFTWARE", "7.99", ""],
    ]);
    expect(csv.rawLines[0]).toBe("3/11/2025,CORNER BAKERY,6.50");
    expect(csv.firstLine).toBe(1);
  });

  it("guesses a header when row 1 has text over typed columns", () => {
    expect(guessHasHeader(parseCsvRecords("Posted On,Merchant,Value\n3/11/2025,CORNER BAKERY,6.50\n"))).toBe(true);
    expect(guessHasHeader(parseCsvRecords("3/11/2025,CORNER BAKERY,6.50\n3/10/2025,GLOBEX SOFTWARE,7.99\n"))).toBe(false);
    expect(guessHasHeader(parseCsvRecords("Name,Note\nAlpha,Beta\n"))).toBe(true);
  });
});
