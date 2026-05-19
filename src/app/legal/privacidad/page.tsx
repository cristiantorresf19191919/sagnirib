import type { Metadata } from "next";

import { brandConfig } from "@/core/branding/brand-config";
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
 * Privacy Policy draft modelled on the Colombian data-protection regime:
 * Ley 1581/2012, Decreto 1377/2013, Decreto 090/2018 y guías de la
 * Superintendencia de Industria y Comercio (SIC). Marcado noindex hasta
 * que cierre la revisión legal.
 */
export const metadata: Metadata = buildPageMetadata({
  title: `Política de privacidad — ${brandConfig.name}`,
  description:
    "Política de tratamiento de datos personales de la plataforma. Finalidades, derechos del titular y mecanismos para ejercerlos. Documento en revisión legal.",
  path: "/legal/privacidad",
  indexable: false,
});

export default function PrivacidadPage() {
  return (
    <>
      <Header hideCatalogCta />
      <LegalShell
        eyebrow="Legal · Privacidad"
        title="Política de tratamiento de datos personales"
        summary="Cómo recogemos, usamos y protegemos tus datos. Esta política aplica a todas las personas que visitan, se registran o publican un perfil en la Plataforma."
        lastUpdated={LAST_UPDATED}
        disclaimer={
          <p>
            <strong>Borrador en revisión legal.</strong> Política redactada
            con base en la Ley 1581 de 2012 y el Decreto 1377 de 2013. Debe
            ser revisada por abogado titulado y registrada en el Registro
            Nacional de Bases de Datos (RNBD) de la SIC antes de su entrada
            en vigencia definitiva.
          </p>
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

        <LegalSection id="datos" title="2. Datos que recogemos">
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

        <LegalSection id="finalidades" title="3. Finalidades del tratamiento">
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

        <LegalSection id="base-legal" title="4. Base legal">
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

        <LegalSection id="encargados" title="5. Encargados y terceros">
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

        <LegalSection id="conservacion" title="6. Conservación de la información">
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

        <LegalSection id="derechos" title="7. Derechos del titular (Habeas Data)">
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

        <LegalSection id="seguridad" title="8. Medidas de seguridad">
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

        <LegalSection id="cookies" title="9. Cookies y tecnologías similares">
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

        <LegalSection id="cambios" title="10. Cambios a esta política">
          <p>
            Esta política podrá actualizarse cuando cambie la regulación
            aplicable o se introduzcan nuevas funcionalidades en la
            Plataforma. Cualquier cambio sustancial será notificado con
            al menos quince (15) días calendario de anticipación a través
            del sitio o por correo electrónico.
          </p>
        </LegalSection>

        <LegalSection id="contacto" title="11. Canales de contacto">
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
