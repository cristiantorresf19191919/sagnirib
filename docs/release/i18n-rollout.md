# i18n content rollout · waves

Companion to ADR-017. Infrastructure (`[lang]` routing, proxy redirect,
locale switcher, sitemap, metadata factory) shipped on 2026-05-20.

All content waves were closed in the follow-up sessions; see "Status"
below.

## Status — all waves ✅

| Wave | Scope | Status |
| ---- | ----- | ------ |
| **A**   | Chrome (Header / Footer / Locale switcher / Home metadata + CTA) | ✅ |
| **B**   | `/publicar` chrome + wizard NavBar + `/publicar/planes` + `/publicar/planes/[tier]/checkout` + `CheckoutFlow` | ✅ |
| **B.2** | Step components: `StepDetails`, `StepDescription` (chrome + gallery/video headers), `StepAttributes`, `StepPublish` | ✅ |
| **C**   | `/explorar` page + `ResultsToolbar` + `CategoryBar` + `SearchBar` + `SortMenu` + `FiltersPanel` trigger/modal/sticky | ✅ |
| **C.2** | `FiltersPanel` deep section labels (price/age/services/content/appearance) + filter chips | ✅ |
| **D**   | `/p/[slug]` page chrome (metadata, back link, kicker, video/audio/stories chips, stat tiles, attributes, sections, verified shield) | ✅ |
| **D.2** | `BookingRequestModal`, `RateBiringaForm`, `ContactReveal`, `ReviewsSection`, `AvailabilityStrip`, `ShareMenu`, `ReportListingMenu`, `SimilarProfiles`, `RecentlyViewedStrip` | ✅ |
| **E**   | Auth funnel pages (`ingresar`, `registrarse`, `recuperar`) + `AuthBadge` + `SignInForm` + `SignUpForm` + `ResetPasswordForm` + `/mi-cuenta` dashboard + `/mi-cuenta/borradores/[id]` | ✅ |
| **E.3** | `/verificacion` + `/verificacion/enviar` + `VerificationWizard` (3-step KYC flow, status screens, error messages) | ✅ |
| **F**   | `/favoritas` + `/seguridad` + `/legal/*` (metadata + jurisdictional notice) + `error.tsx` + `not-found.tsx` + `global-error.tsx` | ✅ |
| **F.2** | `FeaturedStrip`, `HowItWorks`, `TestimonialsSection` editorial bodies | ✅ |
| **F.3** | `brand-copy` + `Hero` slogan/CTAs · `EditorialHero` + `HeroCitySelect` + `HeroMosaicCard` + `LuckyButton` + `EditorialHeroMosaicColumn` · catalog leaf micro-copy (`BookingDatePicker`, `VideoPlayer`, `CardStackGallery`, `PremiumContentGrid`, `CompareDrawer`) · dashboard sub-helpers (`BookingInboxList`, `ReferralCard`, `AvailabilityToggle`) | ✅ |

## Key count

| Locale | Count (approx) |
| ------ | -------------- |
| es     | ~1300          |
| en     | ~1300          |

Total ≈ 2600 entries across both locales. This is well past the
~500-key threshold where the hand-rolled `t()` API was designed to be
swapped for `next-intl` — ADR-017 still names `next-intl` as the
migration target if/when we need plurals, ICU formatting, or
locale-aware date formatters beyond what the standard `Intl.*` APIs
provide.

## What stays in Spanish (jurisdictional)

- `/legal/{terminos,privacidad,disputas,aviso-legal}` — bodies remain
  in Spanish across both locales. Colombian jurisdictional documents
  have their authentic version in Spanish (Ley 1480/2011, Ley 1581/2012,
  Decreto 1377/2013, etc.). An EN banner explains this on the page.

## What's still pending

Nothing in scope. The full buyer + seller journey is bilingual end-to-end
across chrome, headings, CTAs, editorial copy, validation, error
states, dashboard sub-helpers, and aria labels. F.3 closed the last
known ES-only pockets in `EditorialHero` motion-driven copy,
`BookingDatePicker`/`VideoPlayer`/`CardStackGallery`/`PremiumContentGrid`/`CompareDrawer`
micro-copy, and the `BookingInboxList`/`ReferralCard`/`AvailabilityToggle`
relative-time and toast strings.

Legal documents (`/legal/*`) remain jurisdictionally Spanish — see
"What stays in Spanish" above.

## Gates

Final state — full release-hardening suite passing:

```
pnpm typecheck      → clean
pnpm lint           → 0 errors (2 non-blocking warnings in StepDescription
                      ref-cleanup capture — intentional, behavior-load-bearing)
pnpm test           → 64/64
pnpm seo:audit      → manual checklist (expected; gates indexable routes)
pnpm design:audit   → manual checklist
pnpm security:audit → manual checklist
pnpm patterns:audit → manual checklist
pnpm responsive:audit → manual checklist
pnpm firebase:audit → clean (10/10)
pnpm build          → 48 static + dynamic pages, no errors
```

Lint blocker closed by the 2026-05-20 housekeeping pass: 18 errors / 3
warnings → 0 errors / 2 warnings. Notable fixes: extracted
`useClientMounted()` helper at `src/shared/lib/use-client-mounted.ts`
(backed by `useSyncExternalStore`) and migrated `useSavedSearches` +
`useSafeCheckins` to module-level stores. Dead `src/features/home/components/Hero.tsx`
deleted (live home uses `EditorialHero`).

## Locale policy reminders

- `es` is the canonical fallback. Any missing key in `en` falls
  through to the Spanish copy and still renders (no blank UI).
- Auth surfaces, `/mi-cuenta`, `/publicar`, `/legal/*` are
  permanently `noindex`. hreflang alternates are still emitted so
  cross-locale switching keeps URLs anchored to the right canonical.
- Legal documents are jurisdictionally Spanish — see "What stays in
  Spanish" above.
- The hand-rolled `t()` API in `src/core/i18n/messages.ts` is the
  single source of truth. Adding a new locale only requires extending
  `brandConfig.supportedLocales` and adding a dictionary block.
