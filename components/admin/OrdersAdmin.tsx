"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  ShoppingBag, Truck, Clock, CheckCircle, XCircle,
  AlertCircle, ChefHat, PackageCheck, RefreshCw, Bike,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";

interface OrderItem { menuItemId: string; quantity: number; price: number; }
interface Order {
  id: string; type: "DELIVERY" | "TAKEAWAY";
  status: "PENDING"|"CONFIRMED"|"PREPARING"|"READY"|"DELIVERED"|"CANCELLED";
  total: number; guestEmail: string | null; address: string | null;
  items: OrderItem[]; createdAt: string;
}

const STATUS_CONFIG = {
  PENDING:   { bg: "bg-amber-100 text-amber-800",  icon: AlertCircle,  label: "Pending",   next: "CONFIRMED"  },
  CONFIRMED: { bg: "bg-blue-100 text-blue-800",    icon: CheckCircle,  label: "Confirmed", next: "PREPARING"  },
  PREPARING: { bg: "bg-purple-100 text-purple-800",icon: ChefHat,      label: "Preparing", next: "READY"      },
  READY:     { bg: "bg-green-100 text-green-800",  icon: PackageCheck, label: "Ready",     next: "DELIVERED"  },
  DELIVERED: { bg: "bg-gray-100 text-gray-600",    icon: CheckCircle,  label: "Delivered", next: null         },
  CANCELLED: { bg: "bg-red-100 text-red-700",      icon: XCircle,      label: "Cancelled", next: null         },
} as const;

const NEXT_LABEL: Record<string, string> = {
  CONFIRMED: "Mark Confirmed", PREPARING: "Mark Preparing",
  READY: "Mark Ready", DELIVERED: "Mark Delivered",
};

export default function OrdersAdmin() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType)   params.set("type", filterType);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(`Order marked ${status.toLowerCase()}.`, "success");
      fetchOrders();
    } catch {
      toast("Could not update order.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats
  const activeOrders   = orders.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status));
  const totalRevenue   = orders.filter((o) => o.status !== "CANCELLED").reduce((s,o) => s + o.total, 0);
  const deliveryCount  = orders.filter((o) => o.type === "DELIVERY" && o.status !== "CANCELLED").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Orders",  value: activeOrders.length,          colour: "border-spice-500" },
          { label: "Total Orders",   value: orders.length,                colour: "border-charcoal-700" },
          { label: "Delivery",       value: deliveryCount,                colour: "border-blue-400" },
          { label: "Revenue (today)",value: formatPrice(totalRevenue),     colour: "border-gold" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border-l-4 ${s.colour} border border-gray-100 p-4`}>
            <p className="font-display text-2xl text-charcoal-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-charcoal-800">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400">
            <option value="">All statuses</option>
            {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-charcoal-800">Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-300 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400">
            <option value="">All types</option>
            <option value="DELIVERY">Delivery</option>
            <option value="TAKEAWAY">Takeaway</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="self-end">
          <RefreshCw size={14} /> Refresh
        </Button>
        {(filterStatus || filterType) && (
          <button onClick={() => { setFilterStatus(""); setFilterType(""); }}
            className="text-sm text-gray-400 hover:text-gray-600 font-body self-end pb-3">
            Clear
          </button>
        )}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-12">
          <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-body text-sm">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <ShoppingBag size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-body text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg  = STATUS_CONFIG[order.status];
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="bg-white border border-gray-200 p-5 flex flex-col sm:flex-row gap-4">
                {/* Left: type + time */}
                <div className="shrink-0 text-center sm:text-left sm:w-24">
                  <div className="flex items-center gap-1 justify-center sm:justify-start text-gray-500 mb-1">
                    {order.type === "DELIVERY" ? <Truck size={14} /> : <ShoppingBag size={14} />}
                    <span className="text-xs font-body capitalize">{order.type.toLowerCase()}</span>
                  </div>
                  <p className="font-display text-lg text-charcoal-900">#{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400 font-body flex items-center gap-1 justify-center sm:justify-start">
                    <Clock size={10} />
                    {format(new Date(order.createdAt), "HH:mm")}
                  </p>
                </div>

                {/* Middle: items + customer */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-body mb-1">{order.guestEmail ?? "Guest"}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {order.items.map((item, i) => (
                      <span key={i} className="text-xs font-body text-charcoal-700">
                        {item.menuItemId} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  {order.address && (
                    <p className="text-xs text-gray-400 font-body mt-1 truncate">{order.address}</p>
                  )}
                </div>

                {/* Right: total + status + actions */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <p className="font-display text-lg text-charcoal-900">{formatPrice(order.total)}</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-body font-medium ${cfg.bg}`}>
                    <Icon size={12} />{cfg.label}
                  </span>
                  <div className="flex gap-2">
                    {cfg.next && (
                      <button
                        onClick={() => updateStatus(order.id, cfg.next!)}
                        disabled={updatingId === order.id}
                        className="text-xs text-spice-500 hover:text-spice-700 font-body hover:underline disabled:opacity-50"
                      >
                        {updatingId === order.id ? "…" : NEXT_LABEL[cfg.next]}
                      </button>
                    )}
                    {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                      <button
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        disabled={updatingId === order.id}
                        className="text-xs text-red-500 hover:text-red-700 font-body hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
