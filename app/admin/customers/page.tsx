import type { Metadata } from "next";
import CustomersAdmin from "@/components/admin/CustomersAdmin";
import { PageHeader } from "@/components/admin/ui";
export const metadata: Metadata = { title: "Customers" };
export default function AdminCustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" subtitle="Everyone who has ordered or booked. Export, or erase someone's data on request (GDPR)." />
      <CustomersAdmin />
    </div>
  );
}
