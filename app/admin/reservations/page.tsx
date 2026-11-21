import type { Metadata } from "next";
import ReservationsAdmin from "@/components/admin/ReservationsAdmin";
export const metadata: Metadata = { title: "Reservations" };
export default function AdminReservationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal-900">Reservations</h1>
        <p className="text-gray-500 text-sm font-body mt-1">Take phone and walk-in bookings, assign tables, and manage tonight’s service.</p>
      </div>
      <ReservationsAdmin />
    </div>
  );
}
