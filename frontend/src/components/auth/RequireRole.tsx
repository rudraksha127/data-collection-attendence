"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { UserRole } from "@/types/api";

interface RequireRoleProps {
  role: UserRole;
  children: ReactNode;
}

/**
 * Frontend route guard (UX only — the backend remains the authorization authority).
 * Shows a loading state while the session probe runs, redirects otherwise.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (user && user.role !== role) {
      router.replace(user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard");
    }
  }, [status, user, role, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-space-md">
        <span className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="font-label-md text-label-md text-on-surface-variant">Checking session…</span>
      </div>
    );
  }

  if (status === "unauthenticated" || (user && user.role !== role)) {
    return null;
  }

  return <>{children}</>;
}
