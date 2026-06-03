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
 * Privacy Policy draft modelled on the Colombian data-protection regime:
 * Ley 1581/2012, Decreto 1377/2013, Decreto 090/2018 y guías de la
 * Superintendencia de Industria y Comercio (SIC). Marcado noindex hasta
 * que cierre la revisión legal.
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
    title: t(locale, "legal.privacidad.metadata.title", { brand: brandConfig.name }),
    description: t(locale, "legal.privacidad.metadata.description"),
    pathname: "/legal/privacidad",
    locale,
    indexable: false,
  });
}

export default async function PrivacidadPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  const showLocaleNotice = lang !== "es";
  return (
    <>
      <Header hideCatalogCta />
      <LegalShell
        eyebrow="Legal · Privacidad"
        title="Política de tratamiento de datos personales"
        summary="Cómo recogemos, usamos y protegemos tus datos. Esta política aplica a todas las personas que visitan, se registran o publican un perfil en la Plataforma."
        lastUpdated={LAST_UPDATED}
        disclaimer={
          <>
            {showLocaleNotice ? (
              <p className="mb-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/8 px-3 py-2 text-xs text-[var(--color-foreground)]">
                {t(lang, "legal.jurisdictionalNotice")}
              </p>
            ) : null}
            <p>
              <strong>Borrador en revisión legal.</strong> Política redactada
              con base en la Ley 1581 de 2012 y el Decreto 1377 de 2013. Debe
              ser revisada por abogado titulado y registrada en el Registro
              Nacional de Bases de Datos (RNBD) de la SIC antes de su entrada
              en vigencia definitiva.
            </p>
          </>
        }
      >
        <LegalSection id="responsable" title="1. Identificación del responsable">
          <p>
            <strong>{brandConfig.legalName}</strong>, sociedad domiciliada
            en Colombia, es la responsable del tratamiento de los datos
            personales recolectados a través de la Plataforma (en adelante
            el <em>“Responsable”</em>). Los datos de contacto oficial para
            ejercer derechos están publicados en el Aviso Legal.
          </p>
        </LegalSection>

        <LegalSection id="tipologia" title="2. Tipos de usuario y datos que tratamos de cada uno">
          <p>
            Para ser transparentes sobre qué información manejamos, distinguimos
            cuatro tipos de usuario. El tratamiento de tus datos depende de cómo
            uses la Plataforma:
          </p>
          <LegalList>
            <li>
              <strong>Visitante.</strong> Navega y explora perfiles sin crear
              cuenta. No exigimos registro para mirar. De los visitantes solo
              tratamos el reconocimiento de mayoría de edad y cookies esenciales
              y analíticas agregadas, sin identificar a la persona.
            </li>
            <li>
              <strong>Publicador (modelo).</strong> Crea una cuenta para
              publicar y administrar uno o más perfiles. De este usuario
              tratamos datos de identificación y contacto, datos de
              verificación de identidad y edad, y los datos del perfil que
              decide publicar.
            </li>
            <li>
              <strong>Comentador (cliente).</strong> Crea una cuenta para
              guardar favoritos, comentar o solicitar contacto, pero no publica
              perfiles. De este usuario tratamos un seudónimo o nombre público,
              un correo electrónico y, opcionalmente, un número de teléfono.
            </li>
            <li>
              <strong>Partner (cuenta con varias personas).</strong> Es una
              cuenta de publicador que administra los perfiles de dos o más
              personas. Cada persona representada tiene su propio proceso de
              verificación de identidad (verificación por persona) y debe haber
              consentido individualmente la publicación de sus datos e imágenes.
              La cuenta partner es responsable de contar con esa autorización
              para cada persona que publica.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="datos" title="3. Datos que recogemos">
          <p>
            Recopilamos únicamente los datos necesarios para operar la
            Plataforma con seguridad y prestar las funcionalidades que el
            usuario solicita. Estos son los datos típicamente tratados:
          </p>
          <LegalList>
            <li>
              <strong>Datos de identificación:</strong> nombre o seudónimo,
              edad, número de documento (sólo durante la verificación),
              correo electrónico y, opcionalmente, número de teléfono.
            </li>
            <li>
              <strong>Datos del perfil:</strong> fotografías, descripción
              biográfica, ciudad, barrio, idiomas, servicios ofrecidos y
              disponibilidad horaria.
            </li>
            <li>
              <strong>Datos de verificación:</strong> documento de identidad
              vigente y selfie en vivo, tratados con la única finalidad de
              confirmar identidad y consentimiento. Estos datos son
              almacenados separadamente del perfil público y nunca son
              publicados.
            </li>
            <li>
              <strong>Datos de uso:</strong> direcciones IP, identificadores
              de dispositivo, registros de navegación y métricas agregadas
              de comportamiento dentro de la Plataforma.
            </li>
            <li>
              <strong>Comunicaciones:</strong> mensajes que envíes al equipo
              de soporte o a través de los formularios de contacto.
            </li>
          </LegalList>
          <p>
            Los datos de menores de edad no son tratados bajo ninguna
            circunstancia. Si se detecta que un usuario es menor de edad,
            su cuenta es eliminada de forma inmediata y los hechos se
            reportan a las autoridades competentes.
          </p>
        </LegalSection>

        <LegalSection id="publico-privado" title="4. Datos públicos y datos privados">
          <p>
            Cuando publicas un perfil, una parte de tus datos se hace pública —
            esa es justamente la finalidad del perfil — y otra parte permanece
            siempre privada. Queremos que tengas total claridad sobre la
            diferencia:
          </p>
          <p>
            <strong>Datos públicos</strong> (visibles para cualquier persona que
            visite tu perfil, porque tú decides publicarlos):
          </p>
          <LegalList>
            <li>Ciudad, zona o barrio que indiques.</li>
            <li>Categoría del perfil.</li>
            <li>El título y la descripción que escribas.</li>
            <li>Las fotografías y los videos que subas al perfil.</li>
            <li>Idiomas, servicios ofrecidos y disponibilidad.</li>
            <li>
              Las formas de contacto que <em>elijas</em> mostrar (por ejemplo,
              un número visible o un canal de mensajería).
            </li>
          </LegalList>
          <p>
            <strong>Datos privados</strong> (nunca se publican ni se muestran a
            otros usuarios; los usamos solo para operar la cuenta y cumplir la
            ley):
          </p>
          <LegalList>
            <li>Tu correo electrónico.</li>
            <li>
              Tu número privado: si lo marcas como privado,{" "}
              <strong>no aparece en tu perfil público</strong> y los contactos
              llegan a través de los canales internos de la Plataforma.
            </li>
            <li>Tu documento de identidad y tu selfie de verificación.</li>
            <li>Tu fecha de nacimiento o edad exacta (dato interno).</li>
            <li>Tu dirección IP, hora de conexión y registros de actividad.</li>
            <li>Tus credenciales de acceso (contraseña).</li>
            <li>
              Cualquier forma de contacto que <em>no</em> hayas marcado como
              visible.
            </li>
          </LegalList>
          <p>
            En resumen: tú controlas qué se muestra. Si no quieres que un dato
            sea público, no lo marques como visible al publicar tu perfil.
          </p>
        </LegalSection>

        <LegalSection id="finalidades" title="5. Finalidades del tratamiento">
          <p>
            Tus datos personales son tratados exclusivamente para las
            siguientes finalidades:
          </p>
          <LegalList>
            <li>
              Operar la Plataforma, crear y administrar tu cuenta, mostrar
              tu perfil y permitir la interacción con otros usuarios.
            </li>
            <li>
              Verificar tu identidad y mayoría de edad como condición
              indispensable para publicar un perfil.
            </li>
            <li>
              Prevenir fraude, suplantación, abuso, contenido ilícito y
              vulneraciones a la seguridad de la información.
            </li>
            <li>
              Cumplir obligaciones legales (atención de requerimientos
              judiciales o de autoridad administrativa, conservación
              tributaria, reportes a entidades de protección de menores).
            </li>
            <li>
              Mejorar el servicio mediante métricas agregadas y anónimas;
              estudios estadísticos no permiten reidentificar al titular.
            </li>
            <li>
              Comunicaciones operativas (cambios en términos, alertas de
              seguridad). Las comunicaciones promocionales requieren
              consentimiento adicional.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="base-legal" title="6. Base legal">
          <p>
            El tratamiento se ampara en (a) tu consentimiento previo,
            expreso e informado al momento del registro y de la
            verificación; (b) la ejecución del contrato derivado de la
            aceptación de los Términos; (c) el cumplimiento de
            obligaciones legales aplicables; y (d) el interés legítimo del
            Responsable en mantener la integridad y seguridad del servicio,
            siempre proporcional y verificable.
          </p>
        </LegalSection>

        <LegalSection id="encargados" title="7. Encargados y terceros">
          <p>
            Para operar la Plataforma utilizamos servicios de terceros que
            actúan en condición de encargados del tratamiento, sujetos a
            acuerdos contractuales de confidencialidad y a estándares
            equivalentes a los aquí establecidos. Estos incluyen:
          </p>
          <LegalList>
            <li>
              Proveedores de infraestructura en la nube (Google Firebase,
              Netlify) para almacenamiento, autenticación y entrega del
              contenido.
            </li>
            <li>
              Proveedores de mensajería transaccional (correo electrónico,
              notificaciones push) sólo para comunicaciones operativas.
            </li>
            <li>
              Pasarelas de pago, cuando se integren en próximas iteraciones
              y bajo aceptación expresa adicional del usuario.
            </li>
          </LegalList>
          <p>
            No vendemos, alquilamos ni cedemos datos personales a terceros
            con fines publicitarios. Cualquier transferencia internacional
            se efectuará a países con niveles adecuados de protección o
            bajo cláusulas contractuales que garanticen estándares
            equivalentes a la legislación colombiana.
          </p>
        </LegalSection>

        <LegalSection id="conservacion" title="8. Conservación de la información">
          <p>
            Conservamos los datos personales el tiempo estrictamente
            necesario para cumplir las finalidades autorizadas o, en su
            defecto, los plazos mínimos exigidos por la ley:
          </p>
          <LegalList>
            <li>
              <strong>Datos del perfil activo:</strong> mientras la cuenta
              esté activa.
            </li>
            <li>
              <strong>Datos de verificación:</strong> hasta noventa (90)
              días después del cierre de la cuenta, salvo que su
              conservación sea exigida por autoridad competente.
            </li>
            <li>
              <strong>Registros de auditoría y seguridad:</strong> hasta
              dos (2) años, en cumplimiento de buenas prácticas en
              ciberseguridad.
            </li>
            <li>
              <strong>Datos contables y tributarios:</strong> diez (10)
              años, conforme al artículo 60 del Código de Comercio.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="derechos" title="9. Derechos del titular (Habeas Data)">
          <p>
            Como titular de tus datos personales tienes los derechos
            consagrados en el artículo 8 de la Ley 1581 de 2012, entre
            ellos:
          </p>
          <LegalList>
            <li>
              <strong>Conocer, actualizar y rectificar</strong> tus datos
              en cualquier momento.
            </li>
            <li>
              <strong>Solicitar prueba</strong> de la autorización otorgada
              al Responsable.
            </li>
            <li>
              <strong>Ser informado</strong> sobre el uso que se ha dado a
              tus datos.
            </li>
            <li>
              <strong>Revocar la autorización</strong> y/o solicitar la
              supresión de tus datos cuando no medie un deber legal o
              contractual que imponga su conservación.
            </li>
            <li>
              <strong>Presentar quejas</strong> ante la Superintendencia
              de Industria y Comercio (SIC) por infracciones a la normativa
              de protección de datos.
            </li>
          </LegalList>
          <p>
            Para ejercer estos derechos puedes (i) usar la opción
            “Eliminar mi cuenta” desde la configuración del perfil, o
            (ii) escribir al canal de contacto publicado en el Aviso Legal.
            Atenderemos tu solicitud en los plazos legales: diez (10) días
            hábiles para consultas y quince (15) días hábiles para
            reclamos, prorrogables conforme a la ley.
          </p>
        </LegalSection>

        <LegalSection id="seguridad" title="10. Medidas de seguridad">
          <p>
            Aplicamos medidas técnicas, humanas y administrativas
            razonables para proteger tus datos frente a accesos no
            autorizados, pérdida o adulteración. Estas incluyen cifrado
            en tránsito (TLS), control de acceso por roles, segregación
            de los datos de verificación frente al perfil público, y
            auditorías periódicas de seguridad.
          </p>
          <p>
            No obstante, ningún sistema en internet es absolutamente
            invulnerable: te recomendamos usar contraseñas robustas y
            únicas, activar la verificación en dos pasos cuando esté
            disponible y notificarnos de inmediato cualquier acceso no
            autorizado a tu cuenta.
          </p>
        </LegalSection>

        <LegalSection id="cookies" title="11. Cookies y tecnologías similares">
          <p>
            La Plataforma utiliza cookies estrictamente necesarias para el
            funcionamiento del servicio (sesión, mayoría de edad, preferencias
            de tema) y cookies analíticas agregadas que nos permiten medir
            uso sin identificar al titular. No utilizamos cookies de
            publicidad de terceros ni rastreadores transfronterizos.
          </p>
          <p>
            Puedes gestionar el comportamiento de las cookies desde la
            configuración de tu navegador. La desactivación de cookies
            esenciales puede afectar funcionalidades básicas del servicio.
          </p>
        </LegalSection>

        <LegalSection id="cambios" title="12. Cambios a esta política">
          <p>
            Esta política podrá actualizarse cuando cambie la regulación
            aplicable o se introduzcan nuevas funcionalidades en la
            Plataforma. Cualquier cambio sustancial será notificado con
            al menos quince (15) días calendario de anticipación a través
            del sitio o por correo electrónico.
          </p>
        </LegalSection>

        <LegalSection id="contacto" title="13. Canales de contacto">
          <p>
            Para consultas, reclamos o ejercicio de derechos de protección
            de datos, escríbenos a través del canal oficial publicado en
            el Aviso Legal de la Plataforma. La autoridad de protección
            de datos en Colombia es la Superintendencia de Industria y
            Comercio (SIC) — puedes presentar quejas en{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              www.sic.gov.co
            </span>
            .
          </p>
        </LegalSection>
      </LegalShell>
      <Footer />
    </>
  );
}
