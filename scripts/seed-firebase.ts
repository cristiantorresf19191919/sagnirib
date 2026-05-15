/**
 * Seed Firestore with the in-memory Biringa listings.
 *
 * Idempotent: each listing is written via `set()` keyed on `slug` (so re-running
 * the script overwrites cleanly without creating duplicates). ISO date strings
 * are converted to Firestore Timestamps so the adapter mapper can decode them
 * back transparently.
 *
 * Reviews are NOT seeded — the mock generates them on the fly from a hash, so
 * there are no canonical review rows to insert. Real reviews should land via
 * the future `submitReview` Server Action (PR 3).
 *
 * Usage:
 *   1. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *      in .env.local (or your shell).
 *   2. `pnpm seed:firebase`
 *
 * Run with `--dry-run` to see what would be written without touching Firestore.
 */

import { config as loadDotenv } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

import { BIRINGA_LISTINGS } from "../src/server/mocks/biringas/data";
import type { BiringaListing } from "../src/server/biringas/types";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

const DRY_RUN = process.argv.includes("--dry-run");

function readEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(
      `[seed] missing required env var: ${name}. See .env.example.`,
    );
    process.exit(1);
  }
  return v;
}

function init() {
  if (getApps().length > 0) return;
  const projectId = readEnv("FIREBASE_PROJECT_ID");
  const clientEmail = readEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = readEnv("FIREBASE_PRIVATE_KEY")
    .replaceAll(/^"|"$/g, "")
    .replaceAll(String.raw`\n`, "\n");

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

function toFirestoreDoc(listing: BiringaListing): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    ...listing,
    createdAt: Timestamp.fromDate(new Date(listing.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(listing.updatedAt)),
  };
  if (listing.storyAt) {
    doc.storyAt = Timestamp.fromDate(new Date(listing.storyAt));
  } else {
    delete doc.storyAt;
  }
  // Optional fields stored as omitted, not as `undefined` (Firestore rejects
  // `undefined`). The mapper tolerates both.
  if (listing.neighborhood === undefined) delete doc.neighborhood;
  if (listing.privatePhone === undefined) delete doc.privatePhone;
  if (listing.privateWhatsapp === undefined) delete doc.privateWhatsapp;
  return doc;
}

async function run() {
  init();
  const db = getFirestore();
  const collection = db.collection("listings");

  console.log(
    `[seed] ${DRY_RUN ? "DRY RUN — " : ""}seeding ${BIRINGA_LISTINGS.length} listings into project=${process.env.FIREBASE_PROJECT_ID}`,
  );

  let written = 0;
  // Firestore batch limit is 500 ops; chunk to be safe.
  const CHUNK = 200;
  for (let i = 0; i < BIRINGA_LISTINGS.length; i += CHUNK) {
    const slice = BIRINGA_LISTINGS.slice(i, i + CHUNK);
    if (DRY_RUN) {
      for (const listing of slice) {
        console.log(
          `  - would write listings/${listing.id} (slug=${listing.slug})`,
        );
      }
      written += slice.length;
      continue;
    }
    const batch = db.batch();
    for (const listing of slice) {
      batch.set(collection.doc(listing.id), toFirestoreDoc(listing));
    }
    await batch.commit();
    written += slice.length;
    console.log(`  - committed ${written}/${BIRINGA_LISTINGS.length}`);
  }

  console.log(`[seed] done. ${written} listings ${DRY_RUN ? "would be " : ""}written.`);
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
