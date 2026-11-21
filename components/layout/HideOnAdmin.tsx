"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Public site header/footer are not shown inside the admin panel, which has its own layout. */
export default function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : <>{children}</>;
}
