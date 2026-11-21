import type { Metadata } from "next";
import SettingsAdmin from "@/components/admin/SettingsAdmin";
import { PageHeader } from "@/components/admin/ui";
export const metadata: Metadata = { title: "Settings" };
export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Restaurant Settings" subtitle="Ordering and booking switches, delivery charges, table capacity and closed days." />
      <SettingsAdmin />
    </div>
  );
}
