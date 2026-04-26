# Skill · create-event-observer

## Entrada
Necesidad de analytics, audit log o notificación desacoplada.

## Pasos
1. Agregar el evento al union `DomainEvent` en `src/server/events/domain-events.ts`.
2. Sanitizar el payload — nunca enviar PII directa al provider.
3. Cablear handler (analytics / audit / notification) detrás de `publishEvent`.
4. Testear que `publishEvent` invoca el handler correcto.

## Output esperado
Evento tipado, publisher único, handlers testeados.

## Checklist
- [ ] Tipado en `DomainEvent`.
- [ ] Sin secretos / PII en el payload del provider externo.
- [ ] Audit log incluido cuando aplique.
