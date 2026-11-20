import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
export const metadata: Metadata = { title: "Sign In" };
export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your JK Curryhouse account">
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
