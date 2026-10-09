"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { listAdminSubmissions, getAdminSummary } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SubmissionStatusBadge } from "@/components/ui/SubmissionStatusBadge";
import type { AdminSummaryCounts, AdminSubmissionListItem, SubmissionStatus } from "@/types/api";

const STATUS_FILTERS: Array<{ value: SubmissionStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "NEEDS_CORRECTION", label: "Needs Correction" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const PAGE_SIZE = 20;

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<AdminSubmissionListItem[]>([]);
  const [summary, setSummary] = useState<AdminSummaryCounts | null>(null);
  const [status, setStatus] = useState<SubmissionStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [queue, counts] = await Promise.all([
        listAdminSubmissions({ page, page_size: PAGE_SIZE, status: status || undefined, search: search || undefined }),
        getAdminSummary().catch(() => null),
      ]);
      setItems(queue.items ?? []);
      setTotal(queue.total ?? 0);
      if (counts) setSummary(counts);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.isNetwork
            ? "Cannot reach the server. Check your connection."
            : err.message
          : "Failed to load submissions."
      );
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant">
        <div className="h-16 px-margin flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                dashboard
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-headline-sm text-headline-sm leading-tight">Submissions Queue</h1>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Academic Attendance Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-label-md text-label-md text-on-surface">{user?.email ?? "Admin"}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Administrator</span>
            </div>
            <button
              onClick={() => void logout()}
              className="w-11 h-11 flex items-center justify-center rounded-full text-error hover:bg-error-container transition-colors"
              aria-label="Log out"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-xl">
        {/* Summary counters — backend-provided counts */}
        <section aria-label="Status summary" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm">
          <SummaryCard label="Submitted" value={summary?.pending} icon="inbox" tone="bg-primary/10 text-primary" />
          <SummaryCard label="Under Review" value={summary?.under_review} icon="fact_check" tone="bg-primary-fixed text-on-primary-fixed" />
          <SummaryCard label="Needs Correction" value={summary?.needs_correction} icon="build" tone="bg-tertiary-fixed text-on-tertiary-fixed-variant" />
          <SummaryCard label="Approved" value={summary?.approved} icon="verified" tone="bg-secondary-container text-on-secondary-container" />
          <SummaryCard label="Rejected" value={summary?.rejected} icon="block" tone="bg-error-container text-on-error-container" />
        </section>

        {/* Search + filters */}
        <section className="flex flex-col sm:flex-row gap-space-sm" aria-label="Filters">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or roll number…"
              aria-label="Search submissions"
              className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-space-xs" role="group" aria-label="Status filter">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value || "all"}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                }}
                aria-pressed={status === filter.value}
                className={`h-10 px-3.5 rounded-full font-label-md text-label-md transition-colors ${
                  status === filter.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Queue list */}
        <section aria-label="Submission queue" className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-[0px_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-space-lg flex flex-col gap-space-md" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-space-xl flex flex-col items-center text-center gap-space-sm">
              <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
              <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="h-11 px-5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-space-xl flex flex-col items-center text-center gap-space-sm">
              <span className="material-symbols-outlined text-[32px] text-outline">inbox</span>
              <p className="font-body-md text-body-md text-on-surface-variant">No submissions match your filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/submissions/${item.id}`}
                    className="flex items-center justify-between gap-space-md px-space-lg py-space-md hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg text-on-surface truncate">{item.student.full_name}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {item.student.roll_no ?? item.id}
                        {item.student.department ? ` • ${item.student.department}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-sm shrink-0">
                      {typeof item.photo_count === "number" && (
                        <span className="hidden sm:inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">photo_library</span>
                          {item.photo_count}
                        </span>
                      )}
                      <SubmissionStatusBadge status={item.status} />
                      <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav className="flex items-center justify-between" aria-label="Pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest font-label-md text-label-md disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              Previous
            </button>
            <span className="font-label-md text-label-md text-on-surface-variant">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest font-label-md text-label-md disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              Next
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value?: number; icon: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-space-md flex items-center gap-space-sm shadow-[0px_2px_8px_-2px_rgba(15,23,42,0.04)]">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-display-stat text-display-stat text-on-surface tabular-nums leading-none">
          {value ?? "–"}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{label}</span>
      </div>
    </div>
  );
}
