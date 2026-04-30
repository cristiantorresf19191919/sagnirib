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

export interface EnrollmentCatalogs {
  cities: ReadonlyArray<string>;
  services: ReadonlyArray<string>;
  meetingContexts: ReadonlyArray<string>;
  attention: ReadonlyArray<AttentionItem>;
  contact: ReadonlyArray<ContactItem>;
}
