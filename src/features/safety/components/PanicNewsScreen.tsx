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
  // Pick one article per activation (client-only mount → no SSR concern).
  const [article] = useState<Article>(
    () => ARTICLES[Math.floor(Math.random() * ARTICLES.length)],
  );
  const [cookies, setCookies] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-white font-sans text-[#1a1a1a]"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Top utility strip */}
      <div className="h-2 w-full bg-[#2b2b2b]" />

      {/* Masthead / nav — clicking the logo is one of the discreet exits. */}
      <header className="sticky top-0 z-10 border-b-2 border-[#ec1c24] bg-white">
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

        <div className="mt-8 border-t border-[#e5e5e5] pt-5 font-sans text-[12px] uppercase tracking-wide text-[#999]">
          Enlaces entregados por <span className="font-bold">El Espectador</span>
        </div>
      </main>

      {/* Cookie banner */}
      {cookies && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e0e0e0] bg-[#f3f3f3] px-4 py-3">
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
