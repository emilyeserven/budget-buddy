import type { ImportTransactionsInput } from "@app/types";
import type { FastifyInstance } from "fastify";

import { createCsvFormatBody } from "@/routes/csvFormats";
import { importTransactions, listTransactions } from "@/services/transactions";

// Module-level JSON-schema consts (see the `add-endpoint` skill). Bodies are
// `additionalProperties: false` and AJV `removeAdditional` silently strips undeclared fields.
const nullableString = {
  type: ["string", "null"],
} as const;

const stringMap = {
  type: ["object", "null"],
  additionalProperties: {
    type: "string",
  },
} as const;

const transactionSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    date: {
      type: "string",
    },
    time: nullableString,
    total: {
      type: "number",
    },
    accountId: {
      type: "string",
    },
    accountName: {
      type: "string",
    },
    description: nullableString,
    splitterId: nullableString,
    splitterName: nullableString,
    splitType: nullableString,
    splitValue: {
      type: ["number", "null"],
    },
    payeeId: {
      type: "string",
    },
    payeeName: {
      type: "string",
    },
    extra: stringMap,
    rawCSV: nullableString,
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
    },
  },
} as const;

const importRowSchema = {
  type: "object",
  required: ["name", "date", "time", "total", "description", "payeeName", "extra", "rawCSV"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    date: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    },
    time: {
      type: ["string", "null"],
      pattern: "^\\d{2}:\\d{2}:\\d{2}$",
    },
    total: {
      type: "number",
    },
    description: nullableString,
    payeeName: {
      type: "string",
    },
    extra: stringMap,
    rawCSV: {
      type: "string",
    },
  },
} as const;

const importBody = {
  type: "object",
  required: ["accountId", "rows"],
  additionalProperties: false,
  properties: {
    accountId: {
      type: "string",
      format: "uuid",
    },
    csvFormatId: {
      type: ["string", "null"],
      format: "uuid",
    },
    newFormat: {
      ...createCsvFormatBody,
      type: ["object", "null"],
    },
    rows: {
      type: "array",
      items: importRowSchema,
    },
  },
};

const importResultSchema = {
  type: "object",
  properties: {
    imported: {
      type: "integer",
    },
    skipped: {
      type: "integer",
    },
    createdPayees: {
      type: "integer",
    },
    csvFormatId: nullableString,
  },
} as const;

/** Imports carry every row of a CSV export — allow well beyond Fastify's 1 MB default. */
const IMPORT_BODY_LIMIT = 16 * 1024 * 1024;

const tags = ["transactions"];

export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/transactions", {
    schema: {
      tags,
      response: {
        200: {
          type: "array",
          items: transactionSchema,
        },
      },
    },
  }, async () => listTransactions());

  app.post<{ Body: ImportTransactionsInput }>("/api/transactions/import", {
    bodyLimit: IMPORT_BODY_LIMIT,
    schema: {
      tags,
      body: importBody,
      response: {
        200: importResultSchema,
      },
    },
  }, async req => importTransactions(req.body));
}
