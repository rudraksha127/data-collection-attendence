"use client";

import { type ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  icon: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormField({ id, label, icon, required = false, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col space-y-space-xs">
      <label
        htmlFor={id}
        className="font-label-md text-label-md text-on-surface font-medium flex items-center gap-1"
      >
        {label} {required && <span className="text-error font-bold">*</span>}
      </label>
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-on-surface-variant pointer-events-none select-none">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p className="font-body-sm text-body-sm text-error mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  pattern?: string;
  required?: boolean;
  uppercase?: boolean;
}

export function TextInput({
  id,
  name,
  type = "text",
  placeholder,
  defaultValue,
  pattern,
  required = false,
  uppercase = false,
}: TextInputProps) {
  return (
    <input
      className={`w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-low transition-all ${
        uppercase ? "uppercase font-semibold" : ""
      }`}
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      pattern={pattern}
      required={required}
    />
  );
}

interface SelectInputProps {
  id: string;
  name: string;
  icon: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
}

export function SelectInput({ id, name, icon, required = false, defaultValue, options }: SelectInputProps) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full h-12 pl-11 pr-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm appearance-none focus:outline-none focus:bg-surface-container-low transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3.5 flex items-center pointer-events-none text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">expand_more</span>
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  disableNext?: boolean;
  isLoading?: boolean;
}

export function ActionButtons({ onBack, onNext, nextLabel = "Next", disableNext = false, isLoading = false }: ActionButtonsProps) {
  return (
    <div className="w-full pt-space-sm flex items-center gap-space-md mt-2">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 h-12 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={disableNext || isLoading}
        className="flex-1 h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-md flex items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
      >
        {isLoading ? (
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        ) : (
          <>
            <span>{nextLabel}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  );
}
