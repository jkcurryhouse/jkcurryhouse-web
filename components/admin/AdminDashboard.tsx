"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag, CalendarDays, Tag, UtensilsCrossed,
  TrendingUp, Clock, AlertCircle, ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Stats {
  orders:       { total: number; today: number; active: number };
  reservations: { total: number; today: number; pending: number };
  offers:       { active: number };
  revenue:      { today: number };
  menu:         { items: number };
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    {
      label:   "Today's Revenue",
      value:   formatPrice(stats.revenue.today),
      sub:     `${stats.orders.today} orders today`,
      icon:    TrendingUp,
      colour:  "border-gold",
      href:    "/admin/orders",
    },
    {
      label:   "Active Orders",
      value:   String(stats.orders.active),
      sub:     `${stats.orders.total} total orders`,
      icon:    ShoppingBag,
      colour:  stats.orders.active > 0 ? "border-spice-500" : "border-gray-300",
      href:    "/admin/orders",
      urgent:  stats.orders.active > 0,
    },
    {
      label:   "Pending Bookings",
      value:   String(stats.reservations.pending),
      sub:     `${stats.reservations.today} bookings today`,
      icon:    CalendarDays,
      colour:  stats.reservations.pending > 0 ? "border-amber-400" : "border-gray-300",
      href:    "/admin/reservations",
      urgent:  stats.reservations.pending > 0,
    },
    {
      label:   "Active Offers",
      value:   String(stats.offers.active),
      sub:     "Live discount codes",
      icon:    Tag,
      colour:  "border-blue-400",
      href:    "/admin/offers",
    },
    {
      label:   "Menu Items",
      value:   String(stats.menu.items),
      sub:     "Available dishes",
      icon:    UtensilsCrossed,
      colour:  "border-green-400",
      href:    "/admin/menu",
    },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-charcoal-900">Dashboard</h1>
        <p className="text-gray-500 text-sm font-body mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse border border-gray-200" />
          ))}
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
                  <div className={`p-2 ${card.urgent ? "bg-spice-50" : "bg-gray-50"} group-hover:bg-gray-100 transition-colors`}>
                    <Icon size={20} className={card.urgent ? "text-spice-500" : "text-gray-400"} />
                  </div>
                </div>
                {card.urgent && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-spice-600 font-body">
                    <AlertCircle size={12} /> Needs attention
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { href: "/admin/menu",         label: "Update Today's Special",  icon: UtensilsCrossed, sub: "Change the daily special dish" },
    { href: "/admin/menu",         label: "Add Menu Item",           icon: UtensilsCrossed, sub: "Add a new dish to the menu" },
    { href: "/admin/orders",       label: "View Live Orders",        icon: ShoppingBag,     sub: "See all active orders" },
    { href: "/admin/reservations", label: "Check Bookings",          icon: CalendarDays,    sub: "Review pending reservations" },
    { href: "/admin/offers",       label: "Create Offer",            icon: Tag,             sub: "Add a new discount code" },
  ];

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="font-display text-xl text-charcoal-900 mb-4">Quick Actions</h2>
      <ul className="space-y-1">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.label}>
              <Link href={a.href}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <Icon size={16} className="text-gray-400 group-hover:text-spice-500 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-800 group-hover:text-spice-600 transition-colors">{a.label}</p>
                  <p className="text-xs text-gray-400 font-body">{a.sub}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-spice-400 transition-colors shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="bg-white border border-gray-200 p-6">
      <h2 className="font-display text-xl text-charcoal-900 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-gray-400" /> Recent Activity
      </h2>
      <div className="space-y-4">
        {[
          { label: "Orders board",       href: "/admin/orders",       sub: "Monitor live & recent orders" },
          { label: "Reservations log",   href: "/admin/reservations", sub: "All bookings in date order" },
          { label: "Offer performance",  href: "/admin/offers",       sub: "See which codes are active" },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-spice-500 transition-colors group">
            <div>
              <p className="text-sm font-body font-medium text-charcoal-800 group-hover:text-spice-600 transition-colors">{item.label}</p>
              <p className="text-xs text-gray-400 font-body">{item.sub}</p>
            </div>
            <ArrowRight size={14} className="text-gray-300 group-hover:text-spice-400 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-body">
          Full activity log with timestamps coming in Phase 7 polish pass.
        </p>
      </div>
    </div>
  );
}
