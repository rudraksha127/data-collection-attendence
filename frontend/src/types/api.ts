// Typed API layer — mirrors the backend contract in PROMPT 1.
// Backend responses are authoritative; these types describe them.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "APPROVED"
  | "REJECTED";

export type UserRole = "STUDENT" | "ADMIN";

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
  status: string;
  is_first_login: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
  token_type: string;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  roll_no?: string;
  email?: string;
  phone?: string;
  department?: string;
  program?: string;
  academic_year?: string;
  semester?: number;
  section?: string;
  batch?: string;
  [key: string]: unknown;
}

export interface PhotoValidationResult {
  valid: boolean;
  reason_code?: string;
  reason?: string;
}

export interface Photo {
  id: string;
  sequence_number: number;
  status?: string;
  capture_mode?: string;
  validation?: PhotoValidationResult;
  created_at?: string;
}

export interface ReviewHistoryEntry {
  id: string;
  action: string;
  reviewer_name?: string;
  reason_code?: string;
  reason?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  status: SubmissionStatus;
  version: number;
  form_data: Record<string, unknown>;
  photos: Photo[];
  validation_summary?: {
    required: number;
    valid: number;
    invalid: number;
    remaining: number;
  };
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  available_actions?: string[];
}

export interface AdminSubmissionListItem {
  id: string;
  status: SubmissionStatus;
  student: {
    id: string;
    full_name: string;
    roll_no?: string;
    department?: string;
  };
  photo_count?: number;
  submitted_at?: string;
  updated_at?: string;
}

export interface AdminSubmissionsQuery {
  page?: number;
  page_size?: number;
  status?: SubmissionStatus;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface AdminSubmissionsPage {
  items: AdminSubmissionListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminSummaryCounts {
  pending: number;
  under_review: number;
  needs_correction: number;
  approved: number;
  rejected: number;
}

export interface AdminSubmissionDetail extends Submission {
  student_profile: StudentProfile;
  reviews: ReviewHistoryEntry[];
}

export interface ReviewActionPayload {
  version: number;
  reason_code?: string;
  reason?: string;
  affected_fields?: string[];
}
