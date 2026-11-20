import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
export const metadata: Metadata = { title: "Reset Password" };
export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll send a code to your email">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
