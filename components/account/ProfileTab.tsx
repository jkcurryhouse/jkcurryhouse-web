"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { type AuthUser } from "@/context/AuthContext";
import { CheckCircle, ShieldCheck } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfileTab({ user, onUpdate }: { user: AuthUser; onUpdate: () => Promise<void> }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateProfile({ name: data.name, ...(data.phone ? { phone_number: data.phone } : {}) });
      await onUpdate();
      setSaved(true);
      toast("Profile updated.", "success");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Could not update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Verified badge */}
      <div className="bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
        <ShieldCheck size={18} className="text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800 font-body">Email verified</p>
          <p className="text-xs text-green-600 font-body">{user.email}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 md:p-8">
        <h2 className="font-display text-xl text-charcoal-900 mb-6">Personal Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label="Full name"
            type="text"
            required
            error={errors.name?.message}
            {...register("name")}
          />
          <div>
            <label className="font-body text-sm font-medium text-charcoal-800 block mb-1.5">
              Email address
            </label>
            <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 text-sm font-body flex items-center justify-between">
              <span>{user.email}</span>
              <span className="text-xs text-gray-400">Cannot be changed</span>
            </div>
          </div>
          <Input
            label="Phone number"
            type="tel"
            placeholder="+44 7700 000000"
            hint="Optional — used for reservation reminders only"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" loading={loading} disabled={!isDirty}>
              {saved ? <><CheckCircle size={15} /> Saved</> : "Save Changes"}
            </Button>
            {!isDirty && !saved && (
              <p className="text-xs text-gray-400 font-body">No changes to save</p>
            )}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 p-6 md:p-8">
        <h2 className="font-display text-xl text-charcoal-900 mb-4">Account Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-charcoal-800 font-body">Password</p>
              <p className="text-xs text-gray-400 font-body">Last changed: unknown</p>
            </div>
            <a href="/auth/forgot-password" className="text-sm text-spice-500 hover:underline font-body">
              Change password
            </a>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-charcoal-800 font-body">Data & Privacy</p>
              <p className="text-xs text-gray-400 font-body">View how we use your data</p>
            </div>
            <a href="/privacy" className="text-sm text-spice-500 hover:underline font-body">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
