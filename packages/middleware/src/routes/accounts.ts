import type { CreateAccountInput, UpdateAccountInput } from "@app/types";
import type { FastifyInstance } from "fastify";

import { AccountType, enumValues } from "@app/types";
import {
  createAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  updateAccount,
} from "@/services/accounts";

// Module-level JSON-schema consts (see the `add-endpoint` skill). Bodies are
// `additionalProperties: false` and AJV `removeAdditional` silently strips undeclared fields.
const accountSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    type: {
      type: "string",
    },
    institutionId: {
      type: "string",
    },
    institutionName: {
      type: "string",
    },
    ownerId: {
      type: "string",
    },
    ownerName: {
      type: "string",
    },
    invertAmounts: {
      type: "boolean",
    },
    csvFormatId: {
      type: ["string", "null"],
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
    },
  },
} as const;

const idParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const accountBodyProperties = {
  name: {
    type: "string",
    minLength: 1,
  },
  type: {
    type: "string",
    enum: enumValues(AccountType),
  },
  institutionId: {
    type: "string",
    format: "uuid",
  },
  ownerId: {
    type: "string",
    format: "uuid",
  },
  invertAmounts: {
    type: "boolean",
  },
  csvFormatId: {
    type: ["string", "null"],
    format: "uuid",
  },
};

const createBody = {
  type: "object",
  required: ["name", "type", "institutionId", "ownerId"],
  additionalProperties: false,
  properties: accountBodyProperties,
};

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: accountBodyProperties,
};

const tags = ["accounts"];

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/accounts", {
    schema: {
      tags,
      response: {
        200: {
          type: "array",
          items: accountSchema,
        },
      },
    },
  }, async () => listAccounts());

  app.get<{ Params: { id: string } }>("/api/accounts/:id", {
    schema: {
      tags,
      params: idParams,
      response: {
        200: accountSchema,
      },
    },
  }, async req => getAccount(req.params.id));

  app.post<{ Body: CreateAccountInput }>("/api/accounts", {
    schema: {
      tags,
      body: createBody,
      response: {
        201: accountSchema,
      },
    },
  }, async (req, reply) => reply.code(201).send(await createAccount(req.body)));

  app.patch<{ Params: { id: string };
    Body: UpdateAccountInput; }>("/api/accounts/:id", {
    schema: {
      tags,
      params: idParams,
      body: updateBody,
      response: {
        200: accountSchema,
      },
    },
  }, async req => updateAccount(req.params.id, req.body));

  app.delete<{ Params: { id: string } }>("/api/accounts/:id", {
    schema: {
      tags,
      params: idParams,
    },
  }, async (req, reply) => {
    await deleteAccount(req.params.id);
    return reply.code(204).send();
  });
}
