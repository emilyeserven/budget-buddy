/**
 * Synthetic CSV fixtures for the import-step stories. Parsed and normalized with the real
 * `parseCsv` / `normalizeRows`, so each story shows exactly what the page would render.
 */
import type { ColumnMapEntry } from "@app/types";

import { DateFormat, TransactionColumn } from "@app/types";

import { normalizeRows } from "../-utils/normalizeRows";
import { parseCsv } from "../-utils/parseCsv";

const HEADER = "Posted On,Merchant,Value,Kind";

const ROWS = [
  "3/11/2025,CORNER BAKERY,6.50,Card",
  "3/10/2025,NORTHWIND UTILITIES,42.17,ACH",
  "3/9/2025,PIXEL ARCADE,30.00,Card",
  "3/9/2025,PIXEL ARCADE,30.00,Card",
  "3/8/2025,BLUE HERON CAFE,4.25,Card",
  "3/7/2025,GLOBEX SOFTWARE,12.99,ACH",
  "3/6/2025,SERVICE CHARGE,2.00,Fee",
];

const MERCHANTS = ["CORNER BAKERY", "NORTHWIND UTILITIES", "PIXEL ARCADE", "BLUE HERON CAFE", "GLOBEX SOFTWARE"];

/** A small file with a header row. */
export const sampleCsv = parseCsv([HEADER, ...ROWS].join("\n"));

/** The same rows with no header row. */
export const headerlessCsv = parseCsv(ROWS.join("\n"), false);

/** A longer file (120 rows) for the all-rows listing. */
export const longCsv = parseCsv([
  HEADER,
  ...Array.from({
    length: 120,
  }, (_, i) => `3/${(i % 28) + 1}/2025,${MERCHANTS[i % MERCHANTS.length]},${(5 + (i * 7) % 90).toFixed(2)},Card`),
].join("\n"));

/** Date, payee, total, and a custom "Kind" field. */
export const sampleColumnMap: ColumnMapEntry[] = [
  {
    columnIndex: 0,
    transactionCol: TransactionColumn.Date,
  },
  {
    columnIndex: 1,
    transactionCol: TransactionColumn.Payee,
  },
  {
    columnIndex: 2,
    transactionCol: TransactionColumn.Total,
  },
  {
    columnIndex: 3,
    transactionCol: "Kind",
  },
];

/** `sampleCsv` normalized with `sampleColumnMap` — every row readable. */
export const sampleNormalized = normalizeRows(sampleCsv, sampleColumnMap, DateFormat.US);

/** A file with unreadable dates and totals, normalized — some rows are reported as problems. */
export const normalizedWithProblems = normalizeRows(parseCsv([
  HEADER,
  ...ROWS.slice(0, 3),
  "soon,MYSTERY SHOP,1.00,Card",
  "3/5/2025,CORNER BAKERY,,Card",
  "13/45/2025,PIXEL ARCADE,3.00,Card",
].join("\n")), sampleColumnMap, DateFormat.US);
