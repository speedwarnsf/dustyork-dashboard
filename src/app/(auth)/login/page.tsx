"use client";

import { useActionState } from "react";
import { signIn, signUp } from "../actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-8 shadow-[0_0_40px_rgba(123,220,255,0.08)]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-[#7bdcff]">
            D&apos;s Command Center
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Sign in to your dashboard
          </h1>
          <p className="mt-2 text-sm text-[#8b8b8b]">
            Secure Supabase authentication for your private project hub.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}
        <form action={signIn} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#7bdcff]"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-2xl border border-[#1c1c1c] bg-black px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#7bdcff]"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#7bdcff] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#a5ebff]"
          >
            Sign In
          </button>
        </form>
        <form action={signUp} className="mt-4">
          <input type="hidden" name="email" id="signup-email" />
          <input type="hidden" name="password" id="signup-password" />
          <button
            type="submit"
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest("form")!;
              const parent = form.parentElement!;
              const emailInput = parent.querySelector<HTMLInputElement>('input[name="email"]');
              const passwordInput = parent.querySelector<HTMLInputElement>('input[name="password"]');
              const hiddenEmail = form.querySelector<HTMLInputElement>("#signup-email");
              const hiddenPassword = form.querySelector<HTMLInputElement>("#signup-password");
              if (hiddenEmail && emailInput) hiddenEmail.value = emailInput.value;
              if (hiddenPassword && passwordInput) hiddenPassword.value = passwordInput.value;
            }}
            className="w-full rounded-2xl border border-[#1c1c1c] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-[#8b8b8b]">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
