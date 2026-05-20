import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

/**
 * Translation dictionaries.
 *
 * Scope MVP: covers Header navigation, Footer, and key Hero kickers.
 * Everything else in the app stays in `es` for now — see
 * `MIGRATION_TODO` at the bottom for the path to broader coverage.
 *
 * Keys are dot.namespaced strings. Lookup goes through `t(locale, key)`
 * with `es` as the canonical fallback so a missing translation never
 * renders a blank — the user always sees Spanish copy in the worst case.
 *
 * No `next-intl` (or any other library) by design — keeps the bundle
 * tiny and avoids tying the locale shape to a third-party's lifecycle.
 * When we outgrow this (interpolation, plurals, currency formatting),
 * swap to `next-intl` or `Format.js` — the migration target is to
 * keep this file's API surface byte-identical so consumers don't need
 * to change.
 */

type MessageDict = Record<string, string>;

/* -------------------------------------------------------------------------- */
/* Dictionaries                                                                */
/* -------------------------------------------------------------------------- */

const es: MessageDict = {
  "header.nav.how": "Cómo funciona",
  "header.nav.favorites": "Favoritas",
  "header.cta.publish": "Publica tu perfil",
  "header.cta.explore": "Explorar",
  "header.signIn": "Ingresar",
  "header.signOut": "Cerrar sesión",
  "header.myAccount": "Mi cuenta",

  "footer.tagline": "Verificación humana. Reseñas reales. Sin bots.",
  "footer.section.product": "Producto",
  "footer.section.legal": "Legal",
  "footer.section.brand": "Marca",
  "footer.link.explore": "Explorar catálogo",
  "footer.link.publish": "Publica tu perfil",
  "footer.link.plans": "Planes",
  "footer.link.verification": "Verificación",
  "footer.link.safety": "Seguridad",
  "footer.link.terms": "Términos",
  "footer.link.privacy": "Privacidad",
  "footer.link.disputes": "Disputas",
  "footer.copyright": "© {year} Biringas",

  "hero.kicker.location": "Acompañantes verificadas · Colombia",
  "hero.cta.search": "Buscar",
  "hero.field.city": "Ciudad",
  "hero.field.query": "Nombre, plan, servicio…",
  "hero.suggested": "Sugerido",
};

const en: MessageDict = {
  "header.nav.how": "How it works",
  "header.nav.favorites": "Favorites",
  "header.cta.publish": "Publish your profile",
  "header.cta.explore": "Explore",
  "header.signIn": "Sign in",
  "header.signOut": "Sign out",
  "header.myAccount": "My account",

  "footer.tagline": "Human verification. Real reviews. No bots.",
  "footer.section.product": "Product",
  "footer.section.legal": "Legal",
  "footer.section.brand": "Brand",
  "footer.link.explore": "Browse catalog",
  "footer.link.publish": "Publish your profile",
  "footer.link.plans": "Plans",
  "footer.link.verification": "Verification",
  "footer.link.safety": "Safety",
  "footer.link.terms": "Terms",
  "footer.link.privacy": "Privacy",
  "footer.link.disputes": "Disputes",
  "footer.copyright": "© {year} Biringas",

  "hero.kicker.location": "Verified companions · Colombia",
  "hero.cta.search": "Search",
  "hero.field.city": "City",
  "hero.field.query": "Name, plan, service…",
  "hero.suggested": "Suggested",
};

const pt: MessageDict = {
  "header.nav.how": "Como funciona",
  "header.nav.favorites": "Favoritas",
  "header.cta.publish": "Publique seu perfil",
  "header.cta.explore": "Explorar",
  "header.signIn": "Entrar",
  "header.signOut": "Sair",
  "header.myAccount": "Minha conta",

  "footer.tagline": "Verificação humana. Avaliações reais. Sem bots.",
  "footer.section.product": "Produto",
  "footer.section.legal": "Legal",
  "footer.section.brand": "Marca",
  "footer.link.explore": "Explorar catálogo",
  "footer.link.publish": "Publique seu perfil",
  "footer.link.plans": "Planos",
  "footer.link.verification": "Verificação",
  "footer.link.safety": "Segurança",
  "footer.link.terms": "Termos",
  "footer.link.privacy": "Privacidade",
  "footer.link.disputes": "Disputas",
  "footer.copyright": "© {year} Biringas",

  "hero.kicker.location": "Acompanhantes verificadas · Colômbia",
  "hero.cta.search": "Buscar",
  "hero.field.city": "Cidade",
  "hero.field.query": "Nome, plano, serviço…",
  "hero.suggested": "Sugerido",
};

const DICTIONARIES: Record<SupportedLocale, MessageDict> = {
  es,
  en,
  pt,
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

/** Short two-letter label for the header switcher. */
export const LOCALE_SHORT: Record<SupportedLocale, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
};

/**
 * Resolve a message by key for the active locale. Falls back to the
 * canonical Spanish dictionary if the key is missing in the chosen
 * locale, then to the raw key itself as last resort (so a typo is
 * visually obvious without crashing the surface).
 *
 * `{placeholder}` tokens are interpolated from the optional `values`
 * arg — strictly string-only, no formatNumber / plurals (that's the
 * job of the future library swap).
 */
export function t(
  locale: SupportedLocale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[brandConfig.defaultLocale];
  const fallback = DICTIONARIES[brandConfig.defaultLocale];
  const raw = dict[key] ?? fallback[key] ?? key;
  if (!values) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(values, k) ? String(values[k]) : m,
  );
}

/* -------------------------------------------------------------------------- */
/* MIGRATION_TODO                                                              */
/* -------------------------------------------------------------------------- */
/* The shell covers Header + Footer + Hero kickers. Expanding to full
 * site translation should land in waves:
 *
 *   wave 2: /publicar wizard (sellers come from many countries).
 *   wave 3: /explorar filters + catalog card empty states.
 *   wave 4: /p/[slug] sections (Características / Servicios / etc.).
 *   wave 5: error states + toast copy + form validation messages.
 *
 * When the key count crosses ~150, swap this hand-rolled `t()` for
 * `next-intl` — the import path stays `@/core/i18n` so consumers
 * don't need to change.
 */
