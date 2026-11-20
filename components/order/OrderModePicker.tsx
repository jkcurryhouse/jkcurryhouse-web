"use client";
import { useCart, type OrderMode } from "@/context/CartContext";
import { Truck, ShoppingBag } from "lucide-react";

export default function OrderModePicker() {
  const { mode, setMode } = useCart();

  const options: { value: OrderMode; label: string; sub: string; icon: typeof Truck }[] = [
    { value: "delivery", label: "Delivery",  sub: "To your door · £2.99 (free over £25)", icon: Truck },
    { value: "takeaway", label: "Takeaway",  sub: "Collect in 20–30 min · No fee",        icon: ShoppingBag },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map(({ value, label, sub, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`flex flex-col items-center gap-2 p-4 border-2 transition-all text-center ${
            mode === value
              ? "border-spice-500 bg-spice-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <Icon size={22} className={mode === value ? "text-spice-500" : "text-gray-400"} />
          <span className={`font-display text-base ${mode === value ? "text-spice-600" : "text-charcoal-800"}`}>
            {label}
          </span>
          <span className="text-xs text-gray-500 font-body leading-tight">{sub}</span>
        </button>
      ))}
    </div>
  );
}
