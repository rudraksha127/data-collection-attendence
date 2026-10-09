"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegistrationHeader } from "@/components/layout/RegistrationHeader";

const PHOTO_THUMBS = [
  { label: "Front", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoNcCU_3E2niei9H4FP5YNDXZN8-Dp6cUoSlU8Ab9zlgrNfIaXseqPjIgFw3jHtbt1aoSJNEapSzsYDxbOjWMdu5WgIyICV7LieBx7LiDun5_4B-PPhlCoLeqsNEzu6nBFPq5iJo5n0aKQYs4D3zhZ0pl_JR2DqWipsY2OoYZp7udk0fWGsA-IAJgu3ezQ_AD52nyj0OYuknz9mYoogvq2Kh4NMMmzAa49Nnea7Q" },
  { label: "Smile", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-HWrWevM3SE4ZF47SjB61FziLr4gOrGT4wKGaDMSmuFRbqB7mn7DHxHc2JHCuaaWaVxC68xvXHX5MDBhmkJQ9UfjVKANys2LfmN1bRzdDFmA09eB-bIz_FlxQUgqENhs5S8UWkJAfE4ASWiY29XFLBWCbOhWF6WPHqqFm1amL_DQ_opqPUppxND8cd9Ms-utxrmp0cAd81b_K42SFxcaKtPcF996gFJCekppzfQ" },
  { label: "Left", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAs9SkzJIgmO6Le3GOAYr60x72n9psrCT50TDiOfiDCVsxX8w-4vLFh2ZPxEsAaXuQJZjFxE8dyAxD0QiCyGqK5y5WkkENg57gQ6VJeHSlpgIe3BoB0qynyWKTEmwP-AiL4FiEdnkBSAYpWrRgeTySTQ_VJJa0bMFtZQ6d64MdX7C7UO0TsGBwdkz6-4ajxf5gRy-vvcXonextyz0HoTuGEiCffb_kasEGuah6Iog" },
  { label: "Right", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMaNv5BNsCRNdzKMJ2n4n9214GgvO7yozWwPorkT5Tn_i0o0207KxsxSDc-TC62KEIoUqOck29BKfIVkDZgW_tS8CxsLCIHUGcHyGT_BFYMwDwHwnBtWFtJzC1uvFZTsSXqcDl-I5Lwl3nNeWYEkiX431j0zzo8HSR9-ebLIQVP3y-1PaCZs-eferm7ktSYwkt9l5xaeiY2_0neIb9SSwsQlxwemVnySOMyuhJ_Q" },
  { label: "Up", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOpFOa4BGApOSi7rE5rGkUR7KBAuuKsTlWmUTicXTmV6j9LvzQtAoex5Oig1w5l58-3kqHnksLUS8clrblYtOflRF07kVNNY9u_Xu6IPE92PE8uM_QPwo5KrbDy3ZRB8bxoT1enN0bc9b733SOE8e7_XtMPixhxR6c0qyRF9ofCO7DtNdxyeNXETBu11AJVjptjjnDwYLD8o0VW-U68YSmeYq4aa_6cXr-dVvQLA" },
  { label: "Down", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDT-tgSikUvHbuw8zZXGrYwOvtTtlX3gxU6dBV7h_Iu3zgHPqMGugiURwxxWqFarCyRfrYffU_c8klrTmJ_xPLSvONT-EGTq0nivo2CwH0ueQjwQjV_lPO7JzszCFZJflxlPxbxEr0jcU11jDiZhVGlYSbmUGsrnSAtuVAvOdf5bGtr9J_QdJlieVnD0lVOUnsu_BeoS6uBqRpRnieI5CqFz9WsZXY-I7OhkeJrWg" },
  { label: "Natural", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFanES_oRdvJ-bK2DJ8uAaMtickdPKGJ99uXPV3BucIEZiZyCGKX2QOYwlNepgCfOsWlLbAqUyHCjXgQUG-f7ORZN2k9Z3r40bRsz8JB7vTLApxSDJRzKv44Kuysv7lFveYhZWKBa63DycWCpfxSdY7YdMR6XORJfub5WDJI7n7rdTd0SiqKdQgTTNbmIP03cbhLR9igarJC0OLCUi60qhyht7D27jESuQSVk3sA" },
  { label: "Glasses", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmgS9_O_MaqJCGu5I2NZX-GEfgEgjn8laTq4k6RPisRKRES0_Ycq8cEwjCj8-nnVwUFTIBSnS0HctHZIN7r1K6jWPj9Cu0Tuugb0COVJY5-rWWgpaFpwZnvyp-FSC92DkiJfTiMXB_mwHXYf-N6SZi7GUENG1RWD4jCbNAtrINSOolpVRGDs6VFTHB9M0OaPSMF8p2KGelDfiC27YhE4echaCNG3qWQHo3XJYyNA" },
];

interface ReviewRowProps {
  icon: string;
  label: string;
  value: string;
}

function ReviewRow({ icon, label, value }: ReviewRowProps) {
  return (
    <div className="flex items-center justify-between py-1 bg-surface-container-low px-3 rounded-lg">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="font-body-md text-body-md">{label}</span>
      </div>
      <span className="font-label-lg text-label-lg text-on-surface font-semibold text-right truncate max-w-[170px]">{value}</span>
    </div>
  );
}

interface ReviewCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}

function ReviewCard({ icon, iconBg, iconColor, title, subtitle, onEdit, children }: ReviewCardProps) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-md">
      <div className="flex items-center justify-between pb-space-sm mb-space-sm">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
            {subtitle && <span className="font-label-sm text-label-sm text-secondary font-semibold">{subtitle}</span>}
          </div>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-primary hover:bg-surface-container-high transition-colors font-label-md text-label-md" type="button">
            <span>Edit</span>
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function FinalReviewPage() {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = () => {
    setSubmitState("submitting");
    // In production, this must call the real backend API before marking success.
    setTimeout(() => {
      setSubmitState("success");
      setTimeout(() => router.push("/student/submission/success"), 600);
    }, 1200);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md flex flex-col min-h-screen">
      <RegistrationHeader title="Student Identity Step" />
      <main className="flex flex-col relative w-full pt-16 bg-surface px-margin pb-safe">
        <div className="flex flex-col w-full pb-28">
          <div className="flex flex-col gap-space-xs mb-space-lg">
            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-surface-container-high text-primary">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Step 3 of 3 • Verification</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Review & Submit</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Please confirm your student profile details before submission.</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  task_alt
                </span>
              </div>
            </div>
          </div>

          <ReviewCard
            icon="person"
            iconBg="bg-surface-container-high"
            iconColor="text-primary"
            title="Basic Details"
            onEdit={() => router.push("/student/registration/basic")}
          >
            <div className="flex flex-col gap-space-sm">
              <ReviewRow icon="badge" label="Name" value="Rudraksh Udiya" />
              <ReviewRow icon="tag" label="Roll No" value="23IT101" />
              <ReviewRow icon="call" label="Mobile" value="+91 9876543210" />
              <ReviewRow icon="mail" label="Email" value="rudraksh@example.com" />
            </div>
          </ReviewCard>

          <ReviewCard
            icon="school"
            iconBg="bg-surface-container-high"
            iconColor="text-primary"
            title="Academic Details"
            onEdit={() => router.push("/student/registration/academic")}
          >
            <div className="flex flex-col gap-space-sm">
              <ReviewRow icon="calendar_today" label="Year" value="2nd Year" />
              <ReviewRow icon="layers" label="Semester" value="3rd Semester" />
              <ReviewRow icon="account_tree" label="Department" value="IT (Info Tech)" />
              <ReviewRow icon="groups" label="Section" value="IT - 1" />
            </div>
          </ReviewCard>

          <ReviewCard
            icon="face"
            iconBg="bg-secondary-container"
            iconColor="text-on-secondary-container"
            title="Face Photos"
            subtitle="8 of 8 Angles Verified"
            onEdit={() => router.push("/student/registration/capture/progress")}
          >
            <div className="grid grid-cols-4 gap-2 pt-1">
              {PHOTO_THUMBS.map((photo) => (
                <div key={photo.label} className="flex flex-col items-center gap-1">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-sm bg-surface-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full h-full object-cover" alt={photo.label} src={photo.src} />
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[10px]">
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full text-center">{photo.label}</span>
                </div>
              ))}
            </div>
          </ReviewCard>

          <div className="w-full bg-surface-container-high rounded-xl p-space-md flex items-start gap-space-sm mb-4">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Once submitted, Department Admin will review your attendance credentials within 24 hours. You can track status on the home portal.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md px-margin py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe">
        <div className="flex items-center gap-space-sm max-w-md mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="w-1/3 h-12 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-highest transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-label-lg text-label-lg">Back</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitState !== "idle"}
            className={`flex-1 h-12 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-label-lg text-label-lg ${
              submitState === "success" ? "bg-secondary text-on-secondary" : "bg-primary-container text-on-primary hover:bg-primary opacity-90"
            }`}
            type="button"
          >
            {submitState === "submitting" ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span>Submitting...</span>
              </>
            ) : submitState === "success" ? (
              <>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span>Submitted!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                <span>Submit Registration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
