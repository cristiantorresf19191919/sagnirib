import "server-only";

/**
 * Cache tag names for the Biringa listings port.
 *
 * Lifted to the port (not the adapter) because mutations need to
 * `revalidateTag()` from inside the barrel — and the audit forbids the
 * barrel from importing adapter internals. Both adapters and the barrel
 * import these constants from here.
 *
 * Naming convention: `<port>:<resource>[:<id>]`. Add new tags here, not
 * inline as string literals at call sites.
 */
export const CACHE_TAGS = {
  listings: "biringa:listings",
  listing: (slug: string) => `biringa:listing:${slug}`,
  bookingsForListing: (slug: string) => `biringa:bookings:${slug}`,
} as const;
