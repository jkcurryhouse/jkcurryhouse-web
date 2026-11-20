"use client";
import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, MapPin, ShoppingBag, Tag } from "lucide-react";

interface CheckoutFormProps {
  clientSecret: string;
  orderId: string;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

export default function CheckoutForm({ clientSecret, orderId, onBack, onSuccess }: CheckoutFormProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const {
    mode, deliveryAddress, setAddress, total, items,
    deliveryFee, discount, subtotal, discountCode,
  } = useCart();
  const { toast } = useToast();

  const [name,  setName]  = useState(user?.name  ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);

  void clientSecret;

  const handlePay = async () => {
    if (!stripe || !elements) return;
    if (mode === "delivery" && !deliveryAddress.trim()) {
      toast("Please enter your delivery address.", "error");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast("Please fill in your name and email.", "error");
      return;
    }

    setPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: { billing_details: { name, email } },
          return_url: `${window.location.origin}/order/confirmation/${orderId}`,
        },
      });

      if (error) {
        toast(error.message ?? "Payment failed. Please try again.", "error");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm order in DB + send emails
        await fetch(`/api/orders/${orderId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone }),
        });

        // Mark personalised discount code as redeemed
        if (discountCode && user) {
          await fetch("/api/offers/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.userId, code: discountCode }),
          }).catch(() => {}); // non-blocking
        }

        // Trigger personalisation engine to assign any newly unlocked offers
        if (user) {
          fetch(`/api/offers/user?userId=${user.userId}`).catch(() => {});
        }

        onSuccess(orderId);
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-spice-500 transition-colors font-body">
        <ArrowLeft size={15} /> Back to menu
      </button>

      {/* Order summary */}
      <div className="bg-gray-50 border border-gray-200 p-5">
        <p className="font-display text-lg text-charcoal-900 mb-3">Order Summary</p>
        <ul className="space-y-1 mb-3">
          {items.map(({ item, quantity }) => (
            <li key={item.id} className="flex justify-between text-sm font-body text-gray-600">
              <span>{item.name} × {quantity}</span>
              <span>{formatPrice(item.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-200 pt-2 space-y-1">
          {mode === "delivery" && (
            <div className="flex justify-between text-sm font-body text-gray-500">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm font-body text-green-600">
              <span className="flex items-center gap-1"><Tag size={12} /> {discountCode}</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-lg text-charcoal-900 pt-1">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <p className="font-display text-lg text-charcoal-900">Your Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 000000" />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} hint="Order confirmation will be sent here." required />
      </div>

      {/* Delivery address */}
      {mode === "delivery" && (
        <div className="space-y-2">
          <p className="font-display text-lg text-charcoal-900 flex items-center gap-2">
            <MapPin size={18} className="text-spice-500" /> Delivery Address
          </p>
          <textarea value={deliveryAddress} onChange={(e) => setAddress(e.target.value)} rows={3}
            placeholder={"House number / flat, street name\nChippenham\nSN15 ..."}
            className="w-full px-4 py-3 font-body text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-spice-400 resize-none"
            required />
          <p className="text-xs text-gray-400 font-body">We deliver within the SN15 postcode area only. Estimated delivery: 40–55 min.</p>
        </div>
      )}

      {mode === "takeaway" && (
        <div className="bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <ShoppingBag size={16} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-medium text-green-800">Collect from JK Curryhouse</p>
            <p className="text-xs text-green-700 font-body">12 Market Place, Chippenham, SN15 1HA · Ready in 20–30 min</p>
          </div>
        </div>
      )}

      {/* Stripe payment */}
      <div className="space-y-2">
        <p className="font-display text-lg text-charcoal-900">Payment</p>
        <div className="border border-gray-200 p-4 bg-white">
          <PaymentElement />
        </div>
      </div>

      <Button onClick={handlePay} loading={paying} size="lg" className="w-full">
        Pay {formatPrice(total)}
      </Button>
      <p className="text-xs text-gray-400 font-body text-center">
        Secured by Stripe. Your card details are never stored by us.
      </p>
    </div>
  );
}
