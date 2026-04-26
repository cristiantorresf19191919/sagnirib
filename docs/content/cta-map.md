# CTA map

| Ruta | CTA principal | Destino | CTA secundario | Evento analytics |
|---|---|---|---|---|
| `/` | "Explorar Biringas" | `/explorar` | scroll a "Cómo funciona" | `cta_click` `{cta:"home_explore"}` |
| `/explorar` | (implícito por card) | `/p/[slug]` | filtros | `cta_click` `{cta:"explore_card", slug}` |
| `/p/[slug]` | "Contratar" (provisional "Próximamente") | flujo de pago — pendiente | "Compartir perfil" | `cta_click` `{cta:"profile_hire", slug}` |

## Reglas
- El CTA principal por ruta es siempre 1 (uno). No competir 2 CTA primarios por viewport.
- En mobile el CTA principal debe ser alcanzable sin doble scroll desde above-the-fold.
- Touch target ≥ 44×44 px.
- Ningún CTA depende de hover.
- Eventos analytics se emiten vía `publishEvent` / `trackEvent`, nunca llamando al provider externo desde el componente.
