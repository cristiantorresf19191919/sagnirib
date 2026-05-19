import "server-only";

import type { ActionInputSchema } from "@/server/security/validate-action-input";

import {
  REPORT_LIMITS,
  REPORT_REASONS,
  type ReportListingInput,
  type ReportReason,
} from "./report-types";

const ALLOWED_REASONS = new Set<ReportReason>(
  REPORT_REASONS.map((r) => r.value),
);

export const reportListingSchema: ActionInputSchema<ReportListingInput> = {
  parse(input: unknown): ReportListingInput {
    if (!input || typeof input !== "object") {
      throw new Error("reportListing: input must be an object");
    }
    const r = input as Record<string, unknown>;

    if (typeof r.listingSlug !== "string" || r.listingSlug.trim() === "") {
      throw new Error("reportListing: listingSlug is required");
    }
    if (
      typeof r.reason !== "string" ||
      !ALLOWED_REASONS.has(r.reason as ReportReason)
    ) {
      throw new Error(
        `reportListing: reason must be one of ${[...ALLOWED_REASONS].join(", ")}`,
      );
    }

    let detail: string | undefined;
    if (r.detail !== undefined && r.detail !== null && r.detail !== "") {
      if (typeof r.detail !== "string") {
        throw new Error("reportListing: detail must be a string");
      }
      if (r.detail.length > REPORT_LIMITS.detailMax) {
        throw new Error(
          `reportListing: detail must be at most ${REPORT_LIMITS.detailMax} characters`,
        );
      }
      detail = r.detail.trim();
    }

    if (r.reason === "other" && (!detail || detail.length < 8)) {
      throw new Error(
        "reportListing: detail is required when reason is 'other' (min 8 chars)",
      );
    }

    return {
      listingSlug: r.listingSlug.trim(),
      reason: r.reason as ReportReason,
      detail,
    };
  },
};
