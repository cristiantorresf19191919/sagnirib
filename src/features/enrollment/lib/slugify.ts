/**
 * Derives the public profile slug from a free-text title.
 *
 * The publish wizard exposes a single "Título" field; the URL slug
 * (`biringas.co/p/<slug>`) is derived from it rather than typed separately.
 * Strips accents, lowercases, and collapses anything that isn't `[a-z0-9]`
 * into single dashes — matching the `[a-z0-9-]` shape the server schema and
 * Firestore routing expect.
 *
 *   "Alma en Medellín" → "alma-en-medellin"
 *   "  José_99 !! "     → "jose-99"
 */
export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
