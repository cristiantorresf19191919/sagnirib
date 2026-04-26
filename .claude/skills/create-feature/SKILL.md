# Skill · create-feature

## Entrada
Necesidad de un módulo de negocio (ej. listings, reservations).

## Pasos
1. Crear carpeta `src/features/<feature>/` con `components/`, `schemas/`, `server/`, `contracts/`, `index.ts`.
2. Si hay mutaciones, usar el skill `create-server-action-safe`.
3. Si conecta SDK externo, usar `create-integration-adapter`.
4. Si emite analytics/audit, usar `create-event-observer`.
5. Documentar Pattern Decision Record si introduce Adapter / Strategy / Observer / Builder / State Machine.
6. Tests proporcionales al riesgo.

## Output esperado
Feature aislada, con contratos claros, sin filtrar detalles internos.

## Checklist de verificación
- [ ] No hay lógica pesada en page.tsx.
- [ ] No hay duplicación de componentes del design system.
- [ ] Mutaciones validan input + auth + authorization.
- [ ] PDR registrado si aplica.
