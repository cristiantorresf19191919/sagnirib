"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, X } from "lucide-react";

import { useSavedSearches } from "@/features/catalog/lib/use-saved-searches";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
});

/**
 * Saved-searches drawer rendered on `/favoritas`. Reads from the same
 * localStorage store as `SaveSearchButton`. Renders nothing while
 * hydrating (so SSR markup stays empty) and a compact "todavía no
 * guardaste búsquedas" prompt when the store is empty.
 */
export function SavedSearchesList() {
  const { ready, searches, remove } = useSavedSearches();

  if (!ready) return null;

  return (
    <section
      data-testid="saved-searches-list"
      aria-labelledby="saved-searches-title"
      className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 backdrop-blur-sm sm:p-6"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]/20"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2
              id="saved-searches-title"
              className="text-base font-semibold text-[var(--color-foreground)]"
            >
              Búsquedas guardadas
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Vuelve a tu filtro perfecto con un clic.
            </p>
          </div>
        </div>
      </header>

      {searches.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-background-elevated)] px-4 py-5 text-center text-sm text-[var(--color-text-muted)]">
          Aún no guardaste búsquedas. Cuando apliques filtros en{" "}
          <Link
            href="/explorar"
            className="font-semibold text-[var(--color-brand-primary)] underline-offset-4 hover:underline"
          >
            /explorar
          </Link>
          , verás un botón <em>"Guardar búsqueda"</em>.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {searches.map((s) => (
            <li
              key={s.id}
              data-testid={`saved-search-${s.id}`}
              className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 transition-[border-color,background] duration-150 ease-[var(--ease-standard)] hover:border-[var(--color-brand-primary-soft)] hover:bg-[var(--color-background-elevated)]"
            >
              <Link
                href={s.href}
                className="flex min-w-0 flex-1 items-center gap-3 focus:outline-none"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                    {s.label}
                  </span>
                  <span className="truncate text-[11px] text-[var(--color-text-subtle)]">
                    Guardada {DATE_FORMAT.format(new Date(s.savedAt))} · {s.href}
                  </span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-primary)]"
                  aria-hidden
                />
              </Link>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`Quitar búsqueda ${s.label}`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
