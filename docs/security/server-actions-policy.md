# Server Actions security policy

Authoritative source: Addendum 001 §14 + Next 16 docs (`07-mutating-data.md`, `data-security.md`).

Every Server Action must:

1. Mark the function or file with `'use server'`.
2. Validate input through `validateActionInput(schema, input)`.
3. Call `await requireAuth()` for any user-context mutation.
4. Verify authorization via a Policy/Guard (`requireRole` or feature-specific policy).
5. Treat the action as a public POST endpoint — assume bots will hit it.
6. Write `auditLog` for actions that mutate sensitive data.
7. Call `revalidateTag` / `revalidatePath` for data the UI reads.
8. Never return secrets, internal IDs, or provider tokens to the client.

Reminder: visual guards (hidden buttons, disabled states) are NOT security.
