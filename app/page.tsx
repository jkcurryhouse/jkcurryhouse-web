import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import FeaturedDishes from "@/components/home/FeaturedDishes";
import OpeningHours from "@/components/home/OpeningHours";
import CTABar from "@/components/home/CTABar";
import Location from "@/components/home/Location";

export const metadata: Metadata = {
  title: "JK Curryhouse — The Real Indian Kitchen | Chippenham SN15",
  description:
    "JK Curryhouse — authentic Indian cuisine in Chippenham, Wiltshire. Dine in, order delivery or takeaway online. SN15 1HA. Est. 1998.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <FeaturedDishes />
      <CTABar />
      <OpeningHours />
      <Location />
    </>
  );
}
