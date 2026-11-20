"use client";
import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmRegistration, resendConfirmationCode } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const { toast } = useToast();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) { toast("Enter the 6-digit code from your email.", "error"); return; }
    setLoading(true);
    try {
      await confirmRegistration(email, fullCode);
      toast("Email verified! You can now sign in.", "success");
      router.push("/auth/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid code.";
      toast(msg.includes("expired") ? "Code has expired. Request a new one." : "Incorrect code. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendConfirmationCode(email);
      toast("A new code has been sent to your email.", "info");
    } catch {
      toast("Could not resend code. Please try again.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 font-body">
        We sent a 6-digit code to <strong className="text-charcoal-800">{email}</strong>. Enter it below to verify your account.
      </p>

      {/* OTP boxes */}
      <div className="flex gap-3 justify-center" onPaste={handlePaste}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { inputs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={cn(
              "w-12 h-14 text-center text-xl font-display font-bold border-2 focus:outline-none transition-colors",
              digit ? "border-spice-500 text-spice-600" : "border-gray-300 text-charcoal-800",
              "focus:border-spice-400"
            )}
          />
        ))}
      </div>

      <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
        Verify Email
      </Button>

      <p className="text-center text-sm text-gray-500 font-body">
        Didn&apos;t receive it?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-spice-500 hover:underline font-medium disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </div>
  );
}
