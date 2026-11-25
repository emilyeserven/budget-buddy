// @vitest-environment node
import { TransactionColumn } from "@app/types";
import { describe, expect, it } from "vitest";

import { matchFormats } from "./matchFormats";
import { parseCsvRecords } from "./parseCsv";

import { makeCsvFormat } from "@/test-utils/factories";

const creditCard = parseCsvRecords("Posted On,Merchant,Value\n3/11/2025,SERVICE CHARGE,12.50\n3/10/2025,GLOBEX SOFTWARE,7.99\n");

describe("matchFormats", () => {
  it("matches a format whose mapped columns have the right types", () => {
    const format = makeCsvFormat();
    expect(matchFormats([format], creditCard)).toEqual([format]);
  });

  it("rejects a different column count or a mapped column of the wrong type", () => {
    const wrongCount = makeCsvFormat({
      id: "f2",
      headers: ["Posted On", "Value"],
    });
    const wrongType = makeCsvFormat({
      id: "f3",
      columnMap: [{
        columnIndex: 1,
        transactionCol: TransactionColumn.Total,
      }],
    });
    expect(matchFormats([wrongCount, wrongType], creditCard)).toEqual([]);
  });

  it("ranks exact header matches ahead of type-only matches", () => {
    const typeOnly = makeCsvFormat({
      id: "type-only",
      headers: ["Posted", "Memo", "Value"],
    });
    const exact = makeCsvFormat({
      id: "exact",
      headers: ["posted on", "merchant", "value"],
    });
    expect(matchFormats([typeOnly, exact], creditCard).map(f => f.id)).toEqual(["exact", "type-only"]);
  });

  it("matches a headerless format by column types alone, reading row 1 as data", () => {
    const headerless = makeCsvFormat({
      id: "headerless",
      headers: null,
    });
    const noHeaderFile = parseCsvRecords("3/11/2025,SERVICE CHARGE,12.50\n3/10/2025,GLOBEX SOFTWARE,7.99\n");
    expect(matchFormats([makeCsvFormat(), headerless], noHeaderFile).map(f => f.id)).toEqual(["headerless"]);
  });

  it("doesn't match a headered format against a headerless file whose row 1 is data", () => {
    const noHeaderFile = parseCsvRecords("3/11/2025,SERVICE CHARGE,12.50\n3/10/2025,GLOBEX SOFTWARE,7.99\n");
    expect(matchFormats([makeCsvFormat()], noHeaderFile)).toEqual([]);
  });
});
