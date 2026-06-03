/**
 * Shapes for the catalog constants the wizard needs at the client. The page
 * (Server Component) reads them from `@/server/biringas` and passes them
 * down — keeps `server-only` happy without leaking provider types.
 */
export interface AttentionItem {
  id: "hombres" | "mujeres" | "parejas" | "discapacitados";
  label: string;
}
export interface ContactItem {
  id: "llamada" | "whatsapp" | "telegram";
  label: string;
}

/**
 * Mirrors the keys of the canonical `APPEARANCE_CATALOG` constant in
 * `src/server/mocks/biringas/data.ts`. Kept as a structural shape (rather
 * than `typeof APPEARANCE_CATALOG`) so this client-facing module stays free
 * of `server-only` imports — the page reads the canonical object and passes
 * it in.
 */
export interface AppearanceCatalogs {
  country: ReadonlyArray<string>;
  ethnicity: ReadonlyArray<string>;
  hair: ReadonlyArray<string>;
  height: ReadonlyArray<string>;
  body: ReadonlyArray<string>;
  breastSize: ReadonlyArray<string>;
  breastType: ReadonlyArray<string>;
  pubis: ReadonlyArray<string>;
}

/**
 * Colombia location taxonomy (Department → City → Locality), passed from the
 * server as plain data. Structural shape (mirrors `ColombiaDepartment`) so this
 * client-facing module stays free of server imports.
 */
export interface LocationCity {
  name: string;
  localities: ReadonlyArray<string>;
}
export interface LocationDepartment {
  name: string;
  cities: ReadonlyArray<LocationCity>;
}

export interface EnrollmentCatalogs {
  cities: ReadonlyArray<string>;
  /** Department → City → Locality, for the cascading location picker. */
  locations: ReadonlyArray<LocationDepartment>;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  attention: ReadonlyArray<AttentionItem>;
  contact: ReadonlyArray<ContactItem>;
  appearance: AppearanceCatalogs;
  languages: ReadonlyArray<string>;
}
