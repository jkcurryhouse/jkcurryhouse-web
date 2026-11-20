"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ShoppingBag, Truck, Clock, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface OrderItem { menuItemId: string; quantity: number; price: number; }
interface Order {
  id: string; type: "DELIVERY"|"TAKEAWAY";
  status: string; total: number; guestEmail: string|null;
  items: OrderItem[]; createdAt: string;
}

const STATUS_COLOURS: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-purple-100 text-purple-700",
  READY:     "bg-green-100 text-green-700",
  DELIVERED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function OrderHistoryTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/orders?userId=${userId}`);
        const data = await res.json();
        setOrders(data.orders ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-8 flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-body text-sm">Loading your orders…</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="font-display text-xl text-charcoal-900">Order History</h2>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center">
          <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-display text-lg text-charcoal-900 mb-2">No orders yet</h3>
          <p className="text-gray-400 text-sm font-body mb-6">
            Your orders will appear here after your first online order.
          </p>
          <Link href="/order"><Button>Order Now</Button></Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {orders.map((order) => {
            const isOpen = expanded === order.id;
            const statusClass = STATUS_COLOURS[order.status] ?? "bg-gray-100 text-gray-600";
            return (
              <li key={order.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="shrink-0 text-gray-400">
                    {order.type === "DELIVERY" ? <Truck size={16} /> : <ShoppingBag size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-charcoal-800 text-sm">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 font-body flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {format(new Date(order.createdAt), "d MMM yyyy, HH:mm")}
                      &nbsp;·&nbsp;
                      {order.type === "DELIVERY" ? "Delivery" : "Takeaway"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2.5 py-1 font-body font-medium ${statusClass}`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                    <span className="font-display text-base text-charcoal-900">{formatPrice(order.total)}</span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                    <ul className="space-y-1 pt-3">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm font-body">
                          <span className="text-gray-600">{item.menuItemId} × {item.quantity}</span>
                          <span className="text-charcoal-800">{formatPrice(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between font-display text-base text-charcoal-900 border-t border-gray-200 mt-3 pt-3">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
