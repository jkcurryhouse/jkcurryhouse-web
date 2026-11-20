"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ConfirmationCard from "./ConfirmationCard";
import { getDateConstraints, formatSlot } from "@/lib/reservations";
import { Calendar, MessageSquare, User } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: string;
  specialRequest?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  partySize?: string;
}

interface SlotData {
  time: string;
  available: boolean;
  remaining: number;
}

interface BookingResult {
  id: string;
  ref: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
}

export default function ReservationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { min, max } = getDateConstraints();

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<BookingResult | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { register, handleSubmit, watch, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      name:      user?.name  ?? "",
      email:     user?.email ?? "",
      partySize: "2",
    },
  });

  const selectedDate = watch("date");
  const selectedTime = watch("time");

  const loadSlots = useCallback(async (date: string) => {
    if (!date) return;
    setSlotsLoading(true);
    setValue("time", "");
    try {
      const res = await fetch(`/api/reservations/availability?date=${date}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      toast("Could not load available times. Please try again.", "error");
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [setValue, toast]);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const validate = (data: FormData): FormErrors => {
    const errors: FormErrors = {};
    if (!data.name || data.name.length < 2) errors.name = "Name must be at least 2 characters";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address";
    if (!data.phone || data.phone.length < 7) errors.phone = "Enter a valid phone number";
    if (!data.date) errors.date = "Please select a date";
    if (!data.time) errors.time = "Please select a time";
    const size = parseInt(data.partySize);
    if (!size || size < 1) errors.partySize = "Minimum 1 guest";
    if (size > 20) errors.partySize = "For parties over 20 please call us";
    return errors;
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const errors = validate(data);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, partySize: parseInt(data.partySize) }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast(json.error ?? "Something went wrong. Please try again.", "error");
        if (res.status === 409) loadSlots(data.date);
        return;
      }

      setConfirmed(json.reservation);
    } catch {
      toast("Could not submit booking. Please check your connection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <ConfirmationCard
        booking={confirmed}
        guestName={getValues("name")}
        guestEmail={getValues("email")}
      />
    );
  }

  const partySizeOptions = Array.from({ length: 20 }, (_, i) => ({
    value: String(i + 1),
    label: i + 1 === 1 ? "1 guest" : `${i + 1} guests`,
  }));

  const timeOptions = slots.map((s) => ({
    value: s.time,
    label: s.available ? formatSlot(s.time) : `${formatSlot(s.time)} — fully booked`,
    disabled: !s.available,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0" noValidate>
      {/* Step 1 */}
      <FormSection icon={<Calendar size={18} />} title="Date & Time" step={1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Date"
            type="date"
            min={min}
            max={max}
            required
            error={formErrors.date}
            {...register("date")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-charcoal-800">
              Time <span className="text-spice-500">*</span>
            </label>
            {slotsLoading ? (
              <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-400 text-sm font-body flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
                Checking availability…
              </div>
            ) : !selectedDate ? (
              <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-400 text-sm font-body">
                Select a date first
              </div>
            ) : (
              <Select
                options={timeOptions}
                placeholder="Choose a time"
                required
                error={formErrors.time}
                value={selectedTime}
                onChange={(e) => setValue("time", e.target.value)}
              />
            )}
            {formErrors.time && !slotsLoading && selectedDate && (
              <p className="text-xs text-spice-500 font-body">{formErrors.time}</p>
            )}
          </div>
        </div>
        <Select
          label="Party size"
          options={partySizeOptions}
          required
          error={formErrors.partySize}
          hint="For parties over 20, please call us directly."
          {...register("partySize")}
        />
      </FormSection>

      {/* Step 2 */}
      <FormSection icon={<User size={18} />} title="Your Details" step={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Full name" type="text" autoComplete="name" required error={formErrors.name} {...register("name")} />
          <Input label="Phone number" type="tel" autoComplete="tel" placeholder="07700 000000" required error={formErrors.phone} {...register("phone")} />
        </div>
        <Input label="Email address" type="email" autoComplete="email" required error={formErrors.email} hint="Your confirmation will be sent here." {...register("email")} />
      </FormSection>

      {/* Step 3 */}
      <FormSection icon={<MessageSquare size={18} />} title="Special Requests" step={3}>
        <Textarea
          label="Anything we should know?"
          placeholder="Allergies, dietary requirements, high chair needed, birthday cake, occasion..."
          hint="We'll do our best to accommodate every request."
          {...register("specialRequest")}
        />
      </FormSection>

      <div className="bg-amber-50 border border-amber-200 px-5 py-4">
        <p className="text-xs text-amber-800 font-body leading-relaxed">
          <strong>Allergen notice:</strong> If anyone in your party has a food allergy, please mention it above
          and speak to your server on arrival. See our{" "}
          <a href="/allergens" className="underline hover:text-amber-900">full allergen information</a>.
        </p>
      </div>

      <div className="pt-6">
        <Button type="submit" loading={submitting} size="lg" className="w-full sm:w-auto">
          Confirm Reservation
        </Button>
        <p className="mt-3 text-xs text-gray-400 font-body">
          By booking you agree to our cancellation policy. Please give 2 hours&apos; notice for cancellations.
        </p>
      </div>
    </form>
  );
}

function FormSection({ icon, title, step, children }: {
  icon: React.ReactNode; title: string; step: number; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 pb-8 mb-8 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-spice-500 flex items-center justify-center text-white shrink-0">
          <span className="font-body font-bold text-sm">{step}</span>
        </div>
        <div className="flex items-center gap-2 text-charcoal-800">
          {icon}
          <h3 className="font-display text-lg">{title}</h3>
        </div>
      </div>
      <div className="space-y-5 pl-11">{children}</div>
    </div>
  );
}
