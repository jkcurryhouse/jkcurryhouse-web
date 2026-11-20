"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await loginUser({ email: data.email, password: data.password });
      if (result.isSignedIn) {
        toast("Welcome back!", "success");
        router.push("/account");
        router.refresh();
      } else if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
        toast("Please verify your email first.", "info");
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      if (msg.includes("not confirmed")) {
        toast("Please verify your email address first.", "error");
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
      } else if (msg.includes("Incorrect") || msg.includes("incorrect")) {
        toast("Incorrect email or password.", "error");
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
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          aria-label={showPw ? "Hide password" : "Show password"}
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-xs text-spice-500 hover:underline font-body">
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Sign In
      </Button>

      <p className="text-center text-sm text-gray-500 font-body">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-spice-500 hover:underline font-medium">
          Create one
        </Link>
      </p>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs font-body text-gray-400">
          <span className="bg-white px-3">or</span>
        </div>
      </div>

      <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-700 font-body">
        Continue as guest →
      </Link>
    </form>
  );
}
