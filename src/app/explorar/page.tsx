import { redirect } from "next/navigation";

interface ExplorarPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * `/explorar` redirects to `/` since the home now is the catalog (founder
 * direction 2026-04-29). Search params are preserved so deep links keep
 * working — `/explorar?city=Medellín` lands you at `/?city=Medellín`.
 *
 * The seo-routes registry still lists `/explorar`; that entry will be
 * pruned in the next governance pass. For now Next handles the redirect at
 * request time and `/` is canonical.
 */
export default async function ExplorarRedirect({
  searchParams,
}: ExplorarPageProps) {
  const params = await searchParams;
  const out = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      raw.forEach((v) => out.append(key, v));
    } else {
      out.set(key, raw);
    }
  }
  const qs = out.toString();
  redirect(qs ? `/?${qs}` : "/");
}
