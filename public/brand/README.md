# Brand assets

Drop the logo files here so `brand-assets.ts` can resolve them.

Expected files (place when available):
- `logo-biringas.png` — the master neón art currently shared by the founder.
- `logo-biringas.svg` — vector version once vectorized (preferred for nav).
- `logo-biringas-mono.svg` — monochrome variant for footer / OG fallback.
- `og-default.png` — 1200×630 OG image based on the brand art.

Until the binary is committed, references in `brand-assets.ts` resolve to empty strings and any UI consumer must guard against missing values.
