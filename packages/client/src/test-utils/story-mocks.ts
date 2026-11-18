import { EntityType } from "@app/types";
import { http, HttpResponse } from "msw";

import { makeAccount, makeCsvFormat, makeEntity, makeTransaction } from "./factories";

/** Sample data shared by stories. */
export const sampleEntities = [
  makeEntity({
    id: "entity-1",
    name: "Acme Bank",
  }),
  makeEntity({
    id: "entity-2",
    name: "Me",
    type: EntityType.Household,
  }),
  makeEntity({
    id: "entity-3",
    name: "NORTHWIND UTILITIES",
  }),
];

export const sampleAccounts = [
  makeAccount({
    institutionName: "Acme Bank",
  }),
];

export const sampleCsvFormats = [makeCsvFormat()];

export const sampleTransactions = [
  makeTransaction(),
  makeTransaction({
    id: "transaction-2",
    name: "CORNER BAKERY #12",
    date: "2025-03-11",
    time: "08:15:00",
    total: -6.5,
    payeeName: "CORNER BAKERY",
  }),
];

/**
 * Default MSW handlers for data-driven stories (`parameters.msw.handlers`). MSW is a story-only tool
 * here — unit tests stub `fetch` or mock modules instead (see the `test-structure` skill).
 */
export const apiHandlers = [
  http.get("/api/entities", () => HttpResponse.json(sampleEntities)),
  http.post("/api/entities", async ({
    request,
  }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json(makeEntity({
      id: "entity-new",
      name: body.name,
    }), {
      status: 201,
    });
  }),
  http.patch("/api/entities/:id", () => HttpResponse.json(sampleEntities[0])),
  http.delete("/api/entities/:id", () => new HttpResponse(null, {
    status: 204,
  })),
  http.get("/api/accounts", () => HttpResponse.json(sampleAccounts)),
  http.post("/api/accounts", () => HttpResponse.json(sampleAccounts[0], {
    status: 201,
  })),
  http.patch("/api/accounts/:id", () => HttpResponse.json(sampleAccounts[0])),
  http.delete("/api/accounts/:id", () => new HttpResponse(null, {
    status: 204,
  })),
  http.get("/api/csv-formats", () => HttpResponse.json(sampleCsvFormats)),
  http.get("/api/transactions", () => HttpResponse.json(sampleTransactions)),
  http.post("/api/transactions/import", () => HttpResponse.json({
    imported: 2,
    skipped: 1,
    createdPayees: 1,
    csvFormatId: "format-1",
  })),
];
