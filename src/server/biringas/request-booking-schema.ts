import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  BOOKING_DURATIONS,
  BOOKING_LIMITS,
  type BookingContactPreference,
  type BookingMeetingType,
  type BookingRequestInput,
} from "./booking-types";

const MEETING_TYPES: ReadonlySet<BookingMeetingType> = new Set([
  "outcall",
  "incall",
  "videocall",
]);

const CONTACT_PREFERENCES: ReadonlySet<BookingContactPreference> = new Set([
  "whatsapp",
  "telegram",
  "platform",
]);

/**
 * Validator for `requestBooking`. Throws on the first invalid field with
 * a message that names the failing key — the action layer maps these to
 * inline form errors.
 */
export const requestBookingSchema: ActionInputSchema<BookingRequestInput> = {
  parse(input: unknown): BookingRequestInput {
    if (!input || typeof input !== "object") {
      throw new Error("requestBooking: input must be an object");
    }
    const r = input as Record<string, unknown>;

    const listingSlug = expectString(r.listingSlug, "listingSlug", 1, 200);
    const proposedAt = expectIsoDate(r.proposedAt, "proposedAt");
    const durationHours = expectDuration(r.durationHours);
    const meetingType = expectEnum(
      r.meetingType,
      "meetingType",
      MEETING_TYPES,
    );
    const contactPreference = expectEnum(
      r.contactPreference,
      "contactPreference",
      CONTACT_PREFERENCES,
    );
    const message = expectString(
      r.message,
      "message",
      BOOKING_LIMITS.messageMin,
      BOOKING_LIMITS.messageMax,
    );

    return {
      listingSlug,
      proposedAt,
      durationHours,
      meetingType,
      contactPreference,
      message: message.trim(),
    };
  },
};

function expectString(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") {
    throw new Error(`requestBooking: ${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(
      `requestBooking: ${field} must be at least ${min} character(s)`,
    );
  }
  if (trimmed.length > max) {
    throw new Error(
      `requestBooking: ${field} must be at most ${max} character(s)`,
    );
  }
  return trimmed;
}

function expectIsoDate(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`requestBooking: ${field} must be an ISO date string`);
  }
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) {
    throw new Error(`requestBooking: ${field} is not a valid date`);
  }
  // Reject dates in the past (>1 day grace for timezone fuzziness).
  if (ts < Date.now() - 24 * 60 * 60 * 1000) {
    throw new Error(`requestBooking: ${field} cannot be in the past`);
  }
  return value;
}

function expectDuration(
  value: unknown,
): BookingRequestInput["durationHours"] {
  if (typeof value !== "number") {
    throw new Error("requestBooking: durationHours must be a number");
  }
  if (!BOOKING_DURATIONS.includes(value as never)) {
    throw new Error(
      `requestBooking: durationHours must be one of ${BOOKING_DURATIONS.join(", ")}`,
    );
  }
  return value as BookingRequestInput["durationHours"];
}

function expectEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: ReadonlySet<T>,
): T {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    throw new Error(
      `requestBooking: ${field} must be one of ${[...allowed].join(", ")}`,
    );
  }
  return value as T;
}
