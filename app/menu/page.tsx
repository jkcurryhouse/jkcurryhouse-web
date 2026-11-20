import type { Metadata } from "next";
import MenuClient from "@/components/menu/MenuClient";

export const metadata: Metadata = {
  title: "Menu — Indian Food in Chippenham SN15 | JK Curryhouse",
  description:
    "Browse JK Curryhouse's full menu: starters, curries, biryanis, breads and today's specials. All allergens clearly labelled. Online ordering available.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk/menu" },
  openGraph: {
    title: "JK Curryhouse Menu — Indian Restaurant Chippenham",
    description: "60+ authentic Indian dishes from starters to biryani. All allergens labelled.",
    type: "website",
  },
};

export default function MenuPage() {
  return <MenuClient />;
}
