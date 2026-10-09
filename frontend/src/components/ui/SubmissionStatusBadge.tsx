"use client";

import type { SubmissionStatus } from "@/types/api";

const STYLES: Record<SubmissionStatus, { label: string; className: string; icon: string }> = {
  DRAFT: { label: "Draft", className: "bg-surface-container text-on-surface-variant", icon: "edit_note" },
  SUBMITTED: { label: "Submitted", className: "bg-secondary-container text-on-secondary-container", icon: "task_alt" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-primary-fixed text-on-primary-fixed", icon: "fact_check" },
  NEEDS_CORRECTION: { label: "Needs Correction", className: "bg-tertiary-fixed text-on-tertiary-fixed-variant", icon: "build" },
  APPROVED: { label: "Approved", className: "bg-secondary-container text-on-secondary-container", icon: "verified" },
  REJECTED: { label: "Rejected", className: "bg-error-container text-on-error-container", icon: "block" },
};

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
}

export function SubmissionStatusBadge({ status }: SubmissionStatusBadgeProps) {
  const style = STYLES[status] ?? STYLES.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${style.className}`}
      data-status={status}
    >
      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {style.icon}
      </span>
      {style.label}
    </span>
  );
}
