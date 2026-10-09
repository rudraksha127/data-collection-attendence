"use client";

import { useRouter } from "next/navigation";
import { RegistrationHeader } from "@/components/layout/RegistrationHeader";
import { SelectInput } from "@/components/ui/FormField";

const ACADEMIC_YEAR_OPTIONS = [
  { value: "2026-27", label: "2026 - 27" },
  { value: "2025-26", label: "2025 - 26" },
  { value: "2024-25", label: "2024 - 25" },
];

const CURRENT_YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const SEMESTER_OPTIONS = [
  { value: "1", label: "1st Semester" },
  { value: "2", label: "2nd Semester" },
  { value: "3", label: "3rd Semester" },
  { value: "4", label: "4th Semester" },
  { value: "5", label: "5th Semester" },
  { value: "6", label: "6th Semester" },
];

const DEPARTMENT_OPTIONS = [
  { value: "IT", label: "IT (Information Technology)" },
  { value: "CS", label: "Computer Science & Engineering" },
  { value: "ECE", label: "Electronics & Communication" },
  { value: "MECH", label: "Mechanical Engineering" },
];

const SECTION_OPTIONS = [
  { value: "IT-1", label: "IT - 1" },
  { value: "IT-2", label: "IT - 2" },
  { value: "IT-3", label: "IT - 3" },
];

export default function AcademicDetailsPage() {
  const router = useRouter();

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <RegistrationHeader title="Student Identity Step" />
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-6">
          {/* Progress Stepper */}
          <div className="flex items-center justify-between w-full px-2 py-4 mb-2">
            <div className="flex flex-col items-center gap-1.5 flex-1 relative">
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-center">Basic Details</span>
              <div className="absolute top-4 left-[60%] w-full h-0.5 bg-primary -z-10" />
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1 relative">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md font-label-md text-label-md">
                2
              </div>
              <span className="font-label-md text-label-md text-primary text-center font-bold">Academic Details</span>
              <div className="absolute top-4 left-[60%] w-full h-0.5 bg-surface-container-highest -z-10" />
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md">
                3
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-center">Face Enrollment</span>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">Academic Details</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Specify your current cohort information to assign lecture schedules and facial recognition models.
            </p>
          </div>

          <form className="flex flex-col gap-space-lg">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                Academic Year <span className="text-error font-bold">*</span>
              </label>
              <SelectInput id="academicYear" name="academicYear" icon="calendar_today" required defaultValue="2026-27" options={ACADEMIC_YEAR_OPTIONS} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                Current Year <span className="text-error font-bold">*</span>
              </label>
              <SelectInput id="currentYear" name="currentYear" icon="school" required defaultValue="2" options={CURRENT_YEAR_OPTIONS} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                Semester <span className="text-error font-bold">*</span>
              </label>
              <SelectInput id="semester" name="semester" icon="layers" required defaultValue="3" options={SEMESTER_OPTIONS} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                Department <span className="text-error font-bold">*</span>
              </label>
              <SelectInput id="department" name="department" icon="domain" required defaultValue="IT" options={DEPARTMENT_OPTIONS} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                Section <span className="text-error font-bold">*</span>
              </label>
              <SelectInput id="section" name="section" icon="groups" required defaultValue="IT-1" options={SECTION_OPTIONS} />
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-surface-container-low rounded-xl mt-1">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-on-primary-fixed">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Faculty Verification Protocol</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Your cohort selection synchronizes with the departmental biometric ledger for autonomous roll call.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 mt-2">
              <button
                onClick={() => router.back()}
                className="h-12 px-6 flex items-center justify-center gap-2 bg-surface-container text-on-surface font-label-lg text-label-lg rounded-xl hover:bg-surface-container-high active:scale-[0.98] transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Back</span>
              </button>
              <button
                onClick={() => router.push("/student/registration/capture")}
                className="flex-1 h-12 px-6 flex items-center justify-center gap-2 bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
                type="button"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
