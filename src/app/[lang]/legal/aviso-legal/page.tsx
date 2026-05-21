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

const LAST_UPDATED = "19 de mayo de 2026";

/**
 * Aviso Legal (Legal Notice / Impressum-style identification page).
 * Cumple con el deber de información del Estatuto del Consumidor
 * (art. 23, Ley 1480/2011) y de comercio electrónico (Ley 527/1999).
 *
 * Per ADR-017, the legal body stays in Spanish across both locales —
 * Colombian jurisdictional documents have their authentic version in
 * Spanish.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : "es";
  return buildPageMetadata({
    title: t(locale, "legal.avisoLegal.metadata.title", { brand: brandConfig.name }),
    description: t(locale, "legal.avisoLegal.metadata.description"),
    pathname: "/legal/aviso-legal",
    locale,
    indexable: false,
  });
}

export default async function AvisoLegalPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const showLocaleNotice = lang !== "es";
  return (
    <>
      <Header hideCatalogCta />
      <LegalShell
        eyebrow="Legal · Aviso"
        title="Aviso legal"
        summary="Información obligatoria sobre el titular del servicio, la naturaleza de la Plataforma, los mecanismos de reporte y el régimen aplicable al uso del sitio."
        lastUpdated={LAST_UPDATED}
        disclaimer={
          <>
            {showLocaleNotice ? (
              <p className="mb-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 px-3 py-2 text-xs text-[var(--color-foreground)]">
                {t(lang, "legal.jurisdictionalNotice")}
              </p>
            ) : null}
            <p>
              <strong>Borrador en revisión legal.</strong> Aviso redactado
              con base en el Estatuto del Consumidor (Ley 1480/2011),
              Ley 527/1999 de comercio electrónico y Ley 679/2001 de
              protección de menores. Debe ser revisado y firmado por
              representante legal y abogado titulado antes de su publicación
              definitiva.
            </p>
          </>
        }
      >
        <LegalSection id="titular" title="1. Titular del servicio">
          <p>
            <strong>{brandConfig.legalName}</strong>, sociedad debidamente
            constituida y domiciliada en la República de Colombia, es la
            titular y operadora de la plataforma digital{" "}
            {brandConfig.name} (en adelante, la <em>“Plataforma”</em>).
          </p>
          <LegalList>
            <li>
              <strong>Razón social:</strong>{" "}
              <em>[Pendiente de completar por contabilidad]</em>
            </li>
            <li>
              <strong>NIT:</strong>{" "}
              <em>[Pendiente de completar por contabilidad]</em>
            </li>
            <li>
              <strong>Domicilio social:</strong>{" "}
              <em>[Pendiente de completar por contabilidad]</em>
            </li>
            <li>
              <strong>Representante legal:</strong>{" "}
              <em>[Pendiente de completar por contabilidad]</em>
            </li>
            <li>
              <strong>Correo de contacto oficial:</strong>{" "}
              <em>[Pendiente — recomendamos legal@biringas.co]</em>
            </li>
            <li>
              <strong>Canal de atención al consumidor:</strong>{" "}
              <em>[Pendiente — formulario en la Plataforma]</em>
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="naturaleza" title="2. Naturaleza de la Plataforma">
          <p>
            La Plataforma es un marketplace de intermediación digital
            dirigido exclusivamente a personas mayores de edad. Permite
            que adultos verificados publiquen perfiles ofreciendo servicios
            de acompañamiento y que otros adultos los descubran y los
            contacten. La Plataforma <strong>no presta directamente</strong>{" "}
            servicios de acompañamiento, no actúa como agencia, no
            establece tarifas y no media en los acuerdos entre usuarios.
          </p>
          <p>
            El uso de la Plataforma para fines distintos a los aquí
            descritos, así como cualquier publicación o conducta que
            vulnere los Términos y la legislación aplicable, está
            estrictamente prohibido y será sancionado con la suspensión
            inmediata de la cuenta y, cuando corresponda, con el reporte
            a las autoridades.
          </p>
        </LegalSection>

        <LegalSection id="propiedad" title="3. Propiedad intelectual">
          <p>
            Los derechos de propiedad intelectual sobre el diseño, la
            marca, el logotipo, el código fuente, la base de datos
            estructural y los textos editoriales de la Plataforma
            pertenecen a {brandConfig.legalName} o se usan bajo licencia
            válida. Queda prohibida su reproducción, distribución,
            comunicación pública, transformación o cualquier otro acto de
            explotación sin autorización previa y por escrito.
          </p>
          <p>
            Los contenidos publicados por los usuarios (fotografías,
            descripciones, audios, videos) son propiedad de sus respectivos
            titulares, quienes conceden a la Plataforma una licencia
            limitada para su almacenamiento y exhibición conforme a los
            Términos.
          </p>
        </LegalSection>

        <LegalSection id="responsabilidad" title="4. Responsabilidad sobre contenidos">
          <p>
            En cumplimiento del artículo 91 de la Ley 1480 de 2011 y de
            las garantías constitucionales aplicables, la Plataforma
            actúa como prestadora de servicios de intermediación. La
            responsabilidad sobre la veracidad, legalidad e integridad de
            los contenidos publicados recae sobre los usuarios que los
            generan.
          </p>
          <p>
            Sin perjuicio de lo anterior, la Plataforma mantiene una
            política activa de moderación y eliminará todo contenido que
            (i) vulnere derechos de terceros, (ii) sea contrario a la ley
            o al orden público, o (iii) ponga en riesgo a personas
            menores de edad o a víctimas de trata de personas.
          </p>
        </LegalSection>

        <LegalSection id="reportes" title="5. Mecanismos de reporte">
          <p>
            La Plataforma dispone de canales para reportar contenido
            ilícito, abuso o sospecha de explotación. Todo reporte es
            tratado con prioridad absoluta:
          </p>
          <LegalList>
            <li>
              <strong>Reporte interno:</strong> botón “Reportar” disponible
              en cada perfil, formulario de contacto en la Plataforma.
            </li>
            <li>
              <strong>Protección de menores:</strong> casos relacionados
              con menores de edad son reportados de oficio al Instituto
              Colombiano de Bienestar Familiar (Línea 141), la Policía
              Nacional (Línea 123) y a la Fiscalía General de la Nación.
            </li>
            <li>
              <strong>Trata de personas:</strong> reportes a la Línea
              Nacional contra la Trata 01-8000-522020 y al Ministerio
              del Interior.
            </li>
            <li>
              <strong>Violencia basada en género:</strong> articulación
              con la Línea 155 de orientación a la mujer víctima de
              violencia.
            </li>
            <li>
              <strong>Datos personales:</strong> reclamos a la
              Superintendencia de Industria y Comercio — www.sic.gov.co.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="enlaces" title="6. Enlaces a terceros">
          <p>
            La Plataforma puede contener enlaces a sitios web operados
            por terceros. La inclusión de estos enlaces es meramente
            informativa y no implica respaldo, aprobación o relación
            comercial. La Plataforma no se hace responsable del contenido,
            políticas de privacidad o prácticas comerciales de los sitios
            enlazados.
          </p>
        </LegalSection>

        <LegalSection id="disponibilidad" title="7. Disponibilidad del servicio">
          <p>
            La Plataforma realiza esfuerzos razonables para mantener el
            servicio disponible las 24 horas. No obstante, puede
            interrumpirse por mantenimiento, fallas técnicas o causas de
            fuerza mayor sin que ello genere indemnización alguna. La
            Plataforma se reserva el derecho de modificar, suspender o
            descontinuar funcionalidades en cualquier momento.
          </p>
        </LegalSection>

        <LegalSection id="ley-aplicable" title="8. Ley aplicable y jurisdicción">
          <p>
            El uso de la Plataforma se rige por las leyes de la República
            de Colombia. Cualquier controversia que no pueda resolverse
            amigablemente se someterá a la jurisdicción ordinaria
            colombiana, con renuncia expresa a cualquier otro fuero que
            pudiera corresponder.
          </p>
        </LegalSection>

        <LegalSection id="documentos" title="9. Documentos complementarios">
          <p>
            Este Aviso Legal debe leerse en conjunto con los Términos y
            Condiciones y con la Política de Tratamiento de Datos
            Personales de la Plataforma. En caso de conflicto entre
            documentos, prevalecerán los Términos y Condiciones para
            aspectos contractuales y la Política de Privacidad para
            aspectos de protección de datos.
          </p>
        </LegalSection>
      </LegalShell>
      <Footer />
    </>
  );
}
