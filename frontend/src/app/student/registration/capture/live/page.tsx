"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoCapture } from "@/components/student/PhotoCapture";

const TOTAL_PHOTOS = 8;

const DIAGNOSTICS = ["Face detected", "Good lighting", "Clear image", "Face is close enough"];

export default function LiveCapturePage() {
  const router = useRouter();
  const [capturedCount, setCapturedCount] = useState(0);

  const handleCaptured = () => {
    setCapturedCount((prev) => {
      const next = prev + 1;
      if (next >= TOTAL_PHOTOS) {
        setTimeout(() => router.push("/student/registration/capture/progress"), 400);
      }
      return next;
    });
  };

  const progressPercent = (capturedCount / TOTAL_PHOTOS) * 100;

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <main className="flex flex-col relative w-full min-h-screen bg-surface pt-safe pb-safe">
        <div className="flex flex-col w-full text-on-surface select-none pb-4">
          {/* Top Context Bar */}
          <div className="flex items-center justify-between px-space-lg py-space-sm bg-surface-container-lowest shadow-sm rounded-xl mb-space-sm mx-space-sm">
            <div className="flex items-center gap-space-sm">
              <button
                aria-label="Go Back"
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase">IT Department</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Student Registration</span>
              </div>
            </div>
            <button aria-label="Menu options" className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-space-lg mb-space-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-primary font-semibold">Face Photo Enrollment</span>
              <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-space-sm py-0.5 rounded-full">
                Photo {Math.min(capturedCount + 1, TOTAL_PHOTOS)} of {TOTAL_PHOTOS}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden flex">
              <div className="bg-primary-container h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent || 12.5}%` }} />
            </div>
          </div>

          <div className="px-space-lg">
            <PhotoCapture totalPhotos={TOTAL_PHOTOS} onCaptured={handleCaptured} />
          </div>

          {/* Diagnostics */}
          <div className="px-space-lg mt-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold uppercase text-outline tracking-wider">Telemetry & Readiness</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" /> Live Sensor Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-space-md pt-space-xs">
                {DIAGNOSTICS.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    </div>
                    <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">{item}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 col-span-2">
                  <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                  </div>
                  <span className="font-body-sm text-body-sm font-medium text-on-surface">Single face in frame (no obstructions)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
