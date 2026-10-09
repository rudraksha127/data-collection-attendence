"use client";

import { RequireRole } from "@/components/auth/RequireRole";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="STUDENT">{children}</RequireRole>;
}
