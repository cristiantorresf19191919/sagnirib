import "server-only";

import type {
  CheckoutSessionInput,
  CheckoutSessionRecord,
} from "@/server/biringas/checkout-types";

/**
 * Firestore adapter for checkout sessions — STUB.
 *
 * When real Stripe Connect / MercadoPago Marketplace lands, this
 * adapter writes `checkout_sessions/{auto-id}` and mints the provider
 * session id via the SDK (server-side). The mock-only completion
 * helper is intentionally not exposed here — real flows complete via
 * webhook.
 */

interface RawArgs {
  input: CheckoutSessionInput;
  ownerUid: string;
  totalCop: number;
}

export async function createCheckoutSessionRaw(
  _args: RawArgs,
): Promise<CheckoutSessionRecord> {
  throw new CheckoutDisabledError(
    "El checkout en Firestore aún no está implementado. Configura el provider o usa modo mock.",
  );
}

export async function completeCheckoutMockRaw(
  _id: string,
): Promise<CheckoutSessionRecord | null> {
  // Real flow completes via webhook, never via this path.
  return null;
}

export async function findCheckoutSessionRaw(
  _id: string,
): Promise<CheckoutSessionRecord | null> {
  return null;
}

class CheckoutDisabledError extends Error {
  readonly kind = "checkout-disabled" as const;
  constructor(message: string) {
    super(message);
    this.name = "CheckoutDisabledError";
  }
}
