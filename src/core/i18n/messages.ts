import { brandConfig, type SupportedLocale } from "@/core/branding/brand-config";

/**
 * Translation dictionaries.
 *
 * Keys are dot.namespaced strings. Lookup goes through `t(locale, key)`
 * with `es` as the canonical fallback so a missing translation never
 * renders a blank — the user always sees Spanish copy in the worst case.
 *
 * No `next-intl` (or any other library) by design — keeps the bundle
 * tiny and avoids tying the locale shape to a third-party's lifecycle.
 * When we outgrow this (plurals, currency formatting per locale),
 * swap to `next-intl` or `Format.js` — the migration target is to
 * keep this file's API surface byte-identical so consumers don't need
 * to change.
 *
 * Per ADR-017 only `es` (canonical) and `en` are shipped. `pt` was
 * dropped from the MVP after the locale review on 2026-05-20.
 *
 * Content rollout per `docs/release/i18n-rollout.md`:
 *  - Wave A: Header, Footer, Home chrome ✅
 *  - Wave B: /publicar wizard + planes + checkout ✅ (chrome)
 *  - Waves C–F: pending
 */

type MessageDict = Record<string, string>;

/* -------------------------------------------------------------------------- */
/* Dictionaries                                                                */
/* -------------------------------------------------------------------------- */

const es: MessageDict = {
  /* ---------- Header / chrome ---------- */
  "header.nav.how": "Cómo funciona",
  "header.nav.favorites": "Favoritas",
  "header.cta.publish": "Publica tu perfil",
  "header.cta.explore": "Explorar",
  "header.signIn": "Ingresar",
  "header.signOut": "Cerrar sesión",
  "header.myAccount": "Mi cuenta",
  "header.aria.mainNav": "Navegación principal",
  "header.aria.localeMenu": "Selecciona un idioma",
  "header.aria.localeLabel": "Idioma: {label}",

  /* ---------- Footer ---------- */
  "footer.tagline": "Verificación humana. Reseñas reales. Sin bots.",
  "footer.section.product": "Producto",
  "footer.section.legal": "Legal",
  "footer.section.access": "Acceso",
  "footer.section.cities": "Ciudades",
  "footer.link.explore": "Explorar",
  "footer.link.howItWorks": "Cómo funciona",
  "footer.link.terms": "Términos y condiciones",
  "footer.link.privacy": "Política de privacidad",
  "footer.link.legalNotice": "Aviso legal",
  "footer.access.adults": "Sólo mayores de 18 años",
  "footer.access.country": "Servicio limitado a Colombia",
  "footer.badge.verified": "Perfiles verificados",
  "footer.badge.country": "Servicio en Colombia",
  "footer.copyright": "© {year} {brand}. Todos los derechos reservados.",
  "footer.adultPlatform": "Plataforma para personas mayores de edad",

  /* ---------- Home: Hero ---------- */
  "hero.kicker.location": "Acompañantes verificadas · Colombia",
  "hero.cta.search": "Buscar",
  "hero.field.city": "Ciudad",
  "hero.field.query": "Nombre, plan, servicio…",
  "hero.suggested": "Sugerido",

  /* ---------- Home: How it works ---------- */
  "home.how.eyebrow": "Cómo funciona",
  "home.how.title.lead": "Tres pasos para encontrar la",
  "home.how.title.highlight": "compañía adecuada",
  "home.how.subtitle.lead": "Reservar es simple. Antes vamos por la confianza —",
  "home.how.subtitle.emphasis": "verificación, consentimiento, transparencia.",
  "home.how.step01.eyebrow": "Catálogo",
  "home.how.step01.title": "Hojea el catálogo",
  "home.how.step01.description":
    "Filtra por ciudad, categoría o disponibilidad y revisa perfiles con fotos, idiomas y reseñas.",
  "home.how.step02.eyebrow": "Confianza",
  "home.how.step02.title": "Verifica antes de elegir",
  "home.how.step02.description":
    "Cada acompañante destacada pasa por un check de identidad y consentimiento de imagen documentado.",
  "home.how.step03.eyebrow": "Reserva",
  "home.how.step03.title": "Contrata sin fricción",
  "home.how.step03.description":
    "Reserva directo desde el perfil con discreción absoluta. Mensajería y pago integrados se suman muy pronto a tu experiencia.",
  "home.how.step03.cta": "Explorar el catálogo",
  "home.how.privacy.title": "Tu privacidad es primero",
  "home.how.privacy.subtitle": "Discreción, seguridad y respeto en cada paso.",
  "home.how.privacy.item.verified": "Perfiles verificados",
  "home.how.privacy.item.consent": "Consentimiento documentado",
  "home.how.privacy.item.confidential": "100% confidencial",
  "home.how.privacy.aria": "Garantías de privacidad",

  /* ---------- Home: CTA / page ---------- */
  "home.cta.exploreAll": "Explorar todo el catálogo",
  "home.metadata.title":
    "Biringas — Consigue lo que quieres en el momento que quieres",
  "home.metadata.description":
    "Marketplace de Biringas verificadas en Colombia. Reserva compañía para eventos, viajes y salidas — perfiles auténticos, sin bots ni catfish.",

  /* ---------- Home: Featured strip ---------- */
  "home.featured.eyebrow": "Destacadas",
  "home.featured.title.lead": "Perfiles verificados que están",
  "home.featured.title.highlight": "convirtiendo",
  "home.featured.title.trailing": "esta semana",
  "home.featured.subtitle.lead":
    "Curadas por reputación y volumen de reseñas —",
  "home.featured.subtitle.emphasis": "sólo entran si lo han ganado.",
  "home.featured.cta": "Ver todo el catálogo",
  "home.featured.empty":
    "Las acompañantes destacadas aparecerán aquí muy pronto.",

  /* ---------- Home: Testimonials ---------- */
  "home.testimonials.eyebrow": "Lo que dicen los clientes",
  "home.testimonials.title.lead": "Historias reales de quienes ya",
  "home.testimonials.title.highlight": "eligieron Biringas",
  "home.testimonials.subtitle":
    "Reseñas verificadas, sin filtros de marketing. Cada cita lleva al perfil al que se refiere — así puedes contrastar antes de reservar.",
  "home.testimonials.aria": "Testimonios de clientes verificados",
  "home.testimonials.verified": "verificado",
  "home.testimonials.aboutKicker": "Sobre",
  "home.testimonials.cta": "Ver más historias en el catálogo",
  "home.testimonials.stars.aria": "Calificación {value} de 5",

  /* =================================================================
   * Wave B · /publicar wizard
   * ================================================================= */

  "publicar.metadata.title": "Publica tu perfil — Biringas",
  "publicar.metadata.description":
    "Crea tu anuncio en Biringas: detalles, descripción y plan de publicación. Verificación humana antes de salir al catálogo.",
  "publicar.back": "Volver al catálogo",
  "publicar.title": "Publica tu perfil en Biringas",
  "publicar.subtitle":
    "Tres pasos. Diez minutos. Tu perfil sale al catálogo después de una verificación rápida — y empieza a recibir contactos esa misma semana.",
  "publicar.badge.verification": "Verificación humana",

  /* Stepper */
  "publicar.stepper.aria": "Progreso de publicación",
  "publicar.stepper.stepLabel": "Paso {number}",
  "publicar.steps.details.title": "Detalles",
  "publicar.steps.details.description": "Datos públicos y privados de tu perfil.",
  "publicar.steps.description.title": "Descripción",
  "publicar.steps.description.description": "Lo que las personas verán y leerán.",
  "publicar.steps.attributes.title": "Características",
  "publicar.steps.attributes.description":
    "Etnia, cabello, estatura, cuerpo, país e idiomas.",
  "publicar.steps.publish.title": "Publicar",
  "publicar.steps.publish.description": "Plan, refuerzos y publicación.",

  /* Tips */
  "publicar.tip.default": "Consejo útil",
  "publicar.tip.details.title": "Tip — Detalles",
  "publicar.tip.details.body":
    "Las modelos que usan su nombre artístico real, edad correcta y una sola ciudad reciben un 38% más de clics. La URL preferida también funciona como SEO: usa nombre + ciudad.",
  "publicar.tip.description.title": "Tip — Descripción",
  "publicar.tip.description.body":
    "Las descripciones honestas en primera persona convierten 2.5× más. Evita números de teléfono o enlaces externos en el texto — los marcamos como spam y bloquean tu publicación.",
  "publicar.tip.attributes.title": "Tip — Características",
  "publicar.tip.attributes.body":
    "Estas etiquetas se muestran en el bloque «Características» de tu perfil y son los filtros más usados del catálogo. Sé honesta — coincidencia entre lo que cuentas y lo que ven en las fotos sube tu conversión.",
  "publicar.tip.publish.title": "Tip — Plan",
  "publicar.tip.publish.body":
    "El plan Destacada es el que más eligen las modelos verificadas: incluye boost de catálogo, badge y stories diarias. Si tienes alta competencia en tu ciudad, suma un Boost de ciudad de 24h.",

  /* NavBar */
  "publicar.nav.back": "Volver",
  "publicar.nav.continue": "Guardar y continuar",
  "publicar.nav.publishing": "Publicando…",
  "publicar.nav.publishFree": "Publicar gratis",
  "publicar.nav.publishPaid": "Publicar y pagar {total}",
  "publicar.nav.publish": "Publicar",

  /* Progress rail */
  "publicar.rail.kicker": "Tu publicación · borrador",
  "publicar.rail.row.name": "Nombre",
  "publicar.rail.row.city": "Ciudad",
  "publicar.rail.row.category": "Categoría",
  "publicar.rail.row.rate": "Tarifa / hora",
  "publicar.rail.row.services": "Servicios",
  "publicar.rail.row.gallery": "Galería",
  "publicar.rail.row.servicesCount": "{count} elegidos",
  "publicar.rail.row.galleryCount": "{count} fotos",
  "publicar.rail.row.empty": "—",
  "publicar.rail.note":
    "Llegando al paso final eliges tu plan de visibilidad. Cada perfil pasa revisión humana antes de aparecer en el catálogo.",
  "publicar.rail.currentStep": "Paso actual: {step}",

  /* Validation messages */
  "publicar.validation.displayName": "Cuéntanos tu nombre artístico.",
  "publicar.validation.age": "La edad mínima permitida es 18.",
  "publicar.validation.city": "Selecciona la ciudad principal.",
  "publicar.validation.category": "Selecciona una categoría.",
  "publicar.validation.pricePerHour": "Pon una tarifa por hora válida.",
  "publicar.validation.preferredSlug": "Define una URL preferida.",
  "publicar.validation.phone": "Necesitamos un teléfono privado para verificar.",
  "publicar.validation.contactChannels":
    "Selecciona al menos un canal de contacto.",
  "publicar.validation.shortBio": "Escribe una descripción corta.",
  "publicar.validation.bioUrl":
    "El texto no puede incluir enlaces ni URLs.",
  "publicar.validation.bioLength":
    "La descripción larga debe tener al menos 60 caracteres.",
  "publicar.validation.services":
    "Selecciona al menos un servicio incluido.",
  "publicar.validation.galleryInFlight":
    "Espera a que terminen de subir las fotos antes de continuar.",
  "publicar.validation.galleryErrored":
    "Reintenta las fotos con error o quítalas para continuar.",
  "publicar.validation.videosInFlight":
    "Espera a que terminen de subir los videos antes de continuar.",
  "publicar.validation.videosErrored":
    "Reintenta los videos con error o quítalos para continuar.",
  "publicar.validation.country": "Selecciona tu país.",
  "publicar.validation.ethnicity":
    "Selecciona la etnia que mejor te describa.",
  "publicar.validation.hair": "Selecciona tu tipo de cabello.",
  "publicar.validation.height": "Selecciona tu estatura.",
  "publicar.validation.body": "Selecciona tu tipo de cuerpo.",
  "publicar.validation.breastSize": "Selecciona el tamaño de senos.",
  "publicar.validation.breastType": "Selecciona el tipo de senos (naturales o siliconas).",
  "publicar.validation.adultConsent":
    "Confirma que eres mayor de 18 y tienes autorización sobre tus fotos.",
  "publicar.validation.acceptTerms": "Acepta los términos para publicar.",

  /* Submitted screen */
  "publicar.submitted.title": "Recibimos tu publicación",
  "publicar.submitted.description":
    "Estamos verificando tu identidad y consentimiento de imagen. Esto suele tardar entre 4 y 24 horas. Cuando esté listo te avisamos por WhatsApp y tu perfil se activa automáticamente.",
  "publicar.submitted.plan": "Plan",
  "publicar.submitted.mode": "Modo",
  "publicar.submitted.freeLaunch": "Lanzamiento gratuito",
  "publicar.submitted.photosSent": "Fotos enviadas",
  "publicar.submitted.total": "Total",
  "publicar.submitted.totalFree": "Gratis",
  "publicar.submitted.urlSoon": "URL futura",
  "publicar.submitted.verifyBanner.lead":
    "Antes de que tu perfil quede activo",
  "publicar.submitted.verifyBanner.body":
    "necesitamos verificar tu identidad. Toma 5 minutos: documento (anverso + reverso) + selfie sosteniéndolo. Sin esto tu publicación no se aprueba.",
  "publicar.submitted.cta.verify": "Verificar identidad ahora",
  "publicar.submitted.cta.later": "Más tarde",

  /* Order summary (right rail when on publish step) */
  "publicar.order.kicker": "Resumen",
  "publicar.order.plan": "Plan {name}",
  "publicar.order.cycle.monthly": "mes",
  "publicar.order.cycle.quarterly": "trimestre",
  "publicar.order.cycle.month.singular": "mes",
  "publicar.order.cycle.month.plural": "meses",
  "publicar.order.cycleNote": "{months} {monthLabel} · facturado por {cycle}",
  "publicar.order.addOnHint": "pago único",
  "publicar.order.noAddOns": "Sin refuerzos seleccionados.",
  "publicar.order.totalNow": "Total ahora",
  "publicar.order.effectivePerMonth":
    "{amount} efectivos / mes durante el plan",
  "publicar.order.reassure.cancel":
    "Cancela cuando quieras antes del próximo ciclo.",
  "publicar.order.reassure.support":
    "Soporte humano · respuesta en menos de 24 h.",
  "publicar.order.reassure.privacy": "Datos privados nunca se publican.",
  "publicar.order.free.launchPill": "Lanzamiento",
  "publicar.order.free.title": "Publicación sin costo",
  "publicar.order.free.body":
    "Estás aprovechando el periodo de lanzamiento. Tu perfil va a revisión humana y se publica si pasa, sin cobro de ningún plan.",
  "publicar.order.free.note":
    "Te avisaremos con tiempo antes de activar planes pagos.",
  "publicar.order.free.reassure.review":
    "Revisión humana entre 4 y 24 horas.",
  "publicar.order.free.reassure.edit": "Edita tu perfil cuando quieras.",

  /* =================================================================
   * Wave B · /publicar/planes
   * ================================================================= */

  "planes.metadata.title": "Planes para acompañantes — Biringas",
  "planes.metadata.description":
    "Tres planes para acompañantes verificadas en Biringas: Esencial (gratis), Impulso y Elite. Más visibilidad, mejor conversión, sin algoritmos turbios.",
  "planes.kicker": "Planes para acompañantes",
  "planes.title.lead": "Sin algoritmos turbios.",
  "planes.title.highlight": "Sin comisión por reserva.",
  "planes.subtitle":
    "Eliges el plan, pagas lo justo, te quedas con todo lo que cobras. Tres niveles según cuánto quieras crecer.",
  "planes.footnote":
    "Precios en pesos colombianos. Impuestos incluidos. Sin contratos de permanencia.",

  "planes.essential.name": "Esencial",
  "planes.essential.tagline":
    "Empieza con el perfil verificado, sin coste.",
  "planes.essential.priceLabel": "Gratis",
  "planes.essential.priceSubtitle": "Para siempre",
  "planes.essential.cta": "Publicar gratis",
  "planes.essential.feature.verified": "Perfil verificado (2 capas)",
  "planes.essential.feature.photos": "Hasta 6 fotos",
  "planes.essential.feature.messaging":
    "Mensajería + WhatsApp/Telegram",
  "planes.essential.feature.reviews": "Reseñas reales de clientes",
  "planes.essential.feature.catalog": "Aparecer en /explorar",
  "planes.essential.feature.heroSlot": "Aparición en hero editorial",
  "planes.essential.feature.topBadge": "Insignia «Top calificada»",
  "planes.essential.feature.support": "Soporte prioritario",

  "planes.boost.badge": "Recomendado",
  "planes.boost.name": "Impulso",
  "planes.boost.tagline":
    "Aparece arriba en las búsquedas y triplica visitas.",
  "planes.boost.priceLabel": "$89.000",
  "planes.boost.priceSubtitle": "/mes · cancela cuando quieras",
  "planes.boost.cta": "Activar Impulso",
  "planes.boost.feature.allEssential": "Todo lo de Esencial",
  "planes.boost.feature.photos": "Hasta 15 fotos",
  "planes.boost.feature.ranking": "Posicionamiento alto en búsquedas",
  "planes.boost.feature.topFilter": "Filtro «Top rated» por defecto",
  "planes.boost.feature.topBadge": "Insignia «Top calificada»",
  "planes.boost.feature.stories": "Stories ilimitadas",
  "planes.boost.feature.heroSlot": "Aparición en hero editorial",
  "planes.boost.feature.support": "Soporte prioritario",

  "planes.elite.badge": "Por invitación",
  "planes.elite.name": "Elite",
  "planes.elite.tagline":
    "Slot fijo en hero editorial + soporte dedicado.",
  "planes.elite.priceLabel": "$249.000",
  "planes.elite.priceSubtitle": "/mes · cupos limitados",
  "planes.elite.cta": "Solicitar invitación",
  "planes.elite.feature.allBoost": "Todo lo de Impulso",
  "planes.elite.feature.photos":
    "Fotos ilimitadas + video reel",
  "planes.elite.feature.heroSlot":
    "Slot rotatorio en hero editorial",
  "planes.elite.feature.testimonials":
    "Aparición en testimonios curados",
  "planes.elite.feature.analytics":
    "Analytics avanzadas (vistas / conversión)",
  "planes.elite.feature.support":
    "Soporte prioritario WhatsApp",
  "planes.elite.feature.photoshoot":
    "Sesión de fotos profesional (1× / año)",
  "planes.elite.feature.advisor":
    "Cuenta gestionada por un asesor",

  "planes.faq.title": "Preguntas frecuentes.",
  "planes.faq.q1.q": "¿Puedo cambiar de plan en cualquier momento?",
  "planes.faq.q1.a":
    "Sí. El cambio se aplica al siguiente ciclo y los días no usados se acreditan automáticamente.",
  "planes.faq.q2.q": "¿Cobran comisión por reserva?",
  "planes.faq.q2.a":
    "No. Pagas un plan mensual y te quedas con el 100% de lo que cobras a tus clientes.",
  "planes.faq.q3.q": "¿Qué pasa si no me sirve?",
  "planes.faq.q3.a":
    "Cancelas con un clic y tu perfil se mantiene en Esencial. Sin penalizaciones, sin permanencia.",
  "planes.faq.q4.q": "¿Aceptan transferencia / Nequi / Daviplata?",
  "planes.faq.q4.a":
    "Sí, además de tarjeta. La facturación es 100% discreta — el concepto sale como «Servicios digitales».",

  /* =================================================================
   * Wave B · /publicar/planes/[tier]/checkout
   * ================================================================= */

  "checkout.metadata.title": "Activar plan {plan} — Biringas",
  "checkout.metadata.titleInvalid": "Plan no encontrado — Biringas",
  "checkout.metadata.description":
    "Confirma el ciclo y completa el pago para activar el plan en tu perfil.",
  "checkout.kicker": "Checkout",
  "checkout.title.lead": "Activar plan",
  "checkout.subtitle":
    "Sin contratos. Cobramos al confirmar y te avisamos antes de cada renovación.",

  "checkout.tierLabel.boost": "Impulso",
  "checkout.tierLabel.elite": "Elite",

  "checkout.review.title": "Confirmá tu plan",
  "checkout.review.subtitle":
    "Sin permanencia. Podés cancelar desde tu panel cuando quieras.",
  "checkout.billing.legend": "Ciclo de facturación",
  "checkout.billing.monthly.label": "Mensual",
  "checkout.billing.monthly.subtitle": "Cobro mes a mes",
  "checkout.billing.quarterly.label": "Trimestral (15% off)",
  "checkout.billing.quarterly.subtitle": "Equivale a {perMonth} / mes",
  "checkout.payButton": "Pagar {amount}",
  "checkout.simulationNote.lead": "Simulación:",
  "checkout.simulationNote.body":
    "el pago real con tarjeta / MercadoPago se activa cuando conectemos el provider. Por ahora podés probar el flujo de extremo a extremo.",
  "checkout.paying.title": "Procesando pago seguro…",
  "checkout.paying.subtitle":
    "No cierres esta ventana. Confirmamos en pocos segundos.",
  "checkout.done.titleLead": "Plan",
  "checkout.done.titleTrailing": "activado.",
  "checkout.done.body":
    "Te enviamos un comprobante al email registrado. Las ventajas del plan se ven reflejadas en tu perfil dentro de los próximos 5 minutos.",
  "checkout.done.goToPanel": "Ir al panel",
  "checkout.done.activateAnother": "Activar otro plan",
  "checkout.backToPlans": "Volver a planes",

  "checkout.summary.kicker": "Resumen",
  "checkout.summary.plan": "Plan {name}",
  "checkout.summary.description.boost":
    "Posicionamiento alto en búsquedas, insignia «Top calificada» y stories ilimitadas.",
  "checkout.summary.description.elite":
    "Slot rotatorio en hero editorial, aparición en testimonios curados, analytics y soporte WhatsApp.",
  "checkout.summary.row.cycle": "Ciclo",
  "checkout.summary.row.plan": "Plan",
  "checkout.summary.row.total": "Total a cobrar",
  "checkout.summary.discreet.title": "Pago discreto",
  "checkout.summary.discreet.body.lead":
    "El concepto que aparece en tu extracto es",
  "checkout.summary.discreet.body.product": "Servicios digitales",
  "checkout.summary.discreet.body.trailing":
    "— nunca el nombre de la plataforma.",

  "checkout.toast.success.title": "Pago confirmado",
  "checkout.toast.success.body":
    "Plan {plan} activo. Te avisamos cuando se renueve.",
  "checkout.error.disabled":
    "El pago real se activa cuando conectemos el provider. Por ahora la simulación queda registrada en tu cuenta.",
  "checkout.error.create": "No pudimos crear la sesión.",
  "checkout.error.complete": "El pago no pudo completarse.",

  /* =================================================================
   * Wave C · /explorar
   * ================================================================= */

  "explorar.metadata.title": "Explorar Biringas — Catálogo de acompañantes",
  "explorar.metadata.description":
    "Catálogo de Biringas verificadas en Colombia. Filtra por ciudad, categoría (prepagos · masajes · videollamadas), precio, edad y disponibilidad.",
  "explorar.kicker": "Catálogo",
  "explorar.title.lead": "Explorar",
  "explorar.title.highlight": "Biringas",
  "explorar.subtitle.lead":
    "Filtra por ciudad, categoría y disponibilidad. Sólo perfiles verificados —",
  "explorar.subtitle.emphasis": "sin bots, sin catfish.",
  "explorar.savedSearch.default": "Búsqueda personalizada",
  "explorar.savedSearch.button": "Guardar búsqueda",

  /* Toolbar */
  "explorar.toolbar.cityAll": "Toda Colombia",
  "explorar.toolbar.count":
    "{shown} {totalSuffix} {brand}",
  "explorar.toolbar.totalSuffix": "de {total}",
  "explorar.toolbar.entityLabel": "biringas",
  "explorar.toolbar.clear.singular": "Limpiar {count} filtro",
  "explorar.toolbar.clear.plural": "Limpiar {count} filtros",
  "explorar.toolbar.activeLabel": "Activos",

  /* Sort menu */
  "explorar.sort.label": "Ordenar",
  "explorar.sort.relevance": "Más relevantes",
  "explorar.sort.newest": "Más nuevos",
  "explorar.sort.rating": "Mejor calificación",
  "explorar.sort.priceAsc": "Precio: menor a mayor",
  "explorar.sort.priceDesc": "Precio: mayor a menor",

  /* Category bar */
  "explorar.categoryBar.aria": "Categorías",
  "explorar.categoryBar.all": "Todas",

  /* Search bar */
  "explorar.search.placeholder": "Buscar por nombre, ciudad o servicio…",
  "explorar.search.label": "Buscar",
  "explorar.search.clear": "Limpiar búsqueda",

  /* Quick presets */
  "explorar.presets.title": "Atajos rápidos",
  "explorar.presets.availableNow": "Disponibles ahora",
  "explorar.presets.topRated": "Top calificadas",
  "explorar.presets.withVideo": "Con video",
  "explorar.presets.verifiedOnly": "Sólo verificadas",

  /* Catalog grid */
  "explorar.grid.empty.title": "No encontramos perfiles con estos filtros",
  "explorar.grid.empty.body":
    "Quita uno o dos filtros para ampliar resultados, o revisa el catálogo completo.",
  "explorar.grid.empty.cta": "Ver todo el catálogo",
  "explorar.grid.loading": "Cargando perfiles…",
  "explorar.grid.loadMore": "Cargar más",
  "explorar.grid.endOfResults": "Llegaste al final del catálogo",

  /* Filters panel — button only; deep labels deferred to Wave C.2 */
  "explorar.filters.open": "Filtros",
  "explorar.filters.openWithCount": "Filtros · {count}",
  "explorar.filters.close": "Cerrar",
  "explorar.filters.title": "Filtros",
  "explorar.filters.apply": "Aplicar",
  "explorar.filters.clearAll": "Limpiar todo",
  "explorar.filters.viewResults": "Ver {count} resultados",

  "explorar.grid.header.title": "Biringas verificadas en {city}",
  "explorar.grid.header.cityAll": "Colombia",
  "explorar.grid.aria.list": "Biringas en el catálogo",
  "explorar.grid.empty.kicker": "Sin resultados",
  "explorar.grid.empty.headline":
    "Ningún perfil coincide con esta combinación",
  "explorar.grid.empty.advice":
    "Prueba a ampliar la ciudad, soltar la edad o quitar algún chip de servicio. También puedes empezar de cero.",
  "explorar.grid.empty.cta.clearAll": "Borrar todos los filtros",
  "explorar.grid.empty.popularLabel": "O prueba una búsqueda popular",
  "explorar.sort.kicker": "Ordenar por",
  "explorar.sort.option.default.label": "Recientes",
  "explorar.sort.option.default.hint": "Lo más nuevo primero",
  "explorar.sort.option.rating.label": "Mejor calificadas",
  "explorar.sort.option.rating.hint": "Top reseñas",
  "explorar.sort.option.priceAsc.label": "Precio · menor a mayor",
  "explorar.sort.option.priceAsc.hint": "Más asequibles arriba",
  "explorar.sort.option.priceDesc.label": "Precio · mayor a menor",
  "explorar.sort.option.priceDesc.hint": "Lujo arriba",
  "explorar.filters.advanced.title": "Filtros avanzados",
  "explorar.filters.advanced.subtitle":
    "Refina por precio, edad, servicios y apariencia.",
  "explorar.filters.advanced.activeKicker":
    "Filtros activos · toca el chip para quitarlo",
  "explorar.filters.advanced.noActive": "Sin filtros aplicados",
  "explorar.filters.advanced.activeSingular": "{count} filtro activo",
  "explorar.filters.advanced.activePlural": "{count} filtros activos",
  "explorar.filters.advanced.clearAll": "Limpiar todo",
  "explorar.filters.advanced.apply": "Aplicar filtros",
  "explorar.filters.triggerLabel": "Filtros",

  /* =================================================================
   * Wave D · /p/[slug] (profile page chrome)
   * ================================================================= */

  "profile.notFound.title": "Perfil no encontrado",
  "profile.notFound.description":
    "El perfil solicitado no existe o fue retirado.",
  "profile.metadata.title": "{name} en Biringas",
  "profile.back.long": "Volver al catálogo",
  "profile.back.short": "Volver",
  "profile.gallery.aria": "Galería de {name}",
  "profile.kicker": "Perfil",
  "profile.videos.single": "Video",
  "profile.videos.multiple": "Videos",
  "profile.verifiedShield.thisMonth": "Fotos verificadas este mes",
  "profile.verifiedShield.monthsAgo":
    "Fotos verificadas hace {count} mes(es)",
  "profile.verifiedShield.title": "Cómo funciona la verificación",
  "profile.chips.videoSingle": "Vídeo disponible",
  "profile.chips.videoPlural": "{count} vídeos disponibles",
  "profile.chips.audio": "Audio disponible",
  "profile.chips.stories": "{count} historias",
  "profile.stat.views": "Vistas",
  "profile.stat.daysActive": "Días activa",
  "profile.stat.verified": "Verificada",
  "profile.stat.verifiedAgo": "hace {days}d",
  "profile.priceLabel": "Tarifa",
  "profile.section.attributes": "Características",
  "profile.section.services": "Servicios",
  "profile.section.meetingPlaces": "Lugares de encuentro",
  "profile.attributes.ethnicity": "Etnia",
  "profile.attributes.hair": "Cabello",
  "profile.attributes.height": "Estatura",
  "profile.attributes.body": "Cuerpo",
  "profile.attributes.breastSize": "Tamaño de senos",
  "profile.attributes.breastType": "Tipo de senos",
  "profile.attributes.country": "País",
  "profile.attributes.languages": "Idiomas",
  "profile.attributes.empty": "—",
  "profile.rate.aria": "Califica este perfil",

  /* =================================================================
   * Wave E · auth funnel pages chrome
   * ================================================================= */

  "auth.signin.metadata.title": "Ingresar — Biringas",
  "auth.signin.kicker": "Acceso",
  "auth.signin.title.lead": "Ingresá a",
  "auth.signin.title.highlight": "Biringas",
  "auth.signin.subtitle":
    "Tus favoritos, búsquedas guardadas y reservas — todo en un lugar discreto y verificado.",
  "auth.signin.gate.kicker": "Primero contanos qué cuenta usás",
  "auth.signin.gate.help":
    "Lo guardamos en este dispositivo. Podés cambiar cuando quieras.",
  "auth.signin.gate.continueAs": "Continuarás como",
  "auth.signin.gate.partner.title": "Soy partner",
  "auth.signin.gate.partner.body":
    "Publicás perfiles (uno o varios). Acceso al panel de modelos, KYC por cada una y solicitudes de reserva.",
  "auth.signin.gate.partner.short": "partner",
  "auth.signin.gate.client.title": "Soy cliente",
  "auth.signin.gate.client.body":
    "Buscás, guardás favoritos y dejás reseñas. Sin publicación de perfiles.",
  "auth.signin.gate.client.short": "cliente",
  "auth.signin.gate.modal.title": "¿Qué tipo de cuenta querés?",
  "auth.signin.gate.modal.body":
    "Necesitamos saberlo para mostrarte el panel correcto. Tu elección queda registrada en tu cuenta de manera permanente.",
  "auth.accountType.locked.title": "Tu cuenta ya tiene un tipo asignado",
  "auth.accountType.locked.asClient":
    "Tu cuenta está registrada como cliente. Para publicar perfiles, creá una cuenta nueva con otro correo.",
  "auth.accountType.locked.asPartner":
    "Tu cuenta está registrada como Partner. Para comentar como cliente, creá una cuenta nueva con otro correo.",
  "auth.accountType.locked.backToDashboard": "Volver al panel",
  "auth.signup.google.lockedAsClient":
    "Este correo de Google ya está registrado como cliente. Para publicar perfiles, usá otra cuenta de Google con un correo distinto.",
  "auth.signup.google.lockedAsPartner":
    "Este correo de Google ya está registrado como Partner. Para crear una cuenta de cliente, usá otra cuenta de Google con un correo distinto.",
  "auth.signup.metadata.title": "Crear cuenta — Biringas",
  "auth.signup.kicker": "Cuenta nueva",
  "auth.signup.title.lead": "Unite a",
  "auth.signup.title.highlight": "Biringas",
  "auth.signup.subtitle":
    "Cuenta gratis para guardar favoritos, dejar reseñas o publicar tu perfil verificado.",
  "auth.reset.metadata.title": "Recuperar contraseña — Biringas",
  "auth.reset.kicker": "Recuperación",
  "auth.reset.title": "Recuperar contraseña",
  "auth.reset.subtitle":
    "Te enviamos un correo con instrucciones para reestablecer tu acceso.",

  /* AuthBadge */
  "auth.badge.fallbackName": "Mi cuenta",
  "auth.badge.openAccount": "Abrir mi cuenta",
  "auth.badge.signOut": "Cerrar sesión",

  /* SignInForm */
  "auth.signin.toast.title": "Sesión iniciada",
  "auth.signin.toast.email": "Bienvenida de vuelta.",
  "auth.signin.toast.google": "Continuamos desde donde estabas.",
  "auth.signin.kicker.card": "Acceso",
  "auth.signin.card.title": "Continuá donde lo dejaste",
  "auth.signin.field.email": "Email",
  "auth.signin.field.email.placeholder": "tu@email.com",
  "auth.signin.field.password": "Contraseña",
  "auth.signin.field.password.placeholder": "Mínimo 6 caracteres",
  "auth.signin.field.password.show": "Mostrar contraseña",
  "auth.signin.field.password.hide": "Ocultar contraseña",
  "auth.signin.forgot": "¿La olvidaste?",
  "auth.signin.submit": "Iniciar sesión",
  "auth.signin.submitting": "Entrando…",
  "auth.signin.divider": "o",
  "auth.signin.google": "Continuar con Google",
  "auth.signin.trustLine": "Tu identidad nunca aparece en perfiles públicos.",
  "auth.signin.noAccount": "¿No tenés cuenta?",
  "auth.signin.createAccount": "Crear cuenta",
  "auth.disabled.kicker": "Auth no disponible",
  "auth.disabled.signin.body":
    "Falta configurar las variables NEXT_PUBLIC_FIREBASE_* para activar el acceso. Mientras tanto el catálogo y los perfiles funcionan en modo demo.",
  "auth.disabled.signup.body":
    "Falta configurar las variables NEXT_PUBLIC_FIREBASE_* para activar el registro. Mientras tanto el catálogo y los perfiles funcionan en modo demo.",
  "auth.disabled.reset.body":
    "Auth no está disponible — falta configurar Firebase.",
  "auth.alreadySignedIn.lead": "Ya tenés sesión iniciada.",
  "auth.alreadySignedIn.continue": "Continuar",
  "auth.alreadySignedIn.verifying": "Verificando…",
  "auth.alreadySignedIn.retry": "Reintentar",
  "auth.alreadySignedIn.signOut": "Cerrar sesión",
  "auth.alreadySignedIn.signingOut": "Cerrando…",
  "auth.alreadySignedIn.error.title":
    "No pudimos validar tu sesión en el servidor.",
  "auth.alreadySignedIn.error.advice":
    "Probá reintentar. Si el problema persiste, cerrá sesión y volvé a entrar.",
  "auth.alreadySignedIn.error.fallback": "No pudimos confirmar tu sesión.",
  "auth.error.invalidCredentials": "Credenciales inválidas. Probá de nuevo.",
  "auth.error.tooManyRequests": "Demasiados intentos. Esperá unos minutos.",
  "auth.error.popupClosed": "Cancelaste el inicio de sesión.",
  "auth.error.network":
    "Sin conexión. Revisá tu internet e intentá otra vez.",
  "auth.error.unknown": "Error desconocido.",

  /* SignUpForm */
  "auth.signup.kicker.card": "Nueva cuenta",
  "auth.signup.card.title": "Creá tu cuenta en 30 segundos",
  "auth.signup.card.subtitle":
    "Te abre el catálogo verificado, favoritos sincronizados y la opción de publicar tu perfil cuando quieras.",
  "auth.signup.field.email": "Email",
  "auth.signup.field.email.placeholder": "tu@email.com",
  "auth.signup.field.password": "Contraseña",
  "auth.signup.field.password.placeholder": "Mínimo {min} caracteres",
  "auth.signup.field.confirm": "Repetí tu contraseña",
  "auth.signup.field.confirm.placeholder": "La misma de arriba",
  "auth.signup.terms.accept": "Acepto los",
  "auth.signup.terms.terms": "Términos",
  "auth.signup.terms.privacyJoin": "y la",
  "auth.signup.terms.privacy": "Política de Privacidad",
  "auth.signup.submit": "Crear cuenta",
  "auth.signup.submitting": "Creando cuenta…",
  "auth.signup.benefits.aria": "Lo que obtenés",
  "auth.signup.benefits.catalog": "Catálogo verificado con perfiles reales",
  "auth.signup.benefits.favorites":
    "Favoritos sincronizados entre dispositivos",
  "auth.signup.benefits.publish":
    "Publicá tu perfil cuando quieras",
  "auth.signup.trustLine": "Tu identidad nunca aparece en perfiles públicos.",
  "auth.signup.haveAccount": "¿Ya tenés cuenta?",
  "auth.signup.signIn": "Ingresar",
  "auth.signup.toast.title": "Cuenta creada",
  "auth.signup.toast.body": "Enviamos un email de verificación. Ya podés continuar.",
  "auth.signup.validation.email": "Ingresá tu email.",
  "auth.signup.validation.password": "Mínimo {min} caracteres.",
  "auth.signup.validation.confirm": "Las contraseñas no coinciden.",
  "auth.signup.validation.terms":
    "Confirmá que aceptás los Términos y la Privacidad.",
  "auth.signup.strength.weak": "Débil",
  "auth.signup.strength.okay": "Aceptable",
  "auth.signup.strength.strong": "Fuerte",
  "auth.signup.strength.excellent": "Excelente",
  "auth.signup.error.emailInUse": "Este email ya tiene cuenta. Probá ingresar.",
  "auth.signup.error.weakPassword":
    "Contraseña demasiado débil. Probá una más larga.",
  "auth.signup.error.invalidEmail": "El formato del email no es válido.",

  /* ResetPasswordForm */
  "auth.reset.field.email": "Email",
  "auth.reset.submit": "Enviarme el correo",
  "auth.reset.submitting": "Enviando…",
  "auth.reset.success":
    "Si existe una cuenta para {email}, te enviamos un correo con las instrucciones para reestablecer tu contraseña. Revisá también tu carpeta de spam.",
  "auth.reset.backToSignin": "Volver a iniciar sesión",
  "auth.reset.recovered": "¿Recuperaste el acceso?",
  "auth.reset.signIn": "Ingresá",
  "auth.reset.validation.email": "Ingresá tu email.",
  "auth.reset.validation.invalidEmail": "El email no parece válido.",

  /* =================================================================
   * RBAC flows · account-type chooser + publisher / commentator journeys
   * Per mileroticos_flujos_rbac_firebase_es.pdf
   * ================================================================= */

  /* Chooser */
  "rbac.chooser.metadata.title": "Elegí tu tipo de cuenta — Biringas",
  "rbac.chooser.kicker": "Registro",
  "rbac.chooser.title.lead": "Elegí cómo querés",
  "rbac.chooser.title.highlight": "participar",
  "rbac.chooser.subtitle":
    "Dos rutas distintas. Cada una con su panel y sus permisos. Vas a poder cambiar si necesitás más adelante.",
  "rbac.chooser.publisher.eyebrow": "Publicador de perfiles",
  "rbac.chooser.publisher.title": "Publicá tu perfil",
  "rbac.chooser.publisher.body":
    "Creá un anuncio público, gestioná tus fotos verificadas y recibí solicitudes de reserva.",
  "rbac.chooser.publisher.bullet.1": "Verificación de teléfono y email",
  "rbac.chooser.publisher.bullet.2": "Subida de fotos, documento y video",
  "rbac.chooser.publisher.bullet.3": "Moderación previa a publicación",
  "rbac.chooser.publisher.cta": "Continuar como publicador",
  "rbac.chooser.commentator.eyebrow": "Cuenta solo para comentarios",
  "rbac.chooser.commentator.title": "Solo comentarios",
  "rbac.chooser.commentator.body":
    "Dejá reseñas en perfiles existentes y guardá favoritos. Sin teléfono, sin fotos, sin moderación.",
  "rbac.chooser.commentator.bullet.1": "Solo email + nickname",
  "rbac.chooser.commentator.bullet.2": "Panel limitado y discreto",
  "rbac.chooser.commentator.bullet.3": "No podés publicar anuncios",
  "rbac.chooser.commentator.cta": "Continuar como comentarista",
  "rbac.chooser.alreadyAccount": "¿Ya tenés cuenta?",
  "rbac.chooser.signIn": "Ingresá",
  "rbac.chooser.recommended": "Recomendado",

  /* Publisher wizard — chrome */
  "rbac.publisher.metadata.title": "Registrate como publicador — Biringas",
  "rbac.publisher.kicker": "Publicador de perfiles",
  "rbac.publisher.title.lead": "Publicá tu perfil en",
  "rbac.publisher.title.highlight": "Biringas",
  "rbac.publisher.subtitle":
    "Cuatro pasos cortos. Después tu perfil queda en moderación hasta que aprobamos las fotos.",
  "rbac.publisher.step.phone": "Teléfono y email",
  "rbac.publisher.step.otp": "Verificación",
  "rbac.publisher.step.password": "Contraseña",
  "rbac.publisher.step.profile": "Perfil",
  "rbac.publisher.stepper.aria": "Progreso del registro",
  "rbac.publisher.back": "Atrás",
  "rbac.publisher.next": "Continuar",
  "rbac.publisher.submitting": "Procesando…",
  "rbac.publisher.changeAccountType": "¿Querés solo comentar?",
  "rbac.publisher.changeAccountType.cta": "Cambiá a cuenta de comentarios",

  /* Publisher — phone step */
  "rbac.publisher.phone.title": "Tu teléfono y email",
  "rbac.publisher.phone.subtitle":
    "Usamos el teléfono para verificar identidad y para el botón de contacto del perfil.",
  "rbac.publisher.phone.country": "País",
  "rbac.publisher.phone.field": "Teléfono",
  "rbac.publisher.phone.field.placeholder": "Ej: 3237992985",
  "rbac.publisher.phone.email": "Email",
  "rbac.publisher.phone.email.placeholder": "tu@email.com",
  "rbac.publisher.phone.disabledNotice":
    "Verificación por SMS deshabilitada en esta versión — el código será aceptado optimísticamente.",
  "rbac.publisher.phone.validation.country": "Elegí tu país.",
  "rbac.publisher.phone.validation.phone": "Ingresá un teléfono de al menos 7 dígitos.",
  "rbac.publisher.phone.validation.email": "Ingresá un email válido.",

  /* Publisher — OTP step */
  "rbac.publisher.otp.title": "Verificá tu teléfono",
  "rbac.publisher.otp.subtitle":
    "Te enviaríamos un código por SMS o WhatsApp al {phone}.",
  "rbac.publisher.otp.field": "Código de 6 dígitos",
  "rbac.publisher.otp.resend": "Reenviar código",
  "rbac.publisher.otp.optimistic":
    "Modo demo — cualquier código de 6 dígitos te deja continuar.",
  "rbac.publisher.otp.validation": "Ingresá los 6 dígitos del código.",

  /* Publisher — password step */
  "rbac.publisher.password.title": "Creá tu contraseña",
  "rbac.publisher.password.subtitle":
    "Con esta contraseña vas a entrar a tu panel para editar tu perfil.",
  "rbac.publisher.password.field": "Contraseña",
  "rbac.publisher.password.field.placeholder": "Mínimo 8 caracteres",
  "rbac.publisher.password.confirm": "Repetí la contraseña",
  "rbac.publisher.password.confirm.placeholder": "Igual a la de arriba",
  "rbac.publisher.password.validation.password": "Mínimo 8 caracteres.",
  "rbac.publisher.password.validation.confirm": "Las contraseñas no coinciden.",
  "rbac.publisher.password.validation.terms":
    "Tenés que aceptar los términos para continuar.",
  "rbac.publisher.password.terms.lead":
    "Soy mayor de edad y acepto la política de privacidad y los términos de uso.",
  "rbac.publisher.password.submit": "Crear cuenta partner",
  "rbac.publisher.password.submitting": "Creando cuenta…",

  /* Publisher — profile step */
  "rbac.publisher.profile.title": "Detalles de tu perfil",
  "rbac.publisher.profile.subtitle":
    "Los datos públicos del anuncio. Vas a poder editarlos después.",
  "rbac.publisher.profile.section.location": "Localización del perfil",
  "rbac.publisher.profile.field.state": "Estado / departamento",
  "rbac.publisher.profile.field.state.placeholder": "Elegí departamento",
  "rbac.publisher.profile.field.city": "Ciudad",
  "rbac.publisher.profile.field.city.placeholder": "Elegí ciudad",
  "rbac.publisher.profile.field.neighborhood": "Barrio / distrito",
  "rbac.publisher.profile.field.neighborhood.placeholder": "Opcional",
  "rbac.publisher.profile.field.travels": "Hago salidas a (máx. 7 ciudades)",
  "rbac.publisher.profile.field.travels.placeholder": "Opcional, hasta 7",
  "rbac.publisher.profile.section.details": "Detalles del perfil",
  "rbac.publisher.profile.field.age": "Edad",
  "rbac.publisher.profile.field.age.placeholder": "Privado, solo control interno",
  "rbac.publisher.profile.field.category": "Categoría",
  "rbac.publisher.profile.field.category.placeholder": "Elegí categoría",
  "rbac.publisher.profile.field.title": "Título del perfil",
  "rbac.publisher.profile.field.title.placeholder":
    "Mínimo 40 caracteres. Tu título debe ser informativo.",
  "rbac.publisher.profile.field.description": "Descripción",
  "rbac.publisher.profile.field.description.placeholder":
    "Describite. No pongas ciudades en este campo: usá «Hago salidas a». No escribas todo en mayúsculas.",
  "rbac.publisher.profile.section.contact": "Datos de contacto",
  "rbac.publisher.profile.contact.help":
    "Debés elegir al menos una opción de contacto.",
  "rbac.publisher.profile.contact.email": "Quiero que me puedan contactar por email",
  "rbac.publisher.profile.contact.phone": "Quiero que el teléfono se vea en mi perfil",
  "rbac.publisher.profile.contact.whatsapp": "Quiero que WhatsApp se vea en mi perfil",
  "rbac.publisher.profile.contact.telegram": "Quiero que Telegram se vea en mi perfil",
  "rbac.publisher.profile.contact.noDeposit":
    "No pido anticipo adelantado para agendar cita (opcional)",
  "rbac.publisher.profile.section.photos": "Adjuntar fotos",
  "rbac.publisher.profile.photos.help":
    "Publicá solo fotos reales, no robadas de internet. Mínimo 2 fotos de frente, 2/3 del cuerpo visible.",
  "rbac.publisher.profile.photos.cta":
    "Hacé click o arrastrá las imágenes para subirlas",
  "rbac.publisher.profile.photos.disabled":
    "Carga de fotos deshabilitada en esta versión — el botón final crea un perfil en estado PENDING_MODERATION sin archivos.",
  "rbac.publisher.profile.terms.lead":
    "Soy mayor de edad. Acepto la política de privacidad y términos de uso. Declaro que soy completamente independiente, pongo este perfil por cuenta propia y ofrezco mis servicios libremente.",
  "rbac.publisher.profile.submit": "Publicar perfil",
  "rbac.publisher.profile.submitting": "Enviando a moderación…",
  "rbac.publisher.profile.validation.required": "Este campo es obligatorio.",
  "rbac.publisher.profile.validation.titleMin":
    "El título debe tener al menos 40 caracteres.",
  "rbac.publisher.profile.validation.descriptionMin":
    "Describite con al menos 80 caracteres.",
  "rbac.publisher.profile.validation.contact":
    "Elegí al menos una opción de contacto.",
  "rbac.publisher.profile.validation.terms":
    "Tenés que aceptar las condiciones para publicar.",

  /* Publisher — post-publish */
  "rbac.publisher.postPublish.metadata.title": "Perfil bajo moderación — Biringas",
  "rbac.publisher.postPublish.confirm.title": "¡Recibimos tu publicación!",
  "rbac.publisher.postPublish.confirm.body":
    "Tu publicación y la verificación de identidad están en revisión. Te avisamos por WhatsApp cuando esté lista — suele tardar entre 4 y 24 horas.",
  "rbac.publisher.postPublish.confirm.dismiss": "Cerrar",
  "rbac.publisher.postPublish.banner":
    "Tu perfil está bajo moderación. Para poder activarlo, debés verificar tus fotos. ",
  "rbac.publisher.postPublish.bannerLink": "Más información aquí.",
  "rbac.publisher.postPublish.question": "¿Querés verificar las fotos de tu perfil?",
  "rbac.publisher.postPublish.yes": "Sí",
  "rbac.publisher.postPublish.no": "No",
  "rbac.publisher.postPublish.skip": "Lo hago después",
  "rbac.publisher.postPublish.rules.title":
    "Nuevo sistema de verificación de perfiles y nuevas normas",
  "rbac.publisher.postPublish.rules.1":
    "La foto con el cartel se la tomamos nosotras.",
  "rbac.publisher.postPublish.rules.2":
    "Toda foto a verificar tiene que mostrar como mínimo 2/3 de tu cuerpo.",
  "rbac.publisher.postPublish.rules.3":
    "Cada perfil como mínimo debe tener dos fotos de frente.",
  "rbac.publisher.postPublish.rules.4":
    "Si tapás tu rostro, tiene que ser con un difuminado, no emojis, puede recortarlo.",
  "rbac.publisher.postPublish.rules.delete":
    "Las fotos que NO CUMPLAN, SERÁN borradas.",
  "rbac.publisher.postPublish.rules.twoSteps":
    "La verificación se hace en 2 pasos como siempre.",
  "rbac.publisher.postPublish.understood": "Entiendo",
  "rbac.publisher.postPublish.next": "Iniciar verificación",
  "rbac.publisher.postPublish.disabled":
    "La verificación de fotos no está activa todavía. Te avisamos cuando podamos abrirla.",
  "rbac.publisher.verify.step1.title":
    "Paso 1 — Video corto con cartel",
  "rbac.publisher.verify.step1.body":
    "Colocate frente a la cámara de forma que muestre 2/3 de tu cuerpo. Sostené un cartel donde escribas «Biringas». Mostrá el cartel y mostrate para que se vea el video en real.",
  "rbac.publisher.verify.step1.warn":
    "NO SE TOME EL VIDEO CON LUZ DE FONDO.",
  "rbac.publisher.verify.step1.cta": "Iniciar grabación",
  "rbac.publisher.verify.step2.title":
    "Paso 2 — Documento de identidad",
  "rbac.publisher.verify.step2.body":
    "Elegí con qué tipo de documento vas a identificar tu cuenta.",
  "rbac.publisher.verify.step2.id": "Documento de identidad",
  "rbac.publisher.verify.step2.passport": "Pasaporte",
  "rbac.publisher.verify.step2.front": "Sacar foto delantera",
  "rbac.publisher.verify.step2.hint.1":
    "Asegurate de que todo el documento entre en la foto.",
  "rbac.publisher.verify.step2.hint.2":
    "La foto no debe estar borrosa o mal iluminada.",
  "rbac.publisher.verify.step2.hint.3":
    "No puede haber nada cubriendo o censurando el documento.",
  "rbac.publisher.verify.success.title": "Verificación enviada",
  "rbac.publisher.verify.success.body":
    "Vamos a revisar tu material en las próximas horas. Te avisamos cuando esté listo.",
  "rbac.publisher.verify.success.cta": "Volver al panel",

  /* Commentator flow */
  "rbac.commentator.metadata.title": "Cuenta para comentarios — Biringas",
  "rbac.commentator.kicker": "Cuenta solo para comentarios",
  "rbac.commentator.title.lead": "Solo querés",
  "rbac.commentator.title.highlight": "comentar",
  "rbac.commentator.subtitle":
    "Mileroticos sólo lleva a cabo la moderación de comentarios; no los perfiles ni las páginas personales de los usuarios y tampoco se relacionan con su contenido.",
  "rbac.commentator.banner":
    "Este formulario sirve para poder realizar comentarios; si te registrás aquí no podrás publicar.",
  "rbac.commentator.card.title": "Cuenta para publicar comentarios",
  "rbac.commentator.field.country": "País",
  "rbac.commentator.field.country.placeholder": "Elegí tu país",
  "rbac.commentator.field.email": "Correo electrónico",
  "rbac.commentator.field.email.placeholder": "tu@email.com",
  "rbac.commentator.field.emailHint":
    "El correo electrónico será privado.",
  "rbac.commentator.field.nickname": "Nickname",
  "rbac.commentator.field.nickname.placeholder":
    "El nombre con el que vas a comentar.",
  "rbac.commentator.field.password": "Contraseña",
  "rbac.commentator.field.password.placeholder": "Mínimo 8 caracteres",
  "rbac.commentator.field.passwordConfirm": "Repetí la contraseña",
  "rbac.commentator.field.passwordConfirm.placeholder": "Igual a la de arriba",
  "rbac.commentator.terms":
    "Acepto la política de privacidad y condiciones de uso de Biringas.com.",
  "rbac.commentator.submit": "Registrarme",
  "rbac.commentator.submitting": "Creando cuenta…",
  "rbac.commentator.successToast.title": "¡Cuenta creada!",
  "rbac.commentator.successToast.body":
    "Listo. Ya podés dejar comentarios en cualquier perfil.",
  "rbac.commentator.alreadyAccount": "¿Ya tenés cuenta?",
  "rbac.commentator.signIn": "Ingresá",
  "rbac.commentator.switchToPublisher": "¿Querés publicar un anuncio?",
  "rbac.commentator.switchToPublisher.cta": "Registrate como publicador",
  "rbac.commentator.validation.country": "Elegí tu país.",
  "rbac.commentator.validation.email": "Ingresá un email válido.",
  "rbac.commentator.validation.nickname": "Ingresá un nickname.",
  "rbac.commentator.validation.password": "Mínimo 8 caracteres.",
  "rbac.commentator.validation.confirm": "Las contraseñas no coinciden.",
  "rbac.commentator.validation.terms": "Aceptá los términos para continuar.",

  /* Commentator panel */
  "rbac.commentator.panel.metadata.title": "Mis comentarios — Biringas",
  "rbac.commentator.panel.metadata.description":
    "Panel limitado de cuenta para comentarios.",
  "rbac.commentator.panel.title": "Tu cuenta",
  "rbac.commentator.panel.subtitle":
    "Cuenta de comentarios — no podés publicar anuncios.",
  "rbac.commentator.panel.section.options": "Opciones de usuario",
  "rbac.commentator.panel.nav.favorites": "Favoritos",
  "rbac.commentator.panel.nav.comments": "Mis comentarios",
  "rbac.commentator.panel.nav.password": "Cambiar contraseña",
  "rbac.commentator.panel.nav.delete": "Borrar mi cuenta",
  "rbac.commentator.panel.nav.signOut": "Salir del panel",
  "rbac.commentator.panel.favorites.empty":
    "No tenés ningún favorito actualmente.",
  "rbac.commentator.panel.comments.empty":
    "Todavía no comentaste ningún perfil.",
  "rbac.commentator.panel.cantPublish.title": "Tu cuenta es solo para comentarios",
  "rbac.commentator.panel.cantPublish.body":
    "El tipo de cuenta es permanente. Para publicar perfiles tenés que registrar una cuenta nueva con un correo distinto — desde esta no se puede cambiar.",
  "rbac.commentator.panel.success.updated":
    "Tu cuenta se ha modificado correctamente.",
  "rbac.commentator.panel.dialog.delete.title": "Borrar esta cuenta",
  "rbac.commentator.panel.dialog.delete.body":
    "Vas a borrar tu cuenta y todos tus comentarios. Esta acción no se puede deshacer.",
  "rbac.commentator.panel.dialog.delete.confirm": "Sí, borrar",
  "rbac.commentator.panel.dialog.delete.cancel": "Cancelar",
  "rbac.commentator.panel.dialog.delete.disabled":
    "Borrado de cuenta no implementado en esta versión.",

  /* Publisher loader — rotating marketing tips */
  "rbac.publisher.loader.kicker": "Procesando",
  "rbac.publisher.loader.title": "Enviando tu perfil a moderación",
  "rbac.publisher.loader.subtitle":
    "Estamos preparando todo. Esto puede tardar unos segundos.",
  "rbac.publisher.loader.tipsHeading": "Mientras esperás · Tip pro",
  "rbac.publisher.loader.dontClose": "No cierres esta ventana",
  "rbac.publisher.loader.tip.photos":
    "Los perfiles con 4 o más fotos reales obtienen hasta 3× más visitas. Subí variedad: planos completos, medios y de detalle.",
  "rbac.publisher.loader.tip.title":
    "Un título descriptivo de al menos 40 caracteres duplica el click-through. Probá incluir tu ciudad y una característica única.",
  "rbac.publisher.loader.tip.verified":
    "Los perfiles verificados aparecen primero en los resultados. Hacé la verificación en cuanto se active.",
  "rbac.publisher.loader.tip.telegram":
    "Agregar un Telegram o WhatsApp visible aumenta la tasa de respuesta hasta un 40%. Más canales, más reservas.",
  "rbac.publisher.loader.tip.responsive":
    "Responder dentro de la primera hora multiplica por 2,5 las reservas confirmadas. Activá las notificaciones del panel.",
  "rbac.publisher.loader.tip.description":
    "La descripción es tu carta de presentación. Escribí en primera persona, sin mayúsculas y mostrando lo que te hace única.",
  "rbac.publisher.loader.tip.location":
    "Indicar el barrio y las ciudades a las que viajás te coloca en más resultados de búsqueda y reduce conversaciones improductivas.",
  "rbac.publisher.loader.tip.premium":
    "Los planes premium destacan tu perfil en home y en las categorías, multiplicando la exposición sin tocar tu agenda.",
  "rbac.publisher.loader.tip.video":
    "Un video corto bien iluminado aporta confianza y agiliza la verificación. Mostralo cuando se active la subida.",

  /* Photo upload — visual stub */
  "rbac.publisher.photos.choose": "Elegir fotos",
  "rbac.publisher.photos.dragHint":
    "Hacé click o arrastrá imágenes JPG, PNG o WebP. Hasta 8 MB cada una.",
  "rbac.publisher.photos.counter":
    "{count} de {min}–{max} fotos seleccionadas",
  "rbac.publisher.photos.remove": "Quitar foto",
  "rbac.publisher.photos.coverBadge": "Portada",
  "rbac.publisher.photos.ok":
    "Llegaste al mínimo. Podés sumar más para mejorar tu perfil.",
  "rbac.publisher.photos.minHint": "Subí al menos {min} fotos de frente.",
  "rbac.publisher.photos.remaining": "{count} cupos libres",
  "rbac.publisher.photos.error.format":
    "Formato no admitido. Usá JPG, PNG o WebP.",
  "rbac.publisher.photos.error.size":
    "El archivo supera el límite de {mb} MB.",
  "rbac.publisher.photos.error.max":
    "Máximo {max} fotos por perfil.",

  /* Form-level extras */
  "rbac.form.errorSummary.heading":
    "Revisá los siguientes campos para continuar:",
  "rbac.form.toast.invalid.title": "Faltan datos",
  "rbac.form.toast.invalid.body":
    "Marcamos los campos que necesitan atención. Resolvelos para continuar.",
  "rbac.form.toast.success.title": "¡Listo!",
  "rbac.form.toast.success.body": "Recibimos tu perfil — ahora lo revisamos.",
  "rbac.form.toast.error.title": "Algo salió mal",
  "rbac.form.toast.error.body":
    "No pudimos procesar tu solicitud. Probá de nuevo en un momento.",
  "rbac.publisher.profile.field.description.hint":
    "Mínimo 80 caracteres. Máximo {max} — sé breve y específica.",
  "rbac.publisher.profile.validation.descriptionMax":
    "La descripción supera el máximo de {max} caracteres.",

  /* =================================================================
   * Wave E.2 · /mi-cuenta dashboard
   * ================================================================= */

  "miCuenta.metadata.title": "Mi cuenta — Biringas",
  "miCuenta.metadata.description":
    "Panel del modelo: solicitudes recibidas, edición de perfil y agenda semanal.",
  "miCuenta.fallbackName": "modelo",

  /* Empty drafts state */
  "miCuenta.empty.title": "Aún no publicaste ninguna modelo",
  "miCuenta.empty.body":
    "Cuando publiques una modelo verás aquí las solicitudes, podrás editar sus fotos y ajustar su agenda en cualquier momento.",
  "miCuenta.empty.cta": "Publicar una modelo",

  /* Profile tab */
  "miCuenta.profile.single": "Tu perfil publicado:",
  "miCuenta.profile.multiple": "Tenés {count} perfiles publicados.",
  "miCuenta.profile.viewProfile": "Ver perfil",
  "miCuenta.profile.catalogStatus": "Estado en el catálogo:",
  "miCuenta.profile.reviewNote":
    "Mientras tu perfil está en revisión humana, aparece sólo para vos. Te avisamos en cuanto pase la verificación de 2 capas — suele tardar menos de 24 horas hábiles.",

  /* Draft action links */
  "miCuenta.draft.action.details": "Ver detalles",
  "miCuenta.draft.action.editResend": "Editar y reenviar",
  "miCuenta.draft.action.edit": "Editar",

  /* Draft status pills */
  "miCuenta.draft.status.approved": "Aprobado",
  "miCuenta.draft.status.rejected": "Rechazado",
  "miCuenta.draft.status.inReview": "En revisión",

  /* Agenda tab */
  "miCuenta.agenda.headline.lead": "Disponibilidad pública que ven los visitantes en tu perfil",
  "miCuenta.agenda.comingSoon.title": "Próximamente: edición manual.",
  "miCuenta.agenda.comingSoon.body":
    "Vas a poder fijar tus franjas reales con un par de toques. Por ahora la grilla se calcula a partir de tu historial de confirmaciones; si querés ocultar una franja específica, escribinos al soporte.",

  /* KYC status card */
  "miCuenta.kyc.approved.title": "Identidad verificada",
  "miCuenta.kyc.approved.body":
    "Tu insignia dorada aparece en el catálogo. Si cambiás de documento, podés volver a verificar más adelante.",
  "miCuenta.kyc.pending.title": "Verificación en revisión",
  "miCuenta.kyc.pending.body":
    "Recibimos tus archivos. Te avisamos en cuanto el equipo termine la revisión humana.",
  "miCuenta.kyc.pending.meta": "Suele tardar menos de 24 horas",
  "miCuenta.kyc.rejected.title": "Verificación rechazada",
  "miCuenta.kyc.rejected.body":
    "Tu intento anterior no pasó. Podés reenviar las fotos cuando estés lista.",
  "miCuenta.kyc.rejected.cta": "Reenviar verificación",
  "miCuenta.kyc.rejected.reason": "Motivo:",
  "miCuenta.kyc.notSubmitted.title": "Verificá tu identidad",
  "miCuenta.kyc.notSubmitted.body":
    "Tu perfil queda visible recién cuando confirmamos quién sos. Toma 5 minutos: documento (anverso + reverso) + selfie.",
  "miCuenta.kyc.notSubmitted.cta": "Verificar mi identidad",
  "miCuenta.kyc.aria.approved": "Aprobado",
  "miCuenta.kyc.aria.rejected": "Rechazado",
  "miCuenta.kyc.aria.inReview": "En revisión",

  /* Persons / multi-modelo (ADR-018) */
  "miCuenta.persons.listKicker": "Tus modelos ({count})",
  "miCuenta.persons.create.cta": "Crear nueva modelo",
  "miCuenta.persons.create.title": "Nueva modelo",
  "miCuenta.persons.create.help":
    "Cada modelo se verifica por separado y publica su propio perfil. Empezá por el nombre.",
  "miCuenta.persons.create.nameLabel": "Nombre o alias",
  "miCuenta.persons.create.namePlaceholder": "Ej: Sofía",
  "miCuenta.persons.create.submit": "Crear",
  "miCuenta.persons.create.submitting": "Creando…",
  "miCuenta.persons.create.cancel": "Cancelar",
  "miCuenta.persons.create.error.fallback":
    "No pudimos crearla. Intentá de nuevo en unos segundos.",
  "miCuenta.persons.empty.title": "Empezá creando tu primera modelo",
  "miCuenta.persons.empty.body":
    "Cada modelo es independiente: tiene su propia verificación de identidad y sus propias publicaciones. La verificación se pide cuando publiques.",
  "miCuenta.profiles.listKicker": "Tus perfiles ({count})",
  "miCuenta.profiles.publishAnother": "Publicar otro perfil",
  "miCuenta.profiles.empty.title": "Empezá publicando tu primer perfil",
  "miCuenta.profiles.empty.body":
    "Cada perfil se publica y se verifica por separado. Vas a hacer la verificación de identidad en el mismo flujo.",
  "miCuenta.profiles.empty.cta": "Publica tu primer perfil",
  "miCuenta.profile.kyc.notSubmitted": "Identidad pendiente",
  "miCuenta.profile.kyc.pending": "Identidad en revisión",
  "miCuenta.profile.kyc.approved": "Identidad verificada",
  "miCuenta.profile.kyc.rejected": "Identidad rechazada",
  "miCuenta.profile.listing.none": "Sin publicación todavía",
  "miCuenta.profile.listing.inReview": "Publicación en revisión",
  "miCuenta.profile.listing.published": "Publicado",
  "miCuenta.profile.listing.rejected": "Publicación rechazada",
  "miCuenta.profile.action.verifyIdentity": "Verificar identidad",
  "miCuenta.profile.action.publish": "Publicar este perfil",
  "miCuenta.profile.action.viewDetails": "Ver detalles",
  "miCuenta.profile.action.editResend": "Editar y reenviar",
  "miCuenta.profile.action.viewListing": "Ver mi publicación",
  "miCuenta.profile.action.viewVerification": "Ver verificación enviada",
  "miCuenta.profile.action.delete": "Eliminar el perfil {name}",
  "miCuenta.profile.delete.modal.title": "¿Eliminar el perfil {name}?",
  "miCuenta.profile.delete.modal.body":
    "Se cancelará la publicación en revisión, se eliminará la verificación de identidad y el perfil dejará de aparecer en tu dashboard. Esta acción no se puede deshacer.",
  "miCuenta.profile.delete.modal.blocked.body":
    "Este perfil tiene una publicación activa en el catálogo. Despublícala primero o contactá a soporte para eliminarla — borrar el perfil ahora dejaría la publicación huérfana.",
  "miCuenta.profile.delete.modal.typeToConfirm":
    "Escribí «{name}» para confirmar",
  "miCuenta.profile.delete.modal.cancel": "Cancelar",
  "miCuenta.profile.delete.modal.confirm": "Eliminar perfil",
  "miCuenta.profile.delete.toast.success.title": "Perfil eliminado",
  "miCuenta.profile.delete.toast.success.body":
    "El perfil de {name} se eliminó de tu cuenta.",
  "miCuenta.profile.delete.toast.error.title": "No se pudo eliminar el perfil",
  "miCuenta.profile.delete.toast.error.body":
    "Algo salió mal. Intentá de nuevo en unos segundos o contactá a soporte si persiste.",
  "miCuenta.profile.delete.toast.blocked.title": "Hay una publicación activa",
  "miCuenta.profile.delete.toast.blocked.body":
    "El perfil ya está publicado en el catálogo. Despublicalo primero o contactá a soporte.",

  /* Draft detail page */
  "draft.metadata.title": "Detalle del borrador — Biringas",
  "draft.metadata.description": "Vista en revisión de un borrador del catálogo.",
  "draft.back": "Volver al dashboard",
  "draft.unnamed": "Borrador sin nombre",
  "draft.subtitle":
    "Esto es lo que enviaste. Mientras tu publicación está en revisión humana, no se puede editar — si necesitamos algo te avisamos antes de 24 horas.",

  "draft.status.pending.title": "En revisión humana",
  "draft.status.pending.body":
    "Recibimos tu publicación y la pasamos por la verificación de 2 capas. Mientras tanto solo aparece para vos.",
  "draft.status.pending.meta": "Suele tardar menos de 24 horas",
  "draft.status.approved.title": "Publicación aprobada",
  "draft.status.approved.body":
    "Tu perfil pasó la verificación y aparece en el catálogo público.",
  "draft.status.rejected.title": "Publicación rechazada",
  "draft.status.rejected.body":
    "Hubo un detalle que no pasó la revisión. Podés editar el borrador y volver a enviarlo.",
  "draft.status.cancelled.title": "Publicación cancelada",
  "draft.status.cancelled.body":
    "Se canceló porque eliminaste el perfil al que pertenecía. Si querés volver a publicar, creá un nuevo perfil desde el dashboard.",
  "draft.status.rejection.reason": "Motivo:",
  "draft.receivedOn": "Recibido {when}",

  "draft.pill.pending": "En revisión",
  "draft.pill.approved": "Aprobado",
  "draft.pill.rejected": "Rechazado",
  "draft.pill.cancelled": "Cancelado",

  "draft.section.public": "Datos públicos",
  "draft.section.private": "Datos privados (solo vos los ves)",
  "draft.section.description": "Descripción y servicios",
  "draft.section.attributes": "Características",
  "draft.section.gallery": "Galería",
  "draft.section.plan": "Plan elegido",

  "draft.field.displayName": "Nombre artístico",
  "draft.field.age": "Edad",
  "draft.field.age.value": "{n} años",
  "draft.field.city": "Ciudad",
  "draft.field.category": "Categoría",
  "draft.field.url": "URL preferida",
  "draft.field.rate": "Tarifa por hora",
  "draft.field.phone": "Teléfono de verificación",
  "draft.field.contactChannels": "Canales de contacto",
  "draft.field.attention": "Atiende a",
  "draft.field.shortBio": "Frase corta",
  "draft.field.bio": "Descripción larga",
  "draft.field.servicesIncluded": "Servicios incluidos",
  "draft.field.meetingContexts": "Contextos de encuentro",
  "draft.field.faceVisible": "Rostro visible",
  "draft.field.paymentByCard": "Acepta tarjeta",
  "draft.field.availableNow": "Disponible ahora",
  "draft.field.country": "País",
  "draft.field.ethnicity": "Etnia",
  "draft.field.hair": "Cabello",
  "draft.field.height": "Estatura",
  "draft.field.body": "Cuerpo",
  "draft.field.breastSize": "Tamaño de senos",
  "draft.field.breastType": "Tipo de senos",
  "draft.field.pubis": "Pubis",
  "draft.field.languages": "Idiomas",
  "draft.field.photosSent": "Fotos enviadas",
  "draft.field.photos.singular": "{count} foto",
  "draft.field.photos.plural": "{count} fotos",
  "draft.field.photos.readyNote": "— listas para la verificación KYC + revisión humana.",
  "draft.field.photos.empty":
    "Sin fotos adjuntas. El equipo puede pedirte que las subas en esta etapa.",
  "draft.field.package": "Paquete",
  "draft.field.billing": "Facturación",
  "draft.field.billing.monthly": "Mensual",
  "draft.field.billing.quarterly": "Trimestral",
  "draft.field.addOns": "Add-ons",
  "draft.value.yes": "Sí",
  "draft.value.no": "No",

  "draft.footer.pending":
    "Mientras tu publicación está en revisión humana, no se puede editar. Si necesitamos algún cambio te avisamos por el canal de contacto que registraste — suele tardar menos de 24 horas hábiles.",
  "draft.footer.rejected.body":
    "Tu intento anterior no pasó la revisión. Podés editar este borrador y reenviarlo cuando estés lista.",
  "draft.footer.rejected.cta": "Volver al dashboard",

  /* =================================================================
   * Wave F · /favoritas
   * ================================================================= */

  "favoritas.metadata.title": "Tus favoritas — Biringas",
  "favoritas.metadata.description":
    "Guarda los perfiles que te interesan y compáralos lado a lado antes de decidir.",
  "favoritas.loading": "Cargando tu lista…",
  "favoritas.kicker": "Tu shortlist",
  "favoritas.title": "Tus favoritas",
  "favoritas.subtitle":
    "Las guardas con el corazón en cada perfil. Acá podés compararlas lado a lado y decidir sin volver al catálogo.",
  "favoritas.quickVersus": "Versus rápido",
  "favoritas.clearVersus": "Limpiar versus",
  "favoritas.keepExploring": "Seguir explorando",
  "favoritas.compareHint.title": "Modo Versus.",
  "favoritas.compareHint.bodyA": "Tocá",
  "favoritas.compareHint.versus": "Versus rápido",
  "favoritas.compareHint.bodyB":
    "para comparar las primeras 3 al instante, o marcá",
  "favoritas.compareHint.compare": "Comparar",
  "favoritas.compareHint.bodyC": "en las cards para armar tu propio combo.",
  "favoritas.empty.title": "Tu shortlist está vacía",
  "favoritas.empty.body":
    "Tocá el corazón en cualquier perfil para guardarlo aquí. Después podés compararlos lado a lado antes de decidir.",
  "favoritas.empty.cta": "Explorar perfiles",

  /* =================================================================
   * Wave F · /seguridad
   * ================================================================= */

  "seguridad.metadata.title": "Tu seguridad primero — Biringas",
  "seguridad.metadata.description":
    "Guía práctica para que cada encuentro en Biringas sea seguro: antes, durante y después. Reglas claras, sin moralina.",
  "seguridad.kicker": "Tu seguridad primero",
  "seguridad.title.lead": "Nueve reglas que vuelven cada encuentro",
  "seguridad.title.highlight": "un buen recuerdo",
  "seguridad.subtitle":
    "Antes, durante y después. Pegalas en un favorito y reléelas antes de cada reserva — los rituales evitan las sorpresas.",
  "seguridad.phase.before.kicker": "Antes",
  "seguridad.phase.before.title": "Pactar es la mitad del trabajo.",
  "seguridad.phase.during.kicker": "Durante",
  "seguridad.phase.during.title": "Vos siempre tenés el botón rojo.",
  "seguridad.phase.after.kicker": "Después",
  "seguridad.phase.after.title":
    "La confianza se construye en cada encuentro.",

  "seguridad.rule.badge.title": "Confirmá la insignia verde",
  "seguridad.rule.badge.body":
    "Solo los perfiles con el escudo dorado pasaron por verificación humana de 2 capas. Si no la tiene, anda con cautela.",
  "seguridad.rule.chat.title": "Pactá todo por chat",
  "seguridad.rule.chat.body":
    "Tarifa, lugar, duración, tipo de plan. Si algo no coincide al llegar, tenés el chat como evidencia.",
  "seguridad.rule.call.title": "Hacé una llamada corta",
  "seguridad.rule.call.body":
    "Una llamada de 30 segundos confirma identidad y disipa dudas. Si rechaza la llamada o suena bot, cancelá.",
  "seguridad.rule.location.title": "Compartí tu ubicación",
  "seguridad.rule.location.body":
    "Mandale tu ubicación en vivo a alguien de confianza antes de entrar. Apple Maps y Google Maps tienen «compartir en tiempo real» gratis.",
  "seguridad.rule.noMoney.title": "Cero dinero por adelantado",
  "seguridad.rule.noMoney.body":
    "Ninguna acompañante seria pide transferencia antes del encuentro. Si te lo piden, es estafa — bloqueá y reportá.",
  "seguridad.rule.places.title": "Lugares con cámara o gente",
  "seguridad.rule.places.body":
    "Hoteles, departamentos turísticos verificados, restaurantes. Evitá direcciones que cambien a último momento.",
  "seguridad.rule.delete.title": "Borrá lo que no necesitás",
  "seguridad.rule.delete.body":
    "Mensajes, fotos, capturas. Tu privacidad después del encuentro es tan importante como antes.",
  "seguridad.rule.review.title": "Dejá tu reseña",
  "seguridad.rule.review.body":
    "Aunque haya sido perfecto, tu reseña ayuda a otros y refuerza la confianza del perfil. Pocas palabras alcanzan.",
  "seguridad.rule.report.title": "Reportá lo que no estuvo bien",
  "seguridad.rule.report.body":
    "Fotos que no coinciden, presión, comportamiento agresivo — el botón de reporte está en cada perfil. Revisamos en menos de 24 horas.",

  "seguridad.redFlags.title": "Señales de alarma — cancelá sin culpa.",
  "seguridad.redFlags.crypto":
    "Pide pago en cripto, gift cards o transferencias internacionales",
  "seguridad.redFlags.changePlace":
    "Cambia el lugar del encuentro a último momento sin razón",
  "seguridad.redFlags.noCall":
    "No quiere videollamada ni llamada de voz antes de verse",
  "seguridad.redFlags.tooPolished":
    "Las fotos son demasiado pulidas (revisa imagen reversa)",
  "seguridad.redFlags.substances":
    "Insiste en bebidas o sustancias que vos no pediste",

  "seguridad.emergency.title": "Si algo sale mal, no estás sola.",
  "seguridad.emergency.body.lead": "Línea Púrpura Colombia ·",
  "seguridad.emergency.body.purpleLine": "018000 112 137",
  "seguridad.emergency.body.mid":
    "— gratis, 24 horas, asistencia anónima en casos de violencia o presión. Para emergencias inmediatas marcá",
  "seguridad.emergency.body.emergencyLine": "123",
  "seguridad.emergency.body.trailing":
    ". Reportes dentro de la plataforma se revisan en menos de 24 horas hábiles.",
  "seguridad.emergency.cta.verification": "Cómo verificamos los perfiles",
  "seguridad.emergency.cta.explore": "Explorar el catálogo verificado",

  /* =================================================================
   * Wave F · /legal/* (metadata only; body stays in ES — jurisdictional)
   * ================================================================= */

  "legal.terminos.metadata.title": "Términos y condiciones — {brand}",
  "legal.terminos.metadata.description":
    "Términos y condiciones de uso de la plataforma. Reglas del marketplace, responsabilidad del usuario y prohibiciones expresas. Documento en revisión legal.",
  "legal.privacidad.metadata.title": "Política de privacidad — {brand}",
  "legal.privacidad.metadata.description":
    "Política de tratamiento de datos personales de la plataforma. Finalidades, derechos del titular y mecanismos para ejercerlos. Documento en revisión legal.",
  "legal.disputas.metadata.title": "Disputas y cancelaciones — {brand}",
  "legal.disputas.metadata.description":
    "Política de cancelación, reembolso y resolución de disputas. Plazos, escalamiento y reglas claras para ambas partes.",
  "legal.avisoLegal.metadata.title": "Aviso legal — {brand}",
  "legal.avisoLegal.metadata.description":
    "Identificación del titular del servicio, propiedad intelectual, mecanismos de reporte y régimen aplicable. Documento en revisión legal.",
  "legal.jurisdictionalNotice":
    "Este documento se rige por la legislación colombiana y se publica en español como única versión auténtica.",

  /* =================================================================
   * Wave F · errors / not-found / global-error
   * ================================================================= */

  "error.routeKicker": "Algo no salió bien",
  "error.routeTitle": "Hubo un tropiezo al cargar esta página.",
  "error.routeBody":
    "Es del lado nuestro, no tuyo. Probá de nuevo en un momento — si vuelve a pasar, escribinos y lo revisamos.",
  "error.routeRetry": "Intentar de nuevo",
  "error.routeHome": "Volver al inicio",
  "error.ref": "Ref:",

  "notFound.title": "404",
  "notFound.body": "La página que buscas no existe.",
  "notFound.cta": "Volver al inicio",

  "error.globalKicker": "Error inesperado",
  "error.globalTitle": "Algo se rompió del lado nuestro.",
  "error.globalBody":
    "Estamos al tanto. Probá recargar — si sigue sin funcionar, intentá de nuevo en unos minutos.",
  "error.globalRetry": "Intentar de nuevo",

  /* =================================================================
   * E.3 · /verificacion + /verificacion/enviar
   * ================================================================= */

  "verificacion.metadata.title":
    "Verificación en 2 capas — cómo nos aseguramos de que sea real",
  "verificacion.metadata.description":
    "Cada perfil destacado en Biringas pasa por verificación de identidad y consentimiento de imagen documentado. Aquí explicamos el proceso paso a paso.",
  "verificacion.kicker": "Verificación en 2 capas",
  "verificacion.title.lead": "Cada perfil que ves aquí",
  "verificacion.title.highlight": "pasó por una persona real",
  "verificacion.subtitle":
    "Sin bots, sin catfish, sin perfiles auto-generados. La insignia dorada del escudo no se compra — se gana con dos capas independientes de verificación humana.",
  "verificacion.steps.title": "Cómo funciona el proceso.",
  "verificacion.step.identity.eyebrow": "Capa 1",
  "verificacion.step.identity.title": "Identidad",
  "verificacion.step.identity.body":
    "Subimos documento oficial vigente y comparamos contra el registro civil. Si los datos no coinciden, el perfil no se publica — ni siquiera como borrador.",
  "verificacion.step.selfie.eyebrow": "Capa 2",
  "verificacion.step.selfie.title": "Selfie en vivo + consentimiento",
  "verificacion.step.selfie.body":
    "Verificación remota con una persona del equipo (no es un bot). Confirmamos rostro contra documento y grabamos el consentimiento explícito para publicar fotos.",
  "verificacion.step.result.eyebrow": "Resultado",
  "verificacion.step.result.title": "Insignia verde",
  "verificacion.step.result.body":
    "El escudo dorado en el perfil aparece sólo cuando ambas capas pasaron. Si una caduca, la insignia desaparece automáticamente hasta renovarla.",

  "verificacion.privacy.title": "Tu identidad no se cruza con tu perfil.",
  "verificacion.privacy.body":
    "El equipo que verifica documentos no tiene acceso al contenido público del perfil. El equipo que publica fotos no ve el documento. Sólo el hash de verificación conecta ambos lados — y se elimina junto con la cuenta si decides darte de baja.",

  "verificacion.faq.title": "Preguntas frecuentes.",
  "verificacion.faq.q1.q": "¿Cuánto tarda la verificación?",
  "verificacion.faq.q1.a":
    "El 90% de los perfiles queda verificado en menos de 24 horas hábiles. Si hay dudas en el documento, te contactamos para una segunda revisión.",
  "verificacion.faq.q2.q": "¿Qué pasa si un perfil falla la verificación?",
  "verificacion.faq.q2.a":
    "No se publica. El perfil queda en estado borrador y la persona puede corregir los datos o cancelar el proceso sin que nada se haga público.",
  "verificacion.faq.q3.q": "¿Almacenan mi documento?",
  "verificacion.faq.q3.a":
    "Encriptado en frío y nunca compartido con terceros. La copia se elimina automáticamente seis meses después de la verificación; sólo guardamos el hash para futuras renovaciones.",
  "verificacion.faq.q4.q": "¿Pueden falsearse las fotos?",
  "verificacion.faq.q4.a":
    "El consentimiento de imagen documentado y la verificación selfie-en-vivo impiden que terceros suban fotos sin permiso. Cada foto del perfil tiene un timestamp que aparece como «Foto verificada · mes año».",
  "verificacion.faq.q5.q":
    "¿La verificación garantiza que tendré una buena experiencia?",
  "verificacion.faq.q5.a":
    "Garantiza que la persona es real y publicó con consentimiento. La calidad del encuentro depende de la comunicación, expectativas claras y respeto mutuo — para eso están las reseñas y la mensajería.",
  "verificacion.cta.publishQuestion": "¿Eres acompañante y quieres aparecer verificada?",
  "verificacion.cta.publishLink": "Publica tu perfil verificado",

  "verificacion.modeloCta.approved": "Tu identidad ya está verificada",
  "verificacion.modeloCta.pending": "Tu verificación está en revisión",
  "verificacion.modeloCta.start": "Verificar mi identidad",

  /* /verificacion/enviar (wizard) */
  "verificacion.enviar.metadata.title": "Verifica tu identidad — Biringas",
  "verificacion.enviar.metadata.description":
    "Sube tu documento de identidad (anverso + reverso) y una selfie sosteniéndolo. El equipo de Biringas valida cada perfil antes de aprobarlo en el catálogo.",
  "verificacion.enviar.title": "Verifica tu identidad",
  "verificacion.enviar.subtitle":
    "Tres archivos. Cinco minutos. Tu perfil pasa a revisión y se activa en el catálogo cuando confirmamos que eres tú.",

  "verificacion.wizard.step.front.title": "Documento — anverso",
  "verificacion.wizard.step.front.description":
    "Sube una foto clara del frente de tu cédula o pasaporte.",
  "verificacion.wizard.step.front.helper":
    "Asegúrate que todos los datos sean legibles. JPG, PNG, WebP o HEIC. Comprimimos en el navegador para protegerte; ningún metadato sale de tu dispositivo.",
  "verificacion.wizard.step.back.title": "Documento — reverso",
  "verificacion.wizard.step.back.description":
    "Ahora el dorso del mismo documento.",
  "verificacion.wizard.step.back.helper":
    "El número de identificación y los hologramas deben verse. Si tu documento es de una sola cara, repite la foto del anverso aquí.",
  "verificacion.wizard.step.selfie.title": "Selfie con documento",
  "verificacion.wizard.step.selfie.description":
    "Una foto de ti sosteniendo el documento al lado de tu rostro.",
  "verificacion.wizard.step.selfie.helper":
    "Tu cara y el documento deben aparecer en la misma toma sin cubrir datos. Esta es la capa más importante: confirma que eres la persona del documento.",

  "verificacion.wizard.upload": "Subir archivo",
  "verificacion.wizard.uploading": "Subiendo",
  "verificacion.wizard.compressing": "Comprimiendo",
  "verificacion.wizard.ready": "Listo",
  "verificacion.wizard.retry": "Reintentar",
  "verificacion.wizard.privacyHint":
    "Tus archivos quedan privados. Solo el equipo de Biringas puede verlos, por tiempo limitado, durante la revisión.",
  "verificacion.wizard.submit": "Enviar verificación",
  "verificacion.wizard.submitting": "Enviando…",
  "verificacion.wizard.error.format":
    "Formato no permitido. Usa JPG, PNG, WebP o HEIC.",
  "verificacion.wizard.error.tooBig":
    "El archivo pesa más de 40 MB sin comprimir.",
  "verificacion.wizard.error.upload": "No pudimos subir este archivo.",
  "verificacion.wizard.error.completeAll":
    "Completa los tres archivos antes de enviar.",
  "verificacion.wizard.error.noSession": "Tu sesión expiró. Vuelve a ingresar.",
  "verificacion.wizard.error.permissionDenied":
    "Uno o más archivos no son tuyos. Vuelve a subirlos.",
  "verificacion.wizard.error.pendingReview":
    "Ya tienes una verificación en revisión. Espera la respuesta antes de reenviar.",
  "verificacion.wizard.error.submitDefault":
    "No pudimos enviar la verificación. Intenta de nuevo.",
  "verificacion.wizard.error.documentNumberInvalid":
    "El número de documento es muy corto o muy largo. Verificá que esté completo.",
  "verificacion.wizard.error.duplicateDocument":
    "Ese documento ya está registrado en otra cuenta. Si crees que es un error, contactá soporte.",
  "verificacion.wizard.previousRejection": "Verificación anterior rechazada:",

  "verificacion.wizard.doc.kicker": "Datos del documento",
  "verificacion.wizard.doc.title": "Identidad estructurada",
  "verificacion.wizard.doc.subtitle":
    "Capturamos el tipo y número del documento para evitar registros duplicados. El número se guarda en privado, solo el equipo de revisión lo ve.",
  "verificacion.wizard.doc.typeLabel": "Tipo de documento",
  "verificacion.wizard.doc.type.CC": "Cédula (CC)",
  "verificacion.wizard.doc.type.CE": "Cédula de extranjería (CE)",
  "verificacion.wizard.doc.type.PASSPORT": "Pasaporte",
  "verificacion.wizard.doc.numberLabel": "Número de documento",
  "verificacion.wizard.doc.numberHelper":
    "Ingresá el número tal como aparece en el documento. Quitamos puntos y espacios automáticamente.",
  "verificacion.wizard.doc.normalizedHint": "Lo guardamos como",
  "verificacion.wizard.doc.placeholder.cc": "1.234.567",
  "verificacion.wizard.doc.placeholder.ce": "1234567",
  "verificacion.wizard.doc.placeholder.passport": "AB123456",

  "verificacion.wizard.submitted.title": "Verificación enviada",
  "verificacion.wizard.submitted.body":
    "Tus archivos están en revisión. Confirmamos identidad y consentimiento usualmente en menos de 24 horas. Cuando esté lista te avisamos por WhatsApp y tu perfil queda activo en el catálogo.",
  "verificacion.wizard.backToCatalog": "Volver al catálogo",
  "verificacion.wizard.continueToNext": "Continuar con tu publicación",
  "verificacion.wizard.pending.title": "Verificación en revisión",
  "verificacion.wizard.pending.body":
    "Recibimos tu documentación el {when}. Te avisamos en cuanto esté lista.",
  "verificacion.wizard.approved.title": "Identidad verificada",
  "verificacion.wizard.approved.body":
    "Tu verificación quedó aprobada el {when}. Las modelos con identidad verificada aparecen con la insignia dorada en el catálogo.",
  "verificacion.wizard.readonly.pendingNotice":
    "Estamos revisando estos documentos. No puedes editarlos mientras la verificación está en curso.",
  "verificacion.wizard.readonly.approvedNotice":
    "Estos son los documentos con los que tu identidad fue verificada.",
  "verificacion.wizard.readonly.documentSectionTitle": "Documento enviado",
  "verificacion.wizard.readonly.docTypeLabel": "Tipo de documento",
  "verificacion.wizard.readonly.docNumberLabel": "Número (últimos 4)",
  "verificacion.wizard.readonly.documentFront": "Frente del documento",
  "verificacion.wizard.readonly.documentBack": "Dorso del documento",
  "verificacion.wizard.readonly.selfie": "Selfie con documento",

  /* =================================================================
   * D.2 · /p/[slug] deep components
   * ================================================================= */

  /* BookingRequestModal */
  "booking.cta": "Reservar encuentro",
  "booking.modal.title": "Reservar con {name}",
  "booking.modal.subtitle":
    "Tu propuesta llega como solicitud; ella confirma fecha y detalles antes de cualquier pago.",
  "booking.modal.close": "Cerrar",
  "booking.modal.loading": "Cargando…",
  "booking.field.date": "Fecha y momento",
  "booking.field.date.help":
    "Solo se muestran los días con espacio en su agenda.",
  "booking.field.duration": "Duración",
  "booking.field.duration.overnight": "24 horas (overnight)",
  "booking.field.duration.hour.singular": "{n} hora",
  "booking.field.duration.hour.plural": "{n} horas",
  "booking.field.meetingType": "Tipo de encuentro",
  "booking.meetingType.outcall.label": "A domicilio",
  "booking.meetingType.outcall.help": "Ella va al lugar acordado",
  "booking.meetingType.incall.label": "En su lugar",
  "booking.meetingType.incall.help": "Tú vas al lugar de ella",
  "booking.meetingType.videocall.label": "Videollamada",
  "booking.meetingType.videocall.help": "100% remoto",
  "booking.field.contact": "¿Cómo prefieres que te contacte?",
  "booking.contact.whatsapp": "WhatsApp",
  "booking.contact.telegram": "Telegram",
  "booking.contact.platform": "Mensajería de Biringas",
  "booking.field.message": "Mensaje para ella",
  "booking.field.message.placeholder":
    "Contexto del encuentro. Mínimo {min} caracteres.",
  "booking.field.message.placeholderWithCity":
    "Contexto del encuentro (ej: {city}, hotel céntrico). Mínimo {min} caracteres.",
  "booking.privacy":
    "Tu identidad y contacto se comparten solo con {name}.",
  "booking.submit": "Enviar solicitud",
  "booking.submitting": "Enviando…",
  "booking.toast.title": "Solicitud enviada",
  "booking.toast.body":
    "{name} recibirá tu propuesta y confirmará pronto.",
  "booking.error.disabled":
    "El sistema de reservas estará disponible muy pronto.",
  "booking.error.default": "No pudimos enviar la solicitud.",
  "booking.anonymous.body":
    "Para enviar una solicitud de reserva, ingresa con tu cuenta — tu identidad nunca se publica y solo se comparte con ella tras la confirmación.",
  "booking.anonymous.cta": "Ingresar para reservar",
  "booking.anonymous.later": "Más tarde",

  /* RateBiringaForm */
  "rate.success.title": "Gracias por opinar",
  "rate.success.body.lead": "Calificaste a {name} con",
  "rate.success.body.trailing":
    ". Tu reseña ya forma parte de la comunidad verificada.",
  "rate.success.another": "Enviar otra opinión",
  "rate.anonymous.title": "¿Ya estuviste con {name}?",
  "rate.anonymous.body":
    "Ingresa con tu cuenta para dejar una calificación verificada. Tu identidad nunca se publica.",
  "rate.anonymous.cta": "Ingresar para opinar",
  "rate.form.title": "Califica a {name}",
  "rate.form.subtitle":
    "Tu opinión ayuda a otros clientes a elegir con confianza.",
  "rate.stars.aria": "Calificación de 1 a 5 estrellas",
  "rate.stars.singular": "{n} estrella",
  "rate.stars.plural": "{n} estrellas",
  "rate.field.experience": "Tu experiencia",
  "rate.field.experience.placeholder":
    "Cuéntanos cómo fue tu encuentro con {name}. Mínimo {min} caracteres.",
  "rate.field.city": "Ciudad del encuentro",
  "rate.field.city.placeholder": "Bogotá",
  "rate.field.alias": "Alias (opcional)",
  "rate.field.alias.placeholder": "Cliente verificado",
  "rate.cancel": "Cancelar",
  "rate.submit": "Publicar opinión",
  "rate.submitting": "Publicando…",
  "rate.error.noRating": "Elige una calificación de estrellas antes de enviar.",
  "rate.error.submit": "No pudimos publicar tu reseña. Intenta de nuevo.",

  /* ContactReveal */
  "contact.reveal.cta": "Revelar contacto",
  "contact.reveal.revealing": "Revelando…",
  "contact.reveal.ariaLabel": "Revelar contacto de {name}",
  "contact.reveal.previewLabel": "Canales privados",
  "contact.reveal.hint.authenticated":
    "Toca para mostrar los canales privados de este perfil.",
  "contact.reveal.hint.anonymous":
    "Inicia sesión para ver los canales privados de este perfil.",
  "contact.reveal.error": "No pudimos revelar el contacto. Intenta de nuevo.",
  "contact.reveal.empty":
    "Este perfil no tiene canales públicos disponibles ahora.",
  "contact.reveal.title": "Canales disponibles",
  "contact.reveal.footer":
    "Saluda con respeto. Toda interacción queda registrada.",
  "contact.reveal.whatsappGreeting": "Hola {name}, vi tu perfil en Biringas.",
  "contact.reveal.channel.whatsapp": "WhatsApp",
  "contact.reveal.channel.llamada": "Llamar",
  "contact.reveal.channel.telegram": "Telegram",

  /* ReviewsSection */
  "reviews.empty.kicker": "Opiniones",
  "reviews.empty.title": "Aún sin opiniones publicadas",
  "reviews.empty.body":
    "Cuando los clientes verificados dejen su experiencia con {name}, aparecerá aquí.",
  "reviews.kicker": "Opiniones · {count} reseñas",
  "reviews.title.lead": "Esto dicen quienes ya estuvieron con",
  "reviews.title.trailing": ".",
  "reviews.subtitle":
    "Calificaciones agregadas por aspecto, reseñas verificadas y reacciones anónimas. Sin nombres, sin contactos — sólo señal real de quienes ya pasaron por aquí.",
  "reviews.score.over": "sobre {count} opiniones",
  "reviews.score.recommend.lead": "El",
  "reviews.score.recommend.trailing": "recomienda este perfil.",
  "reviews.distribution.title": "Distribución",
  "reviews.distribution.basis":
    "Calculado sobre {count} reseñas verificadas.",
  "reviews.breakdown.title": "Calificación por aspecto",
  "reviews.criteria.trato": "Trato",
  "reviews.criteria.puntualidad": "Puntualidad",
  "reviews.criteria.conversacion": "Conversación",
  "reviews.criteria.presentacion": "Presentación",
  "reviews.criteria.discrecion": "Discreción",
  "reviews.reactions.title": "Reacciones anónimas",
  "reviews.reactions.hint": "Sin nombre, sin contacto. Sólo señal de la comunidad.",
  "reviews.reactions.like": "Me gusta",
  "reviews.reactions.dislike": "No me gusta",
  "reviews.reactions.positiveRate": "{pct}% de reacciones positivas",
  "reviews.filter.aria": "Filtrar opiniones",
  "reviews.filter.all": "Todas",
  "reviews.filter.recent": "Recientes",
  "reviews.filter.five": "5 estrellas",
  "reviews.filter.critical": "Críticas",
  "reviews.filter.verified": "Verificadas",
  "reviews.empty.filter.lead":
    "Sin opiniones bajo este filtro todavía. Probá con",
  "reviews.empty.filter.allLabel": "Todas",
  "reviews.toggle.less": "Ver menos opiniones",
  "reviews.toggle.more": "Ver {count} opiniones",
  "reviews.card.verified": "verificado",
  "reviews.card.helpful": "Útil",
  "reviews.card.notHelpful": "No útil",
  "reviews.stars.aria": "Calificación {value} de 5",

  /* AvailabilityStrip */
  "availability.aria": "Disponibilidad semanal",
  "availability.title": "Disponibilidad",
  "availability.replies": "Responde en ~{min} min",
  "availability.state.available": "Disponible",
  "availability.state.ask": "Consultar",
  "availability.state.busy": "Ocupada",
  "availability.legend.aria": "Leyenda de disponibilidad",
  "availability.disclaimer":
    "Confirma siempre la disponibilidad antes de viajar — los horarios son orientativos.",
  "availability.day.sun": "Dom",
  "availability.day.mon": "Lun",
  "availability.day.tue": "Mar",
  "availability.day.wed": "Mié",
  "availability.day.thu": "Jue",
  "availability.day.fri": "Vie",
  "availability.day.sat": "Sáb",
  "availability.slot.morning": "Mañana",
  "availability.slot.afternoon": "Tarde",
  "availability.slot.evening": "Noche",

  /* ShareMenu */
  "share.cta": "Compartir",
  "share.preamble": "Mira este perfil en Biringas:",
  "share.nativeTitle": "{name} en Biringas",
  "share.nativeText": "Mira este perfil en Biringas: {name}",
  "share.option.whatsapp": "WhatsApp",
  "share.option.telegram": "Telegram",
  "share.option.copy": "Copiar enlace",
  "share.option.copied": "Copiado",

  /* ReportListingMenu */
  "report.trigger.aria": "Reportar perfil de {name}",
  "report.trigger.title": "Reportar perfil",
  "report.modal.close": "Cerrar",
  "report.modal.title": "Reportar a {name}",
  "report.modal.subtitle":
    "Tu reporte es confidencial. Revisamos cada caso.",
  "report.field.reason": "Motivo",
  "report.reason.fake_photos": "Fotos no coinciden",
  "report.reason.scam": "Sospecha de estafa",
  "report.reason.harassment": "Acoso o falta de respeto",
  "report.reason.minor_concern": "Preocupación por seguridad",
  "report.reason.underage": "Sospecha de menor de edad",
  "report.reason.spam": "Spam o duplicado",
  "report.reason.other": "Otro",
  "report.field.detail.required": "Detalle (requerido)",
  "report.field.detail.optional": "Detalle (opcional)",
  "report.field.detail.placeholder":
    "Describe lo que pasó. Cualquier detalle ayuda al equipo de revisión.",
  "report.cancel": "Cancelar",
  "report.submit": "Enviar reporte",
  "report.submitting": "Enviando…",
  "report.error.noReason": "Elige un motivo.",
  "report.error.default": "No pudimos enviar el reporte. Intenta de nuevo.",
  "report.toast.title": "Reporte recibido",
  "report.toast.body":
    "Nuestro equipo de seguridad lo revisará. Gracias por ayudarnos a mantener la comunidad confiable.",

  /* SimilarProfiles */
  "similarProfiles.kicker": "Sigue explorando",
  "similarProfiles.title": "Perfiles similares",
  "similarProfiles.aria": "Perfiles similares",

  /* RecentlyViewedStrip */
  "recentlyViewed.title": "Vistos recientemente",
  "recentlyViewed.clear": "Borrar historial",

  /* =================================================================
   * B.2 · /publicar wizard step contents
   * ================================================================= */

  "step.details.eyebrow": "Detalles de publicación",
  "step.details.title": "Lo que verán las personas",
  "step.details.description":
    "Estos datos aparecen en tu tarjeta del catálogo. Puedes editarlos en cualquier momento.",
  "step.details.field.displayName": "Nombre artístico",
  "step.details.field.displayName.placeholder": "Ej. Alma",
  "step.details.field.displayName.hint":
    "40 caracteres máximo. Es el nombre que verán los visitantes.",
  "step.details.field.age": "Edad",
  "step.details.field.age.placeholder": "18+",
  "step.details.field.age.hint":
    "Solo aceptamos perfiles mayores de 18.",
  "step.details.field.city": "Ciudad principal",
  "step.details.field.city.placeholder": "Selecciona una ciudad",
  "step.details.field.category": "Categoría",
  "step.details.field.category.placeholder": "Selecciona una categoría",
  "step.details.field.category.hint":
    "Determina dónde aparece tu perfil dentro del catálogo.",
  "step.details.category.prepagos": "Prepagos",
  "step.details.category.masajes": "Masajes",
  "step.details.category.videollamadas": "Videollamadas",
  "step.details.field.price": "Tarifa por hora (COP)",
  "step.details.field.price.placeholder": "200000",
  "step.details.field.price.hint":
    "Esta es la referencia pública. Puedes ofrecer paquetes en tu descripción.",
  "step.details.field.slug": "URL preferida",
  "step.details.field.slug.placeholder": "alma-medellin",
  "step.details.field.slug.hint":
    "Aparecerá como biringas.co/p/tu-url. Sin espacios, solo letras y guiones.",
  "step.details.field.phone": "Teléfono privado",
  "step.details.field.phone.placeholder": "+57 300 000 0000",
  "step.details.field.phone.hint":
    "Privado. Nunca se publica. Lo usamos para verificación y contacto entrante.",
  "step.details.attention.legend": "Atención a",
  "step.details.attention.hint":
    "Selecciona uno o varios. Visible en filtros del catálogo.",
  "step.details.contact.legend": "Canal de contacto",
  "step.details.contact.hint":
    "Por dónde aceptas que te contacten al desbloquear tu número.",

  /* StepAttributes */
  "step.attributes.eyebrow": "Características",
  "step.attributes.title": "Cómo te describirás físicamente",
  "step.attributes.description":
    "Estos datos se muestran como bloque de Características en tu perfil público y alimentan los filtros del catálogo. Elige la opción que más se acerque.",
  "step.attributes.country.label": "País",
  "step.attributes.country.hint": "Tu nacionalidad — aparece como filtro.",
  "step.attributes.ethnicity.label": "Etnia",
  "step.attributes.hair.label": "Cabello",
  "step.attributes.height.label": "Estatura",
  "step.attributes.body.label": "Cuerpo",
  "step.attributes.breastSize.label": "Tamaño de senos",
  "step.attributes.breastType.label": "Tipo de senos",
  "step.attributes.pubis.label": "Pubis",
  "step.attributes.pubis.hint":
    "Opcional para el catálogo público; usado solo en filtros de búsqueda.",
  "step.attributes.languages.legend": "Idiomas",
  "step.attributes.languages.hint":
    "Selecciona los idiomas en los que puedes atender. Opcional.",

  /* StepPublish */
  "step.publish.eyebrow": "Publicar",
  "step.publish.title.paid": "Elige tu plan y refuerzos de visibilidad",
  "step.publish.title.free": "Lanzamiento gratuito · revisa lo que viene",
  "step.publish.description.paid":
    "Esencial te deja arrancar. Destacada es lo que más eligen las modelos verificadas. Premium te deja siempre arriba.",
  "step.publish.description.free":
    "Estamos en lanzamiento — todos los perfiles aprobados se publican sin cobro. Los planes que ves abajo son lo que vendrá cuando activemos cobros; por ahora solo informativos.",
  "step.publish.freeBanner.title":
    "Publicación gratuita durante el lanzamiento",
  "step.publish.freeBanner.body":
    "Las modelos que se sumen ahora publican sin costo hasta que activemos los planes pagos. Cuando esto pase tendrás aviso anticipado y opción de elegir tu plan; entretanto, recibes todos los beneficios base.",
  "step.publish.billing.aria": "Frecuencia de pago",
  "step.publish.billing.monthly.label": "Mensual",
  "step.publish.billing.monthly.sublabel": "Cancela cuando quieras",
  "step.publish.billing.quarterly.label": "Trimestral",
  "step.publish.billing.quarterly.sublabel": "Hasta 20% de ahorro",
  "step.publish.pkg.recommended": "Recomendado",
  "step.publish.pkg.comingSoon": "Próximamente",
  "step.publish.pkg.perMonth": "/ mes",
  "step.publish.pkg.quarterly":
    "{total} cada 3 meses · {pct}% de ahorro",
  "step.publish.addons.title": "Refuerzos opcionales (pago único)",
  "step.publish.addons.hint.enabled":
    "Aumentan tu visibilidad temporalmente",
  "step.publish.addons.hint.disabled":
    "Disponibles cuando activemos los planes",
  "step.publish.addons.family.boost": "Visibilidad",
  "step.publish.addons.family.content": "Contenido / SEO",
  "step.publish.terms.legend": "Antes de publicar",
  "step.publish.terms.adult":
    "Confirmo que soy mayor de 18 años y tengo autorización sobre cada foto que subo.",
  "step.publish.terms.terms":
    "Acepto los Términos de Publicación y la Política de Privacidad. Mi número privado no aparece en mi perfil público.",

  /* StepDescription */
  "step.description.eyebrow": "Tu historia",
  "step.description.title": "Lo que leerán y verán los visitantes",
  "step.description.description":
    "Una descripción honesta y unas buenas fotos triplican la respuesta. Tómate el tiempo aquí.",
  "step.description.shortBio.label": "Descripción corta",
  "step.description.shortBio.placeholder":
    "Una frase que te describa. Aparece debajo de tu foto principal.",
  "step.description.shortBio.hint": "{count} / 120 caracteres",
  "step.description.bio.label": "Sobre ti",
  "step.description.bio.placeholder":
    "Cuenta quién eres, qué disfrutas, cómo es la experiencia contigo. Sin información de contacto — la añadimos en el siguiente paso.",
  "step.description.bio.hint":
    "{count} / 1200 caracteres · evita números de teléfono y enlaces externos.",
  "step.description.services.legend": "Servicios incluidos",
  "step.description.services.hint":
    "Selecciona los servicios que ofreces. Aparecen como chips en tu perfil y se conectan con los filtros del catálogo.",
  "step.description.places.legend": "Lugar de encuentro",
  "step.description.places.hint":
    "Dónde aceptas reunirte. Mostrado como filtro de búsqueda.",
  "step.description.toggle.faceVisible.label": "Cara visible",
  "step.description.toggle.faceVisible.body":
    "Indica que muestras el rostro en al menos una foto.",
  "step.description.toggle.paymentByCard.label": "Pago con tarjeta",
  "step.description.toggle.paymentByCard.body":
    "Tu perfil aparece en el filtro de tarjetas aceptadas.",
  "step.description.toggle.availableNow.label": "Disponible ahora",
  "step.description.toggle.availableNow.body":
    "Activa esto cuando estés disponible — aparece como urgente.",
  "step.description.gallery.title": "Galería de fotos",
  "step.description.gallery.counter": "{count} / {max}",
  "step.description.gallery.uploading": "· {count} subiendo",
  "step.description.gallery.helper":
    "Acepta JPG, PNG, WebP o HEIC. Tus metadatos personales nunca se comparten.",
  "step.description.gallery.add.aria": "Agregar foto",
  "step.description.gallery.add.label": "Subir foto",
  "step.description.gallery.retryTooltip": "Reintentar subida",
  "step.description.gallery.removeTooltip": "Quitar {name}",
  "step.description.videos.title": "Videos cortos (opcional)",
  "step.description.videos.counter": "{count} / 2",
  "step.description.videos.uploading": "· {count} subiendo",
  "step.description.videos.helper":
    "Hasta 2 clips de 3 a 30 segundos. MP4 o WebM, máximo 35 MB cada uno. Subilos como los grabaste — no comprimimos en el navegador.",
  "step.description.videos.add.aria": "Agregar video",
  "step.description.videos.add.label": "Subir video",

  /* C.2 · FiltersPanel deep section labels */
  "filters.section.priceAge.title": "Precio y edad",
  "filters.section.priceAge.eyebrow":
    "Refina por presupuesto y franja de edad.",
  "filters.priceLabel": "Precio (COP / hora)",
  "filters.preset.price.cheap": "Baratas",
  "filters.preset.price.standard": "Estándar",
  "filters.preset.price.luxury": "De lujo",
  "filters.ageLabel": "Edad",
  "filters.preset.age.young": "Jovencitas",
  "filters.preset.age.twenties": "20s",
  "filters.preset.age.mature": "Maduras",
  "filters.chip.card": "Pago con tarjeta",
  "filters.section.attentionContact.title": "Atención y contacto",
  "filters.section.attentionContact.eyebrow":
    "A quién atiende y cómo prefiere que la contacten.",
  "filters.field.attention": "Atención a",
  "filters.field.contact": "Canal de contacto",
  "filters.section.meeting.title": "Lugar de encuentro",
  "filters.section.meeting.eyebrow": "Dónde se da la cita.",
  "filters.section.services.title": "Servicios",
  "filters.section.services.eyebrow":
    "Lo que ofrece — generales y especiales.",
  "filters.field.servicesGeneral": "Servicios generales",
  "filters.field.servicesSpecial": "Servicios especiales",
  "filters.section.content.title": "Contenido",
  "filters.section.content.eyebrow":
    "Verificación, vídeo, audio y reseñas reales.",
  "filters.flag.verified": "Fotos verificadas",
  "filters.flag.face": "Cara visible",
  "filters.flag.video": "Con vídeos",
  "filters.flag.audio": "Con audio",
  "filters.flag.reviews": "Con experiencias",
  "filters.flag.now": "Disponible ahora",
  "filters.section.appearance.title": "Apariencia",
  "filters.section.appearance.eyebrow":
    "Atributos físicos: país, etnia, cuerpo.",
  "filters.appearance.country": "País",
  "filters.appearance.ethnicity": "Etnia",
  "filters.appearance.hair": "Pelo",
  "filters.appearance.height": "Estatura",
  "filters.appearance.body": "Cuerpo",
  "filters.appearance.breastSize": "Tamaño de pecho",
  "filters.appearance.breastType": "Tipo de pecho",
  "filters.appearance.pubis": "Pubis",
  "filters.section.clearAria": "Limpiar sección",

  /* =================================================================
   * F.3 · polish sweep
   * ================================================================= */

  /* ---------- brand (used by the legacy `Hero` component) ---------- */
  "brand.slogan": "Consigue lo que quieres en el momento que quieres",
  "brand.homeHeroTitle": "Biringas",
  "brand.homeHeroSubtitle": "Consigue lo que quieres en el momento que quieres",
  "brand.primaryCta": "Explorar Biringas",
  "brand.secondaryCta": "Cómo funciona",
  "brand.hero.eyebrow": "Marketplace de acompañamiento · Colombia",
  "brand.hero.trust.verified": "Perfiles verificados",
  "brand.hero.trust.cities": "Cobertura en 5 ciudades",
  "brand.hero.trust.adults": "Sólo mayores de 18",
  "brand.hero.title.aria": "Título de bienvenida",

  /* ---------- EditorialHero (catalog magazine cover) ---------- */
  "editorialHero.kicker.default": "Acompañantes verificadas · Colombia",
  "editorialHero.rail.brand": "Biringas · Colombia · 2026",
  "editorialHero.live.online": "en línea",
  "editorialHero.headline.line1": "Encuentra a",
  "editorialHero.headline.highlight": "tu Biringa",
  "editorialHero.headline.line3": "ideal",
  "editorialHero.stats.verifiedSuffix": "acompañantes verificadas, activas hoy en",
  "editorialHero.stats.cities": "6 ciudades",
  "editorialHero.search.aria": "Buscar Biringas",
  "editorialHero.search.cityLabel": "Ciudad",
  "editorialHero.search.queryLabel": "Buscar",
  "editorialHero.search.queryPlaceholder": "Nombre, plan, servicio…",
  "editorialHero.search.submit": "Buscar",
  "editorialHero.trust.aria": "Garantías",
  "editorialHero.trust.verification": "Verificación humana",
  "editorialHero.trust.payment": "Pago discreto",
  "editorialHero.trust.noBots": "Sin bots ni catfish",
  "editorialHero.mosaicMobile.aria": "Selección editorial de Biringas",
  "editorialHero.marquee.aria": "Ver {label}",
  "editorialHero.chip.availableNow": "Disponibles ahora",
  "editorialHero.chip.dinnerBogota": "Cena Bogotá",
  "editorialHero.chip.weekendCartagena": "Fin de semana Cartagena",
  "editorialHero.chip.topRated": "Top rated",
  "editorialHero.marquee.bogota": "Bogotá · 142 activas",
  "editorialHero.marquee.medellin": "Medellín · 88 activas",
  "editorialHero.marquee.cartagena": "Cartagena · 41 activas",
  "editorialHero.marquee.cali": "Cali · 37 activas",
  "editorialHero.marquee.liveCheck": "Verificación en vivo",
  "editorialHero.marquee.realReviews": "Reseñas reales",
  "editorialHero.marquee.noBots": "Sin bots, sin catfish",
  "editorialHero.marquee.discreetPayment": "Pago discreto disponible",
  "editorialHero.marquee.barranquilla": "Barranquilla · 24 activas",
  "editorialHero.marquee.videocall": "Videollamada disponible",

  /* ---------- HeroCitySelect ---------- */
  "heroCitySelect.label": "Ciudad",
  "heroCitySelect.helper": "Elige ciudad",
  "heroCitySelect.cities.all": "Toda Colombia",
  "heroCitySelect.cities.bogota": "Bogotá",
  "heroCitySelect.cities.medellin": "Medellín",
  "heroCitySelect.cities.cartagena": "Cartagena",
  "heroCitySelect.cities.cali": "Cali",
  "heroCitySelect.cities.barranquilla": "Barranquilla",
  "heroCitySelect.cities.bucaramanga": "Bucaramanga",

  /* ---------- HeroMosaicCard ---------- */
  "heroMosaicCard.online": "En línea",
  "heroMosaicCard.verified.aria": "Verificada",
  "heroMosaicCard.rating.aria": "Calificación {score} estrellas",
  "heroMosaicCard.link.aria": "{name}, {age}, {city} — ver perfil",

  /* ---------- LuckyButton ---------- */
  "luckyButton.label": "Me siento con suerte",
  "luckyButton.aria": "Me siento con suerte — abrir un perfil aleatorio",

  /* ---------- BookingDatePicker ---------- */
  "bookingDatePicker.day.aria.label": "{day} {date} de {month}",
  "bookingDatePicker.day.aria.unavailable": " — sin disponibilidad",
  "bookingDatePicker.day.today": "Hoy",
  "bookingDatePicker.day.aria.groupLabel": "Día propuesto",
  "bookingDatePicker.slot.aria.groupLabel": "Momento del día",
  "bookingDatePicker.slot.eyebrow": "Momento",
  "bookingDatePicker.slot.morning": "Mañana",
  "bookingDatePicker.slot.afternoon": "Tarde",
  "bookingDatePicker.slot.evening": "Noche",
  "bookingDatePicker.slot.byRequest": "por consulta",
  "bookingDatePicker.slot.title.unavailable": "Sin disponibilidad para este momento",
  "bookingDatePicker.slot.title.byRequest": "Disponible por consulta",
  "bookingDatePicker.slot.title.available": "Disponible",
  "bookingDatePicker.day.sun": "Dom",
  "bookingDatePicker.day.mon": "Lun",
  "bookingDatePicker.day.tue": "Mar",
  "bookingDatePicker.day.wed": "Mié",
  "bookingDatePicker.day.thu": "Jue",
  "bookingDatePicker.day.fri": "Vie",
  "bookingDatePicker.day.sat": "Sáb",
  "bookingDatePicker.month.jan": "ene",
  "bookingDatePicker.month.feb": "feb",
  "bookingDatePicker.month.mar": "mar",
  "bookingDatePicker.month.apr": "abr",
  "bookingDatePicker.month.may": "may",
  "bookingDatePicker.month.jun": "jun",
  "bookingDatePicker.month.jul": "jul",
  "bookingDatePicker.month.aug": "ago",
  "bookingDatePicker.month.sep": "sep",
  "bookingDatePicker.month.oct": "oct",
  "bookingDatePicker.month.nov": "nov",
  "bookingDatePicker.month.dec": "dic",

  /* ---------- VideoPlayer ---------- */
  "videoPlayer.unavailable.aria": "Video no disponible",
  "videoPlayer.unavailable.label": "Video no disponible",

  /* ---------- CardStackGallery ---------- */
  "cardStackGallery.role": "galería",
  "cardStackGallery.bringToFront.aria": "Traer imagen {index} al frente",
  "cardStackGallery.image.alt": "{base} — imagen {index}",
  "cardStackGallery.prev.aria": "Imagen anterior",
  "cardStackGallery.next.aria": "Imagen siguiente",
  "cardStackGallery.tablist.aria": "Seleccionar imagen",
  "cardStackGallery.tab.aria": "Imagen {index}",
  "cardStackGallery.indicator": "Foto {index} de {total}",

  /* ---------- PremiumContentGrid ---------- */
  "premium.eyebrow": "Contenido premium",
  "premium.title.lead": "Lo que",
  "premium.title.trailing": "guarda para sus suscriptores.",
  "premium.subtitle.lead":
    "Fotos sin filtro, video privado y audios pensados para ti.",
  "premium.subtitle.emphasis": "Sin pago en el chat, sin sorpresas.",
  "premium.tier.label": "Premium",
  "premium.tier.from": "Desde",
  "premium.tier.perMonth": "/ mes",
  "premium.kind.photo": "Set fotográfico",
  "premium.kind.video": "Video privado",
  "premium.kind.audio": "Audio íntimo",
  "premium.tile.subscribe": "Suscríbete para ver",
  "premium.tile.aria": "Suscríbete a {name} para ver {title}",
  "premium.perks.aria": "Beneficios de la suscripción",
  "premium.perks.fresh": "Contenido nuevo cada semana",
  "premium.perks.chat": "Chat prioritario sin esperas",
  "premium.perks.cancel": "Cancela cuando quieras",
  "premium.post.photoTitle1": "Sesión cabaret · 18 fotos",
  "premium.post.photoTeaser1": "Editorial nocturna en hotel boutique. Inéditas para suscriptores.",
  "premium.post.photoMeta1": "18 fotos",
  "premium.post.videoTitle1": "Detrás de cámaras",
  "premium.post.videoTeaser1": "Cuatro minutos del set anterior. Sin filtros, sin doblaje.",
  "premium.post.videoMeta1": "4:12",
  "premium.post.audioTitle1": "Te susurro al oído",
  "premium.post.audioTeaser1": "Audio binaural. Úsalo con audífonos, despacio, con tiempo.",
  "premium.post.audioMeta1": "6 audios",
  "premium.post.photoTitle2": "Lencería boutique",
  "premium.post.photoTeaser2": "Marca colombiana. Tres conjuntos elegidos por mí.",
  "premium.post.photoMeta2": "24 fotos",
  "premium.post.videoTitle2": "Cita de ensueño · POV",
  "premium.post.videoTeaser2": "La cita perfecta narrada en primera persona. Solo Premium.",
  "premium.post.videoMeta2": "7:08",
  "premium.post.photoTitle3": "Lo que no ves en mi perfil",
  "premium.post.photoTeaser3": "Lo que el catálogo no muestra. Curado por mí, para ti.",
  "premium.post.photoMeta3": "12 fotos",

  /* ---------- CompareDrawer ---------- */
  "compareDrawer.backdrop.aria": "Cerrar comparación",
  "compareDrawer.dialog.aria": "Comparación lado a lado",
  "compareDrawer.eyebrow": "Modo Versus",
  "compareDrawer.count": "{current} de {total} en comparación",
  "compareDrawer.clear": "Limpiar",
  "compareDrawer.close.aria": "Cerrar comparación",
  "compareDrawer.quickAdd.label": "Agregar",
  "compareDrawer.quickAdd.title": "Agregar {name} a la comparación",
  "compareDrawer.empty.slot": "Slot {index}",
  "compareDrawer.remove.aria": "Quitar a {name}",
  "compareDrawer.footer.decide": "Decidir",
  "compareDrawer.footer.gotoProfile": "Ir al perfil",
  "compareDrawer.crown.aria": "Mejor en este aspecto",
  "compareDrawer.row.price": "Tarifa / hora",
  "compareDrawer.row.score": "Calificación",
  "compareDrawer.row.reviews": "Reseñas",
  "compareDrawer.row.verified": "Verificada",
  "compareDrawer.row.available": "Disponible",
  "compareDrawer.row.video": "Vídeo",
  "compareDrawer.row.audio": "Audio",
  "compareDrawer.row.languages": "Idiomas",
  "compareDrawer.row.services": "Servicios",
  "compareDrawer.value.yes": "Sí",
  "compareDrawer.value.no": "No",
  "compareDrawer.value.now": "Ahora",
  "compareDrawer.value.dash": "—",
  "compareDrawer.services.suffix": "en catálogo",
  "compareDrawer.score.outOf": "/5",

  /* ---------- Dashboard · BookingInboxList ---------- */
  "dashboard.inbox.status.pending": "Pendiente",
  "dashboard.inbox.status.confirmed": "Confirmada",
  "dashboard.inbox.status.declined": "Rechazada",
  "dashboard.inbox.status.cancelled": "Cancelada",
  "dashboard.inbox.status.completed": "Completada",
  "dashboard.inbox.meeting.outcall": "A domicilio",
  "dashboard.inbox.meeting.incall": "En su lugar",
  "dashboard.inbox.meeting.videocall": "Videollamada",
  "dashboard.inbox.contact.whatsapp": "WhatsApp",
  "dashboard.inbox.contact.telegram": "Telegram",
  "dashboard.inbox.contact.platform": "Mensajería Biringas",
  "dashboard.inbox.empty.title": "Aún sin solicitudes",
  "dashboard.inbox.empty.body":
    "Cuando alguien envíe una propuesta a tu perfil, vas a verla aquí con todos los detalles antes de aceptar o rechazar.",
  "dashboard.inbox.filter.aria": "Filtrar solicitudes",
  "dashboard.inbox.filter.all": "Todas",
  "dashboard.inbox.filter.pending": "Pendientes",
  "dashboard.inbox.filter.confirmed": "Confirmadas",
  "dashboard.inbox.filter.completed": "Completadas",
  "dashboard.inbox.filter.declined": "Rechazadas",
  "dashboard.inbox.noResults": "Sin resultados para este filtro.",
  "dashboard.inbox.toast.confirmed": "Reserva confirmada",
  "dashboard.inbox.toast.declined": "Reserva rechazada",
  "dashboard.inbox.toast.completed": "Reserva marcada como completada",
  "dashboard.inbox.toast.errorTitle": "No pudimos actualizar la reserva",
  "dashboard.inbox.toast.errorBody": "Intentá de nuevo en un momento.",
  "dashboard.inbox.received": "Recibida {when}",
  "dashboard.inbox.idHidden": "ID solicitante oculto hasta confirmar",
  "dashboard.inbox.duration": "{hours}h · {type}",
  "dashboard.inbox.action.decline": "Rechazar",
  "dashboard.inbox.action.confirm": "Confirmar",
  "dashboard.inbox.action.confirming": "Confirmando…",
  "dashboard.inbox.action.markCompleted": "Marcar como completada",

  /* ---------- Dashboard · ReferralCard ---------- */
  "dashboard.referral.eyebrow": "Programa de referidos",
  "dashboard.referral.title.lead": "Cada amigo que invitás vale",
  "dashboard.referral.title.suffix": "para ambos.",
  "dashboard.referral.body":
    "Compartí tu link. Cuando tu amigo cree una cuenta y use tu código, le acreditamos {reward} y vos sumás el mismo monto en crédito para impulsar tu perfil.",
  "dashboard.referral.codeLabel": "Tu código",
  "dashboard.referral.copy": "Copiar link",
  "dashboard.referral.copied": "Copiado",
  "dashboard.referral.share": "Compartir",
  "dashboard.referral.share.title": "Biringas",
  "dashboard.referral.share.text":
    "Te invito a Biringas — {reward} de crédito al registrarte con mi código.",
  "dashboard.referral.toast.copied": "Link copiado",
  "dashboard.referral.toast.copyError": "No pudimos copiar el link",
  "dashboard.referral.stats.invited": "Personas invitadas",
  "dashboard.referral.stats.credit": "Crédito acreditado",
  "dashboard.referral.redeem.title": "¿Tenés un código de invitación?",
  "dashboard.referral.redeem.body":
    "Redimilo una vez para sumar {reward} de crédito y acreditarle el mismo monto a quien te invitó.",
  "dashboard.referral.redeem.placeholder": "Ej: A4F9XK",
  "dashboard.referral.redeem.submit": "Redimir",
  "dashboard.referral.redeem.submitting": "Redimiendo…",
  "dashboard.referral.redeem.validation": "Ingresá un código válido.",
  "dashboard.referral.redeem.errorFallback": "No pudimos redimir el código.",
  "dashboard.referral.redeem.toastTitle": "Código redimido",
  "dashboard.referral.redeem.toastBody": "Acreditamos {amount} a tu cuenta.",
  "dashboard.referral.alreadyRedeemed":
    "Ya redimiste un código. Si querés sumar más crédito, invitá a tus amigos con tu propio link de arriba.",

  /* ---------- Dashboard · AvailabilityToggle ---------- */
  "dashboard.availability.aria": "Disponibilidad ahora",
  "dashboard.availability.available": "Disponible ahora",
  "dashboard.availability.paused": "Pausada",
  "dashboard.availability.toast.live": "Estás visible como disponible ahora.",
  "dashboard.availability.toast.paused":
    "Pausada — ya no aparecés como disponible ahora.",
  "dashboard.availability.toast.errorTitle":
    "No pudimos actualizar tu disponibilidad",
  "dashboard.availability.toast.errorBody": "Probá de nuevo en un momento.",

  /* =================================================================
   * Wave G · age gate + catalog primitives + dashboard inline rate
   * ================================================================= */

  /* ---------- Age gate ---------- */
  "ageGate.kicker": "Verificación de edad",
  "ageGate.title": "Sólo personas mayores de 18 años",
  "ageGate.body.prefix":
    "{brand} es un marketplace para mayores de edad. Al continuar declaras que tienes",
  "ageGate.body.emphasis": "18 años o más",
  "ageGate.body.suffix": "y aceptas ver contenido para adultos.",
  "ageGate.cta.confirm": "Tengo 18 años o más",
  "ageGate.cta.exit": "Salir del sitio",
  "ageGate.footer":
    "Si eres menor de edad, abandona este sitio. La acción guardará una cookie de un año en este dispositivo.",

  /* ---------- Catalog cards (BiringaCard + CatalogCard) ---------- */
  "catalog.card.viewListing": "Ver anuncio",
  "catalog.card.viewProfile": "Ver perfil",
  "catalog.card.featured": "Destacada",
  "catalog.card.availableNow": "Disponible ahora",
  "catalog.card.availableNowShort": "Ahora",
  "catalog.card.withVideo": "Con vídeo",
  "catalog.card.withAudio": "Con audio",
  "catalog.card.onlineNow": "En línea ahora",
  "catalog.card.activeNow": "Activa ahora",
  "catalog.card.respondsIn": "Responde ~{minutes}min",
  "catalog.card.verifiedProfile": "Perfil verificado",
  "catalog.card.verified": "Verificada",
  "catalog.card.audio": "Audio",
  "catalog.card.ageSuffix": "a.",
  "catalog.card.linkAria": "{name} en {city} — ver perfil",
  "catalog.card.imageAlt": "{name} en {city}",

  /* ---------- Quick presets row ---------- */
  "catalog.preset.section.aria": "Sugerencias rápidas",
  "catalog.preset.section.eyebrow": "Sugerencias",
  "catalog.preset.list.aria": "Filtros rápidos",
  "catalog.preset.availableNow": "Disponibles ahora",
  "catalog.preset.verified": "Verificadas",
  "catalog.preset.lowBudget": "Bajo $150k",
  "catalog.preset.faceVisible": "Cara visible",
  "catalog.preset.topRated": "Top calificadas",
  "catalog.preset.withVideo": "Con video",
  "catalog.preset.apply": "Aplicar preset: {label}",
  "catalog.preset.remove": "Quitar preset: {label}",

  /* ---------- Active filter chips strip ---------- */
  "catalog.filterChips.aria": "Filtros aplicados",
  "catalog.filterChips.remove": "Quitar filtro: {label}",
  "catalog.filterChips.clearAll": "Borrar todo",
  "catalog.filterChips.clearAll.aria": "Borrar todos los filtros",
  "catalog.filterChips.priceMin": "Mín. {amount}",
  "catalog.filterChips.priceMax": "Máx. {amount}",
  "catalog.filterChips.ageMin": "Edad ≥ {age}",
  "catalog.filterChips.ageMax": "Edad ≤ {age}",
  "catalog.filterChips.verified": "Verificadas",
  "catalog.filterChips.faceVisible": "Cara visible",
  "catalog.filterChips.withVideo": "Con vídeo",
  "catalog.filterChips.withAudio": "Con audio",
  "catalog.filterChips.withReviews": "Con experiencias",
  "catalog.filterChips.paymentByCard": "Pago con tarjeta",
  "catalog.filterChips.availableNow": "Disponible ahora",
  "catalog.filterChips.attention": "Atención: {value}",
  "catalog.filterChips.contact": "Contacto: {value}",

  /* ---------- Onboarding quiz ---------- */
  "onboarding.kicker": "Bienvenida",
  "onboarding.title.lead": "Encuentra tu Biringa en",
  "onboarding.title.highlight": "3 toques",
  "onboarding.skip": "Saltar",
  "onboarding.close": "Cerrar",
  "onboarding.step.indicator": "Paso {current} de {total}",
  "onboarding.step1.title": "¿En qué ciudad estás?",
  "onboarding.step1.subtitle":
    "Filtramos el catálogo para mostrarte sólo lo cercano.",
  "onboarding.step2.title": "¿Cuánto querés invertir por hora?",
  "onboarding.step2.subtitle":
    "Sólo nos ayuda a ordenar. Podés cambiarlo después.",
  "onboarding.step3.title": "¿Qué plan tenés en mente?",
  "onboarding.step3.subtitle":
    "Llevamos directo al catálogo con el filtro aplicado.",
  "onboarding.city.allColombia": "Toda Colombia",
  "onboarding.budget.none": "Sin presupuesto",
  "onboarding.budget.up200": "Hasta $200k",
  "onboarding.budget.up400": "Hasta $400k",
  "onboarding.budget.unlimited": "Sin tope",
  "onboarding.plan.live": "Algo para hoy",
  "onboarding.plan.social": "Cena / evento",
  "onboarding.plan.trip": "Fin de semana",
  "onboarding.plan.general": "Solo estoy mirando",

  /* ---------- Saved searches (Favoritas) ---------- */
  "savedSearches.title": "Búsquedas guardadas",
  "savedSearches.subtitle": "Vuelve a tu filtro perfecto con un clic.",
  "savedSearches.empty.lead":
    "Aún no guardaste búsquedas. Cuando apliques filtros en",
  "savedSearches.empty.buttonHint.lead": ", verás un botón ",
  "savedSearches.empty.buttonName": "Guardar búsqueda",
  "savedSearches.empty.buttonHint.trailing": ".",
  "savedSearches.savedOn": "Guardada {date}",
  "savedSearches.remove": "Quitar búsqueda {label}",

  /* ---------- Featured strip (home + aria) ---------- */
  "home.featured.aria": "Acompañantes destacadas",
  "home.featured.title.default": "Acompañantes verificadas para hoy",
  "home.featured.description.default":
    "Una selección curada por reputación, presencia y disponibilidad reciente.",

  /* ---------- Loading + toast primitives ---------- */
  "loading.catalog": "Cargando catálogo…",
  "toast.dismiss": "Descartar notificación",
  "toast.region.aria": "Notificaciones",

  /* ---------- Dashboard · inline rate buyer ---------- */
  "dashboard.rateBuyer.label": "Calificar al cliente",
  "dashboard.rateBuyer.scoreAria": "Calificación de 1 a 5 estrellas",
  "dashboard.rateBuyer.stars.singular": "{value} estrella",
  "dashboard.rateBuyer.stars.plural": "{value} estrellas",
  "dashboard.rateBuyer.commentPlaceholder":
    "Comentario privado (opcional). Lo lee sólo el equipo de moderación.",
  "dashboard.rateBuyer.cancel": "Cancelar",
  "dashboard.rateBuyer.submit": "Guardar",
  "dashboard.rateBuyer.submitting": "Guardando…",
  "dashboard.rateBuyer.toast.success": "Cliente calificado",
  "dashboard.rateBuyer.rated": "Calificado · {value}/5",
  "dashboard.rateBuyer.error.required": "Elige una calificación.",
  "dashboard.rateBuyer.error.bookingDisabled":
    "Las reseñas mutuas se activan cuando Firestore esté listo.",
  "dashboard.rateBuyer.error.fallback":
    "No pudimos guardar la calificación. Intentá de nuevo.",
};

const en: MessageDict = {
  /* ---------- Header / chrome ---------- */
  "header.nav.how": "How it works",
  "header.nav.favorites": "Favorites",
  "header.cta.publish": "Publish your profile",
  "header.cta.explore": "Explore",
  "header.signIn": "Sign in",
  "header.signOut": "Sign out",
  "header.myAccount": "My account",
  "header.aria.mainNav": "Main navigation",
  "header.aria.localeMenu": "Select a language",
  "header.aria.localeLabel": "Language: {label}",

  /* ---------- Footer ---------- */
  "footer.tagline": "Human verification. Real reviews. No bots.",
  "footer.section.product": "Product",
  "footer.section.legal": "Legal",
  "footer.section.access": "Access",
  "footer.section.cities": "Cities",
  "footer.link.explore": "Explore",
  "footer.link.howItWorks": "How it works",
  "footer.link.terms": "Terms & conditions",
  "footer.link.privacy": "Privacy policy",
  "footer.link.legalNotice": "Legal notice",
  "footer.access.adults": "Adults only (18+)",
  "footer.access.country": "Service limited to Colombia",
  "footer.badge.verified": "Verified profiles",
  "footer.badge.country": "Service in Colombia",
  "footer.copyright": "© {year} {brand}. All rights reserved.",
  "footer.adultPlatform": "Platform for adults only",

  /* ---------- Home: Hero ---------- */
  "hero.kicker.location": "Verified companions · Colombia",
  "hero.cta.search": "Search",
  "hero.field.city": "City",
  "hero.field.query": "Name, plan, service…",
  "hero.suggested": "Suggested",

  /* ---------- Home: How it works ---------- */
  "home.how.eyebrow": "How it works",
  "home.how.title.lead": "Three steps to find the",
  "home.how.title.highlight": "right companion",
  "home.how.subtitle.lead": "Booking is simple. First we go for trust —",
  "home.how.subtitle.emphasis": "verification, consent, transparency.",
  "home.how.step01.eyebrow": "Catalog",
  "home.how.step01.title": "Browse the catalog",
  "home.how.step01.description":
    "Filter by city, category or availability and review profiles with photos, languages and reviews.",
  "home.how.step02.eyebrow": "Trust",
  "home.how.step02.title": "Verify before choosing",
  "home.how.step02.description":
    "Every featured companion goes through an identity check and a documented image-consent review.",
  "home.how.step03.eyebrow": "Booking",
  "home.how.step03.title": "Book with zero friction",
  "home.how.step03.description":
    "Book directly from the profile with absolute discretion. In-app messaging and payment are coming very soon.",
  "home.how.step03.cta": "Browse the catalog",
  "home.how.privacy.title": "Your privacy comes first",
  "home.how.privacy.subtitle": "Discretion, safety and respect at every step.",
  "home.how.privacy.item.verified": "Verified profiles",
  "home.how.privacy.item.consent": "Documented consent",
  "home.how.privacy.item.confidential": "100% confidential",
  "home.how.privacy.aria": "Privacy guarantees",

  /* ---------- Home: CTA / page ---------- */
  "home.cta.exploreAll": "Browse the full catalog",
  "home.metadata.title":
    "Biringas — Get what you want, when you want it",
  "home.metadata.description":
    "Marketplace of verified Biringas in Colombia. Book companionship for events, trips and outings — authentic profiles, no bots or catfish.",

  /* ---------- Home: Featured strip ---------- */
  "home.featured.eyebrow": "Featured",
  "home.featured.title.lead": "Verified profiles that are",
  "home.featured.title.highlight": "converting",
  "home.featured.title.trailing": "this week",
  "home.featured.subtitle.lead":
    "Curated by reputation and review count —",
  "home.featured.subtitle.emphasis": "they only get in if they've earned it.",
  "home.featured.cta": "See the full catalog",
  "home.featured.empty": "Featured companions will appear here very soon.",

  /* ---------- Home: Testimonials ---------- */
  "home.testimonials.eyebrow": "What clients say",
  "home.testimonials.title.lead": "Real stories from people who already",
  "home.testimonials.title.highlight": "chose Biringas",
  "home.testimonials.subtitle":
    "Verified reviews, no marketing filters. Each quote links to the profile it talks about — so you can cross-check before booking.",
  "home.testimonials.aria": "Testimonials from verified clients",
  "home.testimonials.verified": "verified",
  "home.testimonials.aboutKicker": "About",
  "home.testimonials.cta": "See more stories in the catalog",
  "home.testimonials.stars.aria": "Rating {value} out of 5",

  /* =================================================================
   * Wave B · /publicar wizard
   * ================================================================= */

  "publicar.metadata.title": "Publish your profile — Biringas",
  "publicar.metadata.description":
    "Create your listing on Biringas: details, description and publication plan. Human verification before going live in the catalog.",
  "publicar.back": "Back to the catalog",
  "publicar.title": "Publish your profile on Biringas",
  "publicar.subtitle":
    "Three steps. Ten minutes. Your profile goes live in the catalog after a quick verification — and starts receiving contacts the same week.",
  "publicar.badge.verification": "Human verification",

  /* Stepper */
  "publicar.stepper.aria": "Publication progress",
  "publicar.stepper.stepLabel": "Step {number}",
  "publicar.steps.details.title": "Details",
  "publicar.steps.details.description":
    "Public and private data about your profile.",
  "publicar.steps.description.title": "Description",
  "publicar.steps.description.description": "What people will see and read.",
  "publicar.steps.attributes.title": "Attributes",
  "publicar.steps.attributes.description":
    "Ethnicity, hair, height, body type, country and languages.",
  "publicar.steps.publish.title": "Publish",
  "publicar.steps.publish.description":
    "Plan, boosts and publishing.",

  /* Tips */
  "publicar.tip.default": "Useful tip",
  "publicar.tip.details.title": "Tip — Details",
  "publicar.tip.details.body":
    "Models who use their real stage name, accurate age and a single city get 38% more clicks. The preferred URL is also SEO: use name + city.",
  "publicar.tip.description.title": "Tip — Description",
  "publicar.tip.description.body":
    "Honest first-person descriptions convert 2.5× more. Avoid phone numbers or external links in the text — we flag them as spam and block your post.",
  "publicar.tip.attributes.title": "Tip — Attributes",
  "publicar.tip.attributes.body":
    "These tags show up in the «Attributes» block of your profile and are the catalog's most-used filters. Be honest — matching what you say with what shows in your photos raises conversion.",
  "publicar.tip.publish.title": "Tip — Plan",
  "publicar.tip.publish.body":
    "The Featured plan is the most-picked among verified models: it includes catalog boost, badge and daily stories. If you have high competition in your city, add a 24h city Boost.",

  /* NavBar */
  "publicar.nav.back": "Back",
  "publicar.nav.continue": "Save and continue",
  "publicar.nav.publishing": "Publishing…",
  "publicar.nav.publishFree": "Publish free",
  "publicar.nav.publishPaid": "Publish and pay {total}",
  "publicar.nav.publish": "Publish",

  /* Progress rail */
  "publicar.rail.kicker": "Your listing · draft",
  "publicar.rail.row.name": "Name",
  "publicar.rail.row.city": "City",
  "publicar.rail.row.category": "Category",
  "publicar.rail.row.rate": "Hourly rate",
  "publicar.rail.row.services": "Services",
  "publicar.rail.row.gallery": "Gallery",
  "publicar.rail.row.servicesCount": "{count} chosen",
  "publicar.rail.row.galleryCount": "{count} photos",
  "publicar.rail.row.empty": "—",
  "publicar.rail.note":
    "On the final step you choose your visibility plan. Every profile goes through human review before appearing in the catalog.",
  "publicar.rail.currentStep": "Current step: {step}",

  /* Validation messages */
  "publicar.validation.displayName": "Tell us your stage name.",
  "publicar.validation.age": "Minimum age allowed is 18.",
  "publicar.validation.city": "Pick your main city.",
  "publicar.validation.category": "Pick a category.",
  "publicar.validation.pricePerHour": "Set a valid hourly rate.",
  "publicar.validation.preferredSlug": "Define a preferred URL.",
  "publicar.validation.phone":
    "We need a private phone number for verification.",
  "publicar.validation.contactChannels":
    "Pick at least one contact channel.",
  "publicar.validation.shortBio": "Write a short description.",
  "publicar.validation.bioUrl":
    "Text cannot include links or URLs.",
  "publicar.validation.bioLength":
    "The long description must have at least 60 characters.",
  "publicar.validation.services":
    "Pick at least one included service.",
  "publicar.validation.galleryInFlight":
    "Wait for the photos to finish uploading before continuing.",
  "publicar.validation.galleryErrored":
    "Retry the photos with errors or remove them to continue.",
  "publicar.validation.videosInFlight":
    "Wait for the videos to finish uploading before continuing.",
  "publicar.validation.videosErrored":
    "Retry the videos with errors or remove them to continue.",
  "publicar.validation.country": "Pick your country.",
  "publicar.validation.ethnicity":
    "Pick the ethnicity that best describes you.",
  "publicar.validation.hair": "Pick your hair type.",
  "publicar.validation.height": "Pick your height.",
  "publicar.validation.body": "Pick your body type.",
  "publicar.validation.breastSize": "Pick a breast size.",
  "publicar.validation.breastType": "Pick a breast type (natural or implants).",
  "publicar.validation.adultConsent":
    "Confirm you are 18+ and have authorization over your photos.",
  "publicar.validation.acceptTerms": "Accept the terms to publish.",

  /* Submitted screen */
  "publicar.submitted.title": "We received your listing",
  "publicar.submitted.description":
    "We're verifying your identity and image consent. This usually takes between 4 and 24 hours. When it's ready we'll let you know on WhatsApp and your profile activates automatically.",
  "publicar.submitted.plan": "Plan",
  "publicar.submitted.mode": "Mode",
  "publicar.submitted.freeLaunch": "Free launch",
  "publicar.submitted.photosSent": "Photos uploaded",
  "publicar.submitted.total": "Total",
  "publicar.submitted.totalFree": "Free",
  "publicar.submitted.urlSoon": "Future URL",
  "publicar.submitted.verifyBanner.lead":
    "Before your profile goes live",
  "publicar.submitted.verifyBanner.body":
    "we need to verify your identity. It takes 5 minutes: ID (front + back) + selfie holding it. Without this, your listing won't be approved.",
  "publicar.submitted.cta.verify": "Verify identity now",
  "publicar.submitted.cta.later": "Later",

  /* Order summary */
  "publicar.order.kicker": "Summary",
  "publicar.order.plan": "Plan {name}",
  "publicar.order.cycle.monthly": "month",
  "publicar.order.cycle.quarterly": "quarter",
  "publicar.order.cycle.month.singular": "month",
  "publicar.order.cycle.month.plural": "months",
  "publicar.order.cycleNote": "{months} {monthLabel} · billed per {cycle}",
  "publicar.order.addOnHint": "one-time payment",
  "publicar.order.noAddOns": "No boosts selected.",
  "publicar.order.totalNow": "Total now",
  "publicar.order.effectivePerMonth":
    "{amount} effective / month for the plan",
  "publicar.order.reassure.cancel":
    "Cancel anytime before the next cycle.",
  "publicar.order.reassure.support":
    "Human support · reply within 24h.",
  "publicar.order.reassure.privacy": "Private data is never published.",
  "publicar.order.free.launchPill": "Launch",
  "publicar.order.free.title": "Publishing at no cost",
  "publicar.order.free.body":
    "You're taking advantage of the launch period. Your profile goes through human review and is published if it passes, with no plan charge.",
  "publicar.order.free.note":
    "We'll let you know in advance before paid plans are turned on.",
  "publicar.order.free.reassure.review":
    "Human review between 4 and 24 hours.",
  "publicar.order.free.reassure.edit": "Edit your profile anytime.",

  /* =================================================================
   * Wave B · /publicar/planes
   * ================================================================= */

  "planes.metadata.title": "Plans for companions — Biringas",
  "planes.metadata.description":
    "Three plans for verified companions on Biringas: Essential (free), Boost and Elite. More visibility, better conversion, no shady algorithms.",
  "planes.kicker": "Plans for companions",
  "planes.title.lead": "No shady algorithms.",
  "planes.title.highlight": "No booking commission.",
  "planes.subtitle":
    "Pick the plan, pay what's fair, keep everything you earn. Three tiers depending on how much you want to grow.",
  "planes.footnote":
    "Prices in Colombian pesos. Taxes included. No lock-in contracts.",

  "planes.essential.name": "Essential",
  "planes.essential.tagline":
    "Start with a verified profile — at no cost.",
  "planes.essential.priceLabel": "Free",
  "planes.essential.priceSubtitle": "Forever",
  "planes.essential.cta": "Publish for free",
  "planes.essential.feature.verified": "Verified profile (2 layers)",
  "planes.essential.feature.photos": "Up to 6 photos",
  "planes.essential.feature.messaging":
    "Messaging + WhatsApp/Telegram",
  "planes.essential.feature.reviews": "Real client reviews",
  "planes.essential.feature.catalog": "Appear in /explorar",
  "planes.essential.feature.heroSlot": "Slot in the editorial hero",
  "planes.essential.feature.topBadge": "«Top rated» badge",
  "planes.essential.feature.support": "Priority support",

  "planes.boost.badge": "Recommended",
  "planes.boost.name": "Boost",
  "planes.boost.tagline":
    "Show up at the top of searches and triple your visits.",
  "planes.boost.priceLabel": "$89.000",
  "planes.boost.priceSubtitle": "/month · cancel anytime",
  "planes.boost.cta": "Activate Boost",
  "planes.boost.feature.allEssential": "Everything in Essential",
  "planes.boost.feature.photos": "Up to 15 photos",
  "planes.boost.feature.ranking": "High ranking in search",
  "planes.boost.feature.topFilter": "«Top rated» filter by default",
  "planes.boost.feature.topBadge": "«Top rated» badge",
  "planes.boost.feature.stories": "Unlimited stories",
  "planes.boost.feature.heroSlot": "Slot in the editorial hero",
  "planes.boost.feature.support": "Priority support",

  "planes.elite.badge": "By invitation",
  "planes.elite.name": "Elite",
  "planes.elite.tagline":
    "Fixed slot in the editorial hero + dedicated support.",
  "planes.elite.priceLabel": "$249.000",
  "planes.elite.priceSubtitle": "/month · limited seats",
  "planes.elite.cta": "Request an invite",
  "planes.elite.feature.allBoost": "Everything in Boost",
  "planes.elite.feature.photos":
    "Unlimited photos + video reel",
  "planes.elite.feature.heroSlot":
    "Rotating slot in the editorial hero",
  "planes.elite.feature.testimonials":
    "Appearance in curated testimonials",
  "planes.elite.feature.analytics":
    "Advanced analytics (views / conversion)",
  "planes.elite.feature.support":
    "Priority WhatsApp support",
  "planes.elite.feature.photoshoot":
    "Professional photoshoot (1× / year)",
  "planes.elite.feature.advisor":
    "Account managed by an advisor",

  "planes.faq.title": "Frequently asked questions.",
  "planes.faq.q1.q": "Can I change plans at any time?",
  "planes.faq.q1.a":
    "Yes. The change applies to the next cycle and unused days are credited automatically.",
  "planes.faq.q2.q": "Do you charge a booking commission?",
  "planes.faq.q2.a":
    "No. You pay a monthly plan and keep 100% of what your clients pay you.",
  "planes.faq.q3.q": "What if it doesn't work for me?",
  "planes.faq.q3.a":
    "Cancel with one click and your profile stays on Essential. No penalties, no lock-in.",
  "planes.faq.q4.q": "Do you accept transfer / Nequi / Daviplata?",
  "planes.faq.q4.a":
    "Yes, plus card. Billing is 100% discreet — the statement entry reads as «Digital services».",

  /* =================================================================
   * Wave B · /publicar/planes/[tier]/checkout
   * ================================================================= */

  "checkout.metadata.title": "Activate {plan} plan — Biringas",
  "checkout.metadata.titleInvalid": "Plan not found — Biringas",
  "checkout.metadata.description":
    "Confirm the cycle and complete the payment to activate the plan on your profile.",
  "checkout.kicker": "Checkout",
  "checkout.title.lead": "Activate plan",
  "checkout.subtitle":
    "No contracts. We charge on confirm and notify you before each renewal.",

  "checkout.tierLabel.boost": "Boost",
  "checkout.tierLabel.elite": "Elite",

  "checkout.review.title": "Confirm your plan",
  "checkout.review.subtitle":
    "No lock-in. You can cancel from your dashboard anytime.",
  "checkout.billing.legend": "Billing cycle",
  "checkout.billing.monthly.label": "Monthly",
  "checkout.billing.monthly.subtitle": "Charged month by month",
  "checkout.billing.quarterly.label": "Quarterly (15% off)",
  "checkout.billing.quarterly.subtitle":
    "Equivalent to {perMonth} / month",
  "checkout.payButton": "Pay {amount}",
  "checkout.simulationNote.lead": "Simulation:",
  "checkout.simulationNote.body":
    "real card / MercadoPago payment turns on when we hook up the provider. For now you can try the end-to-end flow.",
  "checkout.paying.title": "Processing secure payment…",
  "checkout.paying.subtitle":
    "Don't close this window. We confirm in a few seconds.",
  "checkout.done.titleLead": "Plan",
  "checkout.done.titleTrailing": "activated.",
  "checkout.done.body":
    "We sent a receipt to the email on file. The plan benefits show up on your profile within the next 5 minutes.",
  "checkout.done.goToPanel": "Go to dashboard",
  "checkout.done.activateAnother": "Activate another plan",
  "checkout.backToPlans": "Back to plans",

  "checkout.summary.kicker": "Summary",
  "checkout.summary.plan": "{name} plan",
  "checkout.summary.description.boost":
    "High ranking in search, «Top rated» badge and unlimited stories.",
  "checkout.summary.description.elite":
    "Rotating slot in the editorial hero, appearance in curated testimonials, analytics and WhatsApp support.",
  "checkout.summary.row.cycle": "Cycle",
  "checkout.summary.row.plan": "Plan",
  "checkout.summary.row.total": "Total to charge",
  "checkout.summary.discreet.title": "Discreet payment",
  "checkout.summary.discreet.body.lead":
    "The label that appears on your statement is",
  "checkout.summary.discreet.body.product": "Digital services",
  "checkout.summary.discreet.body.trailing":
    "— never the platform's name.",

  "checkout.toast.success.title": "Payment confirmed",
  "checkout.toast.success.body":
    "{plan} plan active. We'll let you know when it renews.",
  "checkout.error.disabled":
    "Real payments turn on when we hook up the provider. For now the simulation is recorded on your account.",
  "checkout.error.create": "We couldn't create the session.",
  "checkout.error.complete": "The payment couldn't be completed.",

  /* =================================================================
   * Wave C · /explorar
   * ================================================================= */

  "explorar.metadata.title": "Explore Biringas — Companion catalog",
  "explorar.metadata.description":
    "Catalog of verified Biringas in Colombia. Filter by city, category (escorts · massages · video calls), price, age and availability.",
  "explorar.kicker": "Catalog",
  "explorar.title.lead": "Explore",
  "explorar.title.highlight": "Biringas",
  "explorar.subtitle.lead":
    "Filter by city, category and availability. Verified profiles only —",
  "explorar.subtitle.emphasis": "no bots, no catfish.",
  "explorar.savedSearch.default": "Custom search",
  "explorar.savedSearch.button": "Save search",

  /* Toolbar */
  "explorar.toolbar.cityAll": "All of Colombia",
  "explorar.toolbar.count":
    "{shown} {totalSuffix} {brand}",
  "explorar.toolbar.totalSuffix": "of {total}",
  "explorar.toolbar.entityLabel": "biringas",
  "explorar.toolbar.clear.singular": "Clear {count} filter",
  "explorar.toolbar.clear.plural": "Clear {count} filters",
  "explorar.toolbar.activeLabel": "Active",

  /* Sort menu */
  "explorar.sort.label": "Sort",
  "explorar.sort.relevance": "Most relevant",
  "explorar.sort.newest": "Newest",
  "explorar.sort.rating": "Highest rated",
  "explorar.sort.priceAsc": "Price: low to high",
  "explorar.sort.priceDesc": "Price: high to low",

  /* Category bar */
  "explorar.categoryBar.aria": "Categories",
  "explorar.categoryBar.all": "All",

  /* Search bar */
  "explorar.search.placeholder": "Search by name, city or service…",
  "explorar.search.label": "Search",
  "explorar.search.clear": "Clear search",

  /* Quick presets */
  "explorar.presets.title": "Quick shortcuts",
  "explorar.presets.availableNow": "Available now",
  "explorar.presets.topRated": "Top rated",
  "explorar.presets.withVideo": "With video",
  "explorar.presets.verifiedOnly": "Verified only",

  /* Catalog grid */
  "explorar.grid.empty.title": "No profiles match these filters",
  "explorar.grid.empty.body":
    "Remove one or two filters to widen results, or browse the full catalog.",
  "explorar.grid.empty.cta": "See the full catalog",
  "explorar.grid.loading": "Loading profiles…",
  "explorar.grid.loadMore": "Load more",
  "explorar.grid.endOfResults": "You've reached the end of the catalog",

  /* Filters panel — button only; deep labels deferred to Wave C.2 */
  "explorar.filters.open": "Filters",
  "explorar.filters.openWithCount": "Filters · {count}",
  "explorar.filters.close": "Close",
  "explorar.filters.title": "Filters",
  "explorar.filters.apply": "Apply",
  "explorar.filters.clearAll": "Clear all",
  "explorar.filters.viewResults": "View {count} results",

  "explorar.grid.header.title": "Verified Biringas in {city}",
  "explorar.grid.header.cityAll": "Colombia",
  "explorar.grid.aria.list": "Biringas in the catalog",
  "explorar.grid.empty.kicker": "No results",
  "explorar.grid.empty.headline":
    "No profile matches this combination",
  "explorar.grid.empty.advice":
    "Try widening the city, dropping the age, or removing a service chip. You can also start over.",
  "explorar.grid.empty.cta.clearAll": "Clear all filters",
  "explorar.grid.empty.popularLabel": "Or try a popular search",
  "explorar.sort.kicker": "Sort by",
  "explorar.sort.option.default.label": "Newest",
  "explorar.sort.option.default.hint": "Newest first",
  "explorar.sort.option.rating.label": "Top rated",
  "explorar.sort.option.rating.hint": "Top reviews",
  "explorar.sort.option.priceAsc.label": "Price · low to high",
  "explorar.sort.option.priceAsc.hint": "Most affordable on top",
  "explorar.sort.option.priceDesc.label": "Price · high to low",
  "explorar.sort.option.priceDesc.hint": "Luxury on top",
  "explorar.filters.advanced.title": "Advanced filters",
  "explorar.filters.advanced.subtitle":
    "Refine by price, age, services and appearance.",
  "explorar.filters.advanced.activeKicker":
    "Active filters · tap a chip to remove it",
  "explorar.filters.advanced.noActive": "No filters applied",
  "explorar.filters.advanced.activeSingular": "{count} active filter",
  "explorar.filters.advanced.activePlural": "{count} active filters",
  "explorar.filters.advanced.clearAll": "Clear all",
  "explorar.filters.advanced.apply": "Apply filters",
  "explorar.filters.triggerLabel": "Filters",

  /* =================================================================
   * Wave D · /p/[slug] (profile page chrome)
   * ================================================================= */

  "profile.notFound.title": "Profile not found",
  "profile.notFound.description":
    "The requested profile does not exist or was taken down.",
  "profile.metadata.title": "{name} on Biringas",
  "profile.back.long": "Back to the catalog",
  "profile.back.short": "Back",
  "profile.gallery.aria": "{name}'s gallery",
  "profile.kicker": "Profile",
  "profile.videos.single": "Video",
  "profile.videos.multiple": "Videos",
  "profile.verifiedShield.thisMonth": "Photos verified this month",
  "profile.verifiedShield.monthsAgo":
    "Photos verified {count} month(s) ago",
  "profile.verifiedShield.title": "How verification works",
  "profile.chips.videoSingle": "Video available",
  "profile.chips.videoPlural": "{count} videos available",
  "profile.chips.audio": "Audio available",
  "profile.chips.stories": "{count} stories",
  "profile.stat.views": "Views",
  "profile.stat.daysActive": "Days active",
  "profile.stat.verified": "Verified",
  "profile.stat.verifiedAgo": "{days}d ago",
  "profile.priceLabel": "Rate",
  "profile.section.attributes": "Attributes",
  "profile.section.services": "Services",
  "profile.section.meetingPlaces": "Meeting places",
  "profile.attributes.ethnicity": "Ethnicity",
  "profile.attributes.hair": "Hair",
  "profile.attributes.height": "Height",
  "profile.attributes.body": "Body",
  "profile.attributes.breastSize": "Breast size",
  "profile.attributes.breastType": "Breast type",
  "profile.attributes.country": "Country",
  "profile.attributes.languages": "Languages",
  "profile.attributes.empty": "—",
  "profile.rate.aria": "Rate this profile",

  /* =================================================================
   * Wave E · auth funnel pages chrome
   * ================================================================= */

  "auth.signin.metadata.title": "Sign in — Biringas",
  "auth.signin.kicker": "Access",
  "auth.signin.title.lead": "Sign in to",
  "auth.signin.title.highlight": "Biringas",
  "auth.signin.subtitle":
    "Your favorites, saved searches and bookings — all in one discreet, verified place.",
  "auth.signin.gate.kicker": "First, tell us which account you use",
  "auth.signin.gate.help":
    "We save it to this device. You can change it whenever you want.",
  "auth.signin.gate.continueAs": "Continuing as",
  "auth.signin.gate.partner.title": "I'm a partner",
  "auth.signin.gate.partner.body":
    "You publish profiles (one or many). Access the model dashboard, per-model KYC and booking requests.",
  "auth.signin.gate.partner.short": "partner",
  "auth.signin.gate.client.title": "I'm a client",
  "auth.signin.gate.client.body":
    "You browse, save favorites and leave reviews. No profile publishing.",
  "auth.signin.gate.client.short": "client",
  "auth.signin.gate.modal.title": "What kind of account?",
  "auth.signin.gate.modal.body":
    "We need this to show you the right panel. Your choice is permanently recorded on your account.",
  "auth.accountType.locked.title": "Your account already has a type",
  "auth.accountType.locked.asClient":
    "Your account is registered as a client. To publish profiles, create a new account with a different email.",
  "auth.accountType.locked.asPartner":
    "Your account is registered as a Partner. To comment as a client, create a new account with a different email.",
  "auth.accountType.locked.backToDashboard": "Back to dashboard",
  "auth.signup.google.lockedAsClient":
    "This Google email is already registered as a client. To publish profiles, use a different Google account.",
  "auth.signup.google.lockedAsPartner":
    "This Google email is already registered as a Partner. To create a client account, use a different Google account.",
  "auth.signup.metadata.title": "Create account — Biringas",
  "auth.signup.kicker": "New account",
  "auth.signup.title.lead": "Join",
  "auth.signup.title.highlight": "Biringas",
  "auth.signup.subtitle":
    "Free account to save favorites, leave reviews, or publish your verified profile.",
  "auth.reset.metadata.title": "Reset password — Biringas",
  "auth.reset.kicker": "Recovery",
  "auth.reset.title": "Reset password",
  "auth.reset.subtitle":
    "We'll email you instructions to restore your access.",

  /* AuthBadge */
  "auth.badge.fallbackName": "My account",
  "auth.badge.openAccount": "Open my account",
  "auth.badge.signOut": "Sign out",

  /* SignInForm */
  "auth.signin.toast.title": "Signed in",
  "auth.signin.toast.email": "Welcome back.",
  "auth.signin.toast.google": "Picking up where you left off.",
  "auth.signin.kicker.card": "Access",
  "auth.signin.card.title": "Pick up where you left off",
  "auth.signin.field.email": "Email",
  "auth.signin.field.email.placeholder": "you@email.com",
  "auth.signin.field.password": "Password",
  "auth.signin.field.password.placeholder": "Minimum 6 characters",
  "auth.signin.field.password.show": "Show password",
  "auth.signin.field.password.hide": "Hide password",
  "auth.signin.forgot": "Forgot it?",
  "auth.signin.submit": "Sign in",
  "auth.signin.submitting": "Signing in…",
  "auth.signin.divider": "or",
  "auth.signin.google": "Continue with Google",
  "auth.signin.trustLine": "Your identity never appears on public profiles.",
  "auth.signin.noAccount": "Don't have an account?",
  "auth.signin.createAccount": "Create account",
  "auth.disabled.kicker": "Auth not available",
  "auth.disabled.signin.body":
    "The NEXT_PUBLIC_FIREBASE_* variables need to be configured to enable access. Meanwhile the catalog and profiles work in demo mode.",
  "auth.disabled.signup.body":
    "The NEXT_PUBLIC_FIREBASE_* variables need to be configured to enable signup. Meanwhile the catalog and profiles work in demo mode.",
  "auth.disabled.reset.body":
    "Auth is not available — Firebase is not configured.",
  "auth.alreadySignedIn.lead": "You're already signed in.",
  "auth.alreadySignedIn.continue": "Continue",
  "auth.alreadySignedIn.verifying": "Verifying…",
  "auth.alreadySignedIn.retry": "Retry",
  "auth.alreadySignedIn.signOut": "Sign out",
  "auth.alreadySignedIn.signingOut": "Signing out…",
  "auth.alreadySignedIn.error.title":
    "We couldn't validate your session on the server.",
  "auth.alreadySignedIn.error.advice":
    "Try again. If the problem persists, sign out and sign back in.",
  "auth.alreadySignedIn.error.fallback": "We couldn't confirm your session.",
  "auth.error.invalidCredentials": "Invalid credentials. Try again.",
  "auth.error.tooManyRequests": "Too many attempts. Wait a few minutes.",
  "auth.error.popupClosed": "You cancelled sign-in.",
  "auth.error.network":
    "No connection. Check your internet and try again.",
  "auth.error.unknown": "Unknown error.",

  /* SignUpForm */
  "auth.signup.kicker.card": "New account",
  "auth.signup.card.title": "Create your account in 30 seconds",
  "auth.signup.card.subtitle":
    "Unlocks the verified catalog, synced favorites and the option to publish your profile whenever you want.",
  "auth.signup.field.email": "Email",
  "auth.signup.field.email.placeholder": "you@email.com",
  "auth.signup.field.password": "Password",
  "auth.signup.field.password.placeholder": "Minimum {min} characters",
  "auth.signup.field.confirm": "Confirm your password",
  "auth.signup.field.confirm.placeholder": "Same as above",
  "auth.signup.terms.accept": "I accept the",
  "auth.signup.terms.terms": "Terms",
  "auth.signup.terms.privacyJoin": "and the",
  "auth.signup.terms.privacy": "Privacy Policy",
  "auth.signup.submit": "Create account",
  "auth.signup.submitting": "Creating account…",
  "auth.signup.benefits.aria": "What you get",
  "auth.signup.benefits.catalog": "Verified catalog with real profiles",
  "auth.signup.benefits.favorites": "Favorites synced across devices",
  "auth.signup.benefits.publish": "Publish your profile whenever you want",
  "auth.signup.trustLine": "Your identity never appears on public profiles.",
  "auth.signup.haveAccount": "Already have an account?",
  "auth.signup.signIn": "Sign in",
  "auth.signup.toast.title": "Account created",
  "auth.signup.toast.body":
    "We sent a verification email. You can continue now.",
  "auth.signup.validation.email": "Enter your email.",
  "auth.signup.validation.password": "Minimum {min} characters.",
  "auth.signup.validation.confirm": "Passwords don't match.",
  "auth.signup.validation.terms":
    "Confirm that you accept the Terms and Privacy Policy.",
  "auth.signup.strength.weak": "Weak",
  "auth.signup.strength.okay": "Okay",
  "auth.signup.strength.strong": "Strong",
  "auth.signup.strength.excellent": "Excellent",
  "auth.signup.error.emailInUse":
    "This email already has an account. Try signing in.",
  "auth.signup.error.weakPassword":
    "Password too weak. Try a longer one.",
  "auth.signup.error.invalidEmail": "The email format is not valid.",

  /* ResetPasswordForm */
  "auth.reset.field.email": "Email",
  "auth.reset.submit": "Email me the link",
  "auth.reset.submitting": "Sending…",
  "auth.reset.success":
    "If an account exists for {email}, we sent you an email with instructions to reset your password. Also check your spam folder.",
  "auth.reset.backToSignin": "Back to sign in",
  "auth.reset.recovered": "Recovered access?",
  "auth.reset.signIn": "Sign in",
  "auth.reset.validation.email": "Enter your email.",
  "auth.reset.validation.invalidEmail": "The email doesn't look valid.",

  /* =================================================================
   * RBAC flows · publisher / commentator journeys
   * ================================================================= */

  /* Chooser */
  "rbac.chooser.metadata.title": "Pick your account type — Biringas",
  "rbac.chooser.kicker": "Sign up",
  "rbac.chooser.title.lead": "Choose how you want to",
  "rbac.chooser.title.highlight": "join",
  "rbac.chooser.subtitle":
    "Two separate journeys with different panels and permissions. You can switch later if you need to.",
  "rbac.chooser.publisher.eyebrow": "Profile publisher",
  "rbac.chooser.publisher.title": "Publish your profile",
  "rbac.chooser.publisher.body":
    "Create a public listing, manage your verified photos and receive booking requests.",
  "rbac.chooser.publisher.bullet.1": "Phone and email verification",
  "rbac.chooser.publisher.bullet.2": "Photo, ID and short-video upload",
  "rbac.chooser.publisher.bullet.3": "Moderation before publication",
  "rbac.chooser.publisher.cta": "Continue as publisher",
  "rbac.chooser.commentator.eyebrow": "Comments-only account",
  "rbac.chooser.commentator.title": "Just comments",
  "rbac.chooser.commentator.body":
    "Leave reviews on existing profiles and save favorites. No phone, no photos, no moderation.",
  "rbac.chooser.commentator.bullet.1": "Email + nickname only",
  "rbac.chooser.commentator.bullet.2": "Limited, discreet panel",
  "rbac.chooser.commentator.bullet.3": "Cannot publish listings",
  "rbac.chooser.commentator.cta": "Continue as commentator",
  "rbac.chooser.alreadyAccount": "Already have an account?",
  "rbac.chooser.signIn": "Sign in",
  "rbac.chooser.recommended": "Recommended",

  /* Publisher wizard */
  "rbac.publisher.metadata.title": "Sign up as publisher — Biringas",
  "rbac.publisher.kicker": "Profile publisher",
  "rbac.publisher.title.lead": "Publish your profile on",
  "rbac.publisher.title.highlight": "Biringas",
  "rbac.publisher.subtitle":
    "Four short steps. Your profile then goes into moderation until photos are approved.",
  "rbac.publisher.step.phone": "Phone & email",
  "rbac.publisher.step.otp": "Verification",
  "rbac.publisher.step.password": "Password",
  "rbac.publisher.step.profile": "Profile",
  "rbac.publisher.stepper.aria": "Sign-up progress",
  "rbac.publisher.back": "Back",
  "rbac.publisher.next": "Continue",
  "rbac.publisher.submitting": "Working…",
  "rbac.publisher.changeAccountType": "Just want to comment?",
  "rbac.publisher.changeAccountType.cta": "Switch to a comments-only account",

  "rbac.publisher.phone.title": "Phone and email",
  "rbac.publisher.phone.subtitle":
    "We use the phone to verify identity and for the profile's contact button.",
  "rbac.publisher.phone.country": "Country",
  "rbac.publisher.phone.field": "Phone",
  "rbac.publisher.phone.field.placeholder": "e.g. 3237992985",
  "rbac.publisher.phone.email": "Email",
  "rbac.publisher.phone.email.placeholder": "you@email.com",
  "rbac.publisher.phone.disabledNotice":
    "SMS verification disabled in this build — the code is accepted optimistically.",
  "rbac.publisher.phone.validation.country": "Pick your country.",
  "rbac.publisher.phone.validation.phone": "Enter at least 7 digits.",
  "rbac.publisher.phone.validation.email": "Enter a valid email.",

  "rbac.publisher.otp.title": "Verify your phone",
  "rbac.publisher.otp.subtitle":
    "We would send a code by SMS or WhatsApp to {phone}.",
  "rbac.publisher.otp.field": "6-digit code",
  "rbac.publisher.otp.resend": "Resend code",
  "rbac.publisher.otp.optimistic":
    "Demo mode — any 6-digit code lets you continue.",
  "rbac.publisher.otp.validation": "Enter all 6 digits.",

  "rbac.publisher.password.title": "Create your password",
  "rbac.publisher.password.subtitle":
    "You will use this password to sign in to your profile panel.",
  "rbac.publisher.password.field": "Password",
  "rbac.publisher.password.field.placeholder": "Minimum 8 characters",
  "rbac.publisher.password.confirm": "Confirm password",
  "rbac.publisher.password.confirm.placeholder": "Same as above",
  "rbac.publisher.password.validation.password": "Minimum 8 characters.",
  "rbac.publisher.password.validation.confirm": "Passwords don't match.",
  "rbac.publisher.password.validation.terms":
    "You need to accept the terms to continue.",
  "rbac.publisher.password.terms.lead":
    "I am of legal age and I accept the privacy policy and terms of use.",
  "rbac.publisher.password.submit": "Create partner account",
  "rbac.publisher.password.submitting": "Creating account…",

  "rbac.publisher.profile.title": "Profile details",
  "rbac.publisher.profile.subtitle":
    "Public information about the listing. You can edit it later.",
  "rbac.publisher.profile.section.location": "Profile location",
  "rbac.publisher.profile.field.state": "State / department",
  "rbac.publisher.profile.field.state.placeholder": "Pick a department",
  "rbac.publisher.profile.field.city": "City",
  "rbac.publisher.profile.field.city.placeholder": "Pick a city",
  "rbac.publisher.profile.field.neighborhood": "Neighborhood / district",
  "rbac.publisher.profile.field.neighborhood.placeholder": "Optional",
  "rbac.publisher.profile.field.travels": "I travel to (max 7 cities)",
  "rbac.publisher.profile.field.travels.placeholder": "Optional, up to 7",
  "rbac.publisher.profile.section.details": "Profile details",
  "rbac.publisher.profile.field.age": "Age",
  "rbac.publisher.profile.field.age.placeholder": "Private, internal control only",
  "rbac.publisher.profile.field.category": "Category",
  "rbac.publisher.profile.field.category.placeholder": "Pick a category",
  "rbac.publisher.profile.field.title": "Profile title",
  "rbac.publisher.profile.field.title.placeholder":
    "At least 40 characters. The title should be informative.",
  "rbac.publisher.profile.field.description": "Description",
  "rbac.publisher.profile.field.description.placeholder":
    "Describe yourself. Do not put cities in this field — use «I travel to». Do not write in all caps.",
  "rbac.publisher.profile.section.contact": "Contact details",
  "rbac.publisher.profile.contact.help": "Choose at least one contact option.",
  "rbac.publisher.profile.contact.email":
    "I want to be contacted by email",
  "rbac.publisher.profile.contact.phone": "Show my phone on the profile",
  "rbac.publisher.profile.contact.whatsapp": "Show WhatsApp on the profile",
  "rbac.publisher.profile.contact.telegram": "Show Telegram on the profile",
  "rbac.publisher.profile.contact.noDeposit":
    "I do not ask for an upfront deposit to book (optional)",
  "rbac.publisher.profile.section.photos": "Photos",
  "rbac.publisher.profile.photos.help":
    "Real photos only — no stolen, no watermarks. Minimum 2 front-facing photos showing 2/3 of your body.",
  "rbac.publisher.profile.photos.cta":
    "Click or drag images here to upload",
  "rbac.publisher.profile.photos.disabled":
    "Photo upload disabled in this build — submission creates a profile in PENDING_MODERATION without files.",
  "rbac.publisher.profile.terms.lead":
    "I am of legal age. I accept the privacy policy and terms. I declare I am independent and publish this profile on my own.",
  "rbac.publisher.profile.submit": "Publish profile",
  "rbac.publisher.profile.submitting": "Sending to moderation…",
  "rbac.publisher.profile.validation.required": "This field is required.",
  "rbac.publisher.profile.validation.titleMin":
    "Title must be at least 40 characters.",
  "rbac.publisher.profile.validation.descriptionMin":
    "Description must be at least 80 characters.",
  "rbac.publisher.profile.validation.contact":
    "Choose at least one contact option.",
  "rbac.publisher.profile.validation.terms":
    "You must accept the conditions to publish.",

  "rbac.publisher.postPublish.metadata.title":
    "Profile under moderation — Biringas",
  "rbac.publisher.postPublish.confirm.title": "We've got your listing!",
  "rbac.publisher.postPublish.confirm.body":
    "Your listing and identity verification are under review. We'll ping you on WhatsApp once it's ready — usually within 4 to 24 hours.",
  "rbac.publisher.postPublish.confirm.dismiss": "Dismiss",
  "rbac.publisher.postPublish.banner":
    "Your profile is under moderation. To activate it you need to verify your photos. ",
  "rbac.publisher.postPublish.bannerLink": "More info here.",
  "rbac.publisher.postPublish.question":
    "Do you want to verify your profile photos?",
  "rbac.publisher.postPublish.yes": "Yes",
  "rbac.publisher.postPublish.no": "No",
  "rbac.publisher.postPublish.skip": "I'll do it later",
  "rbac.publisher.postPublish.rules.title":
    "New profile verification system and new rules",
  "rbac.publisher.postPublish.rules.1":
    "The photo with the sign is taken by us.",
  "rbac.publisher.postPublish.rules.2":
    "Each photo to verify must show at least 2/3 of your body.",
  "rbac.publisher.postPublish.rules.3":
    "Every profile must have at least two front-facing photos.",
  "rbac.publisher.postPublish.rules.4":
    "If you cover your face it must be with a blur — no emojis. Crops are OK.",
  "rbac.publisher.postPublish.rules.delete":
    "Photos that DO NOT comply WILL be deleted.",
  "rbac.publisher.postPublish.rules.twoSteps":
    "Verification still happens in 2 steps.",
  "rbac.publisher.postPublish.understood": "Understood",
  "rbac.publisher.postPublish.next": "Start verification",
  "rbac.publisher.postPublish.disabled":
    "Photo verification isn't live yet. We'll let you know when we open it.",
  "rbac.publisher.verify.step1.title": "Step 1 — Short video with sign",
  "rbac.publisher.verify.step1.body":
    "Frame the camera so it shows 2/3 of your body. Hold a sign that reads «Biringas». Show the sign and yourself live.",
  "rbac.publisher.verify.step1.warn": "Do not record with backlight.",
  "rbac.publisher.verify.step1.cta": "Start recording",
  "rbac.publisher.verify.step2.title": "Step 2 — ID document",
  "rbac.publisher.verify.step2.body":
    "Pick which document you'll use to identify your account.",
  "rbac.publisher.verify.step2.id": "ID card",
  "rbac.publisher.verify.step2.passport": "Passport",
  "rbac.publisher.verify.step2.front": "Take front photo",
  "rbac.publisher.verify.step2.hint.1": "Make sure the whole document fits.",
  "rbac.publisher.verify.step2.hint.2":
    "The photo must not be blurry or poorly lit.",
  "rbac.publisher.verify.step2.hint.3":
    "Nothing can cover or censor the document.",
  "rbac.publisher.verify.success.title": "Verification submitted",
  "rbac.publisher.verify.success.body":
    "We'll review your material in the next few hours and let you know.",
  "rbac.publisher.verify.success.cta": "Back to panel",

  /* Commentator flow */
  "rbac.commentator.metadata.title": "Comments account — Biringas",
  "rbac.commentator.kicker": "Comments-only account",
  "rbac.commentator.title.lead": "You just want to",
  "rbac.commentator.title.highlight": "comment",
  "rbac.commentator.subtitle":
    "Biringas only moderates comments — not profiles or personal pages, and is not related to their content.",
  "rbac.commentator.banner":
    "This form is for posting comments only. If you register here you will not be able to publish a profile.",
  "rbac.commentator.card.title": "Account to post comments",
  "rbac.commentator.field.country": "Country",
  "rbac.commentator.field.country.placeholder": "Pick your country",
  "rbac.commentator.field.email": "Email",
  "rbac.commentator.field.email.placeholder": "you@email.com",
  "rbac.commentator.field.emailHint": "Your email stays private.",
  "rbac.commentator.field.nickname": "Nickname",
  "rbac.commentator.field.nickname.placeholder":
    "The name you'll comment with.",
  "rbac.commentator.field.password": "Password",
  "rbac.commentator.field.password.placeholder": "Minimum 8 characters",
  "rbac.commentator.field.passwordConfirm": "Confirm password",
  "rbac.commentator.field.passwordConfirm.placeholder": "Same as above",
  "rbac.commentator.terms":
    "I accept the privacy policy and terms of use of Biringas.com.",
  "rbac.commentator.submit": "Register",
  "rbac.commentator.submitting": "Creating account…",
  "rbac.commentator.successToast.title": "Account created",
  "rbac.commentator.successToast.body":
    "All set — you can now leave comments on any profile.",
  "rbac.commentator.alreadyAccount": "Already have an account?",
  "rbac.commentator.signIn": "Sign in",
  "rbac.commentator.switchToPublisher": "Want to publish a listing?",
  "rbac.commentator.switchToPublisher.cta": "Register as publisher",
  "rbac.commentator.validation.country": "Pick your country.",
  "rbac.commentator.validation.email": "Enter a valid email.",
  "rbac.commentator.validation.nickname": "Enter a nickname.",
  "rbac.commentator.validation.password": "Minimum 8 characters.",
  "rbac.commentator.validation.confirm": "Passwords don't match.",
  "rbac.commentator.validation.terms": "Accept the terms to continue.",

  "rbac.commentator.panel.metadata.title": "My comments — Biringas",
  "rbac.commentator.panel.metadata.description":
    "Limited comments-account panel.",
  "rbac.commentator.panel.title": "Your account",
  "rbac.commentator.panel.subtitle":
    "Comments account — you cannot publish listings.",
  "rbac.commentator.panel.section.options": "Account options",
  "rbac.commentator.panel.nav.favorites": "Favorites",
  "rbac.commentator.panel.nav.comments": "My comments",
  "rbac.commentator.panel.nav.password": "Change password",
  "rbac.commentator.panel.nav.delete": "Delete my account",
  "rbac.commentator.panel.nav.signOut": "Sign out",
  "rbac.commentator.panel.favorites.empty":
    "You have no favorites right now.",
  "rbac.commentator.panel.comments.empty":
    "You have not commented on any profile yet.",
  "rbac.commentator.panel.cantPublish.title":
    "This account is for comments only",
  "rbac.commentator.panel.cantPublish.body":
    "Account type is permanent. To publish profiles, register a new account with a different email — you can't switch from this one.",
  "rbac.commentator.panel.success.updated":
    "Your account has been updated.",
  "rbac.commentator.panel.dialog.delete.title": "Delete this account",
  "rbac.commentator.panel.dialog.delete.body":
    "You are about to delete your account and all your comments. This cannot be undone.",
  "rbac.commentator.panel.dialog.delete.confirm": "Yes, delete",
  "rbac.commentator.panel.dialog.delete.cancel": "Cancel",
  "rbac.commentator.panel.dialog.delete.disabled":
    "Account deletion is not implemented in this build.",

  /* Publisher loader — rotating marketing tips */
  "rbac.publisher.loader.kicker": "Processing",
  "rbac.publisher.loader.title": "Sending your profile to moderation",
  "rbac.publisher.loader.subtitle":
    "We're preparing everything. This may take a few seconds.",
  "rbac.publisher.loader.tipsHeading": "While you wait · Pro tip",
  "rbac.publisher.loader.dontClose": "Don't close this window",
  "rbac.publisher.loader.tip.photos":
    "Profiles with 4+ real photos get up to 3× more views. Mix wide, medium and detail shots.",
  "rbac.publisher.loader.tip.title":
    "A descriptive 40+ character title doubles click-through. Include your city and one unique trait.",
  "rbac.publisher.loader.tip.verified":
    "Verified profiles appear first in search. Complete verification as soon as it opens.",
  "rbac.publisher.loader.tip.telegram":
    "Showing a Telegram or WhatsApp handle lifts reply rate by up to 40%. More channels, more bookings.",
  "rbac.publisher.loader.tip.responsive":
    "Replying within the first hour multiplies confirmed bookings by 2.5×. Turn on panel notifications.",
  "rbac.publisher.loader.tip.description":
    "Your description is your pitch. Write in first person, avoid all-caps, and lead with what makes you unique.",
  "rbac.publisher.loader.tip.location":
    "Listing the neighborhood and cities you travel to puts you in more results and cuts unproductive chats.",
  "rbac.publisher.loader.tip.premium":
    "Premium tiers feature you on the home and category pages — exposure without burning your calendar.",
  "rbac.publisher.loader.tip.video":
    "A short, well-lit video adds trust and speeds up verification. Use it once uploads are live.",

  /* Photo upload — visual stub */
  "rbac.publisher.photos.choose": "Choose photos",
  "rbac.publisher.photos.dragHint":
    "Click or drop JPG / PNG / WebP files. Up to 8 MB each.",
  "rbac.publisher.photos.counter":
    "{count} of {min}–{max} photos selected",
  "rbac.publisher.photos.remove": "Remove photo",
  "rbac.publisher.photos.coverBadge": "Cover",
  "rbac.publisher.photos.ok":
    "Minimum reached. Add more to strengthen your profile.",
  "rbac.publisher.photos.minHint": "Upload at least {min} front-facing photos.",
  "rbac.publisher.photos.remaining": "{count} slots left",
  "rbac.publisher.photos.error.format":
    "Unsupported format. Use JPG, PNG, or WebP.",
  "rbac.publisher.photos.error.size":
    "File exceeds the {mb} MB limit.",
  "rbac.publisher.photos.error.max":
    "Max {max} photos per profile.",

  /* Form-level extras */
  "rbac.form.errorSummary.heading":
    "Review these fields to continue:",
  "rbac.form.toast.invalid.title": "Missing details",
  "rbac.form.toast.invalid.body":
    "We highlighted the fields that need attention. Resolve them to continue.",
  "rbac.form.toast.success.title": "Done!",
  "rbac.form.toast.success.body": "We received your profile — review starts now.",
  "rbac.form.toast.error.title": "Something went wrong",
  "rbac.form.toast.error.body":
    "We couldn't process your request. Please try again in a moment.",
  "rbac.publisher.profile.field.description.hint":
    "At least 80 characters. Max {max} — be brief and specific.",
  "rbac.publisher.profile.validation.descriptionMax":
    "Description exceeds the {max}-character limit.",

  /* =================================================================
   * Wave E.2 · /mi-cuenta dashboard
   * ================================================================= */

  "miCuenta.metadata.title": "My account — Biringas",
  "miCuenta.metadata.description":
    "Seller dashboard: incoming requests, profile editing and weekly availability.",
  "miCuenta.fallbackName": "companion",

  /* Empty drafts state */
  "miCuenta.empty.title": "You haven't published any model yet",
  "miCuenta.empty.body":
    "Once you publish a model, you'll see incoming requests here, edit her photos, and adjust her availability anytime.",
  "miCuenta.empty.cta": "Publish a model",

  /* Profile tab */
  "miCuenta.profile.single": "Your published profile:",
  "miCuenta.profile.multiple": "You have {count} published profiles.",
  "miCuenta.profile.viewProfile": "View profile",
  "miCuenta.profile.catalogStatus": "Status in the catalog:",
  "miCuenta.profile.reviewNote":
    "While your profile is under human review, it's only visible to you. We'll let you know as soon as the 2-layer verification clears — it usually takes under 24 working hours.",

  /* Draft action links */
  "miCuenta.draft.action.details": "View details",
  "miCuenta.draft.action.editResend": "Edit and resend",
  "miCuenta.draft.action.edit": "Edit",

  /* Draft status pills */
  "miCuenta.draft.status.approved": "Approved",
  "miCuenta.draft.status.rejected": "Rejected",
  "miCuenta.draft.status.inReview": "In review",

  /* Agenda tab */
  "miCuenta.agenda.headline.lead": "Public availability visitors see on your profile",
  "miCuenta.agenda.comingSoon.title": "Coming soon: manual editing.",
  "miCuenta.agenda.comingSoon.body":
    "You'll be able to pin your actual slots in a couple of taps. For now the grid is calculated from your confirmation history; if you'd like to hide a specific slot, drop us a note in support.",

  /* KYC status card */
  "miCuenta.kyc.approved.title": "Identity verified",
  "miCuenta.kyc.approved.body":
    "Your gold badge appears in the catalog. If you change your ID document, you can verify again later.",
  "miCuenta.kyc.pending.title": "Verification under review",
  "miCuenta.kyc.pending.body":
    "We received your files. We'll let you know as soon as the team finishes the human review.",
  "miCuenta.kyc.pending.meta": "Usually takes under 24 hours",
  "miCuenta.kyc.rejected.title": "Verification rejected",
  "miCuenta.kyc.rejected.body":
    "Your previous attempt didn't pass. You can resubmit the photos when you're ready.",
  "miCuenta.kyc.rejected.cta": "Resubmit verification",
  "miCuenta.kyc.rejected.reason": "Reason:",
  "miCuenta.kyc.notSubmitted.title": "Verify your identity",
  "miCuenta.kyc.notSubmitted.body":
    "Your profile only goes live once we confirm who you are. It takes 5 minutes: ID (front + back) + selfie.",
  "miCuenta.kyc.notSubmitted.cta": "Verify my identity",
  "miCuenta.kyc.aria.approved": "Approved",
  "miCuenta.kyc.aria.rejected": "Rejected",
  "miCuenta.kyc.aria.inReview": "In review",

  /* Persons / multi-modelo (ADR-018) */
  "miCuenta.persons.listKicker": "Your models ({count})",
  "miCuenta.persons.create.cta": "Add new model",
  "miCuenta.persons.create.title": "New model",
  "miCuenta.persons.create.help":
    "Each model is verified separately and publishes her own profile. Start with the name.",
  "miCuenta.persons.create.nameLabel": "Name or alias",
  "miCuenta.persons.create.namePlaceholder": "e.g. Sofía",
  "miCuenta.persons.create.submit": "Create",
  "miCuenta.persons.create.submitting": "Creating…",
  "miCuenta.persons.create.cancel": "Cancel",
  "miCuenta.persons.create.error.fallback":
    "We couldn't create her. Try again in a moment.",
  "miCuenta.persons.empty.title": "Start by creating your first model",
  "miCuenta.persons.empty.body":
    "Each model is independent: she has her own identity verification and her own listings. Verification is requested when she publishes.",
  "miCuenta.profiles.listKicker": "Your profiles ({count})",
  "miCuenta.profiles.publishAnother": "Publish another profile",
  "miCuenta.profiles.empty.title": "Publish your first profile",
  "miCuenta.profiles.empty.body":
    "Each profile is published and verified separately. You'll do the identity check inside the same flow.",
  "miCuenta.profiles.empty.cta": "Publish your first profile",
  "miCuenta.profile.kyc.notSubmitted": "Identity pending",
  "miCuenta.profile.kyc.pending": "Identity under review",
  "miCuenta.profile.kyc.approved": "Identity verified",
  "miCuenta.profile.kyc.rejected": "Identity rejected",
  "miCuenta.profile.listing.none": "No listing yet",
  "miCuenta.profile.listing.inReview": "Listing under review",
  "miCuenta.profile.listing.published": "Published",
  "miCuenta.profile.listing.rejected": "Listing rejected",
  "miCuenta.profile.action.verifyIdentity": "Verify identity",
  "miCuenta.profile.action.publish": "Publish this profile",
  "miCuenta.profile.action.viewDetails": "View details",
  "miCuenta.profile.action.editResend": "Edit and resend",
  "miCuenta.profile.action.viewListing": "View my listing",
  "miCuenta.profile.action.viewVerification": "View submitted verification",
  "miCuenta.profile.action.delete": "Delete {name}'s profile",
  "miCuenta.profile.delete.modal.title": "Delete {name}'s profile?",
  "miCuenta.profile.delete.modal.body":
    "The listing under review will be cancelled, the identity verification will be deleted, and the profile will disappear from your dashboard. This can't be undone.",
  "miCuenta.profile.delete.modal.blocked.body":
    "This profile has an active listing in the catalog. Unpublish it first or contact support — deleting now would leave the listing orphaned.",
  "miCuenta.profile.delete.modal.typeToConfirm":
    "Type «{name}» to confirm",
  "miCuenta.profile.delete.modal.cancel": "Cancel",
  "miCuenta.profile.delete.modal.confirm": "Delete profile",
  "miCuenta.profile.delete.toast.success.title": "Profile deleted",
  "miCuenta.profile.delete.toast.success.body":
    "{name}'s profile was removed from your account.",
  "miCuenta.profile.delete.toast.error.title": "Couldn't delete the profile",
  "miCuenta.profile.delete.toast.error.body":
    "Something went wrong. Try again in a moment or contact support if it keeps failing.",
  "miCuenta.profile.delete.toast.blocked.title": "There's an active listing",
  "miCuenta.profile.delete.toast.blocked.body":
    "This profile is published in the catalog. Unpublish it first or contact support.",

  /* Draft detail page */
  "draft.metadata.title": "Draft detail — Biringas",
  "draft.metadata.description": "Read-only view of a catalog draft under review.",
  "draft.back": "Back to the dashboard",
  "draft.unnamed": "Unnamed draft",
  "draft.subtitle":
    "This is what you submitted. While your listing is under human review, it can't be edited — if we need anything, we'll let you know within 24 hours.",

  "draft.status.pending.title": "Under human review",
  "draft.status.pending.body":
    "We received your listing and it's going through the 2-layer verification. In the meantime it only shows up for you.",
  "draft.status.pending.meta": "Usually takes under 24 hours",
  "draft.status.approved.title": "Listing approved",
  "draft.status.approved.body":
    "Your profile cleared verification and is live in the public catalog.",
  "draft.status.rejected.title": "Listing rejected",
  "draft.status.rejected.body":
    "Something didn't pass review. You can edit the draft and resubmit.",
  "draft.status.cancelled.title": "Listing cancelled",
  "draft.status.cancelled.body":
    "It was cancelled because you deleted the profile it belonged to. To publish again, create a new profile from the dashboard.",
  "draft.status.rejection.reason": "Reason:",
  "draft.receivedOn": "Received {when}",

  "draft.pill.pending": "In review",
  "draft.pill.approved": "Approved",
  "draft.pill.rejected": "Rejected",
  "draft.pill.cancelled": "Cancelled",

  "draft.section.public": "Public data",
  "draft.section.private": "Private data (only you see it)",
  "draft.section.description": "Description and services",
  "draft.section.attributes": "Attributes",
  "draft.section.gallery": "Gallery",
  "draft.section.plan": "Chosen plan",

  "draft.field.displayName": "Stage name",
  "draft.field.age": "Age",
  "draft.field.age.value": "{n} years",
  "draft.field.city": "City",
  "draft.field.category": "Category",
  "draft.field.url": "Preferred URL",
  "draft.field.rate": "Hourly rate",
  "draft.field.phone": "Verification phone",
  "draft.field.contactChannels": "Contact channels",
  "draft.field.attention": "Attends to",
  "draft.field.shortBio": "Short tagline",
  "draft.field.bio": "Long description",
  "draft.field.servicesIncluded": "Included services",
  "draft.field.meetingContexts": "Meeting contexts",
  "draft.field.faceVisible": "Face visible",
  "draft.field.paymentByCard": "Accepts card",
  "draft.field.availableNow": "Available now",
  "draft.field.country": "Country",
  "draft.field.ethnicity": "Ethnicity",
  "draft.field.hair": "Hair",
  "draft.field.height": "Height",
  "draft.field.body": "Body",
  "draft.field.breastSize": "Breast size",
  "draft.field.breastType": "Breast type",
  "draft.field.pubis": "Pubic style",
  "draft.field.languages": "Languages",
  "draft.field.photosSent": "Photos uploaded",
  "draft.field.photos.singular": "{count} photo",
  "draft.field.photos.plural": "{count} photos",
  "draft.field.photos.readyNote": "— ready for KYC verification + human review.",
  "draft.field.photos.empty":
    "No photos attached. The team may ask you to upload them at this stage.",
  "draft.field.package": "Package",
  "draft.field.billing": "Billing",
  "draft.field.billing.monthly": "Monthly",
  "draft.field.billing.quarterly": "Quarterly",
  "draft.field.addOns": "Add-ons",
  "draft.value.yes": "Yes",
  "draft.value.no": "No",

  "draft.footer.pending":
    "While your listing is under human review, it can't be edited. If we need changes, we'll reach out through the contact channel you registered — it usually takes under 24 working hours.",
  "draft.footer.rejected.body":
    "Your previous attempt didn't pass review. You can edit this draft and resubmit when you're ready.",
  "draft.footer.rejected.cta": "Back to the dashboard",

  /* =================================================================
   * Wave F · /favoritas
   * ================================================================= */

  "favoritas.metadata.title": "Your favorites — Biringas",
  "favoritas.metadata.description":
    "Save the profiles you're interested in and compare them side-by-side before deciding.",
  "favoritas.loading": "Loading your list…",
  "favoritas.kicker": "Your shortlist",
  "favoritas.title": "Your favorites",
  "favoritas.subtitle":
    "You save them with the heart on every profile. Here you can compare them side-by-side and decide without going back to the catalog.",
  "favoritas.quickVersus": "Quick versus",
  "favoritas.clearVersus": "Clear versus",
  "favoritas.keepExploring": "Keep exploring",
  "favoritas.compareHint.title": "Versus mode.",
  "favoritas.compareHint.bodyA": "Tap",
  "favoritas.compareHint.versus": "Quick versus",
  "favoritas.compareHint.bodyB":
    "to compare the first 3 instantly, or check",
  "favoritas.compareHint.compare": "Compare",
  "favoritas.compareHint.bodyC": "on cards to build your own combo.",
  "favoritas.empty.title": "Your shortlist is empty",
  "favoritas.empty.body":
    "Tap the heart on any profile to save it here. Then you can compare them side-by-side before deciding.",
  "favoritas.empty.cta": "Explore profiles",

  /* =================================================================
   * Wave F · /seguridad
   * ================================================================= */

  "seguridad.metadata.title": "Your safety first — Biringas",
  "seguridad.metadata.description":
    "Practical guide to make every Biringas encounter safe: before, during and after. Clear rules, no moralizing.",
  "seguridad.kicker": "Your safety first",
  "seguridad.title.lead": "Nine rules that turn every encounter into",
  "seguridad.title.highlight": "a good memory",
  "seguridad.subtitle":
    "Before, during and after. Bookmark this page and re-read it before each booking — rituals prevent surprises.",
  "seguridad.phase.before.kicker": "Before",
  "seguridad.phase.before.title": "Setting expectations is half the work.",
  "seguridad.phase.during.kicker": "During",
  "seguridad.phase.during.title": "You always have the red button.",
  "seguridad.phase.after.kicker": "After",
  "seguridad.phase.after.title": "Trust is built on every encounter.",

  "seguridad.rule.badge.title": "Check the gold badge",
  "seguridad.rule.badge.body":
    "Only profiles with the gold shield passed our 2-layer human verification. If you don't see it, proceed with caution.",
  "seguridad.rule.chat.title": "Settle everything in chat",
  "seguridad.rule.chat.body":
    "Rate, place, duration, plan type. If something doesn't match on arrival, the chat is your evidence.",
  "seguridad.rule.call.title": "Make a short call",
  "seguridad.rule.call.body":
    "A 30-second call confirms identity and dispels doubts. If the call is rejected or sounds like a bot, cancel.",
  "seguridad.rule.location.title": "Share your location",
  "seguridad.rule.location.body":
    "Send your live location to someone you trust before going in. Apple Maps and Google Maps both have free real-time sharing.",
  "seguridad.rule.noMoney.title": "Zero money up front",
  "seguridad.rule.noMoney.body":
    "No serious companion asks for a transfer before the encounter. If they ask, it's a scam — block and report.",
  "seguridad.rule.places.title": "Places with cameras or people",
  "seguridad.rule.places.body":
    "Hotels, verified short-term rentals, restaurants. Avoid addresses that change at the last moment.",
  "seguridad.rule.delete.title": "Delete what you don't need",
  "seguridad.rule.delete.body":
    "Messages, photos, screenshots. Your privacy after the encounter is as important as before.",
  "seguridad.rule.review.title": "Leave your review",
  "seguridad.rule.review.body":
    "Even if it was perfect, your review helps others and reinforces the profile's trust. A few words are enough.",
  "seguridad.rule.report.title": "Report what wasn't right",
  "seguridad.rule.report.body":
    "Mismatched photos, pressure, aggressive behavior — the report button is on every profile. We review within 24 hours.",

  "seguridad.redFlags.title": "Red flags — cancel guilt-free.",
  "seguridad.redFlags.crypto":
    "Asks for payment in crypto, gift cards or international transfers",
  "seguridad.redFlags.changePlace":
    "Changes the meeting place at the last moment for no reason",
  "seguridad.redFlags.noCall":
    "Refuses a video call or voice call before meeting",
  "seguridad.redFlags.tooPolished":
    "Photos are too polished (run a reverse image search)",
  "seguridad.redFlags.substances":
    "Pushes drinks or substances you didn't request",

  "seguridad.emergency.title": "If something goes wrong, you're not alone.",
  "seguridad.emergency.body.lead": "Colombia Purple Line ·",
  "seguridad.emergency.body.purpleLine": "018000 112 137",
  "seguridad.emergency.body.mid":
    "— free, 24 hours, anonymous assistance for violence or coercion. For immediate emergencies dial",
  "seguridad.emergency.body.emergencyLine": "123",
  "seguridad.emergency.body.trailing":
    ". Platform reports are reviewed within 24 working hours.",
  "seguridad.emergency.cta.verification": "How we verify profiles",
  "seguridad.emergency.cta.explore": "Explore the verified catalog",

  /* =================================================================
   * Wave F · /legal/* (metadata only; body stays in ES — jurisdictional)
   * ================================================================= */

  "legal.terminos.metadata.title": "Terms & conditions — {brand}",
  "legal.terminos.metadata.description":
    "Platform terms of use. Marketplace rules, user responsibility and express prohibitions. Document under legal review.",
  "legal.privacidad.metadata.title": "Privacy policy — {brand}",
  "legal.privacidad.metadata.description":
    "Personal data processing policy. Purposes, data subject rights and how to exercise them. Document under legal review.",
  "legal.disputas.metadata.title": "Disputes & cancellations — {brand}",
  "legal.disputas.metadata.description":
    "Cancellation, refund and dispute resolution policy. Timelines, escalation and clear rules for both parties.",
  "legal.avisoLegal.metadata.title": "Legal notice — {brand}",
  "legal.avisoLegal.metadata.description":
    "Service operator identification, intellectual property, reporting channels and applicable regime. Document under legal review.",
  "legal.jurisdictionalNotice":
    "This document is governed by Colombian law and published in Spanish as its sole authentic version.",

  /* =================================================================
   * Wave F · errors / not-found / global-error
   * ================================================================= */

  "error.routeKicker": "Something went wrong",
  "error.routeTitle": "We hit a snag loading this page.",
  "error.routeBody":
    "It's on our side, not yours. Try again in a moment — if it keeps happening, drop us a note and we'll look into it.",
  "error.routeRetry": "Try again",
  "error.routeHome": "Back to home",
  "error.ref": "Ref:",

  "notFound.title": "404",
  "notFound.body": "The page you're looking for doesn't exist.",
  "notFound.cta": "Back to home",

  "error.globalKicker": "Unexpected error",
  "error.globalTitle": "Something broke on our end.",
  "error.globalBody":
    "We're on it. Try reloading — if it keeps failing, try again in a few minutes.",
  "error.globalRetry": "Try again",

  /* =================================================================
   * E.3 · /verificacion + /verificacion/enviar
   * ================================================================= */

  "verificacion.metadata.title":
    "2-layer verification — how we make sure it's real",
  "verificacion.metadata.description":
    "Every featured Biringas profile goes through identity verification and documented image consent. Here we explain the process step by step.",
  "verificacion.kicker": "2-layer verification",
  "verificacion.title.lead": "Every profile you see here",
  "verificacion.title.highlight": "passed through a real person",
  "verificacion.subtitle":
    "No bots, no catfish, no auto-generated profiles. The gold shield badge isn't bought — it's earned with two independent layers of human verification.",
  "verificacion.steps.title": "How the process works.",
  "verificacion.step.identity.eyebrow": "Layer 1",
  "verificacion.step.identity.title": "Identity",
  "verificacion.step.identity.body":
    "We upload an official current ID and cross-check against the civil registry. If the data doesn't match, the profile isn't published — not even as a draft.",
  "verificacion.step.selfie.eyebrow": "Layer 2",
  "verificacion.step.selfie.title": "Live selfie + consent",
  "verificacion.step.selfie.body":
    "Remote verification with a team member (not a bot). We confirm face vs. ID and record explicit consent to publish photos.",
  "verificacion.step.result.eyebrow": "Result",
  "verificacion.step.result.title": "Gold badge",
  "verificacion.step.result.body":
    "The gold shield appears on the profile only when both layers cleared. If one expires, the badge disappears automatically until renewed.",

  "verificacion.privacy.title": "Your identity isn't linked to your profile.",
  "verificacion.privacy.body":
    "The team that verifies documents doesn't have access to the public profile content. The team that publishes photos doesn't see the document. Only the verification hash connects both sides — and it's deleted along with the account if you decide to opt out.",

  "verificacion.faq.title": "Frequently asked questions.",
  "verificacion.faq.q1.q": "How long does verification take?",
  "verificacion.faq.q1.a":
    "90% of profiles are verified in under 24 working hours. If there are doubts about the document, we'll reach out for a second review.",
  "verificacion.faq.q2.q": "What happens if a profile fails verification?",
  "verificacion.faq.q2.a":
    "It's not published. The profile stays as a draft and the person can correct the data or cancel the process without anything going public.",
  "verificacion.faq.q3.q": "Do you store my document?",
  "verificacion.faq.q3.a":
    "Encrypted at rest and never shared with third parties. The copy is automatically deleted six months after verification; we only keep the hash for future renewals.",
  "verificacion.faq.q4.q": "Can photos be faked?",
  "verificacion.faq.q4.a":
    "The documented image consent and the live-selfie verification prevent third parties from uploading photos without permission. Each profile photo has a timestamp shown as «Photo verified · month year».",
  "verificacion.faq.q5.q":
    "Does verification guarantee a good experience?",
  "verificacion.faq.q5.a":
    "It guarantees the person is real and published with consent. The quality of the encounter depends on communication, clear expectations and mutual respect — that's what reviews and messaging are for.",
  "verificacion.cta.publishQuestion":
    "Are you a companion and want to appear verified?",
  "verificacion.cta.publishLink": "Publish your verified profile",

  "verificacion.modeloCta.approved": "Your identity is already verified",
  "verificacion.modeloCta.pending": "Your verification is under review",
  "verificacion.modeloCta.start": "Verify my identity",

  /* /verificacion/enviar (wizard) */
  "verificacion.enviar.metadata.title": "Verify your identity — Biringas",
  "verificacion.enviar.metadata.description":
    "Upload your ID (front + back) and a selfie holding it. The Biringas team validates every profile before approving it in the catalog.",
  "verificacion.enviar.title": "Verify your identity",
  "verificacion.enviar.subtitle":
    "Three files. Five minutes. Your profile goes into review and activates in the catalog when we confirm it's you.",

  "verificacion.wizard.step.front.title": "Document — front",
  "verificacion.wizard.step.front.description":
    "Upload a clear photo of the front of your ID or passport.",
  "verificacion.wizard.step.front.helper":
    "Make sure all data is readable. JPG, PNG, WebP or HEIC. We compress in-browser to protect you; no metadata leaves your device.",
  "verificacion.wizard.step.back.title": "Document — back",
  "verificacion.wizard.step.back.description":
    "Now the back of the same document.",
  "verificacion.wizard.step.back.helper":
    "The ID number and holograms must be visible. If your document is single-sided, repeat the front photo here.",
  "verificacion.wizard.step.selfie.title": "Selfie with document",
  "verificacion.wizard.step.selfie.description":
    "A photo of you holding the document next to your face.",
  "verificacion.wizard.step.selfie.helper":
    "Your face and the document must appear in the same shot without covering data. This is the most important layer: it confirms you are the person on the document.",

  "verificacion.wizard.upload": "Upload file",
  "verificacion.wizard.uploading": "Uploading",
  "verificacion.wizard.compressing": "Compressing",
  "verificacion.wizard.ready": "Ready",
  "verificacion.wizard.retry": "Retry",
  "verificacion.wizard.privacyHint":
    "Your files stay private. Only the Biringas team can view them, for a limited time, during review.",
  "verificacion.wizard.submit": "Submit verification",
  "verificacion.wizard.submitting": "Submitting…",
  "verificacion.wizard.error.format":
    "Format not allowed. Use JPG, PNG, WebP or HEIC.",
  "verificacion.wizard.error.tooBig":
    "The file is larger than 40 MB before compression.",
  "verificacion.wizard.error.upload": "We couldn't upload this file.",
  "verificacion.wizard.error.completeAll":
    "Complete all three files before submitting.",
  "verificacion.wizard.error.noSession": "Your session expired. Sign in again.",
  "verificacion.wizard.error.permissionDenied":
    "One or more files aren't yours. Upload them again.",
  "verificacion.wizard.error.pendingReview":
    "You already have a verification under review. Wait for the response before resubmitting.",
  "verificacion.wizard.error.submitDefault":
    "We couldn't submit the verification. Try again.",
  "verificacion.wizard.error.documentNumberInvalid":
    "The document number is too short or too long. Make sure it's complete.",
  "verificacion.wizard.error.duplicateDocument":
    "That document is already registered on another account. If you think this is a mistake, contact support.",
  "verificacion.wizard.previousRejection": "Previous verification rejected:",

  "verificacion.wizard.doc.kicker": "Document details",
  "verificacion.wizard.doc.title": "Structured identity",
  "verificacion.wizard.doc.subtitle":
    "We capture the type and number of your ID document to prevent duplicate registrations. The number stays private — only the review team sees it.",
  "verificacion.wizard.doc.typeLabel": "Document type",
  "verificacion.wizard.doc.type.CC": "ID card (CC)",
  "verificacion.wizard.doc.type.CE": "Foreign ID (CE)",
  "verificacion.wizard.doc.type.PASSPORT": "Passport",
  "verificacion.wizard.doc.numberLabel": "Document number",
  "verificacion.wizard.doc.numberHelper":
    "Enter the number exactly as it appears on the document. We strip dots and spaces automatically.",
  "verificacion.wizard.doc.normalizedHint": "Stored as",
  "verificacion.wizard.doc.placeholder.cc": "1.234.567",
  "verificacion.wizard.doc.placeholder.ce": "1234567",
  "verificacion.wizard.doc.placeholder.passport": "AB123456",

  "verificacion.wizard.submitted.title": "Verification submitted",
  "verificacion.wizard.submitted.body":
    "Your files are under review. We confirm identity and consent usually within 24 hours. When it's ready we'll let you know on WhatsApp and your profile goes live in the catalog.",
  "verificacion.wizard.backToCatalog": "Back to the catalog",
  "verificacion.wizard.continueToNext": "Continue with your listing",
  "verificacion.wizard.pending.title": "Verification under review",
  "verificacion.wizard.pending.body":
    "We received your documentation on {when}. We'll let you know as soon as it's ready.",
  "verificacion.wizard.approved.title": "Identity verified",
  "verificacion.wizard.approved.body":
    "Your verification was approved on {when}. Companions with verified identity appear with the gold badge in the catalog.",
  "verificacion.wizard.readonly.pendingNotice":
    "We're reviewing these documents. You can't edit them while verification is in progress.",
  "verificacion.wizard.readonly.approvedNotice":
    "These are the documents your identity was verified with.",
  "verificacion.wizard.readonly.documentSectionTitle": "Submitted document",
  "verificacion.wizard.readonly.docTypeLabel": "Document type",
  "verificacion.wizard.readonly.docNumberLabel": "Number (last 4)",
  "verificacion.wizard.readonly.documentFront": "Document front",
  "verificacion.wizard.readonly.documentBack": "Document back",
  "verificacion.wizard.readonly.selfie": "Selfie with document",

  /* =================================================================
   * D.2 · /p/[slug] deep components
   * ================================================================= */

  /* BookingRequestModal */
  "booking.cta": "Book this encounter",
  "booking.modal.title": "Book with {name}",
  "booking.modal.subtitle":
    "Your proposal arrives as a request; she confirms date and details before any payment.",
  "booking.modal.close": "Close",
  "booking.modal.loading": "Loading…",
  "booking.field.date": "Date and time",
  "booking.field.date.help": "Only days with availability in her agenda are shown.",
  "booking.field.duration": "Duration",
  "booking.field.duration.overnight": "24 hours (overnight)",
  "booking.field.duration.hour.singular": "{n} hour",
  "booking.field.duration.hour.plural": "{n} hours",
  "booking.field.meetingType": "Type of encounter",
  "booking.meetingType.outcall.label": "Outcall",
  "booking.meetingType.outcall.help": "She comes to the agreed location",
  "booking.meetingType.incall.label": "Incall",
  "booking.meetingType.incall.help": "You go to her place",
  "booking.meetingType.videocall.label": "Video call",
  "booking.meetingType.videocall.help": "100% remote",
  "booking.field.contact": "How would you like her to reach out?",
  "booking.contact.whatsapp": "WhatsApp",
  "booking.contact.telegram": "Telegram",
  "booking.contact.platform": "Biringas messaging",
  "booking.field.message": "Message for her",
  "booking.field.message.placeholder":
    "Context of the encounter. Minimum {min} characters.",
  "booking.field.message.placeholderWithCity":
    "Context of the encounter (e.g. {city}, downtown hotel). Minimum {min} characters.",
  "booking.privacy":
    "Your identity and contact info are only shared with {name}.",
  "booking.submit": "Send request",
  "booking.submitting": "Sending…",
  "booking.toast.title": "Request sent",
  "booking.toast.body":
    "{name} will receive your proposal and confirm shortly.",
  "booking.error.disabled":
    "The booking system will be available very soon.",
  "booking.error.default": "We couldn't send the request.",
  "booking.anonymous.body":
    "To send a booking request, sign in with your account — your identity is never published and is only shared with her after confirmation.",
  "booking.anonymous.cta": "Sign in to book",
  "booking.anonymous.later": "Later",

  /* RateBiringaForm */
  "rate.success.title": "Thanks for your feedback",
  "rate.success.body.lead": "You rated {name} with",
  "rate.success.body.trailing":
    ". Your review is now part of the verified community.",
  "rate.success.another": "Send another review",
  "rate.anonymous.title": "Already met {name}?",
  "rate.anonymous.body":
    "Sign in with your account to leave a verified rating. Your identity is never published.",
  "rate.anonymous.cta": "Sign in to review",
  "rate.form.title": "Rate {name}",
  "rate.form.subtitle":
    "Your feedback helps other clients choose with confidence.",
  "rate.stars.aria": "Rating from 1 to 5 stars",
  "rate.stars.singular": "{n} star",
  "rate.stars.plural": "{n} stars",
  "rate.field.experience": "Your experience",
  "rate.field.experience.placeholder":
    "Tell us how your encounter with {name} went. Minimum {min} characters.",
  "rate.field.city": "City of the encounter",
  "rate.field.city.placeholder": "Bogotá",
  "rate.field.alias": "Alias (optional)",
  "rate.field.alias.placeholder": "Verified client",
  "rate.cancel": "Cancel",
  "rate.submit": "Publish review",
  "rate.submitting": "Publishing…",
  "rate.error.noRating": "Pick a star rating before submitting.",
  "rate.error.submit": "We couldn't publish your review. Try again.",

  /* ContactReveal */
  "contact.reveal.cta": "Reveal contact",
  "contact.reveal.revealing": "Revealing…",
  "contact.reveal.ariaLabel": "Reveal {name}'s contact",
  "contact.reveal.previewLabel": "Private channels",
  "contact.reveal.hint.authenticated":
    "Tap to show this profile's private channels.",
  "contact.reveal.hint.anonymous":
    "Sign in to see this profile's private channels.",
  "contact.reveal.error": "We couldn't reveal the contact. Try again.",
  "contact.reveal.empty":
    "This profile has no public channels available right now.",
  "contact.reveal.title": "Available channels",
  "contact.reveal.footer":
    "Greet with respect. Every interaction is logged.",
  "contact.reveal.whatsappGreeting": "Hi {name}, I saw your profile on Biringas.",
  "contact.reveal.channel.whatsapp": "WhatsApp",
  "contact.reveal.channel.llamada": "Call",
  "contact.reveal.channel.telegram": "Telegram",

  /* ReviewsSection */
  "reviews.empty.kicker": "Reviews",
  "reviews.empty.title": "No reviews published yet",
  "reviews.empty.body":
    "When verified clients share their experience with {name}, it will appear here.",
  "reviews.kicker": "Reviews · {count}",
  "reviews.title.lead": "What people who already met",
  "reviews.title.trailing": "have to say.",
  "reviews.subtitle":
    "Aggregate ratings per aspect, verified reviews and anonymous reactions. No names, no contacts — just real signal from those who already came through.",
  "reviews.score.over": "across {count} reviews",
  "reviews.score.recommend.lead": "",
  "reviews.score.recommend.trailing": "recommend this profile.",
  "reviews.distribution.title": "Distribution",
  "reviews.distribution.basis":
    "Calculated over {count} verified reviews.",
  "reviews.breakdown.title": "Rating per aspect",
  "reviews.criteria.trato": "Manners",
  "reviews.criteria.puntualidad": "Punctuality",
  "reviews.criteria.conversacion": "Conversation",
  "reviews.criteria.presentacion": "Presentation",
  "reviews.criteria.discrecion": "Discretion",
  "reviews.reactions.title": "Anonymous reactions",
  "reviews.reactions.hint": "No name, no contact. Just community signal.",
  "reviews.reactions.like": "Like",
  "reviews.reactions.dislike": "Dislike",
  "reviews.reactions.positiveRate": "{pct}% positive reactions",
  "reviews.filter.aria": "Filter reviews",
  "reviews.filter.all": "All",
  "reviews.filter.recent": "Recent",
  "reviews.filter.five": "5 stars",
  "reviews.filter.critical": "Critical",
  "reviews.filter.verified": "Verified",
  "reviews.empty.filter.lead":
    "No reviews under this filter yet. Try",
  "reviews.empty.filter.allLabel": "All",
  "reviews.toggle.less": "See fewer reviews",
  "reviews.toggle.more": "See {count} reviews",
  "reviews.card.verified": "verified",
  "reviews.card.helpful": "Helpful",
  "reviews.card.notHelpful": "Not helpful",
  "reviews.stars.aria": "Rating {value} out of 5",

  /* AvailabilityStrip */
  "availability.aria": "Weekly availability",
  "availability.title": "Availability",
  "availability.replies": "Replies in ~{min} min",
  "availability.state.available": "Available",
  "availability.state.ask": "Ask",
  "availability.state.busy": "Busy",
  "availability.legend.aria": "Availability legend",
  "availability.disclaimer":
    "Always confirm availability before traveling — schedules are indicative.",
  "availability.day.sun": "Sun",
  "availability.day.mon": "Mon",
  "availability.day.tue": "Tue",
  "availability.day.wed": "Wed",
  "availability.day.thu": "Thu",
  "availability.day.fri": "Fri",
  "availability.day.sat": "Sat",
  "availability.slot.morning": "Morning",
  "availability.slot.afternoon": "Afternoon",
  "availability.slot.evening": "Evening",

  /* ShareMenu */
  "share.cta": "Share",
  "share.preamble": "Check out this profile on Biringas:",
  "share.nativeTitle": "{name} on Biringas",
  "share.nativeText": "Check out this profile on Biringas: {name}",
  "share.option.whatsapp": "WhatsApp",
  "share.option.telegram": "Telegram",
  "share.option.copy": "Copy link",
  "share.option.copied": "Copied",

  /* ReportListingMenu */
  "report.trigger.aria": "Report {name}'s profile",
  "report.trigger.title": "Report profile",
  "report.modal.close": "Close",
  "report.modal.title": "Report {name}",
  "report.modal.subtitle":
    "Your report is confidential. We review every case.",
  "report.field.reason": "Reason",
  "report.reason.fake_photos": "Photos don't match",
  "report.reason.scam": "Possible scam",
  "report.reason.harassment": "Harassment or disrespect",
  "report.reason.minor_concern": "Safety concern",
  "report.reason.underage": "Possible minor",
  "report.reason.spam": "Spam or duplicate",
  "report.reason.other": "Other",
  "report.field.detail.required": "Detail (required)",
  "report.field.detail.optional": "Detail (optional)",
  "report.field.detail.placeholder":
    "Describe what happened. Any detail helps the review team.",
  "report.cancel": "Cancel",
  "report.submit": "Submit report",
  "report.submitting": "Sending…",
  "report.error.noReason": "Pick a reason.",
  "report.error.default": "We couldn't send the report. Try again.",
  "report.toast.title": "Report received",
  "report.toast.body":
    "Our safety team will review it. Thanks for helping us keep the community trustworthy.",

  /* SimilarProfiles */
  "similarProfiles.kicker": "Keep exploring",
  "similarProfiles.title": "Similar profiles",
  "similarProfiles.aria": "Similar profiles",

  /* RecentlyViewedStrip */
  "recentlyViewed.title": "Recently viewed",
  "recentlyViewed.clear": "Clear history",

  /* =================================================================
   * B.2 · /publicar wizard step contents
   * ================================================================= */

  "step.details.eyebrow": "Publication details",
  "step.details.title": "What people will see",
  "step.details.description":
    "This data appears on your catalog card. You can edit it any time.",
  "step.details.field.displayName": "Stage name",
  "step.details.field.displayName.placeholder": "e.g. Alma",
  "step.details.field.displayName.hint":
    "40 characters max. This is the name visitors will see.",
  "step.details.field.age": "Age",
  "step.details.field.age.placeholder": "18+",
  "step.details.field.age.hint": "We only accept profiles 18+.",
  "step.details.field.city": "Main city",
  "step.details.field.city.placeholder": "Pick a city",
  "step.details.field.category": "Category",
  "step.details.field.category.placeholder": "Pick a category",
  "step.details.field.category.hint":
    "Determines where your profile appears in the catalog.",
  "step.details.category.prepagos": "Escorts",
  "step.details.category.masajes": "Massage",
  "step.details.category.videollamadas": "Video calls",
  "step.details.field.price": "Hourly rate (COP)",
  "step.details.field.price.placeholder": "200000",
  "step.details.field.price.hint":
    "This is the public reference. You can offer packages in your description.",
  "step.details.field.slug": "Preferred URL",
  "step.details.field.slug.placeholder": "alma-medellin",
  "step.details.field.slug.hint":
    "Shows as biringas.co/p/your-url. No spaces, only letters and dashes.",
  "step.details.field.phone": "Private phone",
  "step.details.field.phone.placeholder": "+57 300 000 0000",
  "step.details.field.phone.hint":
    "Private. Never published. We use it for verification and inbound contact.",
  "step.details.attention.legend": "Attends to",
  "step.details.attention.hint":
    "Pick one or more. Visible in catalog filters.",
  "step.details.contact.legend": "Contact channel",
  "step.details.contact.hint":
    "How you accept to be reached when your number unlocks.",

  /* StepAttributes */
  "step.attributes.eyebrow": "Attributes",
  "step.attributes.title": "How you'll describe yourself physically",
  "step.attributes.description":
    "This data appears as the Attributes block on your public profile and feeds the catalog filters. Pick the closest option.",
  "step.attributes.country.label": "Country",
  "step.attributes.country.hint":
    "Your nationality — appears as a filter.",
  "step.attributes.ethnicity.label": "Ethnicity",
  "step.attributes.hair.label": "Hair",
  "step.attributes.height.label": "Height",
  "step.attributes.body.label": "Body",
  "step.attributes.breastSize.label": "Breast size",
  "step.attributes.breastType.label": "Breast type",
  "step.attributes.pubis.label": "Pubic style",
  "step.attributes.pubis.hint":
    "Optional for the public catalog; used only in search filters.",
  "step.attributes.languages.legend": "Languages",
  "step.attributes.languages.hint":
    "Pick the languages you can attend in. Optional.",

  /* StepPublish */
  "step.publish.eyebrow": "Publish",
  "step.publish.title.paid": "Pick your plan and visibility boosts",
  "step.publish.title.free": "Free launch · review what's coming",
  "step.publish.description.paid":
    "Essential gets you started. Featured is what most verified models pick. Premium keeps you on top.",
  "step.publish.description.free":
    "We're in launch mode — every approved profile is published at no cost. The plans below are what's coming when we turn on billing; for now they're informational.",
  "step.publish.freeBanner.title":
    "Free publication during launch",
  "step.publish.freeBanner.body":
    "Models who join now publish at no cost until we turn on paid plans. When that happens you'll get advance notice and the option to pick your plan; meanwhile you get all the base benefits.",
  "step.publish.billing.aria": "Billing frequency",
  "step.publish.billing.monthly.label": "Monthly",
  "step.publish.billing.monthly.sublabel": "Cancel anytime",
  "step.publish.billing.quarterly.label": "Quarterly",
  "step.publish.billing.quarterly.sublabel": "Up to 20% off",
  "step.publish.pkg.recommended": "Recommended",
  "step.publish.pkg.comingSoon": "Coming soon",
  "step.publish.pkg.perMonth": "/ month",
  "step.publish.pkg.quarterly":
    "{total} every 3 months · {pct}% savings",
  "step.publish.addons.title": "Optional boosts (one-time payment)",
  "step.publish.addons.hint.enabled":
    "Temporarily increase your visibility",
  "step.publish.addons.hint.disabled":
    "Available once we enable plans",
  "step.publish.addons.family.boost": "Visibility",
  "step.publish.addons.family.content": "Content / SEO",
  "step.publish.terms.legend": "Before publishing",
  "step.publish.terms.adult":
    "I confirm I am 18+ and have authorization over every photo I upload.",
  "step.publish.terms.terms":
    "I accept the Publishing Terms and Privacy Policy. My private number does not appear on my public profile.",

  /* StepDescription */
  "step.description.eyebrow": "Your story",
  "step.description.title": "What people will read and see",
  "step.description.description":
    "An honest description and good photos triple your response rate. Take your time here.",
  "step.description.shortBio.label": "Short description",
  "step.description.shortBio.placeholder":
    "A sentence that describes you. Shown below your main photo.",
  "step.description.shortBio.hint": "{count} / 120 characters",
  "step.description.bio.label": "About you",
  "step.description.bio.placeholder":
    "Tell who you are, what you enjoy, what the experience with you is like. No contact info — we add that in the next step.",
  "step.description.bio.hint":
    "{count} / 1200 characters · avoid phone numbers and external links.",
  "step.description.services.legend": "Included services",
  "step.description.services.hint":
    "Pick the services you offer. They appear as chips on your profile and connect with catalog filters.",
  "step.description.places.legend": "Meeting place",
  "step.description.places.hint":
    "Where you accept to meet. Shown as a search filter.",
  "step.description.toggle.faceVisible.label": "Face visible",
  "step.description.toggle.faceVisible.body":
    "Indicates you show your face in at least one photo.",
  "step.description.toggle.paymentByCard.label": "Card payment",
  "step.description.toggle.paymentByCard.body":
    "Your profile appears in the accepted-card filter.",
  "step.description.toggle.availableNow.label": "Available now",
  "step.description.toggle.availableNow.body":
    "Turn this on when you're available — it shows as urgent.",
  "step.description.gallery.title": "Photo gallery",
  "step.description.gallery.counter": "{count} / {max}",
  "step.description.gallery.uploading": "· {count} uploading",
  "step.description.gallery.helper":
    "Accepts JPG, PNG, WebP or HEIC. Your personal metadata is never shared.",
  "step.description.gallery.add.aria": "Add photo",
  "step.description.gallery.add.label": "Upload photo",
  "step.description.gallery.retryTooltip": "Retry upload",
  "step.description.gallery.removeTooltip": "Remove {name}",
  "step.description.videos.title": "Short videos (optional)",
  "step.description.videos.counter": "{count} / 2",
  "step.description.videos.uploading": "· {count} uploading",
  "step.description.videos.helper":
    "Up to 2 clips of 3 to 30 seconds. MP4 or WebM, max 35 MB each. Upload them as recorded — we don't compress in the browser.",
  "step.description.videos.add.aria": "Add video",
  "step.description.videos.add.label": "Upload video",

  /* C.2 · FiltersPanel deep section labels */
  "filters.section.priceAge.title": "Price and age",
  "filters.section.priceAge.eyebrow":
    "Refine by budget and age range.",
  "filters.priceLabel": "Price (COP / hour)",
  "filters.preset.price.cheap": "Budget",
  "filters.preset.price.standard": "Standard",
  "filters.preset.price.luxury": "Luxury",
  "filters.ageLabel": "Age",
  "filters.preset.age.young": "Younger",
  "filters.preset.age.twenties": "20s",
  "filters.preset.age.mature": "Mature",
  "filters.chip.card": "Card payment",
  "filters.section.attentionContact.title": "Audience and contact",
  "filters.section.attentionContact.eyebrow":
    "Who she attends and how she prefers to be contacted.",
  "filters.field.attention": "Attends to",
  "filters.field.contact": "Contact channel",
  "filters.section.meeting.title": "Meeting place",
  "filters.section.meeting.eyebrow": "Where you meet.",
  "filters.section.services.title": "Services",
  "filters.section.services.eyebrow":
    "What she offers — general and special.",
  "filters.field.servicesGeneral": "General services",
  "filters.field.servicesSpecial": "Special services",
  "filters.section.content.title": "Content",
  "filters.section.content.eyebrow":
    "Verification, video, audio and real reviews.",
  "filters.flag.verified": "Verified photos",
  "filters.flag.face": "Face visible",
  "filters.flag.video": "With videos",
  "filters.flag.audio": "With audio",
  "filters.flag.reviews": "With experiences",
  "filters.flag.now": "Available now",
  "filters.section.appearance.title": "Appearance",
  "filters.section.appearance.eyebrow":
    "Physical attributes: country, ethnicity, body.",
  "filters.appearance.country": "Country",
  "filters.appearance.ethnicity": "Ethnicity",
  "filters.appearance.hair": "Hair",
  "filters.appearance.height": "Height",
  "filters.appearance.body": "Body",
  "filters.appearance.breastSize": "Breast size",
  "filters.appearance.breastType": "Breast type",
  "filters.appearance.pubis": "Pubic style",
  "filters.section.clearAria": "Clear section",

  /* =================================================================
   * F.3 . polish sweep
   * ================================================================= */

  /* ---------- brand (used by the legacy `Hero` component) ---------- */
  "brand.slogan": "Get what you want, when you want it",
  "brand.homeHeroTitle": "Biringas",
  "brand.homeHeroSubtitle": "Get what you want, when you want it",
  "brand.primaryCta": "Explore Biringas",
  "brand.secondaryCta": "How it works",
  "brand.hero.eyebrow": "Companion marketplace . Colombia",
  "brand.hero.trust.verified": "Verified profiles",
  "brand.hero.trust.cities": "Coverage in 5 cities",
  "brand.hero.trust.adults": "Adults only (18+)",
  "brand.hero.title.aria": "Welcome heading",

  /* ---------- EditorialHero ---------- */
  "editorialHero.kicker.default": "Verified companions . Colombia",
  "editorialHero.rail.brand": "Biringas . Colombia . 2026",
  "editorialHero.live.online": "online now",
  "editorialHero.headline.line1": "Find your",
  "editorialHero.headline.highlight": "perfect Biringa",
  "editorialHero.headline.line3": "today",
  "editorialHero.stats.verifiedSuffix": "verified companions live today across",
  "editorialHero.stats.cities": "6 cities",
  "editorialHero.search.aria": "Search Biringas",
  "editorialHero.search.cityLabel": "City",
  "editorialHero.search.queryLabel": "Search",
  "editorialHero.search.queryPlaceholder": "Name, plan, service...",
  "editorialHero.search.submit": "Search",
  "editorialHero.trust.aria": "Guarantees",
  "editorialHero.trust.verification": "Human verification",
  "editorialHero.trust.payment": "Discreet payment",
  "editorialHero.trust.noBots": "No bots or catfish",
  "editorialHero.mosaicMobile.aria": "Editorial selection of Biringas",
  "editorialHero.marquee.aria": "Browse {label}",
  "editorialHero.chip.availableNow": "Available now",
  "editorialHero.chip.dinnerBogota": "Dinner in Bogota",
  "editorialHero.chip.weekendCartagena": "Weekend in Cartagena",
  "editorialHero.chip.topRated": "Top rated",
  "editorialHero.marquee.bogota": "Bogota . 142 live",
  "editorialHero.marquee.medellin": "Medellin . 88 live",
  "editorialHero.marquee.cartagena": "Cartagena . 41 live",
  "editorialHero.marquee.cali": "Cali . 37 live",
  "editorialHero.marquee.liveCheck": "Live verification",
  "editorialHero.marquee.realReviews": "Real reviews",
  "editorialHero.marquee.noBots": "No bots, no catfish",
  "editorialHero.marquee.discreetPayment": "Discreet payment available",
  "editorialHero.marquee.barranquilla": "Barranquilla . 24 live",
  "editorialHero.marquee.videocall": "Video call available",

  /* ---------- HeroCitySelect ---------- */
  "heroCitySelect.label": "City",
  "heroCitySelect.helper": "Choose a city",
  "heroCitySelect.cities.all": "All of Colombia",
  "heroCitySelect.cities.bogota": "Bogota",
  "heroCitySelect.cities.medellin": "Medellin",
  "heroCitySelect.cities.cartagena": "Cartagena",
  "heroCitySelect.cities.cali": "Cali",
  "heroCitySelect.cities.barranquilla": "Barranquilla",
  "heroCitySelect.cities.bucaramanga": "Bucaramanga",

  /* ---------- HeroMosaicCard ---------- */
  "heroMosaicCard.online": "Online",
  "heroMosaicCard.verified.aria": "Verified",
  "heroMosaicCard.rating.aria": "Rating {score} out of 5 stars",
  "heroMosaicCard.link.aria": "{name}, {age}, {city} - view profile",

  /* ---------- LuckyButton ---------- */
  "luckyButton.label": "I'm feeling lucky",
  "luckyButton.aria": "I'm feeling lucky - open a random profile",

  /* ---------- BookingDatePicker ---------- */
  "bookingDatePicker.day.aria.label": "{day} {date} {month}",
  "bookingDatePicker.day.aria.unavailable": " - no availability",
  "bookingDatePicker.day.today": "Today",
  "bookingDatePicker.day.aria.groupLabel": "Proposed day",
  "bookingDatePicker.slot.aria.groupLabel": "Time of day",
  "bookingDatePicker.slot.eyebrow": "Time",
  "bookingDatePicker.slot.morning": "Morning",
  "bookingDatePicker.slot.afternoon": "Afternoon",
  "bookingDatePicker.slot.evening": "Evening",
  "bookingDatePicker.slot.byRequest": "by request",
  "bookingDatePicker.slot.title.unavailable": "No availability for this time",
  "bookingDatePicker.slot.title.byRequest": "Available by request",
  "bookingDatePicker.slot.title.available": "Available",
  "bookingDatePicker.day.sun": "Sun",
  "bookingDatePicker.day.mon": "Mon",
  "bookingDatePicker.day.tue": "Tue",
  "bookingDatePicker.day.wed": "Wed",
  "bookingDatePicker.day.thu": "Thu",
  "bookingDatePicker.day.fri": "Fri",
  "bookingDatePicker.day.sat": "Sat",
  "bookingDatePicker.month.jan": "Jan",
  "bookingDatePicker.month.feb": "Feb",
  "bookingDatePicker.month.mar": "Mar",
  "bookingDatePicker.month.apr": "Apr",
  "bookingDatePicker.month.may": "May",
  "bookingDatePicker.month.jun": "Jun",
  "bookingDatePicker.month.jul": "Jul",
  "bookingDatePicker.month.aug": "Aug",
  "bookingDatePicker.month.sep": "Sep",
  "bookingDatePicker.month.oct": "Oct",
  "bookingDatePicker.month.nov": "Nov",
  "bookingDatePicker.month.dec": "Dec",

  /* ---------- VideoPlayer ---------- */
  "videoPlayer.unavailable.aria": "Video unavailable",
  "videoPlayer.unavailable.label": "Video unavailable",

  /* ---------- CardStackGallery ---------- */
  "cardStackGallery.role": "gallery",
  "cardStackGallery.bringToFront.aria": "Bring image {index} to the front",
  "cardStackGallery.image.alt": "{base} - image {index}",
  "cardStackGallery.prev.aria": "Previous image",
  "cardStackGallery.next.aria": "Next image",
  "cardStackGallery.tablist.aria": "Select image",
  "cardStackGallery.tab.aria": "Image {index}",
  "cardStackGallery.indicator": "Photo {index} of {total}",

  /* ---------- PremiumContentGrid ---------- */
  "premium.eyebrow": "Premium content",
  "premium.title.lead": "What",
  "premium.title.trailing": "saves for her subscribers.",
  "premium.subtitle.lead":
    "Unfiltered photos, private video and audios made for you.",
  "premium.subtitle.emphasis": "No paying in chat, no surprises.",
  "premium.tier.label": "Premium",
  "premium.tier.from": "From",
  "premium.tier.perMonth": "/ month",
  "premium.kind.photo": "Photo set",
  "premium.kind.video": "Private video",
  "premium.kind.audio": "Intimate audio",
  "premium.tile.subscribe": "Subscribe to view",
  "premium.tile.aria": "Subscribe to {name} to view {title}",
  "premium.perks.aria": "Subscription perks",
  "premium.perks.fresh": "Fresh content every week",
  "premium.perks.chat": "Priority chat with no waits",
  "premium.perks.cancel": "Cancel any time",
  "premium.post.photoTitle1": "Cabaret session . 18 photos",
  "premium.post.photoTeaser1":
    "Nighttime editorial at a boutique hotel. Unreleased for subscribers.",
  "premium.post.photoMeta1": "18 photos",
  "premium.post.videoTitle1": "Behind the scenes",
  "premium.post.videoTeaser1":
    "Four minutes of the previous set. No filters, no overdubs.",
  "premium.post.videoMeta1": "4:12",
  "premium.post.audioTitle1": "Whispering in your ear",
  "premium.post.audioTeaser1":
    "Binaural audio. Use headphones, slowly, taking your time.",
  "premium.post.audioMeta1": "6 audios",
  "premium.post.photoTitle2": "Boutique lingerie",
  "premium.post.photoTeaser2":
    "Colombian label. Three outfits handpicked by me.",
  "premium.post.photoMeta2": "24 photos",
  "premium.post.videoTitle2": "Dream date . POV",
  "premium.post.videoTeaser2":
    "The perfect date told in first person. Premium only.",
  "premium.post.videoMeta2": "7:08",
  "premium.post.photoTitle3": "What you don't see on my profile",
  "premium.post.photoTeaser3":
    "What the catalog doesn't show. Curated by me, for you.",
  "premium.post.photoMeta3": "12 photos",

  /* ---------- CompareDrawer ---------- */
  "compareDrawer.backdrop.aria": "Close comparison",
  "compareDrawer.dialog.aria": "Side-by-side comparison",
  "compareDrawer.eyebrow": "Versus mode",
  "compareDrawer.count": "{current} of {total} in comparison",
  "compareDrawer.clear": "Clear",
  "compareDrawer.close.aria": "Close comparison",
  "compareDrawer.quickAdd.label": "Add",
  "compareDrawer.quickAdd.title": "Add {name} to the comparison",
  "compareDrawer.empty.slot": "Slot {index}",
  "compareDrawer.remove.aria": "Remove {name}",
  "compareDrawer.footer.decide": "Decide",
  "compareDrawer.footer.gotoProfile": "Go to profile",
  "compareDrawer.crown.aria": "Best in this aspect",
  "compareDrawer.row.price": "Rate / hour",
  "compareDrawer.row.score": "Rating",
  "compareDrawer.row.reviews": "Reviews",
  "compareDrawer.row.verified": "Verified",
  "compareDrawer.row.available": "Available",
  "compareDrawer.row.video": "Video",
  "compareDrawer.row.audio": "Audio",
  "compareDrawer.row.languages": "Languages",
  "compareDrawer.row.services": "Services",
  "compareDrawer.value.yes": "Yes",
  "compareDrawer.value.no": "No",
  "compareDrawer.value.now": "Now",
  "compareDrawer.value.dash": "-",
  "compareDrawer.services.suffix": "in catalog",
  "compareDrawer.score.outOf": "/5",

  /* ---------- Dashboard . BookingInboxList ---------- */
  "dashboard.inbox.status.pending": "Pending",
  "dashboard.inbox.status.confirmed": "Confirmed",
  "dashboard.inbox.status.declined": "Declined",
  "dashboard.inbox.status.cancelled": "Cancelled",
  "dashboard.inbox.status.completed": "Completed",
  "dashboard.inbox.meeting.outcall": "At your place",
  "dashboard.inbox.meeting.incall": "At her place",
  "dashboard.inbox.meeting.videocall": "Video call",
  "dashboard.inbox.contact.whatsapp": "WhatsApp",
  "dashboard.inbox.contact.telegram": "Telegram",
  "dashboard.inbox.contact.platform": "Biringas messaging",
  "dashboard.inbox.empty.title": "No requests yet",
  "dashboard.inbox.empty.body":
    "When someone sends a proposal to your profile, you will see it here with every detail before accepting or declining.",
  "dashboard.inbox.filter.aria": "Filter requests",
  "dashboard.inbox.filter.all": "All",
  "dashboard.inbox.filter.pending": "Pending",
  "dashboard.inbox.filter.confirmed": "Confirmed",
  "dashboard.inbox.filter.completed": "Completed",
  "dashboard.inbox.filter.declined": "Declined",
  "dashboard.inbox.noResults": "No results for this filter.",
  "dashboard.inbox.toast.confirmed": "Booking confirmed",
  "dashboard.inbox.toast.declined": "Booking declined",
  "dashboard.inbox.toast.completed": "Booking marked as completed",
  "dashboard.inbox.toast.errorTitle": "We couldn't update the booking",
  "dashboard.inbox.toast.errorBody": "Try again in a moment.",
  "dashboard.inbox.received": "Received {when}",
  "dashboard.inbox.idHidden": "Requester ID hidden until confirmed",
  "dashboard.inbox.duration": "{hours}h . {type}",
  "dashboard.inbox.action.decline": "Decline",
  "dashboard.inbox.action.confirm": "Confirm",
  "dashboard.inbox.action.confirming": "Confirming...",
  "dashboard.inbox.action.markCompleted": "Mark as completed",

  /* ---------- Dashboard . ReferralCard ---------- */
  "dashboard.referral.eyebrow": "Referral program",
  "dashboard.referral.title.lead": "Every friend you invite is worth",
  "dashboard.referral.title.suffix": "for both of you.",
  "dashboard.referral.body":
    "Share your link. When your friend creates an account and uses your code, we credit them {reward} and you get the same amount to boost your profile.",
  "dashboard.referral.codeLabel": "Your code",
  "dashboard.referral.copy": "Copy link",
  "dashboard.referral.copied": "Copied",
  "dashboard.referral.share": "Share",
  "dashboard.referral.share.title": "Biringas",
  "dashboard.referral.share.text":
    "I'm inviting you to Biringas - {reward} credit when you sign up with my code.",
  "dashboard.referral.toast.copied": "Link copied",
  "dashboard.referral.toast.copyError": "We couldn't copy the link",
  "dashboard.referral.stats.invited": "People invited",
  "dashboard.referral.stats.credit": "Credit accrued",
  "dashboard.referral.redeem.title": "Have an invitation code?",
  "dashboard.referral.redeem.body":
    "Redeem it once to add {reward} credit and pay back the same amount to the friend who invited you.",
  "dashboard.referral.redeem.placeholder": "e.g. A4F9XK",
  "dashboard.referral.redeem.submit": "Redeem",
  "dashboard.referral.redeem.submitting": "Redeeming...",
  "dashboard.referral.redeem.validation": "Enter a valid code.",
  "dashboard.referral.redeem.errorFallback": "We couldn't redeem the code.",
  "dashboard.referral.redeem.toastTitle": "Code redeemed",
  "dashboard.referral.redeem.toastBody": "We credited {amount} to your account.",
  "dashboard.referral.alreadyRedeemed":
    "You've already redeemed a code. To earn more credit, invite your friends with your own link above.",

  /* ---------- Dashboard . AvailabilityToggle ---------- */
  "dashboard.availability.aria": "Availability now",
  "dashboard.availability.available": "Available now",
  "dashboard.availability.paused": "Paused",
  "dashboard.availability.toast.live": "You're visible as available now.",
  "dashboard.availability.toast.paused":
    "Paused - you no longer show as available now.",
  "dashboard.availability.toast.errorTitle":
    "We couldn't update your availability",
  "dashboard.availability.toast.errorBody": "Try again in a moment.",

  /* =================================================================
   * Wave G · age gate + catalog primitives + dashboard inline rate
   * ================================================================= */

  /* ---------- Age gate ---------- */
  "ageGate.kicker": "Age verification",
  "ageGate.title": "Adults only (18+)",
  "ageGate.body.prefix":
    "{brand} is a marketplace for adults. By continuing you confirm you are",
  "ageGate.body.emphasis": "18 years or older",
  "ageGate.body.suffix": "and agree to view adult content.",
  "ageGate.cta.confirm": "I'm 18 or older",
  "ageGate.cta.exit": "Leave the site",
  "ageGate.footer":
    "If you are a minor, please leave this site. This action will save a one-year cookie on this device.",

  /* ---------- Catalog cards (BiringaCard + CatalogCard) ---------- */
  "catalog.card.viewListing": "View listing",
  "catalog.card.viewProfile": "View profile",
  "catalog.card.featured": "Featured",
  "catalog.card.availableNow": "Available now",
  "catalog.card.availableNowShort": "Now",
  "catalog.card.withVideo": "Video included",
  "catalog.card.withAudio": "Audio included",
  "catalog.card.onlineNow": "Online now",
  "catalog.card.activeNow": "Active now",
  "catalog.card.respondsIn": "Replies ~{minutes}min",
  "catalog.card.verifiedProfile": "Verified profile",
  "catalog.card.verified": "Verified",
  "catalog.card.audio": "Audio",
  "catalog.card.ageSuffix": "y/o",
  "catalog.card.linkAria": "{name} in {city} — view profile",
  "catalog.card.imageAlt": "{name} in {city}",

  /* ---------- Quick presets row ---------- */
  "catalog.preset.section.aria": "Quick suggestions",
  "catalog.preset.section.eyebrow": "Suggestions",
  "catalog.preset.list.aria": "Quick filters",
  "catalog.preset.availableNow": "Available now",
  "catalog.preset.verified": "Verified",
  "catalog.preset.lowBudget": "Under $150k",
  "catalog.preset.faceVisible": "Face visible",
  "catalog.preset.topRated": "Top rated",
  "catalog.preset.withVideo": "With video",
  "catalog.preset.apply": "Apply preset: {label}",
  "catalog.preset.remove": "Remove preset: {label}",

  /* ---------- Active filter chips strip ---------- */
  "catalog.filterChips.aria": "Applied filters",
  "catalog.filterChips.remove": "Remove filter: {label}",
  "catalog.filterChips.clearAll": "Clear all",
  "catalog.filterChips.clearAll.aria": "Clear all filters",
  "catalog.filterChips.priceMin": "Min. {amount}",
  "catalog.filterChips.priceMax": "Max. {amount}",
  "catalog.filterChips.ageMin": "Age ≥ {age}",
  "catalog.filterChips.ageMax": "Age ≤ {age}",
  "catalog.filterChips.verified": "Verified",
  "catalog.filterChips.faceVisible": "Face visible",
  "catalog.filterChips.withVideo": "With video",
  "catalog.filterChips.withAudio": "With audio",
  "catalog.filterChips.withReviews": "With experiences",
  "catalog.filterChips.paymentByCard": "Card payment",
  "catalog.filterChips.availableNow": "Available now",
  "catalog.filterChips.attention": "Attends: {value}",
  "catalog.filterChips.contact": "Contact: {value}",

  /* ---------- Onboarding quiz ---------- */
  "onboarding.kicker": "Welcome",
  "onboarding.title.lead": "Find your Biringa in",
  "onboarding.title.highlight": "3 taps",
  "onboarding.skip": "Skip",
  "onboarding.close": "Close",
  "onboarding.step.indicator": "Step {current} of {total}",
  "onboarding.step1.title": "Which city are you in?",
  "onboarding.step1.subtitle":
    "We'll filter the catalog to only show what's nearby.",
  "onboarding.step2.title": "How much do you want to invest per hour?",
  "onboarding.step2.subtitle":
    "Just helps us sort. You can change it later.",
  "onboarding.step3.title": "What kind of plan do you have in mind?",
  "onboarding.step3.subtitle":
    "We'll take you straight to the catalog with the filter applied.",
  "onboarding.city.allColombia": "All of Colombia",
  "onboarding.budget.none": "No budget",
  "onboarding.budget.up200": "Up to $200k",
  "onboarding.budget.up400": "Up to $400k",
  "onboarding.budget.unlimited": "No cap",
  "onboarding.plan.live": "Something for today",
  "onboarding.plan.social": "Dinner / event",
  "onboarding.plan.trip": "Weekend getaway",
  "onboarding.plan.general": "Just browsing",

  /* ---------- Saved searches (Favoritas) ---------- */
  "savedSearches.title": "Saved searches",
  "savedSearches.subtitle": "Get back to your perfect filter in one click.",
  "savedSearches.empty.lead":
    "You haven't saved any searches yet. When you apply filters in",
  "savedSearches.empty.buttonHint.lead": ", you'll see a ",
  "savedSearches.empty.buttonName": "Save search",
  "savedSearches.empty.buttonHint.trailing": " button.",
  "savedSearches.savedOn": "Saved {date}",
  "savedSearches.remove": "Remove search {label}",

  /* ---------- Featured strip (home + aria) ---------- */
  "home.featured.aria": "Featured companions",
  "home.featured.title.default": "Verified companions for today",
  "home.featured.description.default":
    "A selection curated by reputation, presence and recent availability.",

  /* ---------- Loading + toast primitives ---------- */
  "loading.catalog": "Loading catalog…",
  "toast.dismiss": "Dismiss notification",
  "toast.region.aria": "Notifications",

  /* ---------- Dashboard · inline rate buyer ---------- */
  "dashboard.rateBuyer.label": "Rate the client",
  "dashboard.rateBuyer.scoreAria": "Rating from 1 to 5 stars",
  "dashboard.rateBuyer.stars.singular": "{value} star",
  "dashboard.rateBuyer.stars.plural": "{value} stars",
  "dashboard.rateBuyer.commentPlaceholder":
    "Private comment (optional). Read only by the moderation team.",
  "dashboard.rateBuyer.cancel": "Cancel",
  "dashboard.rateBuyer.submit": "Save",
  "dashboard.rateBuyer.submitting": "Saving…",
  "dashboard.rateBuyer.toast.success": "Client rated",
  "dashboard.rateBuyer.rated": "Rated · {value}/5",
  "dashboard.rateBuyer.error.required": "Pick a rating.",
  "dashboard.rateBuyer.error.bookingDisabled":
    "Mutual reviews go live once Firestore is ready.",
  "dashboard.rateBuyer.error.fallback":
    "We couldn't save the rating. Try again.",
};

const DICTIONARIES: Record<SupportedLocale, MessageDict> = {
  es,
  en,
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  es: "Español",
  en: "English",
};

/** Short two-letter label for the header switcher. */
export const LOCALE_SHORT: Record<SupportedLocale, string> = {
  es: "ES",
  en: "EN",
};

/**
 * Resolve a message by key for the active locale. Falls back to the
 * canonical Spanish dictionary if the key is missing in the chosen
 * locale, then to the raw key itself as last resort (so a typo is
 * visually obvious without crashing the surface).
 *
 * `{placeholder}` tokens are interpolated from the optional `values`
 * arg — strictly string-only, no formatNumber / plurals (that's the
 * job of the future library swap).
 */
export function t(
  locale: SupportedLocale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[brandConfig.defaultLocale];
  const fallback = DICTIONARIES[brandConfig.defaultLocale];
  const raw = dict[key] ?? fallback[key] ?? key;
  if (!values) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(values, k) ? String(values[k]) : m,
  );
}
