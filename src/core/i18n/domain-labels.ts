/**
 * Display-only translation maps for domain catalog values that are
 * stored in Firestore + used as filter-URL params in canonical Spanish.
 *
 * The canonical value (Spanish) stays the source of truth — it's what
 * is persisted, what flows through `ListingsFilters`, and what shows
 * up in `/explorar?service=…` URLs. These maps only translate the
 * label that the user sees, falling back to the canonical value when
 * a translation is missing (so a new service added in Firestore still
 * renders sanely on every locale until the dictionary is updated).
 *
 * Neutral file — no `server-only` import — so it can be used from both
 * Server Components (e.g. FiltersPanel) and Client Components (e.g.
 * ActiveFilterChips rendered via the dashboard's client trees).
 */
import type { SupportedLocale } from "@/core/branding/brand-config";

type LocaleMap = Partial<Record<SupportedLocale, string>>;

/** SERVICES — canonical Spanish (matches SERVICE_CATALOG in `src/server/mocks/biringas/data.ts`). */
const SERVICES: Record<string, LocaleMap> = {
  "Actriz porno": { en: "Porn actress", pt: "Atriz pornô" },
  "Besos boca": { en: "French kisses", pt: "Beijos na boca" },
  "Eyaculación cuerpo": { en: "Body finish", pt: "Ejaculação no corpo" },
  "Eyaculación facial": { en: "Facial finish", pt: "Ejaculação facial" },
  "Fantasías y disfraces": {
    en: "Fantasies and roleplay",
    pt: "Fantasias e fantasias",
  },
  "Masajes eróticos": { en: "Erotic massages", pt: "Massagens eróticas" },
  "Oral completo": { en: "Full oral", pt: "Oral completo" },
  "Oral con condón": { en: "Oral with condom", pt: "Oral com camisinha" },
  "Oral natural": { en: "Bareback oral", pt: "Oral sem camisinha" },
  "Sexo anal": { en: "Anal sex", pt: "Sexo anal" },
  "Trato de novia": { en: "Girlfriend experience", pt: "Tratamento de namorada" },
};

/** SPECIAL SERVICES. */
const SPECIAL_SERVICES: Record<string, LocaleMap> = {
  "Beso blanco": { en: "White kiss", pt: "Beijo branco" },
  "Beso negro": { en: "Black kiss", pt: "Beijo grego" },
  "Fetichismo": { en: "Fetish", pt: "Fetichismo" },
  "Garganta profunda": { en: "Deep throat", pt: "Garganta profunda" },
  "Lluvia dorada": { en: "Golden shower", pt: "Chuva dourada" },
  "Sado duro": { en: "Hard BDSM", pt: "Sadomasoquismo pesado" },
  "Sado suave": { en: "Soft BDSM", pt: "Sadomasoquismo leve" },
  "Squirting": { en: "Squirting", pt: "Squirting" },
  "Strap on": { en: "Strap-on", pt: "Strap-on" },
};

/** MEETING CONTEXTS. */
const MEETING_CONTEXTS: Record<string, LocaleMap> = {
  "A domicilio": { en: "Outcall", pt: "A domicílio" },
  "Apartamento propio": { en: "Her apartment", pt: "Apartamento próprio" },
  "Cena romántica": { en: "Romantic dinner", pt: "Jantar romântico" },
  "Despedidas soltero": { en: "Bachelor parties", pt: "Despedidas de solteiro" },
  "Eventos y fiestas": { en: "Events and parties", pt: "Eventos e festas" },
  "Hotel / Motel": { en: "Hotel / Motel", pt: "Hotel / Motel" },
  "Viajes": { en: "Travel", pt: "Viagens" },
};

/** ATTENTION TARGETS — keyed by id (matches `AttentionTarget`). */
const ATTENTION: Record<string, LocaleMap> = {
  hombres: { es: "Hombres", en: "Men", pt: "Homens" },
  mujeres: { es: "Mujeres", en: "Women", pt: "Mulheres" },
  parejas: { es: "Parejas", en: "Couples", pt: "Casais" },
  discapacitados: {
    es: "Discapacitados",
    en: "People with disabilities",
    pt: "Pessoas com deficiência",
  },
};

/** CONTACT CHANNELS — keyed by id (matches `ContactChannel`). */
const CONTACTS: Record<string, LocaleMap> = {
  llamada: { es: "Llamada", en: "Call", pt: "Ligação" },
  whatsapp: { es: "WhatsApp", en: "WhatsApp", pt: "WhatsApp" },
  telegram: { es: "Telegram", en: "Telegram", pt: "Telegram" },
};

/** APPEARANCE — every value across every attribute key (country / ethnicity / hair / …). */
const APPEARANCE: Record<string, LocaleMap> = {
  // country
  "Colombianas": { en: "Colombian", pt: "Colombianas" },
  "Venezolanas": { en: "Venezuelan", pt: "Venezuelanas" },
  "Otras": { en: "Other", pt: "Outras" },
  // ethnicity
  "Morenas": { en: "Brunette", pt: "Morenas" },
  "Piel blanca": { en: "Fair skin", pt: "Pele branca" },
  "Trigueñas": { en: "Olive skin", pt: "Trigueiras" },
  // hair
  "Pelinegras": { en: "Black hair", pt: "Cabelo preto" },
  "Rubias": { en: "Blonde", pt: "Loiras" },
  "Pelirrojas": { en: "Redhead", pt: "Ruivas" },
  // height
  "Altas": { en: "Tall", pt: "Altas" },
  "Bajitas": { en: "Petite", pt: "Baixinhas" },
  // body
  "Delgadas": { en: "Slim", pt: "Magras" },
  "Cuerpos Fitness": { en: "Fitness body", pt: "Corpos fitness" },
  "Gorditas": { en: "Curvy", pt: "Gordinhas" },
  // breast
  "Pechos naturales": { en: "Natural breasts", pt: "Peitos naturais" },
  "Tetonas": { en: "Big breasts", pt: "Peitudas" },
  // pubis
  "Depiladas": { en: "Shaved", pt: "Depiladas" },
  "Sin depilar": { en: "Natural", pt: "Sem depilar" },
};

/** PROFILE TAGS — short marketing labels rendered on cards + profile chips. */
const TAGS: Record<string, LocaleMap> = {
  Bilingüe: { en: "Bilingual", pt: "Bilíngue" },
  Cam: { en: "Cam", pt: "Cam" },
  Costeña: { en: "Coastal", pt: "Costeira" },
  Discreta: { en: "Discreet", pt: "Discreta" },
  Disponible: { en: "Available", pt: "Disponível" },
  Ejecutiva: { en: "Executive", pt: "Executiva" },
  Experimentada: { en: "Experienced", pt: "Experiente" },
  Fitness: { en: "Fitness", pt: "Fitness" },
  Joven: { en: "Young", pt: "Jovem" },
  Masajes: { en: "Massages", pt: "Massagens" },
  Nueva: { en: "New", pt: "Nova" },
  Online: { en: "Online", pt: "Online" },
  Parejas: { en: "Couples", pt: "Casais" },
  Premium: { en: "Premium", pt: "Premium" },
  "Trato de Novia": {
    en: "Girlfriend experience",
    pt: "Experiência de namorada",
  },
  VIP: { en: "VIP", pt: "VIP" },
};

/** LANGUAGES — canonical Spanish (matches LANGUAGE_CATALOG). */
const LANGUAGES: Record<string, LocaleMap> = {
  "Español": { en: "Spanish", pt: "Espanhol" },
  "Inglés": { en: "English", pt: "Inglês" },
  "Portugués": { en: "Portuguese", pt: "Português" },
  "Francés": { en: "French", pt: "Francês" },
  "Italiano": { en: "Italian", pt: "Italiano" },
  "Alemán": { en: "German", pt: "Alemão" },
};

function lookup(
  map: Record<string, LocaleMap>,
  locale: SupportedLocale,
  value: string,
): string {
  return map[value]?.[locale] ?? value;
}

export function translateService(locale: SupportedLocale, value: string) {
  return lookup(SERVICES, locale, value);
}

export function translateSpecialService(
  locale: SupportedLocale,
  value: string,
) {
  return lookup(SPECIAL_SERVICES, locale, value);
}

export function translateMeetingContext(
  locale: SupportedLocale,
  value: string,
) {
  return lookup(MEETING_CONTEXTS, locale, value);
}

export function translateAttention(locale: SupportedLocale, id: string) {
  return lookup(ATTENTION, locale, id);
}

export function translateContact(locale: SupportedLocale, id: string) {
  return lookup(CONTACTS, locale, id);
}

export function translateAppearance(locale: SupportedLocale, value: string) {
  return lookup(APPEARANCE, locale, value);
}

export function translateLanguage(locale: SupportedLocale, value: string) {
  return lookup(LANGUAGES, locale, value);
}

export function translateTag(locale: SupportedLocale, value: string) {
  return lookup(TAGS, locale, value);
}
