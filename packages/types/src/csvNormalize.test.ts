import assert from "node:assert/strict";
import { test } from "node:test";
import { DateFormat } from "./csvFormats.js";
import {
  dedupKey,
  detectDateFormat,
  inferColumnType,
  inferValueType,
  normalizeDate,
  normalizeTime,
  parseAmount,
  splitDateTime,
  ValueType,
} from "./csvNormalize.js";

test("inferValueType classifies the shapes seen in bank exports", () => {
  assert.equal(inferValueType("3/12/2025"), ValueType.Date);
  assert.equal(inferValueType("2025-03-12"), ValueType.Date);
  assert.equal(inferValueType("09:41:07"), ValueType.Time);
  assert.equal(inferValueType("2025-03-12T09:41:07Z"), ValueType.DateTime);
  assert.equal(inferValueType("3/12/2025 4:14 PM"), ValueType.DateTime);
  assert.equal(inferValueType("-7.86"), ValueType.Number);
  assert.equal(inferValueType("$1,000.00"), ValueType.Number);
  assert.equal(inferValueType("(5.00)"), ValueType.Number);
  assert.equal(inferValueType("Grocery run"), ValueType.Text);
  assert.equal(inferValueType("  "), ValueType.Empty);
});

test("inferColumnType ignores blanks and falls back to text for mixed columns", () => {
  assert.equal(inferColumnType(["345.60", " ", "12.00"]), ValueType.Number);
  assert.equal(inferColumnType(["", ""]), ValueType.Empty);
  assert.equal(inferColumnType(["1.00", "abc"]), ValueType.Text);
});

test("detectDateFormat picks ISO, US, or EU when a leading part exceeds 12", () => {
  assert.equal(detectDateFormat(["2025-03-12", "2026-01-02"]), DateFormat.Iso);
  assert.equal(detectDateFormat(["3/12/2025", "1/2/2026"]), DateFormat.US);
  assert.equal(detectDateFormat(["13/01/2026", "02/01/2026"]), DateFormat.EU);
});

test("normalizeDate pads, honors the format, and rejects impossible dates", () => {
  assert.equal(normalizeDate("1/2/2026", DateFormat.US), "2026-01-02");
  assert.equal(normalizeDate("1/2/2026", DateFormat.EU), "2026-02-01");
  assert.equal(normalizeDate("1/2/26", DateFormat.US), "2026-01-02");
  assert.equal(normalizeDate("2025-03-12", DateFormat.US), "2025-03-12");
  assert.equal(normalizeDate("2/30/2026", DateFormat.US), null);
  assert.equal(normalizeDate("nope", DateFormat.US), null);
});

test("normalizeTime handles 12h and 24h clocks", () => {
  assert.equal(normalizeTime("09:41:07"), "09:41:07");
  assert.equal(normalizeTime("4:14 PM"), "16:14:00");
  assert.equal(normalizeTime("12:05 am"), "00:05:00");
  assert.equal(normalizeTime("25:00"), null);
});

test("splitDateTime separates the date and time parts", () => {
  assert.deepEqual(splitDateTime("2025-03-12T09:41:07Z", DateFormat.Iso), {
    date: "2025-03-12",
    time: "09:41:07",
  });
  assert.deepEqual(splitDateTime("3/12/2025 4:14 PM", DateFormat.US), {
    date: "2025-03-12",
    time: "16:14:00",
  });
});

test("parseAmount strips currency formatting and reads parentheses as negative", () => {
  assert.equal(parseAmount("$1,000.50"), 1000.5);
  assert.equal(parseAmount("(5.00)"), -5);
  assert.equal(parseAmount("-250.00"), -250);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("abc"), null);
});

test("dedupKey matches on date, time, trimmed name, and total to the cent", () => {
  const base = {
    date: "2025-03-10",
    time: null,
    name: "NORTHWIND UTILITIES ONLINE",
    total: -42.17,
  };
  assert.equal(dedupKey(base), dedupKey({
    ...base,
    name: " NORTHWIND UTILITIES ONLINE ",
    total: -42.170000001,
  }));
  assert.notEqual(dedupKey(base), dedupKey({
    ...base,
    total: -18.75,
  }));
});
