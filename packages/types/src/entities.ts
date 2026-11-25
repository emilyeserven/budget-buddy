/**
 * Entities — anyone a transaction involves: merchants, institutions, friends, household members.
 * A transaction is charged by one Entity (its payee) and may be split with another (its splitter).
 */

export const EntityType = {
  Commercial: "commercial",
  Friend: "friend",
  Household: "household",
} as const;
export type EntityType = typeof EntityType[keyof typeof EntityType];

/** How transactions from this entity are split by default. */
export const DefaultSplit = {
  None: "none",
  Half: "half",
  All: "all",
  Special: "special",
} as const;
export type DefaultSplit = typeof DefaultSplit[keyof typeof DefaultSplit];

/** A split is either a fixed amount or a percentage of the total. */
export const SplitType = {
  Fixed: "fixed",
  Percent: "percent",
} as const;
export type SplitType = typeof SplitType[keyof typeof SplitType];

/** An entity as returned by the API. */
export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  defaultSplitterId: string | null;
  defaultSplit: DefaultSplit | null;
  specialSplitType: SplitType | null;
  specialSplitValue: number | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/entities` body. */
export interface CreateEntityInput {
  name: string;
  type: EntityType;
  defaultSplitterId?: string | null;
  defaultSplit?: DefaultSplit | null;
  specialSplitType?: SplitType | null;
  specialSplitValue?: number | null;
}

/** `PATCH /api/entities/:id` body. */
export type UpdateEntityInput = Partial<CreateEntityInput>;
