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
 * `/legal/disputas` — cancellation, refunds, and dispute resolution.
 *
 * Peer of the existing legal trio (`terminos`, `privacidad`,
 * `aviso-legal`). Designed to make the safety promise concrete: what
 * happens when an encounter goes sideways, how long resolution takes,
 * and the escalation path. Marked `indexable: true` because trust
 * signals belong in search results; flip via `buildPageMetadata` when
 * counsel signs off.
 */
export const metadata: Metadata = buildPageMetadata({
  title: `Disputas y cancelaciones — ${brandConfig.name}`,
  description:
    "Política de cancelación, reembolso y resolución de disputas. Plazos, escalamiento y reglas claras para ambas partes.",
  path: "/legal/disputas",
});

export default function DisputasPage() {
  return (
    <>
      <Header />
      <LegalShell
        eyebrow="Legal · Disputas"
        title="Política de disputas y cancelaciones"
        summary="Cuando algo no sale como acordamos, esta es la ruta para resolverlo — rápida, documentada y sin tomar partido a priori."
        lastUpdated={LAST_UPDATED}
        disclaimer={
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
            Documento en revisión legal. El proceso operativo descrito aquí
            ya es vinculante para ambas partes; las cifras y plazos pueden
            ajustarse en una próxima revisión.
          </p>
        }
      >
        <LegalSection title="1. Cuándo aplica esta política">
          <p>
            Esta política se activa cuando, después de una reserva confirmada
            en la plataforma, ocurre alguno de los siguientes casos:
          </p>
          <LegalList>
            <li>Cancelación por cualquiera de las partes dentro de la ventana definida.</li>
            <li>El encuentro no se realiza por incumplimiento de la otra parte.</li>
            <li>El servicio prestado difiere materialmente de lo acordado por chat.</li>
            <li>Comportamiento inapropiado, presión o falta de respeto durante el encuentro.</li>
            <li>Fotos del perfil que no corresponden con la persona presente.</li>
          </LegalList>
          <p>
            No aplica a desencuentros menores ni a desacuerdos de gustos —
            para eso existen las reseñas. Las disputas son para incumplimientos
            verificables.
          </p>
        </LegalSection>

        <LegalSection title="2. Cancelación · ventanas y reembolsos">
          <p>
            La política de cancelación depende de quién cancela y con cuánta
            anticipación al encuentro acordado:
          </p>
          <LegalList>
            <li>Cliente cancela con más de 24 horas de anticipación: sin costo.</li>
            <li>Cliente cancela entre 24 y 6 horas antes: penalidad del 25% del monto acordado.</li>
            <li>Cliente cancela con menos de 6 horas: penalidad del 50%.</li>
            <li>Acompañante cancela con más de 12 horas: sin costo para el cliente, una nota leve en su historial.</li>
            <li>Acompañante cancela con menos de 12 horas: el cliente recibe un crédito por el 50% del monto acordado y la acompañante recibe una falta moderada en su historial.</li>
          </LegalList>
          <p>
            Tres faltas moderadas en 90 días gatillan una suspensión temporal
            del perfil mientras el equipo revisa el caso individualmente.
          </p>
        </LegalSection>

        <LegalSection title="3. Reportar una disputa">
          <p>
            Tenés hasta <strong>72 horas</strong> después del encuentro para
            abrir una disputa. Desde el perfil o desde la conversación,
            tocá el ícono de bandera y completá el formulario corto:
          </p>
          <LegalList>
            <li>Motivo (categorías predefinidas + texto libre).</li>
            <li>Evidencia (capturas del chat, fotos, ubicación si aplica).</li>
            <li>Resultado esperado (reembolso parcial, total, baja del perfil contrario, etc.).</li>
          </LegalList>
          <p>
            Los reportes anónimos están permitidos para casos
            safety-critical (sospecha de coerción, menor de edad, violencia);
            el resto requiere cuenta verificada para evitar abuso.
          </p>
        </LegalSection>

        <LegalSection title="4. Plazos de respuesta">
          <LegalList>
            <li>Acuse de recibo automático: inmediato al abrir la disputa.</li>
            <li>Triaje inicial por el equipo de moderación: en menos de 24 horas hábiles.</li>
            <li>Respuesta de la parte contraria: hasta 48 horas para presentar su versión y evidencia.</li>
            <li>Resolución preliminar: hasta 5 días hábiles desde el reporte.</li>
            <li>Apelación: 5 días hábiles a partir de la resolución preliminar para apelar con nueva evidencia.</li>
            <li>Resolución final: hasta 10 días hábiles desde el reporte (15 si hubo apelación).</li>
          </LegalList>
        </LegalSection>

        <LegalSection title="5. Cómo decidimos">
          <p>
            La moderación toma decisiones con base en:
          </p>
          <LegalList>
            <li>Chat acordado dentro de la plataforma (la única evidencia que tiene timestamp verificable).</li>
            <li>Historial de ambas partes (reseñas, faltas previas, antigüedad).</li>
            <li>Evidencia documental presentada (capturas, fotos, audios).</li>
            <li>Patrones detectados — un reporte aislado pesa distinto a tres reportes coincidentes.</li>
          </LegalList>
          <p>
            No tomamos partido a priori por ninguna parte. Las decisiones se
            documentan internamente y, en caso de sanciones graves, se
            comparten con la parte afectada.
          </p>
        </LegalSection>

        <LegalSection title="6. Reembolsos y créditos">
          <p>
            Los reembolsos válidos se acreditan como{" "}
            <strong>crédito en la plataforma</strong> dentro de las 48 horas
            posteriores a la resolución. El crédito es utilizable en
            cualquier reserva futura, no expira y no es transferible. En
            casos excepcionales (fraude probado, suspensión definitiva del
            perfil contrario) el crédito puede convertirse a reembolso
            real al método de pago original.
          </p>
        </LegalSection>

        <LegalSection title="7. Casos graves — escalamiento inmediato">
          <p>
            Algunas situaciones omiten el flujo de disputa estándar y se
            escalan al equipo de safety en menos de 1 hora:
          </p>
          <LegalList>
            <li>Sospecha fundada de menor de edad (suspensión inmediata del perfil y reporte a autoridades).</li>
            <li>Coerción, trata o explotación (contacto con Línea Púrpura 018000 112 137).</li>
            <li>Violencia física o sexual durante el encuentro (sugerimos marcar 123 antes de cualquier reporte en plataforma).</li>
            <li>Fraude organizado o extorsión.</li>
          </LegalList>
        </LegalSection>

        <LegalSection title="8. Apelación y recurso externo">
          <p>
            Si después de la apelación interna no estás conforme con la
            resolución, podés escalar a la Superintendencia de Industria y
            Comercio (SIC) en su rol de protección al consumidor — el
            trámite es gratuito y digital en{" "}
            <a
              href="https://www.sic.gov.co"
              className="text-[var(--color-brand-primary)] underline-offset-2 hover:underline"
              rel="noopener"
              target="_blank"
            >
              sic.gov.co
            </a>
            . Esto no reemplaza la jurisdicción ordinaria: cualquiera de las
            partes conserva el derecho a acudir a tribunales civiles
            colombianos.
          </p>
        </LegalSection>

        <LegalSection title="9. Contacto">
          <p>
            Para cualquier consulta sobre esta política o el estado de una
            disputa abierta, escribinos al canal de soporte desde tu cuenta.
            Si por alguna razón no podés acceder, el correo de respaldo es{" "}
            <span className="font-mono text-sm text-[var(--color-foreground)]">
              soporte@biringas.app
            </span>
            .
          </p>
        </LegalSection>
      </LegalShell>
      <Footer />
    </>
  );
}
