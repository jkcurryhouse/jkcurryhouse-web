"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ShoppingBag, CalendarDays, Tag, UtensilsCrossed, TrendingUp, Clock, AlertCircle,
  ArrowRight, Users, Sparkles, Plus, Power, Settings as Cog,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { authFetch } from "@/lib/api-client";
import { formatSlot } from "@/lib/reservations";
import { useToast } from "@/components/ui/Toast";

interface Stats {
  orders:       { today: number; active: number };
  revenue:      { today: number; week: number };
  reservations: {
    today: number; coversToday: number; pending: number; upcoming: number;
    todaysList: { id: string; name: string; time: string; partySize: number; status: string; tableNumber: string | null; specialRequest: string | null }[];
  };
  offers:   { live: number };
  menu:     { available: number; hidden: number; specials: { id: string; name: string }[] };
  switches: { acceptingOrders: boolean; acceptingReservations: boolean; deliveryEnabled: boolean };
  activity: { id: string; actorEmail: string; summary: string; createdAt: string; entity: string }[];
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res  = await authFetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data); setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 60000);
    return () => clearInterval(t);
  }, [load]);

  const flip = async (key: keyof Stats["switches"], value: boolean) => {
    try {
      const res = await authFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ [key]: value }) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Updated — live on the website.", "success");
      load();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const cards = stats ? [
    { label: "Today's revenue",  value: formatPrice(stats.revenue.today), sub: `${stats.orders.today} paid orders · ${formatPrice(stats.revenue.week)} this week`, icon: TrendingUp, colour: "border-gold", href: "/admin/orders" },
    { label: "Active orders",    value: String(stats.orders.active), sub: "Confirmed, preparing or ready", icon: ShoppingBag, colour: stats.orders.active ? "border-spice-500" : "border-gray-300", href: "/admin/orders", urgent: stats.orders.active > 0 },
    { label: "Tonight's tables", value: String(stats.reservations.today), sub: `${stats.reservations.coversToday} covers · ${stats.reservations.upcoming} upcoming`, icon: CalendarDays, colour: "border-blue-400", href: "/admin/reservations" },
    { label: "Pending bookings", value: String(stats.reservations.pending), sub: "Waiting for confirmation", icon: AlertCircle, colour: stats.reservations.pending ? "border-amber-400" : "border-gray-300", href: "/admin/reservations", urgent: stats.reservations.pending > 0 },
    { label: "Live offers",      value: String(stats.offers.live), sub: "Codes customers can use now", icon: Tag, colour: "border-green-400", href: "/admin/offers" },
    { label: "Dishes on menu",   value: String(stats.menu.available), sub: `${stats.menu.hidden} hidden`, icon: UtensilsCrossed, colour: "border-charcoal-700", href: "/admin/menu" },
  ] : [];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal-900">Dashboard</h1>
          <p className="text-gray-500 text-sm font-body mt-1">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/admin/reservations" icon={Plus} label="New booking" />
          <QuickLink href="/admin/menu" icon={UtensilsCrossed} label="Add dish" />
          <QuickLink href="/admin/offers" icon={Tag} label="New offer" />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-sm font-body px-4 py-3">
          {error} If this is a new setup, check DATABASE_URL and that the database has been created (see docs/DATABASE_SETUP.md).
        </div>
      )}

      {stats && (!stats.switches.acceptingOrders || !stats.switches.acceptingReservations || !stats.switches.deliveryEnabled) && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 text-sm font-body px-4 py-3 flex items-center gap-2">
          <Power size={15} />
          {[!stats.switches.acceptingOrders && "Online orders are OFF", !stats.switches.deliveryEnabled && "Delivery is OFF",
            !stats.switches.acceptingReservations && "Online booking is OFF"].filter(Boolean).join(" · ")}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse border border-gray-200" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href}
                className={`bg-white border border-gray-200 border-l-4 ${card.colour} p-5 hover:shadow-md transition-shadow group`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-body mb-1">{card.label}</p>
                    <p className="font-display text-3xl text-charcoal-900">{card.value}</p>
                    <p className="text-xs text-gray-400 font-body mt-1">{card.sub}</p>
                  </div>
                  <div className={`p-2 ${card.urgent ? "bg-spice-50" : "bg-gray-50"}`}>
                    <Icon size={20} className={card.urgent ? "text-spice-500" : "text-gray-400"} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's bookings */}
          <div className="bg-white border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal-900 flex items-center gap-2"><Users size={18} className="text-gray-400" /> Today&apos;s bookings</h2>
              <Link href="/admin/reservations" className="text-xs text-spice-500 font-body hover:underline">Manage →</Link>
            </div>
            {stats.reservations.todaysList.length === 0 ? (
              <p className="text-sm text-gray-400 font-body">No bookings today yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.reservations.todaysList.map((b) => (
                  <li key={b.id} className="py-2.5 flex items-center gap-4 text-sm font-body">
                    <span className="w-20 font-display text-base text-charcoal-900">{formatSlot(b.time)}</span>
                    <span className="flex-1 text-charcoal-800">
                      {b.name} <span className="text-gray-400">× {b.partySize}</span>
                      {b.specialRequest && <span className="text-amber-700 text-xs ml-2">✦ {b.specialRequest}</span>}
                    </span>
                    {b.tableNumber && <span className="text-xs bg-charcoal-800 text-white px-1.5">T{b.tableNumber}</span>}
                    <span className="text-xs text-gray-500 w-20 text-right">{b.status.replace("_", "-").toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Switches + specials */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="font-display text-xl text-charcoal-900 mb-4 flex items-center gap-2"><Power size={18} className="text-gray-400" /> Service</h2>
              {([
                ["acceptingOrders", "Online orders"],
                ["deliveryEnabled", "Delivery"],
                ["acceptingReservations", "Online booking"],
              ] as const).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between py-2 text-sm font-body">
                  <span>{l}</span>
                  <button onClick={() => flip(k, !stats.switches[k])}
                    className={`text-xs px-3 py-1 font-medium ${stats.switches[k] ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                    {stats.switches[k] ? "ON" : "OFF"}
                  </button>
                </div>
              ))}
              <Link href="/admin/settings" className="text-xs text-gray-500 hover:text-spice-500 font-body flex items-center gap-1 mt-2"><Cog size={12} /> All settings</Link>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="font-display text-xl text-charcoal-900 mb-3 flex items-center gap-2"><Sparkles size={18} className="text-gold" /> Today&apos;s specials</h2>
              {stats.menu.specials.length === 0
                ? <p className="text-sm text-gray-400 font-body">None set.</p>
                : <ul className="text-sm font-body text-charcoal-800 space-y-1">{stats.menu.specials.map((s) => <li key={s.id}>{s.name}</li>)}</ul>}
              <Link href="/admin/menu" className="text-xs text-spice-500 font-body hover:underline mt-3 inline-block">Change specials →</Link>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white border border-gray-200 p-6 lg:col-span-3">
            <h2 className="font-display text-xl text-charcoal-900 mb-4 flex items-center gap-2"><Clock size={18} className="text-gray-400" /> Recent admin activity</h2>
            {stats.activity.length === 0 ? (
              <p className="text-sm text-gray-400 font-body">Changes made in the admin panel will appear here.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {stats.activity.map((a) => (
                  <li key={a.id} className="py-2 flex flex-wrap gap-x-3 text-sm font-body">
                    <span className="text-charcoal-800 flex-1 min-w-[200px]">{a.summary}</span>
                    <span className="text-xs text-gray-400">{a.actorEmail} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof Plus; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 text-xs font-body text-charcoal-800 hover:border-spice-400 hover:text-spice-600">
      <Icon size={13} /> {label} <ArrowRight size={12} className="text-gray-300" />
    </Link>
  );
}
