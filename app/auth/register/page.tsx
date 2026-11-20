import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";
export const metadata: Metadata = { title: "Create Account" };
export default function RegisterPage() {
  return (
    <AuthShell title="Create an account" subtitle="Track orders, save favourites, and unlock exclusive offers">
      <RegisterForm />
    </AuthShell>
  );
}
