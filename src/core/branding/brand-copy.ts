import { t } from "@/core/i18n/messages";

/**
 * Approved brand copy slots — kept as a backwards-compat shim around the
 * canonical i18n dictionary (per F.3 polish sweep).
 *
 * Live consumers should read these strings via `t(locale, "brand.*")`
 * directly so the locale toggle works. The constant below replays the ES
 * dictionary so any non-localized caller keeps rendering the Spanish copy
 * that ships in `docs/seo/routes/home.md` (status: approved).
 */
export const brandCopy = {
  slogan: t("es", "brand.slogan"),
  homeHeroTitle: t("es", "brand.homeHeroTitle"),
  homeHeroSubtitle: t("es", "brand.homeHeroSubtitle"),
  primaryCta: t("es", "brand.primaryCta"),
  secondaryCta: t("es", "brand.secondaryCta"),
} as const;
