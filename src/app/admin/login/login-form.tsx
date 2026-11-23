"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "../actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-10 space-y-6">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-2 block text-xs font-semibold tracking-[0.12em] text-primary/70 uppercase">Email</span>
        <input name="email" type="email" required autoComplete="username" className="h-12 w-full border border-line px-3 outline-none focus:border-primary" />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold tracking-[0.12em] text-primary/70 uppercase">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="h-12 w-full border border-line px-3 outline-none focus:border-primary" />
      </label>
      {state?.error && (
        <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 bg-primary font-display text-sm font-semibold text-white hover:bg-primary-deep disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
    </form>
  );
}
