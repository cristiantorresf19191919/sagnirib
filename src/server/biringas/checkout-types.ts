import "server-only";

/**
 * Checkout-session domain contract.
 *
 * Mocked today; persists to Firestore under `checkout_sessions/{id}`
 * later when Stripe Connect or MercadoPago go live. The shape stays
 * compatible with both — `provider` switches between them and
 * `providerSessionId` is set by whichever adapter handles the real
 * intent creation.
 *
 * Pricing is in COP cents to avoid floating-point drift. UI formats
 * to pesos for display.
 */

export type PlanTier = "boost" | "elite";

export type BillingCadence = "monthly" | "quarterly";

export type CheckoutProvider = "stripe" | "mercadopago" | "mock";

export type CheckoutStatus =
  | "draft"
  | "awaiting_payment"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface CheckoutSessionInput {
  tier: PlanTier;
  billing: BillingCadence;
  provider?: CheckoutProvider;
}

export interface CheckoutSessionRecord extends CheckoutSessionInput {
  id: string;
  ownerUid: string;
  totalCop: number;
  status: CheckoutStatus;
  /** Set when the real provider intent has been minted. `null` for
   *  mock-mode sessions, which complete inline. */
  providerSessionId: string | null;
  createdAt: string;
  /** Set when the session reaches a terminal status. */
  completedAt: string | null;
}

interface PlanPricing {
  monthly: number;
  quarterly: number;
}

/**
 * Monthly + quarterly prices in COP per plan. Mirrors what the public
 * planes page displays. Quarterly carries a 15% discount versus 3×
 * monthly — typical retention lever for marketplace seller plans.
 *
 * Server-side enforcement: the barrel's `createCheckoutSession`
 * recomputes the total from these constants. The client never picks
 * a price out of thin air.
 */
export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  boost: {
    monthly: 89_000,
    quarterly: Math.round(89_000 * 3 * 0.85),
  },
  elite: {
    monthly: 249_000,
    quarterly: Math.round(249_000 * 3 * 0.85),
  },
} as const;

export const PLAN_LABELS: Record<PlanTier, string> = {
  boost: "Impulso",
  elite: "Elite",
};

export const BILLING_LABELS: Record<BillingCadence, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral (15% off)",
};
