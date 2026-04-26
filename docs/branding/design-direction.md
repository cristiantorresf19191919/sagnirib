# Design direction

Status: **mood + paleta locked**, lockup logo pendiente de revisión.

## Mood
"Bar neón nocturno". Marketplace con energía adulta pero **navegable y profesional**: fondos cercanos al negro con un casi-imperceptible tinte frío (sensación de pared de ladrillo en penumbra), trazos luminosos en magenta hot, violeta eléctrico, cian eléctrico, con un rojo-coral como acento mínimo de alerta o highlight.

Evitar el "neón genérico de IA": glow controlado (un solo halo principal por elemento), tipografía display script reservada al lockup del logo (NO para H1 del producto).

## Paleta canónica
Tomada del logo del founder.

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | `#FF2BB5` | CTA principal, foco visible, acento dominante |
| `brand-primary-strong` | `#FF5DCB` | hover / glow del primario |
| `brand-primary-soft` | `#FFA3E0` | links sobre fondos oscuros |
| `brand-secondary` | `#7A2BFF` | acento secundario, badges, gradientes |
| `brand-secondary-strong` | `#9D5BFF` | hover del secundario |
| `brand-accent` | `#1FA8FF` | información / outlines fríos |
| `brand-accent-strong` | `#5BC8FF` | hover del accent |
| `brand-highlight` | `#FF3B5C` | error / urgente. Uso escaso |
| `background` | `#08060C` | fondo base |
| `background-elevated` | `#0F0B17` | cards / nav |
| `surface` | `#13101F` | inputs / sub-cards |
| `border` | `#2C2148` | bordes sutiles |
| `foreground` | `#F6F2FF` | texto principal |
| `text-muted` | `#B5A8D6` | texto secundario |
| `text-subtle` | `#7E7196` | metadatos |

## Glow / sombras
Un único halo por elemento; nunca apilar tres glows en el mismo viewport.
- `--shadow-glow-primary` para CTA principal en hero.
- `--shadow-glow-secondary` para badges destacados.
- `--shadow-glow-accent` para focos de información.

## Tipografía
- **Body / UI:** sans humanista, Inter / Geist Sans / equivalente. Pendiente confirmar.
- **Display lockup logo:** script neón embebido en el logo. **No** se usa como H1 web.
- **H1 / H2 web:** sans con peso 600–700, tracking ligeramente apretado en mobile.
- Mono solo para datos técnicos / IDs.

## Motion
- Duración base: 160–240 ms.
- Easings: `--ease-standard` para la mayoría; `--ease-enter` para in / `--ease-exit` para out.
- Permitido: hover-lift sutil, glow pulse muy ocasional en CTA principal.
- Prohibido: parallax pesado, animaciones que bloqueen contenido o CTA, motion gratuito en mobile.

## Lockup logo
- Marca canónica = **Biringas**. El texto adicional del archivo recibido (`Super Tabern`, `Vírgenes`, `2.0`) **NO es canónico** y no se reproduce en `<title>`, OG, JSON-LD, footer, ni meta.
- El archivo PNG actual se usa solo como **referencia de mood y paleta**. No es el logo final de producto.
- Pendiente: SVG vectorizado, monocromo, OG 1200×630, variante horizontal para nav.

## Inspiración vs canónico
| Tipo | Qué |
|---|---|
| Canónica | Paleta y mood del logo recibido. |
| Inspiración controlada | Estética tipo Miami nocturno / Y2K neón sobrio. |
| Prohibida | Estética IA-genérica con neón saturado plano y degradados arcoíris. |
| Temporal | El PNG del logo recibido — no es el lockup final. |

## No-go visuales
- Acumulación de glows.
- Gradientes arcoíris.
- Tipografía script en H1.
- Ilustraciones genéricas de stock.
- Cualquier referencia textual a "Vírgenes" / "Super Tabern" / "2.0" en producto final.
