import "server-only";

/**
 * Single import barrel for the Biringa listings port. Features import from
 * here ONLY — never from `@/server/mocks/...` directly.
 *
 * Today this re-exports the in-memory mock implementation. When a real
 * provider lands (Firebase / Postgres / etc.), swap the wiring here without
 * touching feature code:
 *
 *   - mock: `export * from "@/server/mocks/biringas";`
 *   - prod: `export * from "@/server/adapters/firebase/biringas";`
 *
 * Keeping the swap localized to this file is the whole point of ADR-009.
 */
export * from "@/server/mocks/biringas";
