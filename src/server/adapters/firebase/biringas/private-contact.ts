import "server-only";

import type { PrivateContact } from "@/server/biringas/private-contact-types";

import { getDb } from "@/server/adapters/firebase/client";
import { wrapFirestoreError } from "@/server/adapters/firebase/errors";

/**
 * Reads ONLY the private contact fields from a listing — never the full doc.
 * The result MUST stay behind an auth + audit wrapper at the barrel layer;
 * this raw helper is intentionally not exposed in `@/server/biringas`.
 */
export async function getPrivateContactRaw(
  slug: string,
): Promise<PrivateContact | null> {
  const db = getDb();
  try {
    const snap = await db
      .collection("listings")
      .where("slug", "==", slug)
      .limit(1)
      .select("privatePhone", "privateWhatsapp")
      .get();
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return {
      privatePhone:
        typeof data.privatePhone === "string" ? data.privatePhone : undefined,
      privateWhatsapp:
        typeof data.privateWhatsapp === "string"
          ? data.privateWhatsapp
          : undefined,
    };
  } catch (err) {
    throw wrapFirestoreError("getPrivateContactRaw", err);
  }
}
