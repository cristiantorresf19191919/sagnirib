# Biringas

Marketplace de servicios de acompañamiento para eventos y viajes.
Proyecto Next.js (App Router) operado bajo el **Next Greenfield System v3**.

## Documentación obligatoria antes de tocar código

1. `AGENTS.md` (orden de lectura para agentes / contributors).
2. PDFs de gobernanza: Blueprint Maestro, Project Intake + Brand Handshake, Addendum 001 (SEO + Agents + Design), Addendum 002 (Patterns + Responsive).
3. Documentación oficial de Next instalada en `node_modules/next/dist/docs/01-app/`.
4. ADRs en `docs/adr/` y reglas en `.claude/rules/`.

## Comandos

```bash
pnpm install
pnpm dev              # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm test             # Vitest unit + integration
pnpm test:e2e         # Playwright (desktop)
pnpm responsive:e2e   # Playwright cross-viewport
pnpm build

# Documentary gates (TODO: AST validations en F4+)
pnpm seo:audit
pnpm design:audit
pnpm security:audit
pnpm patterns:audit
pnpm responsive:audit
```

## Estado actual

Foundation técnica + gobernanza completas. Páginas finales y features de negocio quedan **bloqueadas** hasta cerrar el Brand Handshake (logo, paleta final, referencias visuales) — ver `docs/branding/brand-intake.md` y `docs/seo/public-routes-brief.md`.

Indexación SEO está globalmente desactivada (`src/core/seo/seo-config.ts → indexingEnabled = false`). Se abre sólo después del release-hardening.
# sagnirib
