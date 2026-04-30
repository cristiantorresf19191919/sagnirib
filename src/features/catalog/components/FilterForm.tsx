"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

interface FilterFormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  children: ReactNode;
}

/**
 * Plain GET form wrapper that strips empty inputs before the browser
 * submits. Keeps the URL clean (no `?priceMin=&priceMax=&…` noise) without
 * pulling in client-side routing — the browser still owns navigation.
 *
 * `disabled` inputs are not included in the form submission, which is the
 * documented HTML behaviour we lean on here.
 */
export function FilterForm({ children, ...formProps }: FilterFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const fields = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    fields.forEach((el) => {
      if (el.type === "checkbox" || el.type === "radio") return;
      if (el.value === "" || el.value === null) {
        el.disabled = true;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} {...formProps}>
      {children}
    </form>
  );
}
