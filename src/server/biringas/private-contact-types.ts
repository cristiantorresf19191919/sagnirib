import "server-only";

/**
 * Private contact channel for an authenticated viewer. NEVER rendered in
 * server HTML — only fetched on demand via `getPrivateContact()` after the
 * Server Action is invoked from a Client Component button click.
 *
 * Why a separate type? To prevent the public `BiringaListing` from carrying
 * sensitive fields into any rendered surface (Addendum 001 §15).
 */
export interface PrivateContact {
  privatePhone?: string;
  privateWhatsapp?: string;
}
