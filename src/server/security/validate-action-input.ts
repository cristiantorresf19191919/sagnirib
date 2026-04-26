import "server-only";

/**
 * Lightweight contract for schema validation in Server Actions. Concrete
 * schemas live alongside the feature; the contract here is just so all
 * actions parse input through a single shape (Addendum 001 §14).
 */
export interface ActionInputSchema<T> {
  parse(input: unknown): T;
}

export function validateActionInput<T>(
  schema: ActionInputSchema<T>,
  input: unknown,
): T {
  return schema.parse(input);
}
