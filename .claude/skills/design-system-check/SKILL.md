# Skill · design-system-check

## Entrada
Componentes / pantallas en revisión.

## Pasos
1. Buscar hex colors, valores arbitrarios de spacing/radius/shadow fuera de tokens.
2. Verificar que componentes reutilizables vivan en `src/shared/design-system/`.
3. Confirmar que `theme.css` mirror sigue alineado con tokens TS.
4. Marcar drift y proponer corrección.

## Output esperado
Reporte de drift y lista de fixes.

## Checklist
- [ ] Sin hex / arbitrary values fuera del design system.
- [ ] Componentes reutilizables centralizados.
- [ ] Tokens TS == theme.css.
