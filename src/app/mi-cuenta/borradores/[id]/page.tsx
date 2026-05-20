import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Globe,
  Image as ImageIcon,
  Languages,
  Loader2,
  Lock,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

import { buildPageMetadata } from "@/core/seo/build-page-metadata";
import { getSession } from "@/server/auth";
import {
  ATTENTION_CATALOG,
  CONTACT_CATALOG,
  getMyDraft,
  type ListingDraftRecord,
  type ListingDraftStatus,
} from "@/server/biringas";
import { Container } from "@/shared/design-system/components/Container";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";

export const metadata: Metadata = buildPageMetadata({
  title: "Detalle del borrador — Biringas",
  description: "Vista en revisión de un borrador del catálogo.",
  path: "/mi-cuenta/borradores",
  indexable: false,
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BorradorDetallePage({ params }: PageProps) {
  const session = await getSession().catch(() => null);
  if (!session) {
    redirect("/ingresar?next=/mi-cuenta");
  }
  const { id } = await params;
  const draft = await getMyDraft(id);
  if (!draft) notFound();

  return (
    <>
      <Header hideCatalogCta />
      <main className="relative isolate bg-[var(--color-background)] py-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_15%_5%,rgba(47,93,67,0.10),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(229,162,58,0.10),transparent_55%)]"
        />
        <Container width="wide" className="flex flex-col gap-8">
          <HeaderSection draft={draft} />
          <StatusBanner draft={draft} />

          <div className="grid gap-5 lg:grid-cols-2">
            <PublicDataCard draft={draft} />
            <PrivateDataCard draft={draft} />
            <DescriptionCard draft={draft} />
            <AttributesCard draft={draft} />
            <GalleryCard draft={draft} />
            <PlanCard draft={draft} />
          </div>

          <FooterNote status={draft.status} />
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function HeaderSection({ draft }: Readonly<{ draft: ListingDraftRecord }>) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/mi-cuenta"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-primary-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver al dashboard
        </Link>
        <h1 className="font-[var(--font-display)] text-[clamp(28px,3vw,40px)] font-[420] leading-[1.05] tracking-[-0.02em] text-[var(--color-foreground)]">
          {draft.payload.details.displayName || "Borrador sin nombre"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          Esto es lo que enviaste. Mientras tu publicación está en revisión
          humana, no se puede editar — si necesitamos algo te avisamos antes
          de 24 horas.
        </p>
      </div>
      <StatusPill status={draft.status} />
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status banner — mirrors the KycStatusCard pattern from the dashboard.     */
/* -------------------------------------------------------------------------- */

const STATUS_PRESENTATION: Record<
  ListingDraftStatus,
  {
    icon: typeof Loader2;
    surface: string;
    iconTile: string;
    glow: string;
    title: string;
    body: string;
    meta?: { icon: typeof Clock; label: string };
  }
> = {
  pending_review: {
    icon: Loader2,
    surface:
      "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/10",
    iconTile:
      "bg-[var(--color-brand-accent)]/18 text-[var(--color-brand-accent-strong)] ring-1 ring-[var(--color-brand-accent)]/45",
    glow: "shadow-[var(--shadow-glow-accent)]",
    title: "En revisión humana",
    body: "Recibimos tu publicación y la pasamos por la verificación de 2 capas. Mientras tanto solo aparece para vos.",
    meta: { icon: Clock, label: "Suele tardar menos de 24 horas" },
  },
  approved: {
    icon: ShieldCheck,
    surface:
      "border-[var(--color-brand-primary)]/35 bg-[var(--color-brand-primary)]/8",
    iconTile:
      "bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/35",
    glow: "shadow-[var(--shadow-glow-primary)]",
    title: "Publicación aprobada",
    body: "Tu perfil pasó la verificación y aparece en el catálogo público.",
  },
  rejected: {
    icon: ShieldAlert,
    surface:
      "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/8",
    iconTile:
      "bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)] ring-1 ring-[var(--color-brand-highlight)]/45",
    glow: "shadow-[var(--shadow-md)]",
    title: "Publicación rechazada",
    body: "Hubo un detalle que no pasó la revisión. Podés editar el borrador y volver a enviarlo.",
  },
};

function StatusBanner({ draft }: Readonly<{ draft: ListingDraftRecord }>) {
  const presentation = STATUS_PRESENTATION[draft.status];
  const Icon = presentation.icon;
  const animateIcon = draft.status === "pending_review";
  const MetaIcon = presentation.meta?.icon;
  return (
    <div
      className={`relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-2xl)] border p-5 text-[var(--color-foreground)] sm:flex-row sm:items-center sm:justify-between sm:gap-5 ${presentation.surface} ${presentation.glow}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${presentation.iconTile}`}
        >
          <Icon
            className={`h-5 w-5 ${animateIcon ? "animate-spin" : ""}`}
            aria-hidden
          />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
            {presentation.title}
          </span>
          <span className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {presentation.body}
          </span>
          {presentation.meta && MetaIcon ? (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
              <MetaIcon className="h-3 w-3" aria-hidden />
              {presentation.meta.label}
            </span>
          ) : null}
          {draft.status === "rejected" && draft.rejectionReason ? (
            <span className="mt-1 inline-block rounded-[var(--radius-sm)] bg-[var(--color-surface)]/80 px-2 py-1 text-[11px] text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-highlight)]/20">
              <strong className="font-semibold">Motivo:</strong>{" "}
              {draft.rejectionReason}
            </span>
          ) : null}
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
        Recibido{" "}
        {new Intl.DateTimeFormat("es-CO", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(draft.submittedAt))}
      </span>
    </div>
  );
}

function StatusPill({ status }: Readonly<{ status: ListingDraftStatus }>) {
  const tone: Record<ListingDraftStatus, { label: string; classes: string; icon: typeof Clock }> = {
    pending_review: {
      label: "En revisión",
      classes:
        "border-[var(--color-brand-accent)]/45 bg-[var(--color-brand-accent)]/15 text-[var(--color-brand-accent-strong)]",
      icon: Clock,
    },
    approved: {
      label: "Aprobado",
      classes:
        "border-[var(--color-brand-primary)]/45 bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]",
      icon: ShieldCheck,
    },
    rejected: {
      label: "Rechazado",
      classes:
        "border-[var(--color-brand-highlight)]/45 bg-[var(--color-brand-highlight)]/15 text-[var(--color-brand-highlight)]",
      icon: ShieldAlert,
    },
  };
  const t = tone[status];
  const Icon = t.icon;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${t.classes}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {t.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section cards                                                             */
/* -------------------------------------------------------------------------- */

function SectionCard({
  icon: Icon,
  title,
  children,
}: Readonly<{
  icon: typeof Eye;
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <header className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-[var(--font-display)] text-base font-[420] tracking-[-0.01em] text-[var(--color-foreground)]">
          {title}
        </h2>
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  span = 1,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}>) {
  return (
    <div
      className={`flex flex-col gap-1 ${span === 2 ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-[var(--color-foreground)]">
        {value || (
          <span className="text-[var(--color-text-subtle)]">—</span>
        )}
      </dd>
    </div>
  );
}

function ChipList({ items }: Readonly<{ items: ReadonlyArray<string> }>) {
  if (items.length === 0) {
    return <span className="text-[var(--color-text-subtle)]">—</span>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center rounded-full bg-[var(--color-brand-primary)]/8 px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-foreground)] ring-1 ring-[var(--color-brand-primary)]/15"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BooleanBadge({ value }: Readonly<{ value: boolean }>) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        value
          ? "text-[var(--color-brand-primary)]"
          : "text-[var(--color-text-muted)]"
      }`}
    >
      {value ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : (
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full bg-[var(--color-text-subtle)]/40"
        />
      )}
      {value ? "Sí" : "No"}
    </span>
  );
}

function formatCop(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function labelsFromCatalog<T extends { id: string; label: string }>(
  catalog: ReadonlyArray<T>,
  ids: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const map = new Map(catalog.map((c) => [c.id, c.label]));
  return ids.map((id) => map.get(id) ?? id);
}

function PublicDataCard({
  draft,
}: Readonly<{ draft: ListingDraftRecord }>) {
  const d = draft.payload.details;
  return (
    <SectionCard icon={Eye} title="Datos públicos">
      <Field label="Nombre artístico" value={d.displayName} />
      <Field label="Edad" value={d.age > 0 ? `${d.age} años` : "—"} />
      <Field
        label="Ciudad"
        value={
          d.city ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              {d.city}
            </span>
          ) : (
            ""
          )
        }
      />
      <Field
        label="Categoría"
        value={d.category ? <span className="capitalize">{d.category}</span> : ""}
      />
      <Field label="URL preferida" value={d.preferredSlug ? `/p/${d.preferredSlug}` : ""} />
      <Field label="Tarifa por hora" value={formatCop(d.pricePerHour)} />
    </SectionCard>
  );
}

function PrivateDataCard({
  draft,
}: Readonly<{ draft: ListingDraftRecord }>) {
  const d = draft.payload.details;
  return (
    <SectionCard icon={Lock} title="Datos privados (solo vos los ves)">
      <Field
        label="Teléfono de verificación"
        value={
          d.phone ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              {d.phone}
            </span>
          ) : (
            ""
          )
        }
      />
      <Field
        label="Canales de contacto"
        value={
          <ChipList items={labelsFromCatalog(CONTACT_CATALOG, d.contactChannels)} />
        }
      />
      <Field
        label="Atiende a"
        span={2}
        value={
          <ChipList items={labelsFromCatalog(ATTENTION_CATALOG, d.attention)} />
        }
      />
    </SectionCard>
  );
}

function DescriptionCard({
  draft,
}: Readonly<{ draft: ListingDraftRecord }>) {
  const d = draft.payload.description;
  return (
    <SectionCard icon={Sparkles} title="Descripción y servicios">
      <Field label="Frase corta" value={d.shortBio} span={2} />
      <Field
        label="Descripción larga"
        span={2}
        value={
          d.bio ? (
            <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-foreground)]">
              {d.bio}
            </p>
          ) : (
            ""
          )
        }
      />
      <Field
        label="Servicios incluidos"
        span={2}
        value={<ChipList items={[...d.services]} />}
      />
      <Field
        label="Contextos de encuentro"
        span={2}
        value={<ChipList items={[...d.meetingContexts]} />}
      />
      <Field label="Rostro visible" value={<BooleanBadge value={d.faceVisible} />} />
      <Field
        label="Acepta tarjeta"
        value={<BooleanBadge value={d.paymentByCard} />}
      />
      <Field
        label="Disponible ahora"
        value={<BooleanBadge value={d.availableNow} />}
      />
    </SectionCard>
  );
}

function AttributesCard({
  draft,
}: Readonly<{ draft: ListingDraftRecord }>) {
  const a = draft.payload.attributes;
  return (
    <SectionCard icon={Tag} title="Características">
      <Field
        label="País"
        value={
          a.country ? (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              {a.country}
            </span>
          ) : (
            ""
          )
        }
      />
      <Field label="Etnia" value={a.ethnicity} />
      <Field label="Cabello" value={a.hair} />
      <Field label="Estatura" value={a.height} />
      <Field label="Cuerpo" value={a.body} />
      <Field label="Senos" value={a.breast} />
      {a.pubis ? <Field label="Pubis" value={a.pubis} /> : null}
      <Field
        label="Idiomas"
        span={2}
        value={
          a.languages.length > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden />
              <ChipList items={[...a.languages]} />
            </span>
          ) : (
            ""
          )
        }
      />
    </SectionCard>
  );
}

function GalleryCard({
  draft,
}: Readonly<{ draft: ListingDraftRecord }>) {
  const count = draft.payload.description.gallery.length;
  return (
    <SectionCard icon={ImageIcon} title="Galería">
      <Field
        label="Fotos enviadas"
        span={2}
        value={
          count > 0 ? (
            <span className="inline-flex items-center gap-2">
              <strong className="text-[var(--color-foreground)]">
                {count} {count === 1 ? "foto" : "fotos"}
              </strong>
              <span className="text-[var(--color-text-muted)]">
                — listas para la verificación KYC + revisión humana.
              </span>
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">
              Sin fotos adjuntas. El equipo puede pedirte que las subas en
              esta etapa.
            </span>
          )
        }
      />
    </SectionCard>
  );
}

function PlanCard({ draft }: Readonly<{ draft: ListingDraftRecord }>) {
  const p = draft.payload.publish;
  return (
    <SectionCard icon={CreditCard} title="Plan elegido">
      <Field
        label="Paquete"
        value={<span className="capitalize">{p.packageId}</span>}
      />
      <Field
        label="Facturación"
        value={p.billing === "quarterly" ? "Trimestral" : "Mensual"}
      />
      <Field
        label="Add-ons"
        span={2}
        value={<ChipList items={[...p.addOnIds]} />}
      />
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer note                                                               */
/* -------------------------------------------------------------------------- */

function FooterNote({ status }: Readonly<{ status: ListingDraftStatus }>) {
  if (status === "pending_review") {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] p-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
        Mientras tu publicación está en revisión humana, no se puede editar.
        Si necesitamos algún cambio te avisamos por el canal de contacto que
        registraste — suele tardar menos de 24 horas hábiles.
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-brand-highlight)]/30 bg-[var(--color-brand-highlight)]/8 p-4 text-xs leading-relaxed text-[var(--color-foreground)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          Tu intento anterior no pasó la revisión. Podés editar este borrador y
          reenviarlo cuando estés lista.
        </span>
        {/* TODO: enable when the update flow lands. Today this would
            re-create a draft and conflict on slug — keep the route surface
            consistent but route to the dashboard for now. */}
        <Link
          href="/mi-cuenta"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-4 text-xs font-semibold text-[var(--color-surface)] shadow-[var(--shadow-glow-primary)] transition-colors hover:bg-[var(--color-brand-primary-strong)]"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }
  return null;
}
