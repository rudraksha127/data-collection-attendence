"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegistrationHeader } from "@/components/layout/RegistrationHeader";

const REFERENCE_ID = "REG-2026-8841";

export default function SubmissionSuccessPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REFERENCE_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write failed; ignore
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <RegistrationHeader title="Enrollment Confirmation" />
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-6 items-center">
          <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">IT Department</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Academic Year 2026 - 27</span>
          </div>

          {/* Success Illustration */}
          <div className="relative flex flex-col items-center justify-center w-full my-4">
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center -z-0">
              <span className="absolute -top-1 left-1/4 w-2 h-4 rounded-full bg-primary transform -rotate-45 opacity-80 animate-pulse" />
              <span className="absolute top-4 right-1/4 w-3 h-3 rounded-full bg-tertiary-fixed-dim opacity-90" />
              <span className="absolute top-1/2 left-8 w-4 h-2 rounded-full bg-secondary opacity-75 transform rotate-12" />
              <span className="absolute top-10 right-10 w-2.5 h-2.5 rounded-full bg-error opacity-70" />
              <span className="absolute bottom-6 left-12 w-3 h-1.5 rounded-full bg-primary-container transform rotate-45" />
              <span className="absolute bottom-2 right-14 w-2.5 h-2.5 rounded-full bg-tertiary opacity-80" />
              <span className="absolute top-14 left-16 w-2 h-2 rounded-full bg-secondary-fixed opacity-90" />
              <span className="absolute bottom-12 right-24 w-3.5 h-1.5 rounded-full bg-primary-fixed-dim transform -rotate-12" />
            </div>
            <div className="absolute w-36 h-36 rounded-full bg-secondary-container/40 blur-2xl" />
            <div className="relative z-10 w-28 h-28 rounded-full bg-secondary flex items-center justify-center shadow-xl shadow-secondary/20 transition-transform active:scale-95 duration-300">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-on-secondary text-[54px] select-none"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                >
                  check
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center px-space-md mt-4 mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-space-xs tracking-tight">Registration Submitted!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
              Your details and biometric facial photos have been submitted successfully.
            </p>
          </div>

          {/* Summary Card */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-full h-full object-cover"
                    alt="Student headshot"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2MMIQE2QTq0k5QwTbzLYNKTOlF1-cz7L-ltdbeE92yOwVetRqx3BavyrGDTSPsYdfreL6G8I4D5hpOwENNYuVx4vz_7llVrTofvWfoYNVKCRXLnU5acyK228vLg3fD2NkQxnAuLi3pUF7puMuOMp0moWmCbH6a8i3l5iDWwfdd0a_CeXM4hWBwlB9m10M7CPjhP3xqjieJmj9Hg8Q9Vh-UdQuQvkO1eBDWBGL5Q"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Rudraksh Udiya</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Roll No: 23IT101 • IT-1</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-secondary-container px-2.5 py-1 rounded-full text-on-secondary-container">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  photo_library
                </span>
                <span className="font-label-sm text-label-sm font-semibold">8 Photos</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
              <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Face Captured</span>
              </div>
              <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Credentials OK</span>
              </div>
            </div>
          </div>

          {/* Status Notice */}
          <div className="w-full bg-tertiary-fixed rounded-xl p-space-lg shadow-sm flex items-start gap-space-md text-left mb-space-lg">
            <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-on-tertiary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
            </div>
            <div className="flex flex-col flex-1 pr-1">
              <h3 className="font-headline-sm text-headline-sm text-on-tertiary-fixed mb-1 font-bold">Under Admin Verification</h3>
              <p className="font-body-sm text-body-sm text-on-tertiary-fixed-variant leading-relaxed">
                Your registration is pending review by the department admin. You will receive an official notification once your profile is approved and activated.
              </p>
            </div>
          </div>

          {/* Reference Banner */}
          <div className="w-full bg-surface-container-low rounded-xl p-space-md flex items-center justify-between text-on-surface-variant mb-8">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <span className="font-body-sm text-body-sm">
                Reference ID: <strong className="text-on-surface">#{REFERENCE_ID}</strong>
              </span>
            </div>
            <button onClick={handleCopy} className="font-label-sm text-label-sm text-primary font-bold px-2 py-1 rounded hover:bg-surface-container transition-colors" type="button">
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>

          <div className="w-full mt-auto pt-space-md pb-2">
            <button
              onClick={() => router.push("/")}
              className="w-full h-12 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-space-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
