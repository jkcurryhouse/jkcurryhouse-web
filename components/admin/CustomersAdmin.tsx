"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Search, Download, UserCheck, ShieldOff, MailX, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { authFetch } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { StatCard, Spinner, downloadCsv } from "./ui";

interface Customer {
  key: string; name: string; email: string; phone: string; hasAccount: boolean;
  orders: number; spend: number; bookings: number; noShows: number; lastSeen: string; optedOut: boolean;
}

export default function CustomersAdmin() {
  const { toast } = useToast();
  const [rows, setRows]       = useState<Customer[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [sort, setSort]       = useState<"recent" | "spend" | "orders">("recent");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.customers); setTotal(data.total);
    } catch (e) {
      toast((e as Error).message || "Failed to load customers.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, toast]);

  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  const erase = async (c: Customer) => {
    if (!c.email) { toast("Erasure works by email address — this record has none.", "error"); return; }
    const typed = prompt(
      `GDPR erasure for ${c.email}\n\nThis anonymises their name, contact details and address on all orders and bookings. ` +
      `Order amounts stay for your accounts. This cannot be undone.\n\nType the email address to confirm:`);
    if (typed?.trim().toLowerCase() !== c.email) { if (typed != null) toast("Email didn't match — nothing erased.", "info"); return; }
    try {
      const res  = await authFetch("/api/admin/customers/erase", { method: "POST", body: JSON.stringify({ email: c.email, confirm: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Erased: ${data.orders} order(s), ${data.bookings} booking(s). ${c.hasAccount ? data.note : ""}`, "success");
      load();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const sorted = [...rows].sort((a, b) =>
    sort === "spend" ? b.spend - a.spend : sort === "orders" ? b.orders - a.orders : b.lastSeen.localeCompare(a.lastSeen));

  const exportCsv = () => downloadCsv(`customers-${format(new Date(), "yyyy-MM-dd")}.csv`, sorted.map((c) => ({
    name: c.name, email: c.email, phone: c.phone, account: c.hasAccount ? "yes" : "no",
    orders: c.orders, spend: c.spend.toFixed(2), bookings: c.bookings, no_shows: c.noShows,
    last_seen: c.lastSeen.slice(0, 10), unsubscribed: c.optedOut ? "yes" : "no",
  })));

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Customers" value={total} />
        <StatCard label="With an account" value={rows.filter((r) => r.hasAccount).length} colour="border-gold" />
        <StatCard label="Repeat customers" value={rows.filter((r) => r.orders + r.bookings > 1).length} colour="border-green-400" />
        <StatCard label="Unsubscribed" value={rows.filter((r) => r.optedOut).length} colour="border-gray-300" />
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-spice-400 font-body w-64" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="px-3 py-2 border border-gray-300 bg-white text-sm font-body">
          <option value="recent">Most recent</option>
          <option value="spend">Highest spend</option>
          <option value="orders">Most orders</option>
        </select>
        <Button variant="ghost" size="sm" onClick={exportCsv} disabled={!rows.length}><Download size={13} /> CSV</Button>
      </div>

      {loading ? <Spinner label="Loading customers…" /> : sorted.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <Users size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-body text-sm">No customers yet — they appear after their first order or booking.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-right px-4 py-3">Orders</th>
                <th className="text-right px-4 py-3">Spend</th>
                <th className="text-right px-4 py-3">Bookings</th>
                <th className="text-left px-4 py-3">Last seen</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((c) => (
                <tr key={c.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal-800 flex items-center gap-1.5">
                      {c.name || "—"}
                      {c.hasAccount && <UserCheck size={13} className="text-gold" aria-label="Has account" />}
                      {c.optedOut && <MailX size={13} className="text-gray-400" aria-label="Unsubscribed" />}
                    </p>
                    <p className="text-xs text-gray-500">{[c.email, c.phone].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{c.orders}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(c.spend)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.bookings}{c.noShows > 0 && <span className="text-purple-600 text-xs ml-1">({c.noShows} no-show)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(c.lastSeen), "d MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => erase(c)} title="GDPR erase" className="text-gray-300 hover:text-red-600 p-1">
                      <ShieldOff size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
