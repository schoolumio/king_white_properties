"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { FORM_SCHEMAS, type FormType } from "@/lib/forms";
import { cn } from "@/lib/utils";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select" | "date" | "number" | "file" | "radio";
  options?: string[] | { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  span?: 1 | 2;
  help?: string;
  autoComplete?: string;
};

type Props = {
  formType: FormType;
  fields: FieldConfig[];
  defaults?: Record<string, string>;
  submitLabel?: string;
  dark?: boolean;
  successTitle?: string;
  successMessage?: string;
  compact?: boolean;
};

export function EnquiryForm({ formType, fields, defaults = {}, submitLabel = "Submit enquiry", dark, successTitle, successMessage, compact }: Props) {
  const pathname = usePathname();
  const startedAt = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const initial: Record<string, unknown> = { consent: false };
  for (const f of fields) if (f.type !== "file") initial[f.name] = defaults[f.name] ?? "";
  for (const [k, v] of Object.entries(defaults)) initial[k] = v;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(FORM_SCHEMAS[formType] as any),
    defaultValues: initial,
    mode: "onTouched",
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined || v === null) continue;
      fd.append(k, typeof v === "boolean" ? String(v) : String(v));
    }
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("document", file);
    fd.append("_startedAt", String(startedAt.current));
    fd.append("_path", pathname);
    fd.append("company_website", (document.getElementById(`hp-${formType}`) as HTMLInputElement | null)?.value ?? "");

    startTransition(async () => {
      try {
        const res = await submitEnquiry(formType, fd);
        if (res.ok) {
          setReference(res.reference);
          reset(initial);
          setFileName(null);
        } else {
          setServerError(res.error);
          if (res.fieldErrors) {
            for (const [k, msg] of Object.entries(res.fieldErrors)) {
              if (k === "document") setFileError(msg);
              else setError(k, { type: "server", message: msg });
            }
          }
        }
      } catch {
        setServerError("We could not reach the server. Please check your connection and try again.");
      }
    });
  });

  const labelCls = cn("mb-2 block font-display text-[12px] font-semibold tracking-[0.12em] uppercase", dark ? "text-white/70" : "text-navy/75");
  const inputCls = (hasError: boolean) =>
    cn(
      "w-full border-0 border-b bg-transparent px-0 py-3 text-[15.5px] transition-colors outline-none focus:ring-0",
      dark ? "border-white/25 text-white placeholder:text-white/30 focus:border-gold-soft" : "border-navy/20 text-ink placeholder:text-ink/35 focus:border-navy",
      hasError && (dark ? "border-rose-300" : "border-rose-600"),
    );

  if (reference) {
    return (
      <div role="status" aria-live="polite" className={cn("border p-8 sm:p-12", dark ? "border-white/15 bg-white/[0.03] text-white" : "border-line bg-white text-navy")}>
        <CheckCircle2 className={cn("h-10 w-10", dark ? "text-gold-soft" : "text-gold-deep")} strokeWidth={1.3} aria-hidden />
        <h3 className="mt-6 font-display text-2xl font-semibold">{successTitle ?? "Thank you. Your submission has been received."}</h3>
        <p className={cn("mt-3 max-w-lg leading-relaxed", dark ? "text-white/65" : "text-ink/65")}>
          {successMessage ?? "It has been recorded securely and routed to the appropriate team. Please keep your reference number for future correspondence."}
        </p>
        <div className={cn("mt-8 inline-flex flex-col border-l-2 pl-5", dark ? "border-gold-soft" : "border-gold")}>
          <span className={cn("text-[11px] font-semibold tracking-[0.2em] uppercase", dark ? "text-white/50" : "text-steel")}>Reference number</span>
          <span className="mt-1 font-display text-2xl font-semibold tracking-wider" data-testid="enquiry-reference">
            {reference}
          </span>
        </div>
        <div className="mt-10">
          <button type="button" onClick={() => setReference(null)} className={cn("text-sm font-semibold underline underline-offset-4", dark ? "text-white" : "text-navy")}>
            Submit another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn(dark ? "text-white" : "text-ink")} aria-busy={pending}>
      {/* Honeypot — hidden from people, visible to naive bots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor={`hp-${formType}`}>Company website</label>
        <input id={`hp-${formType}`} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={cn("grid gap-x-8", compact ? "gap-y-6" : "gap-y-8", "sm:grid-cols-2")}>
        {fields.map((f) => {
          const err = errors[f.name]?.message as string | undefined;
          const id = `${formType}-${f.name}`;
          const span = f.span === 2 || f.type === "textarea" || f.type === "file" || f.type === "radio" ? "sm:col-span-2" : "";
          if (f.type === "file") {
            return (
              <div key={f.name} className={span}>
                <span className={labelCls}>
                  {f.label} <span className="font-normal tracking-normal normal-case opacity-60">(optional)</span>
                </span>
                <label
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 border border-dashed px-5 py-5 transition-colors",
                    dark ? "border-white/25 hover:border-gold-soft" : "border-navy/25 hover:border-navy",
                  )}
                >
                  <Paperclip className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
                  <span className="text-[14.5px]">
                    {fileName ?? "Attach a supporting document"}
                    <span className={cn("block text-xs", dark ? "text-white/45" : "text-ink/50")}>{f.help ?? "PDF, Word or PowerPoint · max 10 MB"}</span>
                  </span>
                </label>
                <input
                  ref={fileRef}
                  id={id}
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setFileError(null);
                    if (file && file.size > 10 * 1024 * 1024) {
                      setFileError("The document must be 10 MB or smaller");
                      e.target.value = "";
                      setFileName(null);
                      return;
                    }
                    setFileName(file?.name ?? null);
                  }}
                />
                {fileError && <FieldError dark={dark}>{fileError}</FieldError>}
              </div>
            );
          }
          if (f.type === "radio") {
            const opts = normalise(f.options);
            return (
              <fieldset key={f.name} className={span}>
                <legend className={labelCls}>{f.label}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {opts.map((o) => (
                    <label key={o.value} className="cursor-pointer">
                      <input type="radio" value={o.value} className="peer sr-only" {...register(f.name)} />
                      <span
                        className={cn(
                          "inline-block border px-4 py-2.5 text-[13.5px] transition-colors",
                          dark
                            ? "border-white/20 text-white/75 peer-checked:border-gold-soft peer-checked:bg-gold-soft peer-checked:text-navy peer-focus-visible:outline-2 peer-focus-visible:outline-gold"
                            : "border-navy/20 text-ink/75 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-gold",
                        )}
                      >
                        {o.label}
                      </span>
                    </label>
                  ))}
                </div>
                {err && <FieldError dark={dark}>{err}</FieldError>}
              </fieldset>
            );
          }
          return (
            <div key={f.name} className={span}>
              <label htmlFor={id} className={labelCls}>
                {f.label}
                {!f.required && <span className="ml-1 font-normal tracking-normal normal-case opacity-60">(optional)</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea id={id} rows={compact ? 4 : 5} placeholder={f.placeholder} className={cn(inputCls(!!err), "resize-y")} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} {...register(f.name)} />
              ) : f.type === "select" ? (
                <select id={id} className={cn(inputCls(!!err), "cursor-pointer", dark && "[&>option]:text-ink")} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} {...register(f.name)}>
                  <option value="">Select…</option>
                  {normalise(f.options).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  min={f.type === "date" ? new Date().toISOString().slice(0, 10) : f.type === "number" ? 1 : undefined}
                  className={cn(inputCls(!!err), f.type === "date" && dark && "[color-scheme:dark]")}
                  aria-invalid={!!err}
                  aria-describedby={err ? `${id}-err` : undefined}
                  {...register(f.name)}
                />
              )}
              {f.help && !err && <p className={cn("mt-2 text-xs", dark ? "text-white/45" : "text-ink/50")}>{f.help}</p>}
              {err && (
                <FieldError dark={dark} id={`${id}-err`}>
                  {err}
                </FieldError>
              )}
            </div>
          );
        })}

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className={cn("mt-1 h-4 w-4 shrink-0", dark ? "accent-[var(--brand-gold)]" : "accent-[var(--brand-navy)]")} {...register("consent")} />
            <span className={cn("text-[13.5px] leading-relaxed", dark ? "text-white/65" : "text-ink/65")}>
              I consent to my information being processed to respond to this submission, in line with the{" "}
              <Link href="/legal/privacy-policy" className="underline underline-offset-2" target="_blank">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.consent && <FieldError dark={dark}>{String(errors.consent.message)}</FieldError>}
        </div>
      </div>

      {serverError && (
        <div role="alert" className={cn("mt-8 flex items-start gap-3 border px-4 py-3 text-sm", dark ? "border-rose-300/40 bg-rose-500/10 text-rose-100" : "border-rose-200 bg-rose-50 text-rose-800")}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      )}

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-14 items-center justify-center gap-3 px-8 font-display text-[15px] font-semibold tracking-wide transition-colors disabled:opacity-60",
            dark ? "bg-gold text-navy hover:bg-gold-soft" : "bg-navy text-white hover:bg-navy-deep",
          )}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {pending ? "Submitting…" : submitLabel}
        </button>
        <p className={cn("text-xs", dark ? "text-white/45" : "text-ink/50")}>You will receive a reference number on submission.</p>
      </div>
    </form>
  );
}

function normalise(options: FieldConfig["options"]) {
  return (options ?? []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

function FieldError({ children, dark, id }: { children: React.ReactNode; dark?: boolean; id?: string }) {
  return (
    <p id={id} className={cn("mt-2 text-[13px]", dark ? "text-rose-200" : "text-rose-700")}>
      {children}
    </p>
  );
}
