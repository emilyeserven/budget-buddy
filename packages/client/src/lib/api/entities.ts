import type { CreateEntityInput, Entity, UpdateEntityInput } from "@app/types";

import { createCrudApi } from "./client";

export const entitiesApi = createCrudApi<Entity, CreateEntityInput, UpdateEntityInput>("entities");
