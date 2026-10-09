"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const target = user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
      router.replace(target);
    } catch {
      // error surfaced through auth context / local error below
      setLocalError(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <main className="flex flex-col w-full flex-1 px-margin pt-space-xl pb-safe max-w-md mx-auto justify-center">
        {/* Brand emblem */}
        <div className="relative flex flex-col items-center pt-space-md pb-space-lg">
          <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-primary/15 via-primary-container/20 to-secondary-container/25 blur-2xl pointer-events-none" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-surface-container-low to-surface-container flex items-center justify-center shadow-md p-2">
            <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center shadow-inner">
              <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
            </div>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight mt-space-md">
            Academic Attendance Hub
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-center">
            Sign in with your department credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg" noValidate>
          <div className="flex flex-col space-y-space-xs">
            <label htmlFor="email" className="font-label-md text-label-md text-on-surface font-medium flex items-center gap-1">
              Email <span className="text-error font-bold">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-on-surface-variant pointer-events-none select-none">
                mail
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@department.edu"
                className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-space-xs">
            <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-medium flex items-center gap-1">
              Password <span className="text-error font-bold">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-on-surface-variant pointer-events-none select-none">
                lock
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
              />
            </div>
          </div>

          {(localError || null) && (
            <div role="alert" className="flex items-center gap-space-sm bg-error-container text-on-error-container rounded-xl p-space-md">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm">{localError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-primary-container hover:bg-primary disabled:opacity-40 text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-space-lg text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span className="font-label-sm text-label-sm">Faculty-governed academic onboarding system</span>
        </div>
      </main>
    </div>
  );
}
