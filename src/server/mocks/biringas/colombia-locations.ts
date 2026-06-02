/**
 * Hardcoded Colombia location taxonomy: Department → principal City → Locality.
 *
 * Deliberately HARDCODED (not stored in Firestore) so the catalog and the
 * publish wizard share one zero-cost source of truth. A listing persists only
 * its `city` (and optional `neighborhood` as the locality); the **department
 * is derived** from the city via this map, so we never store it — that keeps
 * the Firestore document to a single location string while still allowing
 * department-level filtering.
 *
 * City names in this curated principal-cities set are unique across
 * departments, so `getDepartmentForCity` is unambiguous. Localities are only
 * populated for the major cities (where a zone is meaningful for discovery);
 * everywhere else the third level is simply absent.
 */

export interface ColombiaCity {
  name: string;
  /** Localities / comunas / zonas. Empty when the city has no useful subdivision. */
  localities: ReadonlyArray<string>;
}

export interface ColombiaDepartment {
  name: string;
  cities: ReadonlyArray<ColombiaCity>;
}

const city = (name: string, localities: ReadonlyArray<string> = []): ColombiaCity => ({
  name,
  localities,
});

// Major-city localities (Bogotá localidades; Medellín/Cali/Barranquilla/Cartagena
// recognizable zones) — the ones a client actually searches by.
const BOGOTA_LOCALIDADES = [
  "Usaquén",
  "Chapinero",
  "Santa Fe",
  "San Cristóbal",
  "Usme",
  "Tunjuelito",
  "Bosa",
  "Kennedy",
  "Fontibón",
  "Engativá",
  "Suba",
  "Barrios Unidos",
  "Teusaquillo",
  "Los Mártires",
  "Antonio Nariño",
  "Puente Aranda",
  "La Candelaria",
  "Rafael Uribe Uribe",
  "Ciudad Bolívar",
  "Sumapaz",
];

const MEDELLIN_ZONAS = [
  "El Poblado",
  "Laureles-Estadio",
  "Belén",
  "La América",
  "Robledo",
  "Castilla",
  "Aranjuez",
  "Manrique",
  "Buenos Aires",
  "La Candelaria (Centro)",
  "Villa Hermosa",
  "San Javier",
  "Guayabal",
  "Doce de Octubre",
];

const CALI_ZONAS = [
  "Granada",
  "San Antonio",
  "El Peñón",
  "Centro",
  "Versalles",
  "Santa Mónica",
  "Ciudad Jardín",
  "El Ingenio",
  "Pance",
  "San Fernando",
  "La Flora",
];

const BARRANQUILLA_ZONAS = [
  "Riomar",
  "Norte-Centro Histórico",
  "El Prado",
  "Alto Prado",
  "Boston",
  "Sur Occidente",
  "Metropolitana",
];

const CARTAGENA_ZONAS = [
  "Bocagrande",
  "Centro Histórico",
  "Getsemaní",
  "Manga",
  "Crespo",
  "La Boquilla",
  "El Laguito",
  "Castillogrande",
];

export const COLOMBIA_LOCATIONS: ReadonlyArray<ColombiaDepartment> = [
  { name: "Bogotá D.C.", cities: [city("Bogotá", BOGOTA_LOCALIDADES)] },
  {
    name: "Antioquia",
    cities: [
      city("Medellín", MEDELLIN_ZONAS),
      city("Bello"),
      city("Itagüí"),
      city("Envigado"),
      city("Rionegro"),
      city("Apartadó"),
    ],
  },
  {
    name: "Valle del Cauca",
    cities: [
      city("Cali", CALI_ZONAS),
      city("Palmira"),
      city("Buenaventura"),
      city("Tuluá"),
      city("Cartago"),
      city("Buga"),
    ],
  },
  {
    name: "Atlántico",
    cities: [
      city("Barranquilla", BARRANQUILLA_ZONAS),
      city("Soledad"),
      city("Malambo"),
      city("Sabanalarga"),
    ],
  },
  {
    name: "Bolívar",
    cities: [city("Cartagena", CARTAGENA_ZONAS), city("Magangué"), city("Turbaco")],
  },
  {
    name: "Santander",
    cities: [
      city("Bucaramanga"),
      city("Floridablanca"),
      city("Girón"),
      city("Piedecuesta"),
      city("Barrancabermeja"),
    ],
  },
  {
    name: "Cundinamarca",
    cities: [
      city("Soacha"),
      city("Chía"),
      city("Zipaquirá"),
      city("Facatativá"),
      city("Fusagasugá"),
      city("Girardot"),
      city("Mosquera"),
      city("Madrid"),
      city("Funza"),
    ],
  },
  {
    name: "Norte de Santander",
    cities: [city("Cúcuta"), city("Ocaña"), city("Pamplona"), city("Villa del Rosario")],
  },
  {
    name: "Risaralda",
    cities: [city("Pereira"), city("Dosquebradas"), city("Santa Rosa de Cabal")],
  },
  { name: "Quindío", cities: [city("Armenia"), city("Calarcá"), city("Montenegro")] },
  { name: "Caldas", cities: [city("Manizales"), city("La Dorada"), city("Chinchiná")] },
  {
    name: "Tolima",
    cities: [city("Ibagué"), city("Espinal"), city("Honda"), city("Melgar")],
  },
  {
    name: "Huila",
    cities: [city("Neiva"), city("Pitalito"), city("Garzón")],
  },
  {
    name: "Boyacá",
    cities: [city("Tunja"), city("Duitama"), city("Sogamoso"), city("Chiquinquirá")],
  },
  {
    name: "Nariño",
    cities: [city("Pasto"), city("Tumaco"), city("Ipiales")],
  },
  {
    name: "Cauca",
    cities: [city("Popayán"), city("Santander de Quilichao")],
  },
  {
    name: "Córdoba",
    cities: [city("Montería"), city("Cereté"), city("Lorica"), city("Sahagún")],
  },
  {
    name: "Magdalena",
    cities: [city("Santa Marta"), city("Ciénaga"), city("Fundación")],
  },
  {
    name: "Cesar",
    cities: [city("Valledupar"), city("Aguachica")],
  },
  {
    name: "Sucre",
    cities: [city("Sincelejo"), city("Corozal")],
  },
  {
    name: "La Guajira",
    cities: [city("Riohacha"), city("Maicao"), city("Uribia")],
  },
  {
    name: "Meta",
    cities: [city("Villavicencio"), city("Acacías"), city("Granada (Meta)")],
  },
  {
    name: "Casanare",
    cities: [city("Yopal"), city("Aguazul"), city("Villanueva")],
  },
  {
    name: "Caquetá",
    cities: [city("Florencia"), city("San Vicente del Caguán")],
  },
  {
    name: "Putumayo",
    cities: [city("Mocoa"), city("Puerto Asís")],
  },
  {
    name: "Chocó",
    cities: [city("Quibdó"), city("Istmina")],
  },
  {
    name: "Arauca",
    cities: [city("Arauca"), city("Tame"), city("Saravena")],
  },
  {
    name: "Amazonas",
    cities: [city("Leticia"), city("Puerto Nariño")],
  },
  {
    name: "San Andrés y Providencia",
    cities: [city("San Andrés"), city("Providencia")],
  },
  { name: "Guaviare", cities: [city("San José del Guaviare")] },
  { name: "Guainía", cities: [city("Inírida")] },
  { name: "Vaupés", cities: [city("Mitú")] },
  { name: "Vichada", cities: [city("Puerto Carreño")] },
];

/** Department names, in display order. */
export const DEPARTMENT_NAMES: ReadonlyArray<string> = COLOMBIA_LOCATIONS.map(
  (d) => d.name,
);

/** Flat list of every city name (display order: by department). */
export const ALL_CITIES: ReadonlyArray<string> = COLOMBIA_LOCATIONS.flatMap((d) =>
  d.cities.map((c) => c.name),
);

const CITY_TO_DEPARTMENT = new Map<string, string>(
  COLOMBIA_LOCATIONS.flatMap((d) => d.cities.map((c) => [c.name, d.name] as const)),
);

const CITY_TO_LOCALITIES = new Map<string, ReadonlyArray<string>>(
  COLOMBIA_LOCATIONS.flatMap((d) =>
    d.cities.map((c) => [c.name, c.localities] as const),
  ),
);

/** The department a city belongs to (derived — never stored). */
export function getDepartmentForCity(cityName: string): string | undefined {
  return CITY_TO_DEPARTMENT.get(cityName);
}

/** Cities of a department, in order. */
export function citiesForDepartment(
  departmentName: string,
): ReadonlyArray<ColombiaCity> {
  return (
    COLOMBIA_LOCATIONS.find((d) => d.name === departmentName)?.cities ?? []
  );
}

/** Localities of a city (empty when it has none). */
export function localitiesForCity(cityName: string): ReadonlyArray<string> {
  return CITY_TO_LOCALITIES.get(cityName) ?? [];
}

/** Whether a city has selectable localities (drives the optional 3rd level). */
export function cityHasLocalities(cityName: string): boolean {
  return localitiesForCity(cityName).length > 0;
}
