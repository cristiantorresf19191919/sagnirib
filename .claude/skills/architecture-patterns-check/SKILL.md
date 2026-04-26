# Skill · architecture-patterns-check

## Entrada
Una feature antes de cerrarse.

## Pasos
1. Identificar qué patrones aplica (Repository, Adapter, Strategy, Factory, Observer, Command).
2. Verificar que cada uno resuelve un problema real.
3. Confirmar PDR escrito si introduce un patrón gated.
4. Detectar lógica pesada en page/layout y proponer mover.
5. Confirmar que SDKs externos viven detrás de adapters.

## Output esperado
Reporte de patrones aplicados, evitados y riesgos.

## Checklist
- [ ] Sin patrones decorativos.
- [ ] PDR presente para Adapter/Strategy/Observer/Builder/StateMachine.
- [ ] Lógica de negocio fuera de page/layout.
