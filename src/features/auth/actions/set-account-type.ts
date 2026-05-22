"use server";

import { cookies } from "next/headers";

import {
  ACCOUNT_TYPE_COOKIE,
  isAccountType,
  type AccountType,
} from "@/features/auth/lib/rbac";

export interface SetAccountTypeResult {
  ok: boolean;
  accountType?: AccountType;
  error?: { kind: string; message: string };
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Persists the visitor's chosen registration journey (publisher vs
 * commentator) in an httpOnly cookie so the rest of the funnel and the
 * dashboard can read it server-side. NOT a permission grant — Firebase
 * custom claims remain the authoritative role source. This is purely
 * a UX hint that survives reloads and direct links.
 */
export async function setAccountType(
  input: unknown,
): Promise<SetAccountTypeResult> {
  if (!isAccountType(input)) {
    return {
      ok: false,
      error: { kind: "invalid-argument", message: "Unknown account type" },
    };
  }

  const store = await cookies();
  store.set(ACCOUNT_TYPE_COOKIE, input, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return { ok: true, accountType: input };
}

export async function clearAccountType(): Promise<{ ok: true }> {
  const store = await cookies();
  store.delete(ACCOUNT_TYPE_COOKIE);
  return { ok: true };
}
