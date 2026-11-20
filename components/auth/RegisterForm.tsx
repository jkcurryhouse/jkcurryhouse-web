"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

const requirements = [
  { test: (p: string) => p.length >= 8,    label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p),  label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p),  label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p),  label: "One number" },
];

export default function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await registerUser({ email: data.email, password: data.password, name: data.name });
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP" || result.nextStep.signUpStep === "DONE") {
        toast("Account created! Check your email for a verification code.", "success");
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (msg.includes("already exists") || msg.includes("UsernameExistsException")) {
        toast("An account with this email already exists.", "error");
      } else {
        toast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        required
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register("password", { onChange: (e) => setPassword(e.target.value) })}
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Password strength */}
      {password.length > 0 && (
        <ul className="space-y-1 -mt-2">
          {requirements.map((r) => (
            <li key={r.label} className={`flex items-center gap-2 text-xs font-body ${r.test(password) ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle size={12} className={r.test(password) ? "text-green-500" : "text-gray-300"} />
              {r.label}
            </li>
          ))}
        </ul>
      )}

      <Input
        label="Confirm password"
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        required
        error={errors.confirm?.message}
        {...register("confirm")}
      />

      <p className="text-xs text-gray-400 font-body">
        By creating an account you agree to our{" "}
        <Link href="/privacy" className="text-spice-500 hover:underline">Privacy Policy</Link>.
        We will only email you about your orders and offers you opt in to.
      </p>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-500 font-body">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-spice-500 hover:underline font-medium">Sign in</Link>
      </p>
    </form>
  );
}
