// @vitest-environment node
import { DateFormat, TransactionColumn } from "@app/types";
import { describe, expect, it } from "vitest";

import { normalizeRows } from "./normalizeRows";
import { parseCsv } from "./parseCsv";

describe("normalizeRows", () => {
  it("normalizes dates and times, parses totals, and falls back payee → name", () => {
    const csv = parseCsv("Posted, Clock, Value, Kind, Memo\n2025-03-10,13:05:52,-42.17,Debit,NORTHWIND UTILITIES ONLINE\n");
    const {
      rows, problems,
    } = normalizeRows(csv, [
      {
        columnIndex: 0,
        transactionCol: TransactionColumn.Date,
      },
      {
        columnIndex: 1,
        transactionCol: TransactionColumn.Time,
      },
      {
        columnIndex: 2,
        transactionCol: TransactionColumn.Total,
      },
      {
        columnIndex: 3,
        transactionCol: "Kind",
      },
      {
        columnIndex: 4,
        transactionCol: TransactionColumn.Name,
      },
    ], DateFormat.Iso);
    expect(problems).toEqual([]);
    expect(rows).toEqual([{
      name: "NORTHWIND UTILITIES ONLINE",
      date: "2025-03-10",
      time: "13:05:52",
      total: -42.17,
      description: null,
      payeeName: "NORTHWIND UTILITIES ONLINE",
      extra: {
        Kind: "Debit",
      },
      rawCSV: "2025-03-10,13:05:52,-42.17,Debit,NORTHWIND UTILITIES ONLINE",
    }]);
  });

  it("splits a datetime column and reads US dates", () => {
    const csv = parseCsv("When,Amt,Who\n3/12/2025 4:14 PM,5,Cafe\n");
    const {
      rows,
    } = normalizeRows(csv, [
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
        transactionCol: TransactionColumn.Payee,
      },
    ], DateFormat.US);
    expect(rows[0]).toMatchObject({
      date: "2025-03-12",
      time: "16:14:00",
      name: "Cafe",
      payeeName: "Cafe",
    });
  });

  it("reports rows with an unreadable date or total by file line", () => {
    const csv = parseCsv("Date,Amount,Desc\nsoon,1,A\n3/1/2025,,B\n3/2/2025,3,C\n");
    const {
      rows, problems,
    } = normalizeRows(csv, [
      {
        columnIndex: 0,
        transactionCol: TransactionColumn.Date,
      },
      {
        columnIndex: 1,
        transactionCol: TransactionColumn.Total,
      },
      {
        columnIndex: 2,
        transactionCol: TransactionColumn.Description,
      },
    ], DateFormat.US);
    expect(rows).toHaveLength(1);
    expect(problems).toEqual([
      {
        line: 2,
        message: "unreadable date",
      },
      {
        line: 3,
        message: "unreadable total",
      },
    ]);
  });

  it("numbers rows from 1 when the file has no header", () => {
    const csv = parseCsv("soon,1,A\n3/2/2025,3,C\n", false);
    const {
      rows, problems,
    } = normalizeRows(csv, [
      {
        columnIndex: 0,
        transactionCol: TransactionColumn.Date,
      },
      {
        columnIndex: 1,
        transactionCol: TransactionColumn.Total,
      },
      {
        columnIndex: 2,
        transactionCol: TransactionColumn.Payee,
      },
    ], DateFormat.US);
    expect(rows).toHaveLength(1);
    expect(problems).toEqual([{
      line: 1,
      message: "unreadable date",
    }]);
  });
});
