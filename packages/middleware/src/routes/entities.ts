import type { CreateEntityInput, UpdateEntityInput } from "@app/types";
import type { FastifyInstance } from "fastify";

import { DefaultSplit, EntityType, enumValues, SplitType } from "@app/types";
import {
  createEntity,
  deleteEntity,
  getEntity,
  listEntities,
  updateEntity,
} from "@/services/entities";

// Module-level JSON-schema consts (see the `add-endpoint` skill). Bodies are
// `additionalProperties: false` and AJV `removeAdditional` silently strips undeclared fields.
const nullableEnum = (values: string[]) => ({
  type: ["string", "null"],
  enum: [...values, null],
});

const entitySchema = {
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
    defaultSplitterId: {
      type: ["string", "null"],
    },
    defaultSplit: {
      type: ["string", "null"],
    },
    specialSplitType: {
      type: ["string", "null"],
    },
    specialSplitValue: {
      type: ["number", "null"],
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

const entityBodyProperties = {
  name: {
    type: "string",
    minLength: 1,
  },
  type: {
    type: "string",
    enum: enumValues(EntityType),
  },
  defaultSplitterId: {
    type: ["string", "null"],
    format: "uuid",
  },
  defaultSplit: nullableEnum(enumValues(DefaultSplit)),
  specialSplitType: nullableEnum(enumValues(SplitType)),
  specialSplitValue: {
    type: ["number", "null"],
  },
};

const createBody = {
  type: "object",
  required: ["name", "type"],
  additionalProperties: false,
  properties: entityBodyProperties,
};

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: entityBodyProperties,
};

const tags = ["entities"];

export async function entityRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/entities", {
    schema: {
      tags,
      response: {
        200: {
          type: "array",
          items: entitySchema,
        },
      },
    },
  }, async () => listEntities());

  app.get<{ Params: { id: string } }>("/api/entities/:id", {
    schema: {
      tags,
      params: idParams,
      response: {
        200: entitySchema,
      },
    },
  }, async req => getEntity(req.params.id));

  app.post<{ Body: CreateEntityInput }>("/api/entities", {
    schema: {
      tags,
      body: createBody,
      response: {
        201: entitySchema,
      },
    },
  }, async (req, reply) => reply.code(201).send(await createEntity(req.body)));

  app.patch<{ Params: { id: string };
    Body: UpdateEntityInput; }>("/api/entities/:id", {
    schema: {
      tags,
      params: idParams,
      body: updateBody,
      response: {
        200: entitySchema,
      },
    },
  }, async req => updateEntity(req.params.id, req.body));

  app.delete<{ Params: { id: string } }>("/api/entities/:id", {
    schema: {
      tags,
      params: idParams,
    },
  }, async (req, reply) => {
    await deleteEntity(req.params.id);
    return reply.code(204).send();
  });
}
