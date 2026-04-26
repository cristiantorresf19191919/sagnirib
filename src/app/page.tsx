import type { Metadata } from "next";

import { brandConfig } from "@/core/branding/brand-config";
import { brandCopy } from "@/core/branding/brand-copy";
import { buildPageMetadata } from "@/core/seo/build-page-metadata";

/**
 * Foundation placeholder — explicitly noindex.
 * Real home page will be implemented after the Project Intake + Brand
 * Handshake closes (see docs/project/project-intake.md).
 */
export const metadata: Metadata = buildPageMetadata({
  title: `${brandConfig.name} — En construcción`,
  description: brandConfig.description,
  path: "/",
  indexable: false,
});

export default function HomePlaceholder() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="text-xs uppercase tracking-[0.4em] text-[var(--color-text-subtle)]">
        Foundation · Greenfield
      </span>
      <h1
        className="text-4xl font-semibold leading-tight sm:text-5xl"
        style={{
          color: "var(--color-brand-primary-strong)",
          textShadow: "var(--shadow-glow-primary)",
        }}
      >
        {brandConfig.name}
      </h1>
      <p className="max-w-md text-base text-[var(--color-text-muted)]">
        {brandCopy.slogan}
      </p>
      <p className="max-w-md text-xs text-[var(--color-text-subtle)]">
        Project Intake + Brand Handshake en curso. Esta ruta es un placeholder
        no indexable hasta cerrar el contrato SEO.
      </p>
    </main>
  );
}
