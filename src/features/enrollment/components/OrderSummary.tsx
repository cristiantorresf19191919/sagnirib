"use client";

import { Check } from "lucide-react";

import {
  ADD_ONS,
  type BillingCycle,
  PACKAGES,
  type PackageId,
  calculateTotal,
  formatCop,
  type AddOnId,
} from "../lib/pricing";

interface OrderSummaryProps {
  packageId: PackageId;
  addOnIds: ReadonlyArray<AddOnId>;
  billing: BillingCycle;
}

export function OrderSummary({ packageId, addOnIds, billing }: OrderSummaryProps) {
  const pkg = PACKAGES.find((p) => p.id === packageId)!;
  const totals = calculateTotal(packageId, addOnIds, billing);
  const months = billing === "quarterly" ? 3 : 1;
  const cycleLabel = billing === "quarterly" ? "trimestre" : "mes";

  return (
    <aside className="sticky top-24 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
          Resumen
        </span>
        <span className="text-base font-semibold text-[var(--color-foreground)]">
          Plan {pkg.name}
        </span>
        <span className="text-[12px] text-[var(--color-text-muted)]">
          {months} {months === 1 ? "mes" : "meses"} · facturado por {cycleLabel}
        </span>
      </div>

      <ul className="flex flex-col gap-2 text-[12px] text-[var(--color-text-muted)]">
        <SummaryLine label={`Plan ${pkg.name}`} amount={totals.packageCop} />
        {addOnIds.length > 0 ? (
          addOnIds.map((id) => {
            const addOn = ADD_ONS.find((a) => a.id === id)!;
            return (
              <SummaryLine
                key={id}
                label={addOn.name}
                amount={addOn.priceCop}
                hint="pago único"
              />
            );
          })
        ) : (
          <li className="text-[12px] italic text-[var(--color-text-subtle)]">
            Sin refuerzos seleccionados.
          </li>
        )}
      </ul>

      <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Total ahora
          </span>
          <span className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            {formatCop(totals.totalCop)}
          </span>
        </div>
        <span className="text-[11px] text-[var(--color-text-subtle)]">
          {formatCop(totals.effectiveMonthlyCop)} efectivos / mes durante el plan
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Reassurance>Cancela cuando quieras antes del próximo ciclo.</Reassurance>
        <Reassurance>Soporte humano · respuesta en menos de 24 h.</Reassurance>
        <Reassurance>Datos privados nunca se publican.</Reassurance>
      </ul>
    </aside>
  );
}

function SummaryLine({
  label,
  amount,
  hint,
}: {
  label: string;
  amount: number;
  hint?: string;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
            {hint}
          </span>
        )}
      </span>
      <span className="text-[12px] font-semibold text-[var(--color-foreground)]">
        {formatCop(amount)}
      </span>
    </li>
  );
}

function Reassurance({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]"
      >
        <Check className="h-2 w-2" aria-hidden />
      </span>
      {children}
    </li>
  );
}
