import type { Metadata } from "next";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
export const metadata: Metadata = { title: "Orders" };
export default function AdminOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal-900">Orders</h1>
        <p className="text-gray-500 text-sm font-body mt-1">Live order board — update status as orders progress.</p>
      </div>
      <OrdersAdmin />
    </div>
  );
}
