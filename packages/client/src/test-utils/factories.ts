import type { Account, CsvFormat, Entity, Transaction } from "@app/types";

import { AccountType, DateFormat, EntityType, TransactionColumn } from "@app/types";

/**
 * Shared test factories. Construct full shared entity objects in tests, stories, and MSW mocks with
 * these (override only the fields a test cares about) — never re-list every field in an inline
 * literal, which silently drifts when the shared type changes. When you add a field to a shared
 * type, update its factory's defaults; a new shared entity gets a factory here in the same change.
 */
export function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: "entity-1",
    name: "Acme Bank",
    type: EntityType.Commercial,
    defaultSplitterId: null,
    defaultSplit: null,
    specialSplitType: null,
    specialSplitValue: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "account-1",
    name: "Checking",
    type: AccountType.Checking,
    institutionId: "entity-1",
    institutionName: "Acme Bank",
    ownerId: "entity-2",
    ownerName: "Me",
    invertAmounts: false,
    csvFormatId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeCsvFormat(overrides: Partial<CsvFormat> = {}): CsvFormat {
  return {
    id: "format-1",
    name: "Checking",
    institutionId: "entity-1",
    accountId: "account-1",
    columnMap: [
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
    ],
    headers: ["Posted On", "Merchant", "Value"],
    dateFormat: DateFormat.US,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "transaction-1",
    name: "NORTHWIND UTILITIES ONLINE",
    date: "2025-03-10",
    time: null,
    total: -42.17,
    accountId: "account-1",
    accountName: "Checking",
    description: null,
    splitterId: null,
    splitterName: null,
    splitType: null,
    splitValue: null,
    payeeId: "entity-3",
    payeeName: "NORTHWIND UTILITIES",
    extra: null,
    rawCSV: "3/10/2025,NORTHWIND UTILITIES ONLINE,-42.17",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
