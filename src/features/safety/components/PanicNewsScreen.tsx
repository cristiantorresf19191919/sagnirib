"use client";

import { useState, type ReactNode } from "react";
import {
  Bookmark,
  MessageSquare,
  Search,
  Share2,
  UserPlus,
} from "lucide-react";

/**
 * The disguise rendered by the panic switch (see `PanicProvider`). A
 * full-viewport, self-contained recreation of an El Espectador article page —
 * deliberately NOT styled with Biringas design tokens (it must look like a
 * different website entirely), so the literal newspaper palette here is
 * intentional and exempt from the design-system token rule.
 *
 * Content is a small set of plausible, self-authored Colombian news articles
 * picked at random on each activation. We do NOT fetch or re-host real
 * elespectador.com content — scraping a third party at runtime is fragile,
 * blocked by CORS, and not ours to republish; a believable static decoy serves
 * the safety goal (hiding the adult site from an onlooker) just as well.
 *
 * Exit is intentionally discreet: press `Escape` (handled in PanicProvider) or
 * click the masthead — gestures the real user knows but a curious bystander
 * would not associate with "go back to that other site".
 */

interface Article {
  tag: string;
  title: string;
  lead: string;
  author: string;
  date: string;
  caption: string;
  body: ReadonlyArray<string>;
}

const ARTICLES: ReadonlyArray<Article> = [
  {
    tag: "Lee este contenido exclusivo para suscriptores",
    title:
      "De la Espriella e Iván Cepeda: estas son las cuentas de sus campañas en primera vuelta",
    lead: "El Espectador le puso la lupa a los reportes financieros de los dos candidatos que disputarán la segunda vuelta y definirán quién será el próximo presidente de Colombia para el período 2026-2030. Millonarios créditos y contratistas cercanos a los gerentes de campaña aparecen en los informes presentados ante el Consejo Nacional Electoral (CNE).",
    author: "David Escobar Moreno",
    date: "02 de junio de 2026 - 09:00 p. m.",
    caption:
      "Iván Cepeda y Abelardo de la Espriella lideran el bloque de candidatos ya instalados en la primera vuelta.",
    body: [
      "Colombia fue a las urnas y decidió: Abelardo de la Espriella e Iván Cepeda se enfrentarán el próximo 21 de junio en una segunda vuelta para definir quién será el próximo presidente de la República. Otra batalla se libra tras bambalinas, la de las cuentas de campaña.",
      "Según los reportes entregados al Consejo Nacional Electoral, ambas campañas movieron sumas que superan con holgura los topes históricos vistos en contiendas anteriores, alimentadas por créditos bancarios y aportes de simpatizantes.",
      "La Misión de Observación Electoral advirtió que la trazabilidad de algunos gastos sigue siendo deficiente, mientras la Unión Europea reiteró sus recomendaciones sobre la supervisión del financiamiento político en el país.",
      "Los gerentes de ambas campañas defendieron la legalidad de cada movimiento y aseguraron que entregarán los soportes complementarios dentro de los plazos previstos por la autoridad electoral.",
    ],
  },
  {
    tag: "Análisis",
    title:
      "Banco de la República mantiene tasas: ¿qué significa para su bolsillo en lo que resta del año?",
    lead: "La junta directiva del Emisor sorprendió al mercado al dejar inalterada la tasa de intervención. Analistas dividen sus pronósticos sobre el rumbo de la inflación y el crédito de consumo en el segundo semestre.",
    author: "Redacción Economía",
    date: "02 de junio de 2026 - 06:30 p. m.",
    caption:
      "La sede del Banco de la República en el centro de Bogotá, donde sesiona la junta directiva.",
    body: [
      "La decisión, tomada por mayoría, mantiene la tasa de referencia en un nivel que el Emisor considera coherente con la meta de inflación de largo plazo. El mercado esperaba un recorte moderado.",
      "Para los hogares, la medida implica que las cuotas de los créditos de tasa variable no bajarán de inmediato, aunque tampoco habrá un encarecimiento adicional en el corto plazo.",
      "Los gremios pidieron al equipo económico señales claras de reactivación, mientras el Ministerio de Hacienda insistió en que la senda fiscal se mantiene bajo control.",
    ],
  },
  {
    tag: "Bogotá",
    title:
      "Primera línea del metro de Bogotá supera el 80 % de avance: estos son los próximos hitos",
    lead: "La concesión confirmó que los trenes ya completaron pruebas dinámicas en el patio taller. La operación comercial sigue proyectada para iniciar por tramos, con estaciones del suroccidente entre las primeras en abrir.",
    author: "Redacción Bogotá",
    date: "02 de junio de 2026 - 04:10 p. m.",
    caption:
      "Viaducto de la primera línea del metro a la altura de la avenida Primero de Mayo.",
    body: [
      "La obra, una de las de mayor envergadura en la historia reciente de la ciudad, entra en su fase de ajustes finales de sistemas y señalización antes de las pruebas con pasajeros.",
      "El Distrito reiteró que el plan de manejo de tráfico se mantendrá en los corredores aledaños mientras se completan los acabados de las estaciones.",
      "Vecinos de los barrios cercanos pidieron acelerar la recuperación del espacio público una vez termine la intervención de los frentes de obra.",
    ],
  },
  {
    tag: "Deportes",
    title:
      "Selección Colombia define su lista para los amistosos de preparación de junio",
    lead: "El cuerpo técnico apuesta por una mezcla de experiencia y nuevas figuras del fútbol local y europeo. Dos jugadores regresan tras superar sus lesiones y un debutante se gana el llamado por su gran temporada.",
    author: "Redacción Deportes",
    date: "02 de junio de 2026 - 02:45 p. m.",
    caption:
      "Entrenamiento de la Selección Colombia en la sede deportiva de la Federación.",
    body: [
      "La convocatoria contempla dos partidos de fogueo que servirán para afinar el once titular de cara a los próximos compromisos oficiales de la eliminatoria.",
      "El entrenador destacó el momento de varios jugadores y subrayó la importancia de mantener la competencia interna en todas las líneas.",
      "La afición ya agotó buena parte de la boletería para el encuentro que se jugará en el país.",
    ],
  },
  {
    tag: "Judicial",
    title:
      "Corte Constitucional revisa demanda contra artículos de la última reforma tributaria",
    lead: "El alto tribunal admitió una demanda que cuestiona la base gravable de un impuesto saludable. La decisión podría afectar el recaudo proyectado para la próxima vigencia fiscal.",
    author: "Redacción Judicial",
    date: "02 de junio de 2026 - 01:20 p. m.",
    caption:
      "Sede de la Corte Constitucional en el centro administrativo de Bogotá.",
    body: [
      "La demanda argumenta que la norma vulnera los principios de equidad y progresividad tributaria consagrados en la Constitución.",
      "El Gobierno defendió la medida como una herramienta de salud pública y de sostenibilidad de las finanzas, y pidió declarar su exequibilidad.",
      "Expertos consultados coinciden en que el fallo sentará un precedente sobre el alcance de los impuestos correctivos en el país.",
    ],
  },
  {
    tag: "Mundo",
    title:
      "Cumbre regional busca una hoja de ruta común frente a la migración en América Latina",
    lead: "Delegaciones de una decena de países se reúnen para coordinar políticas migratorias y de integración. Sobre la mesa están la regularización laboral y los corredores humanitarios.",
    author: "Agencia / Redacción Internacional",
    date: "02 de junio de 2026 - 12:05 p. m.",
    caption: "Sesión inaugural de la cumbre regional sobre movilidad humana.",
    body: [
      "Los cancilleres reconocieron que ningún país puede atender el fenómeno de forma aislada y plantearon mecanismos de cooperación financiera.",
      "Organizaciones humanitarias pidieron garantías para el acceso a salud y educación de la población en tránsito.",
      "La declaración final, aún en negociación, incluiría compromisos verificables con plazos definidos.",
    ],
  },
  {
    tag: "Economía",
    title:
      "El dólar cierra a la baja tras nuevos datos de inflación en Estados Unidos",
    lead: "La divisa estadounidense retrocedió frente al peso en una jornada de alta volatilidad. Importadores y viajeros siguen de cerca el comportamiento del mercado cambiario.",
    author: "Redacción Economía",
    date: "02 de junio de 2026 - 11:30 a. m.",
    caption: "Tablero de cotizaciones en una casa de cambio del norte de Bogotá.",
    body: [
      "El movimiento estuvo influido por la expectativa de un giro en la política monetaria de la Reserva Federal en los próximos meses.",
      "Analistas advierten que la tendencia podría revertirse según los datos de empleo que se conocerán esta semana.",
      "El comportamiento del crudo y los flujos de inversión extranjera siguen siendo determinantes para el peso.",
    ],
  },
  {
    tag: "Estilo de vida",
    title:
      "Cinco rutas de senderismo cerca de Bogotá para desconectarse este puente festivo",
    lead: "Desde páramos hasta cascadas escondidas, la región ofrece planes de naturaleza a menos de dos horas de la ciudad. Recomendaciones de seguridad y de conservación para disfrutarlas.",
    author: "Redacción Estilo de vida",
    date: "02 de junio de 2026 - 10:15 a. m.",
    caption: "Sendero de alta montaña en los cerros orientales de la sabana.",
    body: [
      "Los expertos recomiendan llevar agua suficiente, protección solar y avisar a alguien sobre la ruta elegida antes de salir.",
      "Varias de estas rutas cuentan con guías comunitarios que apoyan la economía local y la protección del ecosistema.",
      "Las autoridades ambientales recuerdan no dejar residuos y respetar la fauna y la flora de cada zona protegida.",
    ],
  },
  {
    tag: "Tecnología",
    title:
      "Colombia avanza en su estrategia de inteligencia artificial para el sector público",
    lead: "El plan contempla pilotos en salud, justicia y atención al ciudadano. Académicos piden reglas claras de transparencia y protección de datos antes de escalar las herramientas.",
    author: "Redacción Tecnología",
    date: "02 de junio de 2026 - 09:40 a. m.",
    caption: "Centro de datos de una entidad pública en la capital.",
    body: [
      "La hoja de ruta busca mejorar tiempos de respuesta en trámites sin reemplazar la decisión humana en casos sensibles.",
      "Especialistas insisten en auditar los algoritmos para evitar sesgos y garantizar la rendición de cuentas.",
      "El reto, coinciden, será capacitar a los funcionarios y asegurar la calidad de los datos de entrada.",
    ],
  },
  {
    tag: "Política",
    title:
      "Congreso instala mesas técnicas para discutir la reforma al sistema de salud",
    lead: "Las comisiones acordaron un cronograma de audiencias con gremios, pacientes y trabajadores del sector. El articulado sobre el manejo de recursos concentra el debate.",
    author: "Redacción Política",
    date: "01 de junio de 2026 - 08:50 p. m.",
    caption: "Sesión conjunta de comisiones económicas en el Capitolio Nacional.",
    body: [
      "Los ponentes aseguraron que buscarán un consenso amplio antes de llevar el texto a votación en plenaria.",
      "Las asociaciones de pacientes pidieron garantías de continuidad en la entrega de medicamentos durante la transición.",
      "El Ministerio reiteró que la reforma apunta a fortalecer la atención primaria en territorios apartados.",
    ],
  },
  {
    tag: "Cultura",
    title:
      "La Feria del Libro cierra con récord de visitantes y un fuerte impulso a autores locales",
    lead: "Más de medio millón de personas pasaron por los pabellones durante las dos semanas del evento. Las editoriales independientes celebran un repunte en ventas.",
    author: "Redacción Cultura",
    date: "01 de junio de 2026 - 07:25 p. m.",
    caption: "Pabellón principal de la feria durante el último fin de semana.",
    body: [
      "La programación incluyó conversatorios, talleres y homenajes que llenaron los auditorios desde temprano.",
      "Los organizadores destacaron la participación de colegios y bibliotecas públicas en las jornadas escolares.",
      "Varios autores debutantes agotaron sus tirajes y firmaron acuerdos para nuevas publicaciones.",
    ],
  },
  {
    tag: "Salud",
    title:
      "Autoridades sanitarias lanzan campaña de vacunación ante el aumento de casos respiratorios",
    lead: "La estrategia prioriza a menores, adultos mayores y personas con enfermedades de base. Los puntos de atención ampliarán horarios durante las próximas semanas.",
    author: "Redacción Salud",
    date: "01 de junio de 2026 - 05:10 p. m.",
    caption: "Jornada de vacunación en un centro de salud del sur de la ciudad.",
    body: [
      "Las autoridades recomiendan el lavado frecuente de manos y el uso de tapabocas en espacios cerrados y concurridos.",
      "Los hospitales reportaron un incremento en consultas pediátricas asociadas a virus estacionales.",
      "La meta es cubrir a la población vulnerable antes del pico esperado para mitad de año.",
    ],
  },
  {
    tag: "Medellín",
    title:
      "Medellín estrena nuevo tramo de ciclorrutas que conecta el centro con el río",
    lead: "El corredor suma varios kilómetros de carriles protegidos y nuevas estaciones de bicicletas públicas. La movilidad sostenible gana terreno en la capital antioqueña.",
    author: "Redacción Antioquia",
    date: "01 de junio de 2026 - 03:35 p. m.",
    caption: "Ciclistas estrenan el nuevo corredor a la altura del parque del río.",
    body: [
      "La obra busca reducir los tiempos de viaje y fomentar alternativas al vehículo particular en horas pico.",
      "Colectivos de ciclistas pidieron mantenimiento permanente y mejor iluminación en los tramos nocturnos.",
      "La administración anunció que el plan se extenderá a otras comunas durante el próximo año.",
    ],
  },
  {
    tag: "Economía",
    title:
      "Café colombiano alcanza nuevos máximos de exportación impulsado por la demanda asiática",
    lead: "Los productores celebran mejores precios internacionales, aunque advierten sobre los costos de los insumos. El gremio proyecta una cosecha estable para el segundo semestre.",
    author: "Redacción Economía",
    date: "01 de junio de 2026 - 01:50 p. m.",
    caption: "Recolección de café en una finca de la zona cafetera.",
    body: [
      "La calidad del grano y las certificaciones de origen siguen siendo el principal diferencial en los mercados premium.",
      "Las cooperativas piden mayor acceso a crédito y a tecnología para los pequeños caficultores.",
      "El clima y las plagas continúan siendo los riesgos más vigilados por el sector.",
    ],
  },
  {
    tag: "Judicial",
    title:
      "Fiscalía imputa cargos en caso de contratación irregular en una entidad territorial",
    lead: "El ente acusador señala presuntas irregularidades en varios contratos de obra. La defensa anunció que aportará pruebas para desvirtuar los señalamientos.",
    author: "Redacción Judicial",
    date: "31 de mayo de 2026 - 09:15 p. m.",
    caption: "Audiencia de imputación en los juzgados de la ciudad.",
    body: [
      "Según la Fiscalía, los hallazgos surgieron de una auditoría que detectó sobrecostos y posibles direccionamientos.",
      "Los procesados quedaron a la espera de la decisión del juez sobre medidas de aseguramiento.",
      "Los organismos de control anunciaron que continuarán con las investigaciones disciplinarias paralelas.",
    ],
  },
  {
    tag: "Mundo",
    title:
      "Acuerdo internacional fija nuevas metas para reducir emisiones del transporte marítimo",
    lead: "Los países firmantes se comprometieron a impulsar combustibles más limpios y eficiencia energética. La industria pide reglas claras para planear sus inversiones.",
    author: "Agencia / Redacción Internacional",
    date: "31 de mayo de 2026 - 06:40 p. m.",
    caption: "Buque de carga en una de las principales rutas comerciales del mundo.",
    body: [
      "El pacto establece objetivos intermedios verificables y mecanismos de seguimiento por parte de un organismo técnico.",
      "Las navieras advierten que la transición requerirá inversiones significativas y apoyo financiero.",
      "Ambientalistas celebraron el avance, aunque pidieron metas más ambiciosas en el corto plazo.",
    ],
  },
];

/** Recirculation pool — "Lo más leído" headlines for added realism. */
const MORE_HEADLINES: ReadonlyArray<string> = [
  "Estos son los peajes que tendrán nueva tarifa a partir del próximo mes",
  "Subsidios de vivienda: cómo postularse y cuáles son los requisitos en 2026",
  "Pico y placa en Bogotá: los cambios que regirán esta semana",
  "Mercados campesinos: dónde encontrarlos este fin de semana en la ciudad",
  "Tres claves para entender el nuevo calendario tributario de la DIAN",
  "Selección femenina arranca su preparación para el torneo continental",
  "Alerta por lluvias: recomendaciones de los organismos de socorro",
  "Cómo proteger tus datos personales en compras por internet",
];

const NAV = [
  "Opinión",
  "Política",
  "Judicial",
  "Economía",
  "Mundo",
  "Bogotá",
  "Deportes",
  "Colombia + 20",
  "Estilo de vida",
  "Vea",
];

export function PanicNewsScreen({ onExit }: { onExit: () => void }) {
  // Pick one article + a recirculation set per activation (client-only mount
  // → no SSR concern, randomness is fine here).
  const [article] = useState<Article>(
    () => ARTICLES[Math.floor(Math.random() * ARTICLES.length)],
  );
  const [headlines] = useState<ReadonlyArray<string>>(() =>
    [...MORE_HEADLINES].sort(() => Math.random() - 0.5).slice(0, 5),
  );
  const [cookies, setCookies] = useState(true);

  return (
    <div
      className="overflow-y-auto overscroll-contain bg-white font-sans text-[#1a1a1a]"
      // Positioning is set inline (not via Tailwind `fixed`/`z-*`) so the
      // decoy reliably covers EVERYTHING — header, content, toasts — regardless
      // of utility-layer ordering. A near-max z-index keeps it on top of any
      // portal (toast stack, modals). It must fully obscure the app; a class
      // that fails to resolve would leave the site peeking through.
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483600,
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Top utility strip */}
      <div className="h-2 w-full bg-[#2b2b2b]" />

      {/* Masthead / nav — clicking the logo is one of the discreet exits. */}
      <header
        className="border-b-2 border-[#ec1c24] bg-white"
        style={{ position: "sticky", top: 0, zIndex: 10 }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="El Espectador"
            className="shrink-0 select-none text-left"
            style={{ fontFamily: "Georgia, serif" }}
            title="El Espectador"
          >
            <span className="block text-[22px] font-bold leading-none tracking-tight text-[#111]">
              El Espectador
            </span>
          </button>
          <nav className="hidden flex-1 items-center gap-4 overflow-x-auto text-[13px] font-sans md:flex">
            {NAV.map((item, i) => (
              <span
                key={item}
                className={`whitespace-nowrap ${
                  i === 1
                    ? "border-b-2 border-[#ec1c24] pb-3 font-semibold text-[#111]"
                    : "text-[#3a3a3a] hover:text-[#ec1c24]"
                }`}
              >
                {item}
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Search className="h-4 w-4 text-[#3a3a3a]" aria-hidden />
            <span className="rounded bg-[#ffd200] px-3 py-1.5 text-[13px] font-bold font-sans text-[#111]">
              Suscríbete
            </span>
          </div>
        </div>
      </header>

      {/* Article */}
      <main className="mx-auto max-w-[760px] px-4 pb-32 pt-6">
        <span className="mb-4 inline-block rounded-sm bg-[#fdecec] px-2 py-1 text-[12px] font-semibold font-sans text-[#ec1c24]">
          {article.tag}
        </span>

        <h1 className="text-[34px] font-bold leading-[1.12] text-[#111] sm:text-[40px]">
          {article.title}
        </h1>

        <p className="mt-5 text-[18px] leading-[1.6] text-[#333]">{article.lead}</p>

        {/* Google Discover follow box */}
        <div className="mt-6 flex items-center gap-3 rounded border border-[#dadce0] bg-[#f8fbff] px-4 py-3">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[14px] font-bold ring-1 ring-[#dadce0]"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            <span className="text-[#4285F4]">G</span>
          </span>
          <span className="text-[13px] font-sans text-[#3c4043]">
            Sigue a <strong>El Espectador</strong> en Discover: los temas que te
            gustan, directo y al instante.
          </span>
        </div>

        {/* Byline */}
        <div className="mt-6 flex items-center justify-between border-y border-[#e5e5e5] py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d9d9d9] text-[13px] font-bold text-[#555]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {article.author
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="font-sans leading-tight">
              <div className="text-[14px] font-bold text-[#111]">
                {article.author}
              </div>
              <div className="text-[12px] text-[#777]">{article.date}</div>
            </div>
          </div>
          <div className="hidden items-center gap-5 font-sans text-[#555] sm:flex">
            <BylineAction icon={<Share2 className="h-4 w-4" />} label="Compartir" />
            <BylineAction icon={<Bookmark className="h-4 w-4" />} label="Guardar" />
            <BylineAction
              icon={<MessageSquare className="h-4 w-4" />}
              label="Comentar (2)"
            />
            <BylineAction icon={<UserPlus className="h-4 w-4" />} label="Únete" />
          </div>
        </div>

        {/* Lead image + caption */}
        <figure className="mt-6">
          <div
            aria-hidden
            className="aspect-[16/9] w-full rounded-sm"
            style={{
              background:
                "linear-gradient(135deg, #3a4654 0%, #586577 45%, #7d8a99 100%)",
            }}
          />
          <figcaption className="mt-2 font-sans text-[13px] leading-snug text-[#555]">
            {article.caption}
            <span className="mt-1 block font-bold text-[#111]">
              Foto: El Espectador
            </span>
          </figcaption>
        </figure>

        {/* Body */}
        <div className="mt-6 space-y-5 text-[18px] leading-[1.72] text-[#222]">
          {article.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        {/* Recirculation — "Lo más leído" */}
        <section className="mt-10 border-t-2 border-[#111] pt-4">
          <h2 className="mb-3 font-sans text-[13px] font-bold uppercase tracking-wide text-[#ec1c24]">
            Lo más leído
          </h2>
          <ol className="divide-y divide-[#e5e5e5]">
            {headlines.map((h, i) => (
              <li key={h} className="flex items-start gap-3 py-3">
                <span
                  className="font-sans text-[22px] font-bold leading-none text-[#d9d9d9]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="text-[15px] leading-snug text-[#111] hover:text-[#ec1c24]">
                  {h}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 border-t border-[#e5e5e5] pt-5 font-sans text-[12px] uppercase tracking-wide text-[#999]">
          Enlaces entregados por <span className="font-bold">El Espectador</span>
        </div>
      </main>

      {/* Cookie banner */}
      {cookies && (
        <div
          className="border-t border-[#e0e0e0] bg-[#f3f3f3] px-4 py-3"
          style={{ position: "sticky", bottom: 0, zIndex: 5 }}
        >
          <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-3 font-sans text-[12px] text-[#555] sm:flex-row">
            <span className="flex-1 leading-snug">
              El Espectador usa cookies necesarias para el funcionamiento del
              sitio. Al hacer clic en “Aceptar” autoriza el uso de cookies no
              esenciales de medición y publicidad. Ver{" "}
              <span className="font-semibold underline">
                políticas de cookies y de datos
              </span>
              .
            </span>
            <button
              type="button"
              onClick={() => setCookies(false)}
              className="shrink-0 rounded bg-[#2b2b2b] px-5 py-2 text-[13px] font-semibold text-white"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BylineAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-col items-center gap-1 text-[11px]">
      {icon}
      {label}
    </span>
  );
}
