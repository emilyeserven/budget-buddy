/**
 * Helpers for the keyed-const-object enum convention used by every cross-package string union:
 *
 *   export const EntityType = { Commercial: "commercial", ... } as const;
 *   export type EntityType = typeof EntityType[keyof typeof EntityType];
 *
 * Reference members as `EntityType.Commercial`; spread the values into wire schemas with
 * {@link enumValues} (JSON-Schema `enum`, Drizzle `text(..., { enum })`) or `z.enum(EntityType)`.
 */

/** A keyed const object whose values are the union's string literals. */
export type StringEnum = Readonly<Record<string, string>>;

/** The values of a keyed enum object, typed as a non-empty tuple (what Drizzle's `enum` wants). */
export function enumValues<E extends StringEnum>(e: E): [E[keyof E], ...E[keyof E][]] {
  return Object.values(e) as [E[keyof E], ...E[keyof E][]];
}

/** Type guard: is `value` one of the enum's values? */
export function isEnumValue<E extends StringEnum>(e: E, value: unknown): value is E[keyof E] {
  return typeof value === "string" && (Object.values(e) as string[]).includes(value);
}
