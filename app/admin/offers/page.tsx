import type { Metadata } from "next";
import OffersAdmin from "@/components/admin/OffersAdmin";
export const metadata: Metadata = { title: "Offers" };
export default function AdminOffersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal-900">Offers & Discount Codes</h1>
        <p className="text-gray-500 text-sm font-body mt-1">Create discount codes for everyone or for loyal customers, schedule them, and roll them out by email.</p>
      </div>
      <OffersAdmin />
    </div>
  );
}
