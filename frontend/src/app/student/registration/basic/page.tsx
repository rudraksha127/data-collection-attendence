"use client";

import { useRouter } from "next/navigation";
import { RegistrationHeader } from "@/components/layout/RegistrationHeader";
import { ProgressStepper } from "@/components/student/ProgressStepper";
import { FormField, TextInput, ActionButtons } from "@/components/ui/FormField";

const STEPS = [
  { label: "Basic Details", state: "active" as const },
  { label: "Academic Details", state: "inactive" as const },
  { label: "Face Enrollment", state: "inactive" as const },
];

export default function BasicDetailsPage() {
  const router = useRouter();

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <RegistrationHeader title="Student Identity Step" />
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-6 space-y-space-xl">
          <ProgressStepper steps={STEPS} />

          <div className="w-full bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col space-y-space-lg">
            <div className="flex flex-col space-y-space-xs">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Basic Details</h2>
                <span className="font-label-sm text-label-sm text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                  Step 1 of 3
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Please ensure official student records correspond to these credentials.
              </p>
            </div>

            <form className="flex flex-col space-y-space-md">
              <FormField id="fullName" label="Full Name" icon="person" required>
                <TextInput id="fullName" name="fullName" placeholder="e.g. John Doe" required />
              </FormField>

              <FormField id="enrollmentNo" label="Enrollment / Roll No" icon="badge" required>
                <TextInput id="enrollmentNo" name="enrollmentNo" placeholder="e.g. 23IT101" uppercase required />
              </FormField>

              <FormField id="mobileNumber" label="Mobile Number" icon="call" required>
                <TextInput
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  required
                />
              </FormField>

              <FormField id="emailAddress" label="Email Address" icon="mail" required>
                <TextInput id="emailAddress" name="emailAddress" type="email" placeholder="name@example.com" required />
              </FormField>
            </form>
          </div>

          <div className="w-full bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">verified_user</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Academic credentials will be cross-referenced with university records in Step 2.
            </p>
          </div>

          <ActionButtons onBack={() => router.back()} onNext={() => router.push("/student/registration/academic")} />
        </div>
      </main>
    </div>
  );
}
