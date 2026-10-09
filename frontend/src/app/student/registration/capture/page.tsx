"use client";

import { useRouter } from "next/navigation";
import { RegistrationHeader } from "@/components/layout/RegistrationHeader";

const GUIDELINES = [
  "Camera will open directly (gallery upload not allowed)",
  "Capture your face clearly (well-focused close-up)",
  "Good lighting (avoid dark rooms or harsh backlights)",
  "No mask, cap, tinted glasses, or sunglasses",
  "Take photos from different specified angles",
  "Only your face should be visible in the frame",
  "Follow real-time prompts displayed on the screen",
];

const SAMPLE_ANGLES = [
  { label: "Front", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3hwpwRJ41nlF1aIaJkcx-7JcklqR0Qd44tWjjdlc28ZB-f7lEpt4XQdKOK1C-X0NI1Gf6LXqtq3lykvtpqHd_kE9Z1DiYnhnByL6tjbpQX0TcuPn9tzF_4gclso5xe_pSHKi62B_gU-E86milbhaSW1RJ0-ZZqmXZHhYRbpzW1YRAHecpNStK8gp5NgI_Z5ZNsJyvJu-B_uahEatn-JQGq9nck3pSQA13djteVg" },
  { label: "Slight Left", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAV0VCE1IornDp5EPE5uYNJY66Ifbv0I_S93il3gVcf33wmdG3y13-x304ggq2zWiAsE_srpReHnmcYrF4uopNFlBDckKmxs33VIjZFQixuE5kvzFOMiXR7UTlxk437SPmnz5O9shWPCMOFarS4VOyIhiWizYhjX23tGWeb2U1agbNafKIsxFzA_-wB5sTX1DeoWNrV1pHUtjn2OES9KEp0gExb1THpr17AircsoQ" },
  { label: "Slight Right", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEStP6IKNxvwEFGbjtf2smZ1QLuvuEDKsrRFxBc2EZ1bibLJ2TUtmg0Vq584E8P9J3DfxXiLBxDemAcMD2P1J0w7PZ_ue16wcJLm3uCXp5ouaYYgAPZBHjczlsdX62taD5J6AErVRtA4ipJmY4Q2om3tryLKm2VbTH1mBp7GFH7yRmuGPq4sZqPVR2BFy1qMy6HAKd24WjhbWgOBrTR3zq6WoE5hAhDjJFKVGTPA" },
  { label: "Up Tilt", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-jrraS6VqEuavuEPq8NrLDEXBhWbzKymkJXSogJ6VFP9h6YHMhOfkA7FcXqJoDgvqi3Rj5D6M7bvGxIo4u_Eyf0CSOZMp34p9uRfLSE32F9w2VTRRTWdjUM9XZuU5BHpdGT-EzazWiIQNmVyG-Doug09v0LbngM0E2w9FXkCi3Owdr1OqcieEpPBtQ7-ut8pxFrqgd4A8xrlrGq6iGtZAz2dkllkoIg9BfHwm-g" },
];

export default function EnrollmentInstructionsPage() {
  const router = useRouter();

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <RegistrationHeader title="Biometric Instructions Step" />
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-24">
          {/* Progress Stepper */}
          <div className="w-full pt-2 pb-4">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-primary-container z-0" />
              <div className="flex flex-col items-center relative z-10">
                <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">Basic Details</span>
              </div>
              <div className="flex flex-col items-center relative z-10">
                <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">Academic Details</span>
              </div>
              <div className="flex flex-col items-center relative z-10">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
                  <span className="font-label-md text-label-md font-bold text-on-primary">3</span>
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-primary-container mt-1.5">Face Enrollment</span>
              </div>
            </div>
          </div>

          <div className="mt-3 mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">Face Photo Enrollment</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Biometric calibration for facial attendance registry</p>
          </div>

          {/* Hero Card */}
          <div className="bg-surface-container-high rounded-xl p-space-lg flex items-center gap-space-md shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0 text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[24px]">photo_camera</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-label-lg text-label-lg text-on-surface font-semibold">We will capture 6 – 8 live photos</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                These photos will be used to calibrate your high-precision smart classroom attendance profile.
              </p>
            </div>
          </div>

          {/* Angles Preview */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg mt-space-md shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Angles Preview</span>
              <span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-medium">8 Perspectives</span>
            </div>
            <div className="grid grid-cols-4 gap-space-sm mb-2">
              {SAMPLE_ANGLES.map((angle) => (
                <div key={angle.label} className="flex flex-col items-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-surface-container relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full h-full object-cover" alt={angle.label} src={angle.src} />
                    <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 rounded-full p-0.5">
                      <span className="material-symbols-outlined text-[10px] text-secondary">check</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">{angle.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg mt-space-md shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-space-sm mb-1">
              <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
              <h4 className="font-label-lg text-label-lg text-on-surface">Enrollment Guidelines</h4>
            </div>
            {GUIDELINES.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-on-secondary-container text-[14px] font-bold">check</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-tight">{item}</p>
              </div>
            ))}
          </div>

          {/* Consent Pill */}
          <div className="bg-surface-container-low rounded-xl px-space-lg py-space-md mt-space-md flex items-center gap-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">shield_lock</span>
            <span className="font-label-sm text-label-sm">Biometric templates are securely encrypted and processed according to institutional privacy policy.</span>
          </div>
        </div>
      </main>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-margin bg-surface/90 backdrop-blur-md pb-safe z-40">
        <button
          onClick={() => router.push("/student/registration/capture/live")}
          className="w-full h-12 bg-primary-container hover:bg-primary active:scale-[0.99] text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-150"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          <span>Start Face Capture</span>
        </button>
      </div>
    </div>
  );
}
