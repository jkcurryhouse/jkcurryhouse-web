import type { Metadata } from "next";
import OffersClient from "@/components/offers/OffersClient";

export const metadata: Metadata = {
  title: "Offers & Loyalty Rewards | JK Curryhouse Chippenham",
  description:
    "Current deals and exclusive loyalty offers at JK Curryhouse, Chippenham. Create an account to unlock personalised rewards.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk/offers" },
};

export default function OffersPage() {
  return <OffersClient />;
}
