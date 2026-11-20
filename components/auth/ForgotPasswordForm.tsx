"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset, submitPasswordReset } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const emailSchema = z.object({ email: z.string().email("Enter a valid email") });
const resetSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type EmailData = z.infer<typeof emailSchema>;
type ResetData = z.infer<typeof resetSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetData>({ resolver: zodResolver(resetSchema) });

  const onRequestReset = async (data: EmailData) => {
    setLoading(true);
    try {
      await requestPasswordReset(data.email);
      setEmail(data.email);
      setStep("reset");
      toast("Reset code sent — check your email.", "info");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Could not send reset code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: ResetData) => {
    setLoading(true);
    try {
      await submitPasswordReset({ email, code: data.code, newPassword: data.newPassword });
      toast("Password reset successfully. Please sign in.", "success");
      router.push("/auth/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed.";
      toast(msg.includes("expired") ? "Code has expired. Request a new one." : msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(onRequestReset)} className="space-y-5" noValidate>
        <p className="text-sm text-gray-600 font-body">Enter your account email and we&apos;ll send you a reset code.</p>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={emailForm.formState.errors.email?.message}
          {...emailForm.register("email")}
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Code</Button>
        <p className="text-center text-sm text-gray-500 font-body">
          Remembered it?{" "}
          <Link href="/auth/login" className="text-spice-500 hover:underline">Sign in</Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5" noValidate>
      <p className="text-sm text-gray-600 font-body">
        Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
      </p>
      <Input
        label="Verification code"
        type="text"
        inputMode="numeric"
        maxLength={6}
        required
        error={resetForm.formState.errors.code?.message}
        {...resetForm.register("code")}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        error={resetForm.formState.errors.newPassword?.message}
        {...resetForm.register("newPassword")}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        error={resetForm.formState.errors.confirm?.message}
        {...resetForm.register("confirm")}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">Reset Password</Button>
      <button type="button" onClick={() => setStep("email")} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 font-body">
        ← Use a different email
      </button>
    </form>
  );
}
