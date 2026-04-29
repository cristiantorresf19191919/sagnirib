import "server-only";

import { cookies } from "next/headers";

import { site } from "@/core/env/site";

/**
 * Cookie name used to record an "I am 18+" acknowledgment from the visitor.
 *
 * The flag is anonymous (no PII) and only short-circuits the interstitial
 * gate. It is NOT a substitute for KYC/age verification when an account or
 * payment flow is added — those will require provider-driven checks.
 */
export const AGE_ACK_COOKIE = "biringas_age_ack";
const AGE_ACK_VALUE = "1";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function readAgeAck(): Promise<boolean> {
  const store = await cookies();
  return store.get(AGE_ACK_COOKIE)?.value === AGE_ACK_VALUE;
}

export async function writeAgeAck(): Promise<void> {
  const store = await cookies();
  store.set({
    name: AGE_ACK_COOKIE,
    value: AGE_ACK_VALUE,
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: site.isProduction,
    httpOnly: false,
  });
}
