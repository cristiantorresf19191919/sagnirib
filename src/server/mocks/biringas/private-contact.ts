import "server-only";

import type { PrivateContact } from "@/server/biringas/private-contact-types";

import { BIRINGA_LISTINGS } from "./data";

export async function getPrivateContactRaw(
  slug: string,
): Promise<PrivateContact | null> {
  const listing = BIRINGA_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return null;
  return {
    privatePhone: listing.privatePhone,
    privateWhatsapp: listing.privateWhatsapp,
  };
}
