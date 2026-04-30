import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  /** Visible label to render alongside the icon. */
  label?: string;
  /** Compact (icon only) or default (icon + label). */
  compact?: boolean;
}

export function VerifiedBadge({
  label = "Verificada",
  compact = false,
}: VerifiedBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-primary)]/10 px-2 py-1 text-xs font-medium text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
      aria-label={label}
      title={label}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {!compact && <span>{label}</span>}
    </span>
  );
}
