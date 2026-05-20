import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type {
  BookingContactPreference,
  BookingMeetingType,
  BookingRequestRecord,
} from "@/server/biringas/booking-types";
import { FirebaseAdapterError } from "@/server/adapters/firebase/errors";

/**
 * Mapper: Firestore DocumentData → BookingRequestRecord (ADR-016).
 *
 * Provider types (Timestamp, DocRef) MUST NOT leak past this file
 * (ADR-009). Everything coming out of here is the canonical internal
 * shape that features consume.
 */

type Raw = Record<string, unknown>;

function toIso(value: unknown, field: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  throw new FirebaseAdapterError(
    "internal",
    `mapper(booking): expected Timestamp/Date/string at "${field}"`,
  );
}

function toIsoOptional(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new FirebaseAdapterError(
      "internal",
      `mapper(booking): expected string at "${field}"`,
    );
  }
  return value;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FirebaseAdapterError(
      "internal",
      `mapper(booking): expected number at "${field}"`,
    );
  }
  return value;
}

const STATUS_VALUES: ReadonlyArray<BookingRequestRecord["status"]> = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
];

const MEETING_TYPES: ReadonlyArray<BookingMeetingType> = [
  "outcall",
  "incall",
  "videocall",
];

const CONTACT_PREFS: ReadonlyArray<BookingContactPreference> = [
  "whatsapp",
  "telegram",
  "platform",
];

function asEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: ReadonlyArray<T>,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new FirebaseAdapterError(
      "internal",
      `mapper(booking): ${field} must be one of ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

function asBuyerReview(
  value: unknown,
): BookingRequestRecord["buyerReview"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const r = value as Raw;
  const ratingRaw = r.rating;
  if (
    typeof ratingRaw !== "number" ||
    !Number.isInteger(ratingRaw) ||
    ratingRaw < 1 ||
    ratingRaw > 5
  ) {
    return undefined;
  }
  return {
    rating: ratingRaw as 1 | 2 | 3 | 4 | 5,
    comment:
      typeof r.comment === "string" && r.comment.trim().length > 0
        ? r.comment
        : undefined,
    submittedAt: toIso(r.submittedAt, "buyerReview.submittedAt"),
  };
}

const DURATION_VALUES: ReadonlyArray<
  BookingRequestRecord["durationHours"]
> = [1, 2, 3, 4, 8, 12, 24];

export function mapBookingDoc(id: string, data: Raw): BookingRequestRecord {
  const durationRaw = asNumber(data.durationHours, "durationHours");
  if (
    !DURATION_VALUES.includes(
      durationRaw as BookingRequestRecord["durationHours"],
    )
  ) {
    throw new FirebaseAdapterError(
      "internal",
      `mapper(booking): durationHours ${durationRaw} is not a supported slot`,
    );
  }

  return {
    id,
    listingSlug: asString(data.listingSlug, "listingSlug"),
    requesterUid: asString(data.requesterUid, "requesterUid"),
    proposedAt: toIso(data.proposedAt, "proposedAt"),
    durationHours: durationRaw as BookingRequestRecord["durationHours"],
    meetingType: asEnum(data.meetingType, "meetingType", MEETING_TYPES),
    contactPreference: asEnum(
      data.contactPreference,
      "contactPreference",
      CONTACT_PREFS,
    ),
    message: asString(data.message, "message"),
    submittedAt: toIso(data.submittedAt, "submittedAt"),
    respondedAt: toIsoOptional(data.respondedAt),
    status: asEnum(data.status, "status", STATUS_VALUES),
    buyerReview: asBuyerReview(data.buyerReview),
  };
}
