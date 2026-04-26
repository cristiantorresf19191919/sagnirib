# Skill · create-integration-adapter

## Entrada
Necesidad de conectar SDK / API externa.

## Pasos
1. Crear `src/server/adapters/<provider>/{client,types,errors}.ts` con `import "server-only"`.
2. Definir contrato interno (interfaces) que la feature consume.
3. Implementar mapper en `src/server/mappers/` para traducir DTOs.
4. Definir errores tipados (`ProviderXAuthError`, `ProviderXRateLimited`, etc.).
5. Mantener secrets en env servidor; nunca en cliente.
6. Crear fake/mock para tests bajo `tests/integration/`.

## Output esperado
Adapter aislado; provider intercambiable.

## Checklist
- [ ] `server-only`.
- [ ] Sin tipos de provider en features/components.
- [ ] Errores tipados.
- [ ] Mock/fake disponible.
