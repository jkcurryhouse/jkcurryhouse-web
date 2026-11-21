import type { Metadata } from "next";
import MenuClient from "@/components/menu/MenuClient";
import NoticeBanner from "@/components/layout/NoticeBanner";
import { getPublicMenu } from "@/lib/menu-repo";

// Re-render at most every 60s; admin edits also trigger an immediate refresh.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Menu — Indian Food in Chippenham SN15 | JK Curryhouse",
  description:
    "Browse JK Curryhouse's full menu: starters, curries, biryanis, breads and today's specials. All allergens clearly labelled. Online ordering available.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk/menu" },
  openGraph: {
    title: "JK Curryhouse Menu — Indian Restaurant Chippenham",
    description: "Authentic Indian dishes from starters to biryani. All allergens labelled.",
    type: "website",
  },
};

export default async function MenuPage() {
  const { items } = await getPublicMenu();
  return <MenuClient items={items} notice={<NoticeBanner />} />;
}
