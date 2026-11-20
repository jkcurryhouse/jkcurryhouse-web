import type { Metadata } from "next";
import ReservationForm from "@/components/reservations/ReservationForm";

export const metadata: Metadata = {
  title: "Book a Table — JK Curryhouse Chippenham",
  description:
    "Reserve a table at JK Curryhouse in Chippenham. Online booking for up to 20 guests. Confirmation sent immediately.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk/reservations" },
};

export default function ReservationsPage() {
  return (
    <div className="bg-gray-50 py-12 md:py-16">
      <div className="container-pad max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-accent text-gold text-sm tracking-[0.2em] uppercase mb-2">
            JK Curryhouse
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-charcoal-900 mb-3">
            Reserve a Table
          </h1>
          <p className="text-gray-500 font-body max-w-xl mx-auto">
            Book online in a few steps — we&apos;ll confirm your table by email right away.
          </p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm px-6 py-8 md:px-10 md:py-10">
          <ReservationForm />
        </div>
      </div>
    </div>
  );
}