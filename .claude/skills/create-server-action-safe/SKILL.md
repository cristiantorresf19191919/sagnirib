# Skill · create-server-action-safe

## Entrada
Necesidad de una mutación de negocio.

## Pasos
1. Crear schema en `src/features/<feature>/schemas/`.
2. Crear acción en `src/features/<feature>/server/actions/<action>.ts` con `'use server'`.
3. Llamar `validateActionInput(schema, input)`.
4. Llamar `await requireAuth()` y `requireRole`/policy.
5. Realizar la mutación a través de un Repository/Adapter, nunca SDK directo.
6. `auditLog` si toca datos sensibles.
7. `revalidateTag` / `revalidatePath` cuando aplique.
8. Test de integración cubriendo input inválido, sin auth, sin permiso, ok.

## Output esperado
Server Action segura, testeada, idempotente cuando aplique.

## Checklist
- [ ] `'use server'` presente.
- [ ] Validación de schema.
- [ ] Auth + authorization.
- [ ] Audit log + revalidate.
- [ ] No retorna secretos al cliente.
