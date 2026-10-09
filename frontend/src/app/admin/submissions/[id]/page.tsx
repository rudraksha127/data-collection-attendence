"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  approveSubmission,
  getAdminSubmission,
  getPhotoUrl,
  rejectSubmission,
  requestCorrection,
} from "@/lib/api/endpoints";
import { SubmissionStatusBadge } from "@/components/ui/SubmissionStatusBadge";
import type { AdminSubmissionDetail, Photo } from "@/types/api";

type ReviewAction = "approve" | "reject" | "correction";

const REASON_CODES: Record<Exclude<ReviewAction, "approve">, Array<{ value: string; label: string }>> = {
  reject: [
    { value: "DUPLICATE_REGISTRATION", label: "Duplicate registration" },
    { value: "INVALID_DETAILS", label: "Invalid or fraudulent details" },
    { value: "PHOTO_UNUSABLE", label: "Photos unusable for recognition" },
    { value: "OTHER", label: "Other" },
  ],
  correction: [
    { value: "PHOTO_INVALID", label: "Photo quality issue" },
    { value: "MISSING_FIELDS", label: "Missing or incomplete fields" },
    { value: "INVALID_ACADEMIC_COMBINATION", label: "Invalid academic combination" },
    { value: "OTHER", label: "Other" },
  ],
};

export default function AdminSubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const submissionId = params.id;

  const [detail, setDetail] = useState<AdminSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSubmission(submissionId);
      setDetail(data);
      // Resolve signed URLs lazily; failure of one URL must not break the page.
      const entries = await Promise.all(
        (data.photos ?? []).map(async (photo) => {
          try {
            const { url } = await getPhotoUrl(submissionId, photo.id);
            return [photo.id, url] as const;
          } catch {
            return null;
          }
        })
      );
      const map: Record<string, string> = {};
      for (const entry of entries) if (entry) map[entry[0]] = entry[1];
      setPhotoUrls(map);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.isNetwork
            ? "Cannot reach the server. Check your connection."
            : err.isForbidden
              ? "You do not have access to this submission."
              : err.message
          : "Failed to load submission."
      );
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openAction = (next: ReviewAction) => {
    setAction(next);
    setReasonCode("");
    setReason("");
    setFormError(null);
  };

  const submitAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    if (action !== "approve" && !reasonCode) {
      setFormError("Select a reason code.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      version: detail.version,
      reason_code: action === "approve" ? undefined : reasonCode,
      reason: reason.trim() || undefined,
    };
    try {
      const updated =
        action === "approve"
          ? await approveSubmission(submissionId, payload)
          : action === "reject"
            ? await rejectSubmission(submissionId, payload)
            : await requestCorrection(submissionId, payload);
      setDetail(updated);
      setAction(null);
      setSuccessMessage(
        action === "approve"
          ? "Submission approved."
          : action === "reject"
            ? "Submission rejected."
            : "Correction requested — status is now Needs Correction."
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        setFormError("This submission has changed. Refresh before reviewing.");
      } else if (err instanceof ApiError && err.isNetwork) {
        setFormError("Network error — the decision was not recorded. Try again.");
      } else {
        setFormError(err instanceof ApiError ? err.message : "Action failed. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-space-md">
        <span className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="font-label-md text-label-md text-on-surface-variant">Loading submission…</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-space-sm px-margin text-center">
        <span className="material-symbols-outlined text-[36px] text-error">error</span>
        <p className="font-body-md text-body-md text-on-surface-variant">{error ?? "Submission not found."}</p>
        <div className="flex gap-space-sm mt-space-sm">
          <button type="button" onClick={() => void load()} className="h-11 px-5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors">
            Retry
          </button>
          <button type="button" onClick={() => router.push("/admin/dashboard")} className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors">
            Back to queue
          </button>
        </div>
      </div>
    );
  }

  const profile = detail.student_profile ?? {};
  const form = detail.form_data ?? {};
  const canReview = detail.status === "SUBMITTED" || detail.status === "UNDER_REVIEW";

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant">
        <div className="h-16 px-margin flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-space-sm min-w-0">
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              aria-label="Back to queue"
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-sm text-headline-sm truncate">{String(profile.full_name ?? "Submission")}</h1>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                {String(profile.roll_no ?? detail.id)} • v{detail.version}
              </span>
            </div>
          </div>
          <SubmissionStatusBadge status={detail.status} />
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-margin py-space-xl flex flex-col gap-space-xl pb-32">
        {successMessage && (
          <div role="status" className="flex items-center gap-space-sm bg-secondary-container text-on-secondary-container rounded-xl p-space-md">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-body-sm text-body-sm">{successMessage}</span>
          </div>
        )}

        {/* Student info */}
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-space-lg shadow-[0px_2px_8px_-2px_rgba(15,23,42,0.04)]">
          <h2 className="font-headline-sm text-headline-sm mb-space-md">Student Information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {Object.entries(profile)
              .filter(([, value]) => value !== null && value !== undefined && value !== "")
              .map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <dt className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{labelFor(key)}</dt>
                  <dd className="font-body-md text-body-md text-on-surface">{String(value)}</dd>
                </div>
              ))}
            {Object.entries(form)
              .filter(([key]) => !(key in profile))
              .filter(([, value]) => value !== null && value !== undefined && value !== "")
              .map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <dt className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{labelFor(key)}</dt>
                  <dd className="font-body-md text-body-md text-on-surface">{String(value)}</dd>
                </div>
              ))}
          </dl>
        </section>

        {/* Photos */}
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-space-lg shadow-[0px_2px_8px_-2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-space-md">
            <h2 className="font-headline-sm text-headline-sm">Captured Photos</h2>
            <span className="font-label-md text-label-md text-on-surface-variant">{detail.photos?.length ?? 0} photos</span>
          </div>
          {!detail.photos || detail.photos.length === 0 ? (
            <div className="flex flex-col items-center gap-space-sm py-space-lg">
              <span className="material-symbols-outlined text-[28px] text-outline">photo_library</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">No photos were submitted.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-space-sm">
              {detail.photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActivePhoto(photo)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-surface-container border border-outline-variant hover:ring-2 hover:ring-primary/40 transition-all"
                  aria-label={`Open photo ${photo.sequence_number}`}
                >
                  {photoUrls[photo.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrls[photo.id]} alt={`Photo ${photo.sequence_number}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[24px] text-outline absolute inset-0 flex items-center justify-center">
                      {photo.validation && photo.validation.valid === false ? "broken_image" : "image"}
                    </span>
                  )}
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-black/60 text-white font-label-sm text-label-sm">
                    #{photo.sequence_number}
                  </span>
                </button>
              ))}
            </div>
          )}
          {detail.validation_summary && (
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-md">
              {detail.validation_summary.valid} / {detail.validation_summary.required} photos accepted
              {detail.validation_summary.invalid > 0 ? ` • ${detail.validation_summary.invalid} rejected` : ""}
            </p>
          )}
        </section>

        {/* Review history */}
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-space-lg shadow-[0px_2px_8px_-2px_rgba(15,23,42,0.04)]">
          <h2 className="font-headline-sm text-headline-sm mb-space-md">Review History</h2>
          {!detail.reviews || detail.reviews.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No review actions yet.</p>
          ) : (
            <ol className="flex flex-col gap-space-md">
              {detail.reviews.map((entry) => (
                <li key={entry.id} className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">history</span>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg">{entry.action}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {entry.reviewer_name ? `${entry.reviewer_name} • ` : ""}
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}
                      {entry.reason ? ` — ${entry.reason}` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      {/* Sticky review actions */}
      {canReview && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant shadow-[0px_8px_24px_-4px_rgba(29,97,231,0.08)] pb-safe">
          <div className="max-w-4xl mx-auto px-margin py-space-md flex gap-space-sm">
            <button
              type="button"
              onClick={() => openAction("approve")}
              className="flex-1 h-12 rounded-xl bg-[#059669] text-white font-label-lg text-label-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Approve
            </button>
            <button
              type="button"
              onClick={() => openAction("correction")}
              className="flex-1 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container font-label-lg text-label-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">build</span>
              Request Correction
            </button>
            <button
              type="button"
              onClick={() => openAction("reject")}
              className="flex-1 h-12 rounded-xl bg-error text-on-error font-label-lg text-label-lg hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Photo viewer modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-space-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${activePhoto.sequence_number}`}
          onClick={() => setActivePhoto(null)}
        >
          <div className="flex flex-col items-center gap-space-md max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            {photoUrls[activePhoto.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrls[activePhoto.id]} alt={`Photo ${activePhoto.sequence_number}`} className="max-h-[70vh] rounded-xl bg-surface-container-lowest" />
            ) : (
              <div className="w-full aspect-square rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px] text-outline">broken_image</span>
              </div>
            )}
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => {
                  const index = detail.photos.findIndex((p) => p.id === activePhoto.id);
                  if (index > 0) setActivePhoto(detail.photos[index - 1]);
                }}
                disabled={detail.photos.findIndex((p) => p.id === activePhoto.id) <= 0}
                className="w-11 h-11 rounded-full bg-surface-container-lowest/90 disabled:opacity-30 flex items-center justify-center"
                aria-label="Previous photo"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="font-label-md text-label-md text-white">
                Photo {activePhoto.sequence_number} of {detail.photos.length}
                {activePhoto.validation?.valid === false && activePhoto.validation.reason ? ` — ${activePhoto.validation.reason}` : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  const index = detail.photos.findIndex((p) => p.id === activePhoto.id);
                  if (index < detail.photos.length - 1) setActivePhoto(detail.photos[index + 1]);
                }}
                disabled={detail.photos.findIndex((p) => p.id === activePhoto.id) >= detail.photos.length - 1}
                className="w-11 h-11 rounded-full bg-surface-container-lowest/90 disabled:opacity-30 flex items-center justify-center"
                aria-label="Next photo"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <button type="button" onClick={() => setActivePhoto(null)} className="w-11 h-11 rounded-full bg-surface-container-lowest/90 flex items-center justify-center" aria-label="Close viewer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review action modal */}
      {action && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="review-action-title">
          <form
            onSubmit={submitAction}
            className="w-full max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-space-lg flex flex-col gap-space-md shadow-2xl"
          >
            <h2 id="review-action-title" className="font-headline-sm text-headline-sm">
              {action === "approve" ? "Approve submission?" : action === "reject" ? "Reject submission?" : "Request correction"}
            </h2>
            {action !== "approve" && (
              <div className="flex flex-col gap-space-xs">
                <label htmlFor="reason-code" className="font-label-md text-label-md font-medium">
                  Reason code <span className="text-error">*</span>
                </label>
                <select
                  id="reason-code"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="h-12 px-space-md bg-surface border border-outline-variant rounded-xl font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                >
                  <option value="">Select a reason…</option>
                  {REASON_CODES[action].map((code) => (
                    <option key={code.value} value={code.value}>
                      {code.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="reason" className="font-label-md text-label-md font-medium">
                Notes {action === "approve" ? "(optional)" : ""}
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Add details for the audit trail…"
                className="p-space-md bg-surface border border-outline-variant rounded-xl font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 resize-none"
              />
            </div>
            {formError && (
              <p role="alert" className="font-body-sm text-body-sm text-error">
                {formError}
              </p>
            )}
            <div className="flex gap-space-sm">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 h-12 rounded-xl font-label-lg text-label-lg text-white disabled:opacity-40 flex items-center justify-center gap-space-xs transition-all ${
                  action === "approve" ? "bg-[#059669]" : action === "reject" ? "bg-error" : "bg-primary-container"
                }`}
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Send Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const KEY_LABELS: Record<string, string> = {
  full_name: "Full Name",
  roll_no: "Roll Number",
  email: "Email",
  phone: "Phone",
  department: "Department",
  program: "Program",
  academic_year: "Academic Year",
  semester: "Semester",
  section: "Section",
  batch: "Batch",
  date_of_birth: "Date of Birth",
  gender: "Gender",
  address: "Address",
  guardian_name: "Guardian Name",
  guardian_phone: "Guardian Phone",
};

function labelFor(key: string): string {
  return KEY_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
