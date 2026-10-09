// Typed endpoint functions — one place per backend route group.
// Contract source: PROMPT 1 "FINAL API GROUP".

import { apiRequest } from "./client";
import type {
  AdminSubmissionDetail,
  AdminSubmissionsPage,
  AdminSubmissionsQuery,
  AdminSummaryCounts,
  AuthUser,
  LoginResponse,
  Photo,
  ReviewActionPayload,
  StudentProfile,
  Submission,
} from "@/types/api";

// ---------- Auth ----------

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuthRedirect: true,
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/api/v1/auth/logout", { method: "POST", skipAuthRedirect: true });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/auth/me", { skipAuthRedirect: true });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiRequest<void>("/api/v1/auth/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

// ---------- Student ----------

export function getStudentProfile(): Promise<StudentProfile> {
  return apiRequest<StudentProfile>("/api/v1/students/me");
}

export function updateStudentProfile(patch: Partial<StudentProfile>): Promise<StudentProfile> {
  return apiRequest<StudentProfile>("/api/v1/students/me", { method: "PATCH", body: patch });
}

// ---------- Submission ----------

export function createSubmission(): Promise<Submission> {
  return apiRequest<Submission>("/api/v1/submissions", { method: "POST", body: {} });
}

export function getMySubmission(): Promise<Submission | null> {
  return apiRequest<Submission | null>("/api/v1/submissions/me");
}

export function getSubmission(id: string): Promise<Submission> {
  return apiRequest<Submission>(`/api/v1/submissions/${encodeURIComponent(id)}`);
}

export function updateSubmission(
  id: string,
  formData: Record<string, unknown>,
  version: number
): Promise<Submission> {
  return apiRequest<Submission>(`/api/v1/submissions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { form_data: formData, version },
  });
}

export function submitSubmission(id: string, version: number): Promise<Submission> {
  return apiRequest<Submission>(`/api/v1/submissions/${encodeURIComponent(id)}/submit`, {
    method: "POST",
    body: { version },
  });
}

// ---------- Photos ----------

export function uploadPhoto(
  submissionId: string,
  file: Blob,
  meta: { sequence_number: number; capture_mode: string },
  filename = "capture.jpg"
): Promise<Photo> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("sequence_number", String(meta.sequence_number));
  formData.append("capture_mode", meta.capture_mode);
  return apiRequest<Photo>(`/api/v1/submissions/${encodeURIComponent(submissionId)}/photos`, {
    method: "POST",
    formData,
    timeoutMs: 60_000,
  });
}

export function deletePhoto(submissionId: string, photoId: string): Promise<void> {
  return apiRequest<void>(
    `/api/v1/submissions/${encodeURIComponent(submissionId)}/photos/${encodeURIComponent(photoId)}`,
    { method: "DELETE" }
  );
}

export function getPhotoUrl(submissionId: string, photoId: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(
    `/api/v1/submissions/${encodeURIComponent(submissionId)}/photos/${encodeURIComponent(photoId)}/url`
  );
}

// ---------- Admin ----------

export function listAdminSubmissions(query: AdminSubmissionsQuery = {}): Promise<AdminSubmissionsPage> {
  return apiRequest<AdminSubmissionsPage>("/api/v1/admin/submissions", {
    query: {
      page: query.page,
      page_size: query.page_size,
      status: query.status,
      search: query.search,
      sort_by: query.sort_by,
      sort_order: query.sort_order,
    },
  });
}

export function getAdminSummary(): Promise<AdminSummaryCounts> {
  return apiRequest<AdminSummaryCounts>("/api/v1/admin/submissions/summary");
}

export function getAdminSubmission(id: string): Promise<AdminSubmissionDetail> {
  return apiRequest<AdminSubmissionDetail>(`/api/v1/admin/submissions/${encodeURIComponent(id)}`);
}

export function startReview(id: string, version: number): Promise<AdminSubmissionDetail> {
  return apiRequest<AdminSubmissionDetail>(
    `/api/v1/admin/submissions/${encodeURIComponent(id)}/start-review`,
    { method: "POST", body: { version } }
  );
}

export function approveSubmission(id: string, payload: ReviewActionPayload): Promise<AdminSubmissionDetail> {
  return apiRequest<AdminSubmissionDetail>(
    `/api/v1/admin/submissions/${encodeURIComponent(id)}/approve`,
    { method: "POST", body: payload }
  );
}

export function rejectSubmission(id: string, payload: ReviewActionPayload): Promise<AdminSubmissionDetail> {
  return apiRequest<AdminSubmissionDetail>(
    `/api/v1/admin/submissions/${encodeURIComponent(id)}/reject`,
    { method: "POST", body: payload }
  );
}

export function requestCorrection(id: string, payload: ReviewActionPayload): Promise<AdminSubmissionDetail> {
  return apiRequest<AdminSubmissionDetail>(
    `/api/v1/admin/submissions/${encodeURIComponent(id)}/request-correction`,
    { method: "POST", body: payload }
  );
}
