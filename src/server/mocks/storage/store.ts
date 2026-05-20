import "server-only";

/**
 * Process-local store backing the dev-only storage mock.
 *
 * Three maps:
 *   - `tickets[token]` — reservations issued by signUploadUrl. The Route
 *     Handler consumes a token, validates it, and creates a `blob`.
 *   - `blobs[path]`    — completed uploads, keyed by canonical path.
 *
 * The Route Handler lives at `src/app/api/_storage-mock/[token]/route.ts`.
 * It is the only thing outside this file that writes into the store.
 *
 * Persistence: in-memory only. Dev refresh wipes everything. Production
 * never reaches this code (the barrel selects the Firebase adapter when
 * `isFirebaseConfigured()` is true).
 */

interface TicketReservation {
  path: string;
  ownerUid: string;
  contentType: string;
  sessionId: string;
  /** Epoch ms. */
  expiresAt: number;
  /** Per-ticket size cap — varies by kind (photo vs video, ADR-015). */
  maxBytes: number;
}

export interface MockBlob {
  /** Canonical bucket-style path. */
  path: string;
  ownerUid: string;
  sessionId: string;
  contentType: string;
  sizeBytes: number;
  /** Raw bytes — kept so future preview / promote logic works end-to-end. */
  bytes: Uint8Array;
}

class MockStore {
  private readonly tickets = new Map<string, TicketReservation>();
  private readonly blobs = new Map<string, MockBlob>();

  reserveTicket(reservation: TicketReservation): string {
    const token = randomToken();
    this.tickets.set(token, reservation);
    return token;
  }

  /**
   * Called by the Route Handler. Validates the token + headers and commits
   * the upload into `blobs`. Returns the canonical path on success.
   */
  commitTicket(args: {
    token: string;
    contentType: string;
    sizeBytes: number;
    bytes: Uint8Array;
  }): MockBlob | { error: string; status: number } {
    const reservation = this.tickets.get(args.token);
    if (!reservation) return { error: "unknown ticket", status: 403 };
    if (Date.now() > reservation.expiresAt) {
      this.tickets.delete(args.token);
      return { error: "ticket expired", status: 403 };
    }
    if (args.contentType !== reservation.contentType) {
      return { error: "contentType mismatch", status: 403 };
    }
    if (args.sizeBytes <= 0) {
      return { error: "empty body", status: 400 };
    }
    if (args.sizeBytes > reservation.maxBytes) {
      return { error: "body exceeds cap", status: 413 };
    }

    const blob: MockBlob = {
      path: reservation.path,
      ownerUid: reservation.ownerUid,
      sessionId: reservation.sessionId,
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
      bytes: args.bytes,
    };
    this.blobs.set(reservation.path, blob);
    // One-shot: the ticket cannot be replayed.
    this.tickets.delete(args.token);
    return blob;
  }

  getBlob(path: string): MockBlob | undefined {
    return this.blobs.get(path);
  }

  copyToDraft(args: {
    source: string;
    draftId: string;
    ownerUid: string;
    sessionId: string;
  }): string {
    const blob = this.blobs.get(args.source);
    if (!blob) {
      const err = new Error(`storage(mock)/copy: source missing: ${args.source}`);
      (err as { kind?: string }).kind = "not-found";
      throw err;
    }
    if (blob.ownerUid !== args.ownerUid || blob.sessionId !== args.sessionId) {
      const err = new Error(
        "storage(mock)/copy: source not owned by caller",
      );
      (err as { kind?: string }).kind = "permission-denied";
      throw err;
    }
    // Preserve the staging sub-prefix (photos vs videos, ADR-015) so
    // the draft layout mirrors the staging one. Same extension and id
    // as the staging name.
    const segments = args.source.split("/");
    const filename = segments.pop() ?? "blob.bin";
    const subPrefix = segments[segments.length - 1] === "videos"
      ? "videos"
      : "photos";
    const ext = filename.split(".").pop() ?? "bin";
    const assetId = filename.replace(`.${ext}`, "");
    const dest = `listing_drafts/${args.draftId}/${subPrefix}/${assetId}.${ext}`;
    this.blobs.set(dest, { ...blob, path: dest });
    this.blobs.delete(args.source);
    return dest;
  }
}

function randomToken(): string {
  const buf = new Uint8Array(16);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const mockStore = new MockStore();
