/**
 * Pointers to brand assets in /public/brand.
 *
 * The master neón art exists outside the repo today (founder shared it as
 * a chat attachment). Drop it as `public/brand/logo-biringas.png` and the
 * paths below will resolve. Until then, consumers MUST guard against
 * empty strings — do not render <Image src="" />.
 *
 * Per design-direction: only the colour and mood references from this art
 * are canonical for now. The literal logo lockup ("Super Tabern · Biringas
 * Vírgenes 2.0") is NOT canonical; the brand name is "Biringas".
 */
export const brandAssets = {
  logoPng: "/brand/logo-biringas.png",
  logoSvg: "",
  logoMonochrome: "",
  favicon: "/favicon.ico",
  ogImageDefault: "",
} as const;

/**
 * @returns true when the path is non-empty AND a file is expected to exist.
 * Consumers should call this before rendering an asset.
 */
export function hasAsset(path: string): boolean {
  return path.length > 0;
}
