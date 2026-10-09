"use client";

type StepState = "completed" | "active" | "inactive";

interface StepItem {
  label: string;
  state: StepState;
}

interface ProgressStepperProps {
  steps: StepItem[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="w-full bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
      <div className="relative flex items-center justify-between">
        {/* Connecting Track Background */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-surface-container z-0" />
        {/* Completed/Active Progress Segment */}
        <div className="absolute top-1/2 left-6 w-[20%] -translate-y-1/2 h-0.5 bg-primary z-0" />
        {steps.map((step, index) => (
          <StepIndicator key={step.label} step={step} index={index} />
        ))}
      </div>
    </div>
  );
}

function StepIndicator({ step, index }: { step: StepItem; index: number }) {
  const { label, state } = step;
  return (
    <div className="relative z-10 flex flex-col items-center">
      {state === "completed" ? (
        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check
          </span>
        </div>
      ) : state === "active" ? (
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md shadow-sm">
          {index + 1}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md text-label-md">
          {index + 1}
        </div>
      )}
      <span
        className={`mt-space-xs font-label-sm text-label-sm ${
          state === "active" ? "text-primary font-semibold" : "text-on-surface-variant"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
