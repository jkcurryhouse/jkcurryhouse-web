import type { Metadata } from "next";
import OrderClient from "@/components/order/OrderClient";
import NoticeBanner from "@/components/layout/NoticeBanner";
import { getPublicMenu } from "@/lib/menu-repo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Order Online — Delivery & Takeaway | JK Curryhouse Chippenham",
  description:
    "Order Indian food online from JK Curryhouse in Chippenham. Delivery across SN15 or collect in 20–30 minutes. Pay securely online.",
};

export default async function OrderPage() {
  const { items } = await getPublicMenu();
  return <OrderClient items={items} notice={<NoticeBanner />} />;
}
