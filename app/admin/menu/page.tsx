import type { Metadata } from "next";
import MenuAdmin from "@/components/admin/MenuAdmin";
export const metadata: Metadata = { title: "Menu Management" };
export default function AdminMenuPage() {
  return <MenuAdmin />;
}
