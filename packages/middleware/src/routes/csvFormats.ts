import type { CreateCsvFormatInput } from "@app/types";
import type { FastifyInstance } from "fastify";

import { DateFormat, enumValues } from "@app/types";
import { createCsvFormat, listCsvFormats } from "@/services/csvFormats";

// Module-level JSON-schema consts (see the `add-endpoint` skill). Bodies are
// `additionalProperties: false` and AJV `removeAdditional` silently strips undeclared fields.
const columnMapSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["columnIndex", "transactionCol"],
    additionalProperties: false,
    properties: {
      columnIndex: {
        type: "integer",
        minimum: 0,
      },
      transactionCol: {
        type: "string",
        minLength: 1,
      },
    },
  },
} as const;

const csvFormatSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    institutionId: {
      type: ["string", "null"],
    },
    accountId: {
      type: ["string", "null"],
    },
    columnMap: columnMapSchema,
    headers: {
      type: "array",
      items: {
        type: "string",
      },
    },
    dateFormat: {
      type: "string",
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
    },
  },
} as const;

/** `CreateCsvFormatInput` — also embedded as `newFormat` in the transaction import body. */
export const createCsvFormatBody = {
  type: "object",
  required: ["columnMap", "headers", "dateFormat"],
  additionalProperties: false,
  properties: {
    name: {
      type: ["string", "null"],
    },
    institutionId: {
      type: ["string", "null"],
      format: "uuid",
    },
    accountId: {
      type: ["string", "null"],
      format: "uuid",
    },
    columnMap: columnMapSchema,
    headers: {
      type: "array",
      items: {
        type: "string",
      },
    },
    dateFormat: {
      type: "string",
      enum: enumValues(DateFormat),
    },
  },
};

const tags = ["csv-formats"];

export async function csvFormatRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/csv-formats", {
    schema: {
      tags,
      response: {
        200: {
          type: "array",
          items: csvFormatSchema,
        },
      },
    },
  }, async () => listCsvFormats());

  app.post<{ Body: CreateCsvFormatInput }>("/api/csv-formats", {
    schema: {
      tags,
      body: createCsvFormatBody,
      response: {
        201: csvFormatSchema,
      },
    },
  }, async (req, reply) => reply.code(201).send(await createCsvFormat(req.body)));
}
