"use client";

import { useState } from "react";
import { EnquiryForm, type FieldConfig } from "@/components/forms/enquiry-form";
import type { FormType } from "@/lib/forms";
import { cn } from "@/lib/utils";

/** Tabbed enquiry panel used on property and vehicle detail pages. */
export function EnquiryTabs({ tabs, relatedId }: { tabs: { key: string; label: string; formType: FormType; fields: FieldConfig[]; submitLabel: string; defaults?: Record<string, string> }[]; relatedId: string }) {
  const [active, setActive] = useState(tabs[0].key);
  return (
    <div>
      <div role="tablist" className="flex border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "-mb-px border-b-2 px-1 pb-4 font-display text-sm font-semibold transition-colors sm:text-[15px] [&+&]:ml-8",
              active === t.key ? "border-accent text-primary" : "border-transparent text-ink/45 hover:text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={active !== t.key} className="pt-8">
          <EnquiryForm formType={t.formType} fields={t.fields} defaults={{ relatedId, ...t.defaults }} submitLabel={t.submitLabel} compact />
        </div>
      ))}
    </div>
  );
}
