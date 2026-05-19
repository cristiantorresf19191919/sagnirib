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
 * Terms of Service draft for the Colombian marketplace. Modelled on
 * Ley 1480/2011 (Estatuto del Consumidor), Ley 527/1999 (comercio
 * electrónico) y Código Civil colombiano. Marked `indexable: false`
 * until counsel review closes.
 */
export const metadata: Metadata = buildPageMetadata({
  title: `Términos y condiciones — ${brandConfig.name}`,
  description:
    "Términos y condiciones de uso de la plataforma. Reglas del marketplace, responsabilidad del usuario y prohibiciones expresas. Documento en revisión legal.",
  path: "/legal/terminos",
  indexable: false,
});

export default function TerminosPage() {
  return (
    <>
      <Header hideCatalogCta />
      <LegalShell
        eyebrow="Legal · Términos"
        title="Términos y condiciones"
        summary="Reglas que rigen el uso de la plataforma. Al acceder o registrarte aceptas estos términos en su totalidad. Si no estás de acuerdo, no uses el servicio."
        lastUpdated={LAST_UPDATED}
        disclaimer={
          <p>
            <strong>Borrador en revisión legal.</strong> Este documento es
            una plantilla de trabajo redactada con base en la normativa
            colombiana aplicable. Antes de su publicación definitiva debe
            ser revisado y aprobado por un abogado titulado con ejercicio
            en la República de Colombia.
          </p>
        }
      >
        <LegalSection id="aceptacion" title="1. Aceptación de los términos">
          <p>
            Estos términos y condiciones (los <em>“Términos”</em>) regulan
            el acceso y uso de la plataforma {brandConfig.name} (en
            adelante, la <em>“Plataforma”</em>), un servicio digital
            operado por {brandConfig.legalName}, sociedad debidamente
            constituida bajo las leyes de la República de Colombia.
          </p>
          <p>
            Al acceder, registrarte o utilizar la Plataforma en cualquier
            forma, manifiestas que (i) eres mayor de 18 años, (ii) tienes
            plena capacidad legal para contratar bajo el Código Civil
            colombiano, y (iii) aceptas estos Términos y la Política de
            Privacidad en su integridad. Si no aceptas todo lo aquí
            previsto, debes abstenerte de usar la Plataforma.
          </p>
        </LegalSection>

        <LegalSection id="naturaleza" title="2. Naturaleza del servicio">
          <p>
            {brandConfig.name} es un <strong>marketplace de intermediación
            digital</strong>: pone en contacto a personas mayores de edad
            que ofrecen acompañamiento, masajes, prepagos o servicios de
            videollamada con personas que buscan dichos servicios. La
            Plataforma <strong>no presta directamente</strong> ninguno de
            los servicios anunciados por sus usuarios; actúa exclusivamente
            como facilitador tecnológico y operador del directorio en línea.
          </p>
          <LegalList>
            <li>
              Los acuerdos sobre tarifas, lugar, duración y condiciones de
              cada encuentro se pactan directamente entre los usuarios sin
              intervención de la Plataforma.
            </li>
            <li>
              {brandConfig.name} no es empleador, agente, mandatario ni
              representante de las personas que ofrecen sus servicios y no
              es responsable de la ejecución, calidad o cumplimiento de los
              mismos.
            </li>
            <li>
              La Plataforma se reserva el derecho de moderar contenido,
              verificar identidades y retirar perfiles que infrinjan estos
              Términos o la ley aplicable.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="elegibilidad" title="3. Elegibilidad y verificación">
          <p>
            El acceso a la Plataforma está estrictamente restringido a
            personas mayores de 18 años de edad. La verificación de edad
            se realiza mediante (a) reconocimiento explícito al ingresar
            por primera vez al sitio (gate de mayoría de edad), y (b) para
            las personas que publican perfiles, mediante un proceso de
            doble verificación que combina documento de identidad oficial
            colombiano vigente y selfie en vivo.
          </p>
          <p>
            Está absolutamente prohibido el acceso, registro o publicación
            por parte de personas menores de edad, así como el uso de
            documentos o imágenes ajenas. El uso de la Plataforma por
            cualquier persona que oculte su minoría de edad será reportado
            de inmediato al Instituto Colombiano de Bienestar Familiar
            (ICBF), la Fiscalía General de la Nación y demás autoridades
            competentes en cumplimiento de la Ley 679 de 2001 y normas
            concordantes.
          </p>
        </LegalSection>

        <LegalSection id="cuenta" title="4. Registro y cuentas de usuario">
          <p>
            Para publicar un perfil debes crear una cuenta proporcionando
            información veraz, exacta y actualizada. Eres el único
            responsable de mantener la confidencialidad de tus credenciales
            de acceso y de toda actividad que ocurra bajo tu cuenta.
          </p>
          <LegalList>
            <li>
              No puedes ceder, transferir o vender tu cuenta a terceros.
            </li>
            <li>
              Debes notificarnos de inmediato si detectas un uso no
              autorizado de tu cuenta.
            </li>
            <li>
              {brandConfig.name} podrá suspender o eliminar tu cuenta sin
              previo aviso ante cualquier infracción a estos Términos.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="conducta" title="5. Conducta prohibida">
          <p>
            Al usar la Plataforma te obligas a no realizar, promover o
            facilitar ninguna de las siguientes conductas:
          </p>
          <LegalList>
            <li>
              Publicar contenido relacionado con personas menores de edad,
              en cualquier forma o contexto. <strong>Tolerancia cero.</strong>
            </li>
            <li>
              Promover, facilitar o publicitar la trata de personas, la
              explotación sexual comercial o cualquier conducta tipificada
              en la Ley 985 de 2005 y la Ley 1257 de 2008.
            </li>
            <li>
              Suplantar la identidad de terceros, usar fotografías que no
              te pertenezcan o entregar información falsa durante el proceso
              de verificación.
            </li>
            <li>
              Publicar contenido violento, discriminatorio, de odio o que
              vulnere la dignidad humana.
            </li>
            <li>
              Realizar prácticas de spam, scraping no autorizado, ingeniería
              inversa o interferencia con la infraestructura técnica del
              servicio.
            </li>
            <li>
              Usar la Plataforma para actividades ilegales bajo la
              normativa colombiana o internacional aplicable.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="contenido" title="6. Contenido del usuario">
          <p>
            Conservas todos los derechos de autor y de imagen sobre el
            contenido que publicas (fotografías, descripciones, audios,
            videos). Al publicarlo, otorgas a {brandConfig.name} una
            licencia mundial, no exclusiva, gratuita y por el tiempo en
            que el contenido permanezca activo en la Plataforma, para
            almacenarlo, reproducirlo y mostrarlo dentro de la propia
            Plataforma con el único fin de prestar el servicio.
          </p>
          <p>
            Declaras y garantizas que cuentas con todos los derechos sobre
            el contenido que publicas y que su difusión por medio de la
            Plataforma no infringe derechos de terceros ni la ley aplicable.
          </p>
        </LegalSection>

        <LegalSection id="pagos" title="7. Pagos">
          <p>
            En la versión actual del servicio, la Plataforma no procesa
            pagos entre usuarios. Cualquier pago se realiza directamente
            entre las partes mediante los canales que ellas pacten libremente.
          </p>
          <p>
            Cuando se habilite la pasarela de pagos integrada en futuras
            iteraciones, su uso se regirá por los términos del proveedor
            de pasarela y por una adenda específica a estos Términos que
            será notificada con anterioridad a su entrada en vigencia.
          </p>
        </LegalSection>

        <LegalSection id="responsabilidad" title="8. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley, {brandConfig.name}
            no será responsable por:
          </p>
          <LegalList>
            <li>
              Los actos, omisiones, contenido, conducta o cumplimiento de
              los usuarios entre sí, ya sea dentro o fuera de la Plataforma.
            </li>
            <li>
              Daños indirectos, lucro cesante o perjuicios consecuenciales
              derivados del uso o imposibilidad de uso del servicio.
            </li>
            <li>
              Interrupciones, errores o pérdida de datos atribuibles a
              fallas de terceros (proveedores de hosting, pasarelas,
              redes públicas).
            </li>
          </LegalList>
          <p>
            Nada en esta sección excluye la responsabilidad que sea
            legalmente irrenunciable bajo la Ley 1480 de 2011 (Estatuto
            del Consumidor) ni la responsabilidad por dolo o culpa grave.
          </p>
        </LegalSection>

        <LegalSection id="propiedad" title="9. Propiedad intelectual de la Plataforma">
          <p>
            La marca, el logotipo, el código fuente, el diseño, los textos
            editoriales y demás elementos creativos de la Plataforma son
            propiedad de {brandConfig.legalName} o se usan bajo licencia.
            Queda prohibida su reproducción, comunicación pública o
            transformación sin autorización previa y por escrito.
          </p>
        </LegalSection>

        <LegalSection id="terminacion" title="10. Suspensión y terminación">
          <p>
            {brandConfig.name} podrá suspender o terminar el acceso de
            cualquier usuario, con o sin previo aviso, cuando se verifique
            (o se tenga indicio razonable) de incumplimiento de estos
            Términos, infracción a la ley, riesgo para otros usuarios o
            uso fraudulento del servicio.
          </p>
          <p>
            El usuario podrá igualmente terminar la relación contractual
            en cualquier momento eliminando su cuenta desde la
            configuración del perfil o solicitándolo por escrito a la
            dirección de contacto indicada en el Aviso Legal.
          </p>
        </LegalSection>

        <LegalSection id="cambios" title="11. Modificaciones a los Términos">
          <p>
            La Plataforma podrá modificar estos Términos por razones
            comerciales, regulatorias o técnicas. Los cambios serán
            notificados con al menos quince (15) días calendario de
            anticipación a través de la propia Plataforma o por correo
            electrónico al registrado en la cuenta. El uso continuado del
            servicio después de la entrada en vigencia constituirá
            aceptación de la versión modificada.
          </p>
        </LegalSection>

        <LegalSection id="ley-aplicable" title="12. Ley aplicable y jurisdicción">
          <p>
            Estos Términos se rigen por las leyes de la República de
            Colombia. Toda controversia derivada de su interpretación,
            ejecución o terminación será sometida a la jurisdicción
            ordinaria colombiana, con renuncia expresa a cualquier otro
            fuero que pudiera corresponder. Las partes intentarán de buena
            fe resolver previamente las controversias mediante conciliación
            ante un centro autorizado.
          </p>
        </LegalSection>

        <LegalSection id="contacto" title="13. Contacto">
          <p>
            Para consultas sobre estos Términos, denuncias o solicitudes
            legales, escríbenos a través de los canales oficiales
            publicados en el Aviso Legal de la Plataforma.
          </p>
        </LegalSection>
      </LegalShell>
      <Footer />
    </>
  );
}
