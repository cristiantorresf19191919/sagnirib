# Rule: Firebase data ownership

When you touch Firebase (Firestore, Auth, Storage, Cloud Functions, FCM),
read in this order: ADR-010 → `docs/architecture/firebase-governance.md`
→ this rule. The playbook has the step-by-step for every common task.

## Hard rules (audit-enforced)

1. **`firebase-admin/*`** is reachable only from `src/server/adapters/firebase/**`, `src/server/mappers/firebase-*.ts` (for SDK types like `Timestamp`), and `scripts/seed-*.ts`.
2. **`firebase-admin/storage`** is reachable only from `src/server/adapters/firebase/storage/**` (tighter scope than rule 1). Cloud Storage access has its own port — never piggyback on the biringas or auth adapters.
3. **`firebase/*` (Web SDK)** is reachable only from `src/features/auth/lib/**`.
4. **`FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*`** env vars are read only in `src/core/config/firebase.ts`, `src/core/config/firebase-client.ts`, and `scripts/seed-firebase.ts`.
5. **Features import from barrels** (`@/server/biringas`, `@/server/auth`, `@/server/storage`, `@/server/persons`, `@/server/users`, `@/server/verification`) — never from `@/server/adapters/...` or `@/server/mocks/...` directly.
6. **`*Raw` adapter helpers** (e.g. `getPrivateContactRaw`) are never re-exported from a barrel and never imported by a feature. The barrel-wrapped version with `requireAuth()` + `auditLog()` is the only public surface.
7. **All Firestore writes** go through Server Actions with `'use server'` + `validateActionInput` + `requireAuth()` + `auditLog()` + `revalidateTag()`.
8. **All Storage writes** go through Server Actions that issue **server-signed V4 PUT URLs** with a fixed path, MIME, and byte-range. The client never holds Storage credentials, never picks its own destination path, and never calls `firebase/storage` directly. (ADR-012)
9. **Hardcoded collection / bucket prefixes** (`db.collection("…")`, `\`listings/\${…}\``, `users/{uid}/staging/...`, `listing_drafts/...`) live only in `src/server/adapters/firebase/<port>/` and `scripts/`.
10. **`__session` cookie** is read or written only inside `src/server/adapters/firebase/auth/`.

## Hard rules (documentary, also enforced)

11. **No parallel fake data.** The mocks under `src/server/mocks/<port>/` are canonical. Do not invent new arrays of demo data anywhere else (no `MOCK_*`, `DEMO_*`, `SAMPLE_*` arrays of domain objects in features, scripts, tests fixtures, or Storybook stories — share the canonical mock instead).
12. **No reinvented types.** Domain types live in `src/server/<port>/types.ts`. Adapters and features both import from there.
13. **Adding a new Firestore collection or bucket prefix** is an ADR-level change. Open the next ADR and follow the playbook in `docs/architecture/firebase-governance.md` § "Adding a new collection" / § "Provisioning the storage bucket".

## Enforcement

`pnpm firebase:audit` catches all of (1)–(10) and most of (11). It is part
of the release-hardening gate set:

```
pnpm typecheck && pnpm lint && pnpm test && pnpm firebase:audit && pnpm build
```

Reference: ADR-009, ADR-010, ADR-012, `docs/architecture/firebase-governance.md`.
