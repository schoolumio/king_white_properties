"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload } from "lucide-react";
import type { FieldDef } from "@/lib/content-schema";
import { ActionForm, SubmitButton } from "./form";
import { saveContent } from "@/app/admin/actions/content";

/* eslint-disable @typescript-eslint/no-explicit-any */

const input = "w-full border border-line bg-white px-3 text-[14px] outline-none focus:border-navy";

export function ContentEditor({ sectionKey, fields, initial }: { sectionKey: string; fields: FieldDef[]; initial: Record<string, any> }) {
  const [value, setValue] = useState<Record<string, any>>(initial);
  return (
    <ActionForm action={saveContent} className="space-y-6">
      <input type="hidden" name="key" value={sectionKey} />
      <input type="hidden" name="value" value={JSON.stringify(value)} />
      <div className="grid gap-5 border border-line bg-white p-5 sm:grid-cols-2">
        <Fields fields={fields} value={value} onChange={setValue} />
      </div>
      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0">
        <SubmitButton>Save & publish</SubmitButton>
      </div>
    </ActionForm>
  );
}

function Fields({ fields, value, onChange }: { fields: FieldDef[]; value: Record<string, any>; onChange: (v: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });
  return (
    <>
      {fields.map((f) => (
        <FieldEditor key={f.name} field={f} value={value?.[f.name]} onChange={(v) => set(f.name, v)} />
      ))}
    </>
  );
}

function Label({ field }: { field: FieldDef }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-semibold text-ink/75">
      {field.label}
      {field.help && <span className="block text-[11.5px] font-normal text-ink/50">{field.help}</span>}
    </span>
  );
}

function FieldEditor({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  switch (field.type) {
    case "text":
    case "email":
    case "url":
      return (
        <label className="block">
          <Label field={field} />
          <input className={`${input} h-10`} type={field.type === "text" ? "text" : field.type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case "color":
      return (
        <label className="block">
          <Label field={field} />
          <span className="flex gap-2">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-14 border border-line" />
            <input className={`${input} h-10 font-mono`} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
          </span>
        </label>
      );
    case "textarea":
    case "markdown":
      return (
        <label className="block sm:col-span-2">
          <Label field={field} />
          <textarea className={`${input} py-2 leading-relaxed ${field.type === "markdown" ? "font-mono text-[13px]" : ""}`} rows={field.type === "markdown" ? 10 : 3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
          {field.type === "markdown" && <span className="mt-1 block text-[11.5px] text-ink/45">Markdown: **bold**, *italic*, “- ” for lists, “## ” for headings, blank line between paragraphs.</span>}
        </label>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-[13.5px] sm:col-span-2">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" /> {field.label}
        </label>
      );
    case "image":
      return <ImageField field={field} value={value ?? ""} onChange={onChange} />;
    case "stringList":
      return (
        <label className="block">
          <Label field={field} />
          <textarea className={`${input} py-2`} rows={5} value={(value ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
          <span className="mt-1 block text-[11.5px] text-ink/45">One item per line.</span>
        </label>
      );
    case "group":
      return (
        <fieldset className="border border-line p-4 sm:col-span-2">
          <legend className="px-1 font-display text-sm font-semibold text-navy">{field.label}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Fields fields={field.fields} value={value ?? {}} onChange={onChange} />
          </div>
        </fieldset>
      );
    case "objectList": {
      const list: any[] = Array.isArray(value) ? value : [];
      const update = (next: any[]) => onChange(next);
      return (
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 font-display text-sm font-semibold text-navy">{field.label}</legend>
          <ol className="space-y-3">
            {list.map((item, i) => (
              <li key={i} className="border border-line bg-[#fafaf8] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink/55">
                    {field.itemLabel ?? "Item"} {i + 1}
                  </span>
                  <span className="flex gap-1">
                    <button type="button" aria-label="Move up" className="grid h-8 w-8 place-items-center border border-line bg-white" onClick={() => i > 0 && update(list.map((x, j) => (j === i - 1 ? list[i] : j === i ? list[i - 1] : x)))}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Move down" className="grid h-8 w-8 place-items-center border border-line bg-white" onClick={() => i < list.length - 1 && update(list.map((x, j) => (j === i + 1 ? list[i] : j === i ? list[i + 1] : x)))}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Remove" className="grid h-8 w-8 place-items-center border border-rose-200 bg-white text-rose-700" onClick={() => update(list.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Fields fields={field.fields} value={item} onChange={(v) => update(list.map((x, j) => (j === i ? v : x)))} />
                </div>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => update([...list, {}])} className="mt-3 inline-flex items-center gap-1.5 border border-line bg-white px-3 py-2 text-[13px] font-semibold text-navy hover:border-navy">
            <Plus className="h-4 w-4" /> Add {field.itemLabel?.toLowerCase() ?? "item"}
          </button>
        </fieldset>
      );
    }
  }
}

function ImageField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload(file?: File) {
    if (!file) return;
    setError(null);
    if (file.size > 4 * 1024 * 1024) {
      setError("Image is larger than 4 MB — please compress it and try again.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "brand");
      fd.append("kind", "image");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({ error: `Upload failed (${res.status}).` }));
      if (!res.ok) throw new Error(json.error);
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="sm:col-span-2">
      <Label field={field} />
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-20 w-32 border border-line bg-slate-100 object-cover" />
        ) : (
          <span className="grid h-20 w-32 place-items-center border border-dashed border-line text-[11px] text-ink/40">No image</span>
        )}
        <div className="min-w-60 flex-1 space-y-2">
          <input className={`${input} h-10 text-[12.5px]`} value={value} placeholder="https://… or upload" onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-navy hover:border-navy">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            {value && (
              <button type="button" onClick={() => onChange("")} className="px-2 text-[12.5px] text-rose-700">
                Remove
              </button>
            )}
          </div>
          {error && <p className="text-xs text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
