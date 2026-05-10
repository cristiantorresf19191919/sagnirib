import "server-only";

/**
 * Re-export of the Admin app singleton. Auth helpers import from here so the
 * `auth/` folder doesn't reach back into `client.ts` directly.
 */
export { getApp } from "./client";
