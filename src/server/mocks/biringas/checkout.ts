import "server-only";

import type {
  CheckoutSessionInput,
  CheckoutSessionRecord,
} from "@/server/biringas/checkout-types";

const STORE: CheckoutSessionRecord[] = [];

let counter = 0;
function nextId() {
  counter += 1;
  return `checkout-${Date.now()}-${counter}`;
}

interface RawArgs {
  input: CheckoutSessionInput;
  ownerUid: string;
  totalCop: number;
}

/**
 * Creates a new checkout session in `awaiting_payment` state. The
 * mock auto-completes after 1.5s — see `completeCheckoutMockRaw` for
 * the deterministic completion path the UI calls explicitly.
 */
export async function createCheckoutSessionRaw({
  input,
  ownerUid,
  totalCop,
}: RawArgs): Promise<CheckoutSessionRecord> {
  const record: CheckoutSessionRecord = {
    id: nextId(),
    ownerUid,
    tier: input.tier,
    billing: input.billing,
    provider: "mock",
    totalCop,
    status: "awaiting_payment",
    providerSessionId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  STORE.push(record);
  return record;
}

/**
 * Mock-only completion — flips the session to `succeeded` so the
 * checkout success surface has something to read back. Real provider
 * flows complete via webhook; this is only for the mocked happy path.
 */
export async function completeCheckoutMockRaw(
  id: string,
): Promise<CheckoutSessionRecord | null> {
  const idx = STORE.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  STORE[idx] = {
    ...STORE[idx]!,
    status: "succeeded",
    completedAt: new Date().toISOString(),
  };
  return STORE[idx];
}

export async function findCheckoutSessionRaw(
  id: string,
): Promise<CheckoutSessionRecord | null> {
  return STORE.find((s) => s.id === id) ?? null;
}
