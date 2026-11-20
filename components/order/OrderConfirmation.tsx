"use client";
import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Clock, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Button from "@/components/ui/Button";

interface OrderDetails {
  orderId: string;
  ref: string;
  mode: "delivery" | "takeaway";
  items: { name: string; quantity: number; price: number }[];
  total: number;
  guestEmail: string;
}

export default function OrderConfirmation({ order }: { order: OrderDetails }) {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 px-6 py-5 flex items-start gap-4">
        <CheckCircle size={28} className="text-green-500 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-2xl text-green-800 mb-1">Order Placed!</h2>
          <p className="text-green-700 text-sm font-body">
            Confirmation sent to <strong>{order.guestEmail}</strong>.
          </p>
        </div>
      </div>

      {/* Order card */}
      <div className="bg-white border border-gray-200">
        <div className="bg-charcoal-900 px-6 py-4 flex items-center justify-between">
          <p className="font-display text-white text-lg">Your Order</p>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-body">Reference</p>
            <p className="text-gold font-display text-lg font-bold">#{order.ref}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Items */}
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm font-body">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="text-charcoal-800 font-medium">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-100 pt-3 flex justify-between font-display text-lg text-charcoal-900">
            <span>Total Paid</span>
            <span>£{order.total.toFixed(2)}</span>
          </div>

          {/* Mode */}
          <div className={`flex items-start gap-3 p-3 ${order.mode === "delivery" ? "bg-blue-50 border border-blue-100" : "bg-green-50 border border-green-100"}`}>
            {order.mode === "delivery"
              ? <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
              : <ShoppingBag size={16} className="text-green-600 shrink-0 mt-0.5" />
            }
            <div>
              <p className="text-sm font-body font-medium">
                {order.mode === "delivery" ? "Delivery — 40–55 min" : "Takeaway — ready in 20–30 min"}
              </p>
              {order.mode === "takeaway" && (
                <p className="text-xs text-gray-500 font-body">12 Market Place, Chippenham, SN15 1HA</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status tracker */}
      <div className="bg-white border border-gray-200 p-6">
        <p className="font-display text-lg text-charcoal-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gold" /> Order Status
        </p>
        <div className="space-y-3">
          {[
            { status: "Order Received",  done: true,  active: false },
            { status: "Confirmed by Kitchen", done: false, active: true },
            { status: order.mode === "delivery" ? "Out for Delivery" : "Ready to Collect", done: false, active: false },
            { status: order.mode === "delivery" ? "Delivered" : "Collected", done: false, active: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                step.done   ? "bg-green-500" :
                step.active ? "bg-saffron-500 animate-pulse" :
                              "bg-gray-200"
              }`} />
              <span className={`text-sm font-body ${
                step.done ? "text-green-700" : step.active ? "text-charcoal-800 font-medium" : "text-gray-400"
              }`}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 font-body mt-4">
          We&apos;ll call you on the number provided if there are any issues with your order.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/menu"><Button variant="outline">Browse Menu</Button></Link>
        <Link href="/"><Button variant="ghost">Back to Home</Button></Link>
      </div>
    </div>
  );
}
