"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  CalendarDays, Tag, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { logoutUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { Monogram } from "@/components/brand/Logo";

const NAV = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/menu",         label: "Menu",         icon: UtensilsCrossed },
  { href: "/admin/orders",       label: "Orders",       icon: ShoppingBag },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/offers",       label: "Offers",       icon: Tag },
];

function AdminGuard({ children }: { children: ReactNode }) {
  const { admin, loading } = useAdmin();
  const router             = useRouter();
  const pathname           = usePathname();
  const { toast }          = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      toast("Admin access required. Please sign in with an admin account.", "error");
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [admin, loading, router, pathname, toast]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-body">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-charcoal-900 border-r border-gold/10 fixed inset-y-0 left-0 z-40">
        <SidebarContent admin={admin} onLogout={handleLogout} pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-charcoal-900 flex flex-col">
            <SidebarContent admin={admin} onLogout={handleLogout} pathname={pathname}
              onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-charcoal-900 border-b border-gold/10 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <span className="font-display text-white text-lg">JK Curryhouse Admin</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  admin, onLogout, pathname, onClose,
}: {
  admin: { name: string; email: string };
  onLogout: () => void;
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gold/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monogram size={36} />
          <div>
            <p className="font-display text-xl font-semibold text-gold-gradient leading-none">Curryhouse</p>
            <p className="font-caps text-gold text-[10px] tracking-[0.25em] uppercase mt-1">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors rounded-none ${
                active
                  ? "bg-spice-500/20 text-spice-400 border-l-2 border-spice-500"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}>
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-gold/10">
        <div className="mb-3">
          <p className="text-white text-sm font-body font-medium truncate">{admin.name}</p>
          <p className="text-gray-500 text-xs font-body truncate">{admin.email}</p>
          <span className="inline-block mt-1 bg-gold/20 text-gold text-xs px-2 py-0.5 font-body">
            Admin
          </span>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors font-body w-full">
          <LogOut size={13} /> Sign out
        </button>
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-300 transition-colors font-body mt-2">
          ← Back to website
        </Link>
      </div>
    </>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminProvider>
  );
}
