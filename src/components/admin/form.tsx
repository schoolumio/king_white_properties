"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ActionState } from "@/app/admin/actions/types";
import { cn } from "@/lib/utils";

const FieldErrors = createContext<Record<string, string>>({});
const Pending = createContext(false);

/**
 * Submits via onSubmit (rather than the form `action` prop) so React does not
 * reset uncontrolled fields — users keep their input when validation fails.
 */

/** Wraps a server action with pending/error/success feedback. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <Pending.Provider value={pending}>
    <FieldErrors.Provider value={state?.fieldErrors ?? {}}>
      <form
        ref={ref}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const data = new FormData(e.currentTarget, submitter);
          startTransition(() => formAction(data));
        }}
      >
        {state?.error && (
          <div role="alert" className="mb-5 flex items-start gap-2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </div>
        )}
        {state?.success && (
          <div role="status" className="mb-5 flex items-start gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {state.success}
          </div>
        )}
        {children}
      </form>
    </FieldErrors.Provider>
    </Pending.Provider>
  );
}

function useFieldError(name: string) {
  return useContext(FieldErrors)[name];
}

const inputCls = "w-full border border-line bg-white px-3 text-[14px] text-ink outline-none focus:border-primary disabled:bg-slate-50";

export function Field({ label, name, help, children, className }: { label: string; name?: string; help?: string; children: React.ReactNode; className?: string }) {
  const err = useFieldError(name ?? "");
  return (
    <div className={className}>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-semibold text-ink/75">{label}</span>
        {children}
      </label>
      {err ? <p className="mt-1 text-xs text-rose-700">{err}</p> : help ? <p className="mt-1 text-xs text-ink/50">{help}</p> : null}
    </div>
  );
}

export function TextInput({ label, name, help, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; help?: string }) {
  const err = useFieldError(name);
  return (
    <Field label={label} name={name} help={help} className={className}>
      <input name={name} className={cn(inputCls, "h-10", err && "border-rose-400")} {...rest} />
    </Field>
  );
}

export function TextArea({ label, name, help, className, rows = 4, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; help?: string }) {
  const err = useFieldError(name);
  return (
    <Field label={label} name={name} help={help} className={className}>
      <textarea name={name} rows={rows} className={cn(inputCls, "py-2 leading-relaxed", err && "border-rose-400")} {...rest} />
    </Field>
  );
}

export function SelectInput({
  label,
  name,
  options,
  help,
  className,
  placeholder,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; options: { value: string; label: string }[]; help?: string; placeholder?: string }) {
  const err = useFieldError(name);
  return (
    <Field label={label} name={name} help={help} className={className}>
      <select name={name} className={cn(inputCls, "h-10", err && "border-rose-400")} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, name, defaultChecked, help, value = "true" }: { label: string; name: string; defaultChecked?: boolean; help?: string; value?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-[13.5px] text-ink/80">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[var(--brand-primary)]" />
      <span>
        {label}
        {help && <span className="block text-xs text-ink/50">{help}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({ children, variant = "primary", className, name, value }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string; name?: string; value?: string }) {
  const pending = useContext(Pending);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 px-5 text-[13.5px] font-semibold disabled:opacity-60",
        variant === "primary" && "bg-primary text-white hover:bg-primary-deep",
        variant === "secondary" && "border border-line bg-white text-primary hover:border-primary",
        variant === "danger" && "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
        className,
      )}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Button that submits only after a confirmation prompt (for destructive actions). */
export function ConfirmSubmit({ children, message, variant = "danger", name, value }: { children: React.ReactNode; message: string; variant?: "primary" | "secondary" | "danger"; name?: string; value?: string }) {
  const pending = useContext(Pending);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 px-4 text-[13.5px] font-semibold disabled:opacity-60",
        variant === "danger" ? "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50" : variant === "primary" ? "bg-primary text-white" : "border border-line bg-white text-primary",
      )}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-[15px] font-semibold text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-ink/55">{description}</p>}
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
