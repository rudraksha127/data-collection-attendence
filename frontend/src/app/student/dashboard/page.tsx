"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { createSubmission, getMySubmission, getStudentProfile } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SubmissionStatusBadge } from "@/components/ui/SubmissionStatusBadge";
import type { StudentProfile, Submission } from "@/types/api";

const STATUS_MESSAGES: Record<string, string> = {
  DRAFT: "Your registration is in progress. Continue where you left off.",
  SUBMITTED: "Your registration has been submitted and is awaiting review.",
  UNDER_REVIEW: "A department admin is reviewing your registration.",
  NEEDS_CORRECTION: "Your registration needs corrections. Review the feedback and resubmit.",
  APPROVED: "Your registration is approved. Your profile is active for attendance.",
  REJECTED: "Your registration was rejected. Contact your department for next steps.",
};

const NEXT_ACTION: Record<string, { label: string; href: string }> = {
  DRAFT: { label: "Continue Registration", href: "/student/registration/basic" },
  NEEDS_CORRECTION: { label: "Edit & Resubmit", href: "/student/registration/review" },
  SUBMITTED: { label: "View Submission", href: "/student/registration/review" },
  UNDER_REVIEW: { label: "View Submission", href: "/student/registration/review" },
  APPROVED: { label: "View Profile", href: "/student/registration/review" },
  REJECTED: { label: "View Feedback", href: "/student/registration/review" },
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, logout: authLogout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, current] = await Promise.all([
        getStudentProfile().catch(() => null),
        getMySubmission().catch(() => null),
      ]);
      setProfile(me);
      setSubmission(current);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.isNetwork
            ? "Cannot reach the server. Check your connection."
            : err.message
          : "Failed to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const startRegistration = async () => {
    setStarting(true);
    setError(null);
    try {
      const draft = await createSubmission();
      setSubmission(draft);
      router.push("/student/registration/basic");
    } catch (err) {
      // An existing active submission may already exist — fetch it and continue.
      if (err instanceof ApiError && (err.isConflict || err.status === 422)) {
        const current = await getMySubmission().catch(() => null);
        if (current) {
          setSubmission(current);
          router.push("/student/registration/basic");
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : "Could not start registration. Try again.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-space-md">
        <span className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="font-label-md text-label-md text-on-surface-variant">Loading your dashboard…</span>
      </div>
    );
  }

  const status = submission?.status ?? null;
  const action = status ? NEXT_ACTION[status] : null;
  const photoCount = submission?.photos?.length ?? 0;

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant">
        <div className="h-16 px-margin flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-lg text-label-lg truncate">{profile?.full_name ?? "Student"}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                {profile?.roll_no ?? user?.email ?? ""}
              </span>
            </div>
          </div>
          <button
            onClick={() => void authLogout()}
            aria-label="Log out"
            className="w-11 h-11 flex items-center justify-center rounded-full text-error hover:bg-error-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
        {error && (
          <div role="alert" className="flex items-center gap-space-sm bg-error-container text-on-error-container rounded-xl p-space-md">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-body-sm text-body-sm flex-1">{error}</span>
            <button type="button" onClick={() => void load()} className="font-label-md text-label-md underline">
              Retry
            </button>
          </div>
        )}

        {/* Status card */}
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-space-lg shadow-[0px_2px_8px_-2px_rgba(15,23,42,0.04)] flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h1 className="font-headline-md text-headline-md tracking-tight">Registration Status</h1>
            {status ? <SubmissionStatusBadge status={status} /> : <SubmissionStatusBadge status="DRAFT" />}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {status ? STATUS_MESSAGES[status] : "You have not started your registration yet."}
          </p>

          {submission && (
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col">
                <span className="font-display-stat text-display-stat text-primary tabular-nums leading-none">
                  {photoCount}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Photos captured</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col">
                <span className="font-display-stat text-display-stat text-on-surface tabular-nums leading-none">
                  {submission.version}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Submission version</span>
              </div>
            </div>
          )}

          {submission?.submitted_at && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Submitted {new Date(submission.submitted_at).toLocaleString()}
            </p>
          )}

          {!submission ? (
            <button
              type="button"
              onClick={() => void startRegistration()}
              disabled={starting}
              className="w-full h-12 bg-primary-container hover:bg-primary disabled:opacity-40 text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all"
            >
              {starting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  Start Registration
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          ) : action ? (
            <Link
              href={action.href}
              className="w-full h-12 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all"
            >
              {action.label}
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          ) : null}
        </section>

        {/* Department context */}
        <section className="rounded-2xl bg-surface-container-low p-space-md flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Department</span>
              <span className="font-label-lg text-label-lg">{profile?.department ?? "Information Technology"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest/60 text-primary">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span className="font-label-sm text-label-sm font-semibold">{profile?.academic_year ?? "2026 – 2027"}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
