"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "requesting" | "active" | "denied" | "unavailable" | "error";

interface PhotoCaptureProps {
  /** Total photo slots required (kept for callers; slot count is rendered by the parent progress UI). */
  totalPhotos?: number;
  onCaptured: (blob: Blob, dataUrl: string) => void;
  instruction?: string;
}

export function PhotoCapture({ onCaptured, instruction = "Look straight at the camera" }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [preview, setPreview] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("requesting");
    setErrorMessage("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("unavailable");
      setErrorMessage("Camera is not supported on this device or browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("active");
    } catch (err) {
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
        setStatus("denied");
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings to continue.");
      } else if (err instanceof DOMException && (err.name === "NotFoundError" || err.name === "OverconstrainedError")) {
        setStatus("unavailable");
        setErrorMessage("No camera was found on this device.");
      } else {
        setStatus("error");
        setErrorMessage("Unable to start the camera. Please try again.");
      }
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 960;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setPreview({ blob, dataUrl });
      },
      "image/jpeg",
      0.92
    );
  }, []);

  const confirmPhoto = useCallback(() => {
    if (!preview) return;
    onCaptured(preview.blob, preview.dataUrl);
    setPreview(null);
  }, [preview, onCaptured]);

  const retake = useCallback(() => setPreview(null), []);

  if (status === "denied" || status === "unavailable" || status === "error") {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center gap-space-md text-center">
        <span className="material-symbols-outlined text-[40px] text-error">no_photography</span>
        <p className="font-body-md text-body-md text-on-surface">{errorMessage}</p>
        <button
          onClick={startCamera}
          className="h-10 px-5 bg-primary text-on-primary font-label-lg text-label-lg rounded-xl flex items-center gap-1"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="relative mx-auto w-full rounded-xl overflow-hidden bg-inverse-surface shadow-xl aspect-[3/4] max-h-[410px] flex items-center justify-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="absolute inset-0 w-full h-full object-cover" alt="Captured preview" src={preview.dataUrl} />
        ) : (
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        )}
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

        {!preview && (
          <div className="absolute top-space-md left-0 right-0 flex justify-center px-space-md pointer-events-none z-10">
            <div className="flex items-center gap-1.5 bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface px-space-md py-1.5 rounded-full shadow-md animate-pulse">
              <span className="material-symbols-outlined text-secondary-fixed text-[18px]">center_focus_strong</span>
              <span className="font-label-md text-label-md tracking-wide">{instruction}</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-surface-container-lowest pointer-events-none transition-opacity duration-150 z-20" style={{ opacity: flashActive ? 0.9 : 0 }} />
      </div>

      {status === "requesting" && (
        <div className="flex items-center justify-center gap-space-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          <span className="font-body-md text-body-md">Requesting camera access…</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-space-lg">
        {preview ? (
          <>
            <button onClick={retake} className="h-12 px-6 bg-surface-container text-on-surface font-label-lg text-label-lg rounded-xl flex items-center gap-1" type="button">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retake
            </button>
            <button onClick={confirmPhoto} className="h-12 px-6 bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow-md flex items-center gap-1" type="button">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Use Photo
            </button>
          </>
        ) : (
          <button
            aria-label="Capture Biometric Photo"
            onClick={capturePhoto}
            disabled={status !== "active"}
            className="w-18 h-18 p-1.5 rounded-full bg-surface-container-lowest shadow-xl border-4 border-primary-container flex items-center justify-center transition-all duration-150 transform active:scale-90 hover:shadow-2xl disabled:opacity-50"
            type="button"
          >
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                photo_camera
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
