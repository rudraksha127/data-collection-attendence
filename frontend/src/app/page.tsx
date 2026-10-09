"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Go back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
              onClick={() => window.history.back()}
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Student Identity Step</h1>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Close or menu"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-6">
          {/* Academic Context Sub-bar */}
          <div className="flex items-center justify-between py-space-sm px-space-md mb-space-md rounded-xl bg-surface-container-low shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-primary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  school
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Department
                </span>
                <span className="font-label-lg text-label-lg text-on-surface leading-tight">
                  Information Technology
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-highest/60 text-primary">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              <span className="font-label-sm text-label-sm font-semibold">2026 – 2027</span>
            </div>
          </div>

          {/* Central Visual Emblem */}
          <div className="relative flex flex-col items-center justify-center pt-space-md pb-space-lg">
            <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-primary/15 via-primary-container/20 to-secondary-container/25 blur-2xl pointer-events-none"></div>
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-surface-container-low to-surface-container flex items-center justify-center shadow-md p-2">
              <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/50 via-transparent to-primary/5"></div>
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md transform transition-transform hover:scale-105 duration-300">
                  <span
                    className="material-symbols-outlined text-[36px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    school
                  </span>
                </div>
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
            </div>

            <div className="text-center mt-space-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Self-Service Portal
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                Student Registration
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto mt-1 leading-snug">
                Register your biometric details & live photos for automated attendance
              </p>
            </div>
          </div>

          {/* Instruction Steps */}
          <div className="flex flex-col gap-space-sm mt-space-sm mb-space-lg">
            <StepCard
              stepNumber="01"
              stepTitle="Profile & Cohort"
              mainText="Fill basic and academic details"
              subText="Roll number, semester, and personal contact"
              icon="badge"
              bgColor="bg-primary-fixed"
              iconColor="text-on-primary-fixed"
            />
            <StepCard
              stepNumber="02"
              stepTitle="Face Enrollment"
              mainText="Capture 6 – 8 live photos"
              subText="Direct camera capture only • No gallery uploads"
              icon="photo_camera"
              bgColor="bg-surface-container-high"
              iconColor="text-primary"
            />
            <StepCard
              stepNumber="03"
              stepTitle="Department Review"
              mainText="Admin will verify and activate"
              subText="Approved profiles enable classroom attendance"
              icon="verified_user"
              bgColor="bg-secondary-container"
              iconColor="text-on-secondary-container"
            />
          </div>

          {/* Notice Card */}
          <div className="rounded-xl p-space-md bg-surface-container-low mb-space-xl flex items-start gap-space-sm">
            <span
              className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              info
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Important Device Requirement
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Ensure your front camera is enabled with clean lens and adequate ambient room lighting before beginning.
              </p>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="sticky bottom-0 left-0 right-0 pt-space-sm pb-space-sm bg-gradient-to-t from-surface via-surface/95 to-transparent">
            <Link
              href="/student/registration/basic"
              className="w-full h-13 py-3.5 px-space-lg rounded-xl bg-primary-container text-on-primary flex items-center justify-center gap-space-sm shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <span className="font-label-lg text-label-lg tracking-wide">Start Registration</span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span className="font-label-sm text-label-sm">Faculty-governed academic onboarding system</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StepCardProps {
  stepNumber: string;
  stepTitle: string;
  mainText: string;
  subText: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}

function StepCard({ stepNumber, stepTitle, mainText, subText, icon, bgColor, iconColor }: StepCardProps) {
  return (
    <div className="flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center ${iconColor} shrink-0 shadow-xs`}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm text-primary font-bold">STEP {stepNumber}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{stepTitle}</span>
        </div>
        <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{mainText}</p>
        <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">{subText}</span>
      </div>
      <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
    </div>
  );
}
