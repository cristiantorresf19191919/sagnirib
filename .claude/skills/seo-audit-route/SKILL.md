# Skill · seo-audit-route

## Entrada
Una ruta pública existente.

## Pasos
1. Verificar contrato SEO en `docs/seo/routes/<route>.md`.
2. Inspeccionar metadata renderizada (title, description, canonical, OG, alternates).
3. Confirmar presencia/ausencia de JSON-LD según contrato.
4. Verificar inclusión en sitemap y robots según indexabilidad.
5. Revisar internal links y alt text en imágenes.

## Output esperado
Reporte con hallazgos y go/no-go.

## Checklist de verificación
- [ ] Title/description únicos y dentro de longitud razonable.
- [ ] Canonical correcto.
- [ ] OG/Twitter renderizan.
- [ ] JSON-LD válido.
- [ ] Sitemap/robots coherentes.
