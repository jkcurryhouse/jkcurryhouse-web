"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, Tag, X, ChevronRight, ShoppingBag } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface CartSidebarProps {
  onCheckout: () => void;
}

export default function CartSidebar({ onCheckout }: CartSidebarProps) {
  const {
    items, mode, increment, decrement, remove,
    subtotal, deliveryFee, discount, total, itemCount,
    discountCode, discountPercent, discountAmount,
    setDiscount, clearDiscount,
  } = useCart();
  const { toast } = useToast();
  const [codeInput, setCodeInput] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const applyCode = async () => {
    if (!codeInput.trim()) return;
    setCheckingCode(true);
    try {
      const res = await fetch(`/api/offers/validate?code=${encodeURIComponent(codeInput.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        toast(data.error ?? "Invalid or expired discount code.", "error");
        return;
      }
      setDiscount(data.code, data.amount ?? 0, data.percent ?? 0);
      toast(`Code applied — ${data.label}`, "success");
      setShowCodeInput(false);
      setCodeInput("");
    } catch {
      toast("Could not validate code. Please try again.", "error");
    } finally {
      setCheckingCode(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 text-center">
        <ShoppingBag size={36} className="text-gray-200 mx-auto mb-3" />
        <p className="font-display text-lg text-charcoal-900 mb-1">Your order is empty</p>
        <p className="text-gray-400 text-xs font-body">Add items from the menu to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 divide-y divide-gray-100">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <p className="font-display text-lg text-charcoal-900">
          Your Order
          <span className="ml-2 bg-spice-500 text-white text-xs font-body rounded-full px-2 py-0.5">{itemCount}</span>
        </p>
        <span className={`text-xs font-body px-2 py-1 ${mode === "delivery" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
          {mode === "delivery" ? "🚚 Delivery" : "🛍 Takeaway"}
        </span>
      </div>

      {/* Items */}
      <ul className="px-5 py-3 space-y-3">
        {items.map(({ item, quantity }) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-charcoal-800 truncate">{item.name}</p>
              <p className="text-xs text-gray-400 font-body">{formatPrice(item.price)} each</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => decrement(item.id)}
                className="w-6 h-6 border border-gray-200 flex items-center justify-center hover:border-spice-300 transition-colors"
              >
                <Minus size={11} />
              </button>
              <span className="w-6 text-center text-sm font-body font-bold">{quantity}</span>
              <button
                onClick={() => increment(item.id)}
                className="w-6 h-6 border border-gray-200 flex items-center justify-center hover:border-spice-300 transition-colors"
              >
                <Plus size={11} />
              </button>
            </div>
            <span className="text-sm font-body font-bold text-charcoal-900 w-14 text-right shrink-0">
              {formatPrice(item.price * quantity)}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="text-gray-300 hover:text-spice-500 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      {/* Discount code */}
      <div className="px-5 py-3">
        {discountCode ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
            <div className="flex items-center gap-2 text-green-700 text-xs font-body">
              <Tag size={13} />
              <span className="font-mono font-bold">{discountCode}</span>
              <span>
                {discountPercent > 0 ? `${discountPercent}% off` : `${formatPrice(discountAmount)} off`}
              </span>
            </div>
            <button onClick={clearDiscount} className="text-green-500 hover:text-green-700">
              <X size={14} />
            </button>
          </div>
        ) : showCodeInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && applyCode()}
              placeholder="DISCOUNT CODE"
              className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 focus:outline-none focus:border-spice-400 uppercase"
              autoFocus
            />
            <Button size="sm" onClick={applyCode} loading={checkingCode}>Apply</Button>
            <button onClick={() => setShowCodeInput(false)} className="text-gray-400 hover:text-gray-600 px-1">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCodeInput(true)}
            className="flex items-center gap-2 text-xs text-spice-500 hover:text-spice-600 font-body hover:underline"
          >
            <Tag size={13} /> Add discount code
          </button>
        )}
      </div>

      {/* Totals */}
      <div className="px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm font-body text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {mode === "delivery" && (
          <div className="flex justify-between text-sm font-body text-gray-600">
            <span>Delivery</span>
            <span>{deliveryFee === 0 ? <span className="text-green-600">Free</span> : formatPrice(deliveryFee)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm font-body text-green-600">
            <span>Discount</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-display text-lg text-charcoal-900 border-t border-gray-100 pt-2 mt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        {mode === "delivery" && subtotal < 25 && subtotal > 0 && (
          <p className="text-xs text-gray-400 font-body">
            Add {formatPrice(25 - subtotal)} more for free delivery
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 py-4">
        <Button onClick={onCheckout} className="w-full" size="lg">
          Checkout <ChevronRight size={16} />
        </Button>
        <p className="text-xs text-gray-400 font-body text-center mt-2">
          Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}
