import "server-only";

import { cookies } from "next/headers";

import {
  ACCOUNT_TYPE_COOKIE,
  isAccountType,
  type AccountType,
} from "./rbac";

/**
 * Server-side reader for the `biringas:account-type` cookie.
 *
 * Returns the chosen account type or null if the visitor never went
 * through the registration chooser. Used to render the right dashboard
 * surface (publisher vs commentator) before Firebase custom claims
 * propagate. NOT a security primitive — Security Rules remain the
 * authoritative gate.
 */
export async function readAccountTypeCookie(): Promise<AccountType | null> {
  const store = await cookies();
  const raw = store.get(ACCOUNT_TYPE_COOKIE)?.value;
  return isAccountType(raw) ? raw : null;
}
