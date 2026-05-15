import "server-only";

/**
 * Re-export of the canonical domain types. Lives at `@/server/biringas/types`
 * so the mock and the Firebase adapter share the same contract (ADR-009).
 */
export type {
  AttentionTarget,
  BiringaAttributes,
  BiringaListing,
  BiringaReputation,
  Category,
  ContactChannel,
  ListingsFilters,
  PaginatedListings,
  Sex,
} from "@/server/biringas/types";
