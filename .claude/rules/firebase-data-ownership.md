# Rule: Firebase data ownership

When you touch Firebase (Firestore, Auth, Storage, Cloud Functions, FCM),
read in this order: ADR-010 → `docs/architecture/firebase-governance.md`
→ this rule. The playbook has the step-by-step for every common task.

## Hard rules (audit-enforced)

1. **`firebase-admin/*`** is reachable only from `src/server/adapters/firebase/**`, `src/server/mappers/firebase-*.ts` (for SDK types like `Timestamp`), and `scripts/seed-*.ts`.
2. **`firebase/*` (Web SDK)** is reachable only from `src/features/auth/lib/**`.
3. **`FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*`** env vars are read only in `src/core/config/firebase.ts`, `src/core/config/firebase-client.ts`, and `scripts/seed-firebase.ts`.
4. **Features import from barrels** (`@/server/biringas`, `@/server/auth`) — never from `@/server/adapters/...` or `@/server/mocks/...` directly.
5. **`*Raw` adapter helpers** (e.g. `getPrivateContactRaw`) are never re-exported from a barrel and never imported by a feature. The barrel-wrapped version with `requireAuth()` + `auditLog()` is the only public surface.
6. **All Firestore writes** go through Server Actions with `'use server'` + `validateActionInput` + `requireAuth()` + `auditLog()` + `revalidateTag()`.
7. **Hardcoded collection names** (`db.collection("…")`, `\`listings/\${…}\``) live only in `src/server/adapters/firebase/<port>/` and `scripts/`.
8. **`__session` cookie** is read or written only inside `src/server/adapters/firebase/auth/`.

## Hard rules (documentary, also enforced)

9. **No parallel fake data.** The mocks under `src/server/mocks/<port>/` are canonical. Do not invent new arrays of demo data anywhere else (no `MOCK_*`, `DEMO_*`, `SAMPLE_*` arrays of domain objects in features, scripts, tests fixtures, or Storybook stories — share the canonical mock instead).
10. **No reinvented types.** Domain types live in `src/server/<port>/types.ts`. Adapters and features both import from there.
11. **Adding a new Firestore collection** is an ADR-level change. Open ADR-011+ and follow the playbook in `docs/architecture/firebase-governance.md` § "Adding a new collection".

## Enforcement

`pnpm firebase:audit` catches all of (1)–(8) and most of (9). It is part of
the release-hardening gate set:

```
pnpm typecheck && pnpm lint && pnpm test && pnpm firebase:audit && pnpm build
```

Reference: ADR-009, ADR-010, `docs/architecture/firebase-governance.md`.
