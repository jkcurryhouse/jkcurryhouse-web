import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import VerifyForm from "@/components/auth/VerifyForm";
export const metadata: Metadata = { title: "Verify Email" };
export default function VerifyPage() {
  return (
    <AuthShell title="Verify your email" subtitle="Almost there — just one quick step">
      <Suspense><VerifyForm /></Suspense>
    </AuthShell>
  );
}
