import type { Metadata } from "next";
import OrderClient from "@/components/order/OrderClient";

export const metadata: Metadata = {
  title: "Order Online — Delivery & Takeaway | JK Curryhouse Chippenham",
  description:
    "Order Indian food online from JK Curryhouse in Chippenham. Delivery across SN15 or collect in 20–30 minutes. Pay securely online.",
};

export default function OrderPage() {
  return <OrderClient />;
}
