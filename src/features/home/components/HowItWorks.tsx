import type { CSSProperties, ReactNode } from "react";

import { Container } from "@/shared/design-system/components/Container";

type Tone = "primary" | "secondary" | "accent";

interface Step {
  index: string;
  stamp: string;
  timestamp: string;
  title: string;
  description: string;
  rows: ReadonlyArray<[label: string, value: string]>;
  signature: string;
  tone: Tone;
  mark: ReactNode;
}

const STEPS: ReadonlyArray<Step> = [
  {
    index: "01",
    stamp: "Carta",
    timestamp: "23:00 — Llegas",
    title: "Hojea el catálogo",
    description:
      "Filtra por ciudad, tipo de evento o disponibilidad y revisa perfiles con fotos, idiomas y reseñas.",
    rows: [
      ["Tiempo estimado", "00:30"],
      ["Filtros", "Ciudad · Servicio"],
      ["Confirmación", "—"],
    ],
    signature: "Mila",
    tone: "primary",
    mark: <RingMark />,
  },
  {
    index: "02",
    stamp: "Firma",
    timestamp: "23:14 — Decides",
    title: "Verifica antes de elegir",
    description:
      "Cada acompañante destacada pasa por un check de identidad y consentimiento de imagen documentado en la barra.",
    rows: [
      ["Tiempo estimado", "00:45"],
      ["Check", "Identidad · Imagen"],
      ["Confirmación", "SMS + WhatsApp"],
    ],
    signature: "Rocío",
    tone: "secondary",
    mark: <SparkMark />,
  },
  {
    index: "03",
    stamp: "Pase",
    timestamp: "23:59 — Reservas",
    title: "Contrata sin fricción",
    description:
      "Reserva directo desde el perfil. Pagos y mensajería conectan en la próxima versión — hoy es entrada al MVP.",
    rows: [
      ["Tiempo estimado", "00:15"],
      ["Pago", "Próxima versión"],
      ["Empaque", "Discreto · Sellado"],
    ],
    signature: "Vera",
    tone: "accent",
    mark: <MoonMark />,
  },
];

const TONE_VARS: Record<Tone, CSSProperties> = {
  primary: {
    "--tone": "var(--color-brand-primary)",
    "--tone-strong": "var(--color-brand-primary-strong)",
    "--tone-soft": "var(--color-brand-primary-soft)",
    "--tone-glow":
      "0 0 24px rgba(255,43,181,0.45), 0 0 60px rgba(255,43,181,0.20)",
  } as CSSProperties,
  secondary: {
    "--tone": "var(--color-brand-secondary)",
    "--tone-strong": "var(--color-brand-secondary-strong)",
    "--tone-soft": "var(--color-brand-secondary-strong)",
    "--tone-glow":
      "0 0 24px rgba(122,43,255,0.50), 0 0 60px rgba(122,43,255,0.22)",
  } as CSSProperties,
  accent: {
    "--tone": "var(--color-brand-accent)",
    "--tone-strong": "var(--color-brand-accent-strong)",
    "--tone-soft": "var(--color-brand-accent-strong)",
    "--tone-glow":
      "0 0 24px rgba(31,168,255,0.50), 0 0 60px rgba(31,168,255,0.22)",
  } as CSSProperties,
};

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="relative scroll-mt-24 overflow-hidden border-y border-[var(--color-border)]/40 bg-[var(--color-background-elevated)] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(255,43,181,0.10),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(31,168,255,0.10),transparent_50%)]"
      />

      <Container width="wide">
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Cómo funciona
          </span>
          <h2
            id="how-title"
            className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
          >
            Tres pasos para encontrar la compañía adecuada.
          </h2>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
          {STEPS.map((step) => (
            <li key={step.index} className="contents">
              <Receipt step={step} />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

interface ReceiptProps {
  step: Step;
}

function Receipt({ step }: Readonly<ReceiptProps>) {
  return (
    <article
      style={TONE_VARS[step.tone]}
      className="group relative isolate flex flex-col"
    >
      {/* Pin / glowing dot */}
      <span
        aria-hidden
        className="absolute left-1/2 -top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--tone)]"
        style={{ boxShadow: "var(--tone-glow)" }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 -top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--tone)]/30 motion-safe:animate-ping"
      />

      {/* Ambient halo behind ticket */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-6 -z-10 h-[70%] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--tone) 35%, transparent), transparent 70%)",
        }}
      />

      <ZigzagBand variant="top" />

      <div className="relative flex flex-1 flex-col bg-[var(--color-surface)] px-6 pt-5 pb-7 sm:px-7">
        {/* Subtle paper texture lines */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 22px, rgba(255,255,255,0.6) 22px 23px)",
          }}
        />

        {/* Header strip */}
        <div className="relative flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Biringas · Comanda
          </span>
          <Barcode />
        </div>

        <div className="relative mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--tone-strong)]">
          {step.timestamp}
        </div>

        {/* Stamp + numeral */}
        <div className="relative mt-7 flex items-start justify-between gap-4">
          <span
            aria-hidden
            className="block font-serif text-[6.5rem] font-light italic leading-[0.85] tracking-tight text-[var(--tone)] sm:text-[7.5rem]"
            style={{
              textShadow:
                "0 0 24px color-mix(in oklab, var(--tone) 60%, transparent)",
            }}
          >
            {step.index}
          </span>
          <Stamp label={step.stamp} />
        </div>

        <h3 className="relative mt-3 text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)] sm:text-[1.6rem]">
          {step.title}
        </h3>

        <Dashed />

        <p className="relative text-sm leading-relaxed text-[var(--color-text-muted)]">
          {step.description}
        </p>

        <Dashed />

        <dl className="relative flex flex-col gap-2.5">
          {step.rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-[0.18em]"
            >
              <dt className="text-[var(--color-text-subtle)]">{label}</dt>
              <dd className="font-semibold text-[var(--tone-strong)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Bottom row: signature + status mark */}
        <div className="relative mt-7 flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-subtle)]">
              Firma · Barra
            </span>
            <span
              className="font-serif text-3xl italic leading-none text-[var(--tone)]"
              style={{
                textShadow:
                  "0 0 18px color-mix(in oklab, var(--tone) 50%, transparent)",
              }}
            >
              {step.signature}
            </span>
          </div>

          <span
            aria-hidden
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--tone)]/60 bg-[var(--color-background)]/40 text-[var(--tone)]"
            style={{
              boxShadow:
                "inset 0 0 0 1px color-mix(in oklab, var(--tone) 30%, transparent), 0 0 24px color-mix(in oklab, var(--tone) 35%, transparent)",
            }}
          >
            {step.mark}
          </span>
        </div>
      </div>

      <ZigzagBand variant="bottom" />
    </article>
  );
}

interface ZigzagBandProps {
  variant: "top" | "bottom";
}

function ZigzagBand({ variant }: Readonly<ZigzagBandProps>) {
  // Saw-tooth path scaled with preserveAspectRatio="none". Each tooth is
  // 20 units wide; viewBox is 1200 wide → 60 teeth across the strip.
  const top =
    "M0,12 L0,6 L20,12 L40,6 L60,12 L80,6 L100,12 L120,6 L140,12 L160,6 L180,12 L200,6 L220,12 L240,6 L260,12 L280,6 L300,12 L320,6 L340,12 L360,6 L380,12 L400,6 L420,12 L440,6 L460,12 L480,6 L500,12 L520,6 L540,12 L560,6 L580,12 L600,6 L620,12 L640,6 L660,12 L680,6 L700,12 L720,6 L740,12 L760,6 L780,12 L800,6 L820,12 L840,6 L860,12 L880,6 L900,12 L920,6 L940,12 L960,6 L980,12 L1000,6 L1020,12 L1040,6 L1060,12 L1080,6 L1100,12 L1120,6 L1140,12 L1160,6 L1180,12 L1200,6 L1200,12 Z";
  const bottom =
    "M0,0 L0,6 L20,0 L40,6 L60,0 L80,6 L100,0 L120,6 L140,0 L160,6 L180,0 L200,6 L220,0 L240,6 L260,0 L280,6 L300,0 L320,6 L340,0 L360,6 L380,0 L400,6 L420,0 L440,6 L460,0 L480,6 L500,0 L520,6 L540,0 L560,6 L580,0 L600,6 L620,0 L640,6 L660,0 L680,6 L700,0 L720,6 L740,0 L760,6 L780,0 L800,6 L820,0 L840,6 L860,0 L880,6 L900,0 L920,6 L940,0 L960,6 L980,0 L1000,6 L1020,0 L1040,6 L1060,0 L1080,6 L1100,0 L1120,6 L1140,0 L1160,6 L1180,0 L1200,6 L1200,0 Z";

  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 12"
      preserveAspectRatio="none"
      className="block h-3 w-full text-[var(--color-surface)]"
    >
      <path d={variant === "top" ? top : bottom} fill="currentColor" />
    </svg>
  );
}

interface StampProps {
  label: string;
}

function Stamp({ label }: Readonly<StampProps>) {
  return (
    <span
      aria-hidden
      className="mt-2 inline-flex -rotate-[6deg] items-center rounded-md border-2 border-dashed border-[var(--tone)]/70 bg-[var(--color-background)]/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--tone-soft)]"
      style={{
        boxShadow:
          "inset 0 0 0 1px color-mix(in oklab, var(--tone) 25%, transparent)",
      }}
    >
      {label}
    </span>
  );
}

function Dashed() {
  return (
    <div
      aria-hidden
      className="relative my-5 h-px w-full"
      style={{
        backgroundImage:
          "linear-gradient(to right, color-mix(in oklab, var(--color-text-subtle) 60%, transparent) 50%, transparent 0)",
        backgroundSize: "8px 1px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

function Barcode() {
  // Hand-tuned bar pattern so each card reads slightly different but stays
  // legible as "barcode" silhouette.
  const bars = [2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1, 2];
  let x = 0;
  return (
    <svg
      aria-hidden
      viewBox="0 0 56 14"
      width="56"
      height="14"
      className="text-[var(--tone)]"
    >
      {bars.map((w, i) => {
        const rect = (
          <rect
            key={`bar-${i}-${x}`}
            x={x}
            y={0}
            width={w}
            height={14}
            fill="currentColor"
          />
        );
        x += w + 1;
        return rect;
      })}
    </svg>
  );
}

function RingMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SparkMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M12 3 L12 21 M3 12 L21 12 M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" />
    </svg>
  );
}

function MoonMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
