"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegistrationHeader } from "@/components/layout/RegistrationHeader";

type SlotStatus = "valid" | "pending";

interface PhotoSlot {
  label: string;
  status: SlotStatus;
  src?: string;
}

const INITIAL_SLOTS: PhotoSlot[] = [
  { label: "1. Front", status: "valid", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFlFVia0q9LrQW41A8Cu34Bj1iNHbrwWDmoMSSNFi2-Ji6KXZWjGKxXbySbH_Ep8LP89vmLjVU3Vn2frvVDIVpSHV_xAjAkfy5XRVfIhXQ94FhsrbbUy4aK2R3ApOvJpkWaU1SYlR8XDWNf-k9jlOVc5acLBVWK59BSbURZs8uEYoVK5qndzOI_f_49TVAPCp3pNZmVJaI7FbekIbptqpW5dfrNSOBIwSMWUOb1w" },
  { label: "2. Front (Smile)", status: "valid", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZGjegCe3tdxYf9BoA1hEGiX8aTPoaY95e3KCb2UYKgd4k4F04ldJBLeBp72JS2LWa3JpiLERdMeEju19_U1CJr1jp6TJhUf6Zid8ehmPYFk_6fUQCxq1rbArf6AEPO6dnEu6_QjTHJD1fBvqMV9i5soo6-Oc_5zPUmgm_VSmtXqd9ozROGTbUs7tYM4gvjmc1ZOxmy0wlRjceQ2RdSfaQIYzOT_crFF0b3ct8g" },
  { label: "3. Left", status: "valid", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkjjk-wiYVk7mHRiPy8sU_tBaIeZAKw2QSGkG-Yuo0FNMs7CSsFd9D6GZrAEO1ydo_EhPZlxPCOMupXZ4tHeE9JZdobZXZLdyhkAG-3duzzX0_Ffl78e2-xdGOlGL0d34KuhrRW0FZjgRQJdsg3EkCGo6rwbkPYuwpeo5fH-A-OZOlaUQEDfwwu9uWkmS1ZDAIU88pynAO7iVgP4ZFEols3uad4ZDjMuRJiaIPVw" },
  { label: "4. Right", status: "valid", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeQpa-MaAYGCZxZoQG7-Q4BSeWBcOPO5fpMRfqK8bXXgZWcGxWYnh_wJfF8zyfImIWXFQD3XKncVLyRFvkbSrEWr7XnaI5BCPP2EtEQZbtXS3SHr7O9hSBeeSibxurcSXA-UshtQOlPSfFJbpE_Vki1Q98NiXtrocduRwbiNWlluRWM67o34rUBa5ayRK3Ge04mv-ISEqwj7bB4GDi3D9fOCprpIMVLYCenaU5yg" },
  { label: "5. Up", status: "pending" },
  { label: "6. Down", status: "pending" },
  { label: "7. Natural", status: "pending" },
  { label: "8. With Glasses", status: "pending" },
];

export default function CaptureProgressPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS);
  const completedCount = slots.filter((s) => s.status === "valid").length;
  const allComplete = completedCount === slots.length;

  const handleSlotTap = (index: number) => {
    if (slots[index].status === "valid") return;
    // Placeholder: mark as valid locally for demo; production must use backend validation
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, status: "valid" } : s)));
  };

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <RegistrationHeader title="Biometric Instructions Step" />
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-6 space-y-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Capture Photos</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Multi-angle facial recognition enrollment</p>
              </div>
              <span className="inline-flex items-center px-space-md py-space-xs rounded-full bg-surface-container text-primary font-label-md text-label-md">
                {completedCount} of {slots.length} completed
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / slots.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-lg">
              <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                info
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Tap pending frames to activate live angle verification.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-gutter">
            {slots.map((slot, index) => (
              <div
                key={slot.label}
                onClick={() => handleSlotTap(index)}
                className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col items-center text-center space-y-space-xs ${
                  slot.status === "pending" ? "hover:bg-surface-container-low transition-colors cursor-pointer group" : ""
                }`}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-low">
                  {slot.status === "valid" && slot.src ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="w-full h-full object-cover" alt={slot.label} src={slot.src} />
                      <div className="absolute bottom-1 right-1 bg-secondary text-on-secondary rounded-full p-0.5 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full group-hover:bg-surface-container flex flex-col items-center justify-center text-primary transition-colors">
                      <span className="material-symbols-outlined text-[32px]">photo_camera</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Tap to capture</span>
                    </div>
                  )}
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full pt-1">{slot.label}</span>
                {slot.status === "valid" ? (
                  <span className="inline-flex items-center gap-0.5 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[12px]">done</span> Valid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[12px]">hourglass_empty</span> Pending
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-space-md flex items-center gap-space-md">
            <button
              onClick={() => router.back()}
              className="w-1/2 h-12 flex items-center justify-center gap-space-xs rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors active:scale-98"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Back</span>
            </button>
            <button
              disabled={!allComplete}
              onClick={() => router.push("/student/registration/review")}
              className={`w-1/2 h-12 flex items-center justify-center gap-space-xs rounded-xl font-label-lg text-label-lg ${
                allComplete
                  ? "bg-primary text-on-primary shadow-md hover:bg-primary-container transition-colors"
                  : "bg-primary-fixed text-primary cursor-not-allowed opacity-60"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">{allComplete ? "arrow_forward" : "lock"}</span>
              <span>Submit</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
