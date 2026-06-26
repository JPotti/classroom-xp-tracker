"use client";

import { FormEvent, Suspense, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase] = useState(() => createClient());

  const [mode, setMode] =
    useState<AuthMode>("sign-in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] =
    useState<string | null>(null);

  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const requestedNextPath =
    searchParams.get("next");

  /*
   * Only permit internal application paths.
   * This prevents an external website from being used as
   * the destination after login.
   */
  const nextPath =
    requestedNextPath?.startsWith("/") &&
    !requestedNextPath.startsWith("//")
      ? requestedNextPath
      : "/";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setIsError(false);
    setIsSubmitting(true);

    try {
      if (mode === "sign-up") {
        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setMessage(
            "Account created. Check your email to confirm your account, then sign in.",
          );
          return;
        }

        router.push(nextPath);
        router.refresh();
        return;
      }

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(newMode: AuthMode) {
    setMode(newMode);
    setMessage(null);
    setIsError(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
        <div className="mb-7">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
            Regent Camps
          </p>

          <h1 className="text-3xl font-bold">
            Teacher portal
          </h1>

          <p className="mt-2 text-slate-400">
            Sign in to manage your shared classroom XP.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => changeMode("sign-in")}
            className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
              mode === "sign-in"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => changeMode("sign-up")}
            className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
              mode === "sign-up"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create account
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-300">
              Email address
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              placeholder="teacher@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-300">
              Password
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              minLength={6}
              autoComplete={
                mode === "sign-in"
                  ? "current-password"
                  : "new-password"
              }
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>

          {message && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                isError
                  ? "border-red-500/40 bg-red-950/40 text-red-200"
                  : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Working..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your classes are kept private using authenticated
          database access rules.
        </p>
      </section>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <p className="text-slate-400">
        Loading teacher portal...
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}