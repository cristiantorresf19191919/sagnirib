import Link from "next/link";

import { readLocale } from "@/core/i18n/locale";
import { localizedHref } from "@/core/i18n/href";
import { t } from "@/core/i18n/messages";

export default async function NotFound() {
  const locale = await readLocale();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">{t(locale, "notFound.title")}</h1>
      <p className="text-[var(--color-text-muted)]">
        {t(locale, "notFound.body")}
      </p>
      <Link
        href={localizedHref(locale, "/")}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
      >
        {t(locale, "notFound.cta")}
      </Link>
    </main>
  );
}
