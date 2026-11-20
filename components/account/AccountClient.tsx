"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProfileTab from "./ProfileTab";
import OrderHistoryTab from "./OrderHistoryTab";
import OffersTab from "./OffersTab";
import { useState } from "react";
import { User, ShoppingBag, LogOut, Tag } from "lucide-react";
import { logoutUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

type Tab = "profile" | "orders" | "offers";

export default function AccountClient() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("profile");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      toast("You've been signed out.", "info");
      router.push("/");
      router.refresh();
    } catch {
      toast("Could not sign out. Please try again.", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-spice-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-body">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "profile" as Tab, label: "Profile",       icon: User },
    { id: "orders"  as Tab, label: "Order History", icon: ShoppingBag },
    { id: "offers"  as Tab, label: "My Offers",     icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="container-pad max-w-5xl">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="eyebrow mb-1">Your Account</p>
            <h1 className="font-display text-4xl text-charcoal-900">Hello, {user.name.split(" ")[0]}</h1>
            <p className="text-gray-500 text-sm font-body mt-1">{user.email}</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-spice-500 transition-colors font-body disabled:opacity-50">
            <LogOut size={16} />{loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <nav className="md:col-span-1">
            <ul className="space-y-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.id}>
                    <button onClick={() => setTab(t.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-left transition-colors border-l-2 ${
                        tab === t.id
                          ? "border-spice-500 bg-white text-spice-600 font-medium shadow-sm"
                          : "border-transparent text-gray-600 hover:text-spice-500 hover:bg-white/50"
                      }`}>
                      <Icon size={16} />{t.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link href="/order" className="btn-primary block text-center !py-2.5 !text-xs">Order Food</Link>
              <Link href="/reservations" className="mt-2 block text-center text-xs font-body text-gray-500 hover:text-spice-500 transition-colors py-2">
                Book a Table
              </Link>
            </div>
          </nav>

          <div className="md:col-span-3">
            {tab === "profile" && <ProfileTab user={user} onUpdate={refresh} />}
            {tab === "orders"  && <OrderHistoryTab userId={user.userId} />}
            {tab === "offers"  && <OffersTab userId={user.userId} />}
          </div>
        </div>
      </div>
    </div>
  );
}
