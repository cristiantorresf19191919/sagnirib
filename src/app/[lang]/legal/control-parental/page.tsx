import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { brandConfig } from "@/core/branding/brand-config";
import { isSupportedLocale } from "@/core/i18n/constants";
import { t } from "@/core/i18n/messages";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import {
  LegalList,
  LegalSection,
  LegalShell,
} from "@/features/legal/components/LegalShell";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

const LAST_UPDATED = "2 de junio de 2026";

/**
 * Política de Control Parental. Biringas es un sitio para adultos y, como tal,
 * va marcado con la etiqueta RTA ("Restricted To Adults") que los filtros de
 * control parental leen para bloquearlo. El meta `rating` se emite a nivel de
 * sitio desde `default-metadata.ts`; esta página explica el rol del adulto
 * responsable y cómo activar los filtros, en línea con la Ley 679/2001 de
 * protección de menores y las campañas de MinTIC (En TIC Confío) e ICBF.
 *
 * Per ADR-017, el cuerpo legal permanece en español como única versión
 * auténtica; el locale EN solo traduce metadata y el aviso jurisdiccional.
 * Marcado `indexable: false` hasta que cierre la revisión legal, igual que el
 * resto de borradores legales.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "legal.controlParental.metadata.title", {
      brand: brandConfig.name,
    }),
    description: t(locale, "legal.controlParental.metadata.description"),
    pathname: "/legal/control-parental",
    locale,
    indexable: false,
  });
}

export default async function ControlParentalPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const showLocaleNotice = lang !== "es";
  return (
    <>
      <Header hideCatalogCta />
      <LegalShell
        eyebrow="Legal · Control parental"
        title="Control parental"
        summary="Biringas es un sitio exclusivamente para adultos. Esta página explica cómo, como padre, madre o adulto responsable, puedes impedir que personas menores de edad accedan a contenido restringido en este y en cualquier otro sitio."
        lastUpdated={LAST_UPDATED}
        disclaimer={
          <>
            {showLocaleNotice ? (
              <p className="mb-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 px-3 py-2 text-xs text-[var(--color-foreground)]">
                {t(lang, "legal.jurisdictionalNotice")}
              </p>
            ) : null}
            <p>
              <strong>Borrador en revisión legal.</strong> Documento informativo
              redactado con base en la Ley 679 de 2001 de protección de menores
              y las campañas de prevención de MinTIC e ICBF. Debe ser revisado
              por abogado titulado antes de su publicación definitiva.
            </p>
          </>
        }
      >
        <LegalSection id="solo-adultos" title="1. Un sitio solo para adultos">
          <p>
            {brandConfig.name} es una plataforma destinada{" "}
            <strong>exclusivamente a personas mayores de 18 años</strong>. El
            acceso, registro y publicación por parte de personas menores de
            edad están terminantemente prohibidos. Antes de mostrar cualquier
            contenido te pedimos confirmar tu mayoría de edad, y la publicación
            de perfiles exige un proceso de verificación de identidad y edad.
          </p>
          <p>
            Ninguna medida técnica sustituye la supervisión de un adulto. Si en
            tu hogar o en los dispositivos que usan personas menores de edad
            existe la posibilidad de navegar por internet, la herramienta más
            eficaz para protegerlas eres tú: activa el control parental.
          </p>
        </LegalSection>

        <LegalSection id="rta" title="2. Etiqueta RTA (Restricted To Adults)">
          <p>
            Todas las páginas de {brandConfig.name} incluyen la etiqueta
            estándar internacional{" "}
            <strong>RTA — “Restricted To Adults”</strong> en su código. Se trata
            de una marca que los programas y servicios de control parental leen
            automáticamente para identificar un sitio para adultos y bloquearlo.
          </p>
          <LegalList>
            <li>
              La etiqueta se emite en cada página mediante la meta-etiqueta{" "}
              <span className="font-medium text-[var(--color-foreground)]">
                rating
              </span>{" "}
              con el valor RTA reconocido por la industria.
            </li>
            <li>
              Es gratuita, abierta y respetada por la mayoría de filtros y
              sistemas operativos. No requiere que hagas nada en el sitio: basta
              con que actives un filtro compatible en tus dispositivos.
            </li>
            <li>
              Es responsabilidad de cada hogar activar el control parental. La
              etiqueta RTA solo funciona si existe un filtro que la lea.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="como-activar" title="3. Cómo activar el control parental">
          <p>
            Puedes restringir el acceso a contenido para adultos a nivel de
            dispositivo, de red doméstica o mediante software especializado.
            Estas son las vías más comunes:
          </p>
          <LegalList>
            <li>
              <strong>En el dispositivo (iOS / iPadOS):</strong> Ajustes →
              Tiempo en pantalla → Restricciones de contenido y privacidad →
              Restricciones de contenido → Contenido web → “Limitar sitios web
              para adultos”.
            </li>
            <li>
              <strong>En el dispositivo (Android):</strong> instala Google
              Family Link, vincula la cuenta del menor y activa los filtros de
              Google Chrome y de Google Play.
            </li>
            <li>
              <strong>En Windows:</strong> usa Microsoft Family Safety para
              filtrar sitios y aplicar límites de contenido por cuenta infantil.
            </li>
            <li>
              <strong>En macOS:</strong> Ajustes del Sistema → Tiempo de uso →
              Restricciones de contenido y privacidad → Contenido web →
              “Limitar sitios web para adultos”.
            </li>
            <li>
              <strong>En el router o la red doméstica:</strong> muchos
              proveedores de internet y routers permiten activar un filtro de
              contenido para adultos que cubre todos los dispositivos conectados
              a esa red.
            </li>
            <li>
              <strong>Con software de filtrado de terceros:</strong> existen
              soluciones de hardware, software y servicios de filtrado (por
              ejemplo, filtros DNS familiares o suites de control parental) que
              bloquean sitios marcados con RTA.
            </li>
          </LegalList>
          <p>
            Te recomendamos combinar varias capas (dispositivo + red) y revisar
            periódicamente la configuración, ya que los menores pueden cambiar
            de dispositivo o de red.
          </p>
        </LegalSection>

        <LegalSection id="recursos" title="4. Recursos en Colombia">
          <p>
            En Colombia existen programas públicos de acompañamiento a familias
            para una navegación segura de niñas, niños y adolescentes:
          </p>
          <LegalList>
            <li>
              <strong>En TIC Confío (MinTIC):</strong> programa nacional de uso
              responsable y seguro de las TIC, con guías para madres, padres y
              cuidadores.
            </li>
            <li>
              <strong>Te Protejo:</strong> línea virtual de denuncia de
              contenidos de explotación sexual de menores en internet.
            </li>
            <li>
              <strong>ICBF — Línea 141:</strong> atención de casos de
              vulneración de derechos de niñas, niños y adolescentes.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="tolerancia-cero" title="5. Tolerancia cero con el contenido que afecte a menores">
          <p>
            {brandConfig.name} está absolutamente en contra de la explotación
            sexual de menores y de la trata de personas. Cualquier sospecha o
            indicio de que una persona menor de edad esté publicando o sea
            mostrada en la Plataforma se trata con prioridad absoluta:
          </p>
          <LegalList>
            <li>
              Eliminamos de inmediato la cuenta y el contenido involucrado.
            </li>
            <li>
              Reportamos los hechos a las autoridades competentes — Instituto
              Colombiano de Bienestar Familiar (Línea 141), Policía Nacional
              (Línea 123) y Fiscalía General de la Nación — conforme a la Ley
              679 de 2001.
            </li>
            <li>
              Conservamos la información mínima necesaria para la investigación
              cuando la ley así lo exige.
            </li>
          </LegalList>
          <p>
            Si detectas contenido que pueda involucrar a una persona menor de
            edad, usa el botón “Reportar” disponible en cada perfil o
            escríbenos por los canales del Aviso Legal. Actuaremos con
            contundencia.
          </p>
        </LegalSection>

        <LegalSection id="documentos" title="6. Documentos complementarios">
          <p>
            Esta política de control parental complementa los Términos y
            Condiciones, la Política de Tratamiento de Datos Personales y el
            Aviso Legal de la Plataforma.
          </p>
        </LegalSection>
      </LegalShell>
      <Footer />
    </>
  );
}
