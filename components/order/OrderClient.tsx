"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import OrderModePicker from "./OrderModePicker";
import MenuSection from "./MenuSection";
import CartSidebar from "./CartSidebar";
import CheckoutForm from "./CheckoutForm";
import OrderConfirmation from "./OrderConfirmation";
import { ShoppingBag } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder"
);

type Step = "browse" | "checkout" | "confirmed";

interface PendingOrder {
  orderId: string;
  clientSecret: string;
}

interface ConfirmedOrder {
  orderId: string;
  ref: string;
  mode: "delivery" | "takeaway";
  items: { name: string; quantity: number; price: number }[];
  total: number;
  guestEmail: string;
}

export default function OrderClient() {
  const { items, mode, total, subtotal, deliveryFee, discount, discountCode, deliveryAddress, itemCount } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("browse");
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Keep mobile cart badge updated
  useEffect(() => {
    if (itemCount === 0) setMobileCartOpen(false);
  }, [itemCount]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast("Add some items before checking out.", "error");
      return;
    }
    if (mode === "delivery" && !deliveryAddress.trim()) {
      toast("Enter your delivery address before proceeding.", "error");
      return;
    }

    setCreatingIntent(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          items: items.map(({ item, quantity }) => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity,
          })),
          subtotal,
          deliveryFee,
          discount,
          discountCode: discountCode || undefined,
          total,
          deliveryAddress: mode === "delivery" ? deliveryAddress : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not start checkout. Please try again.", "error");
        return;
      }

      setPending({ orderId: data.orderId, clientSecret: data.clientSecret });
      setStep("checkout");
    } catch {
      toast("Could not connect to payment service. Please try again.", "error");
    } finally {
      setCreatingIntent(false);
    }
  };

  const handleSuccess = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setConfirmed(data.order);
      setStep("confirmed");
    } catch {
      setStep("confirmed");
      setConfirmed({
        orderId,
        ref: orderId.slice(-8).toUpperCase(),
        mode,
        items: items.map(({ item, quantity }) => ({ name: item.name, quantity, price: item.price })),
        total,
        guestEmail: "",
      });
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-section-gradient py-16 text-center relative overflow-hidden">
        <div className="absolute inset-6 border border-gold/10 pointer-events-none hidden md:block" />
        <div className="relative z-10">
          <p className="eyebrow mb-3">Chippenham · SN15</p>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-3">Order Online</h1>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-4 text-sm font-body">
            Delivery across SN15 · Takeaway from 12 Market Place · Secure payment via Stripe
          </p>
        </div>
      </div>

      <div className="container-pad py-10 max-w-6xl">
        {step === "confirmed" && confirmed ? (
          <OrderConfirmation order={confirmed} />
        ) : (
          <>
            {/* Order mode */}
            {step === "browse" && (
              <div className="max-w-sm mb-8">
                <p className="font-body text-sm font-medium text-charcoal-800 mb-2">How would you like to receive your order?</p>
                <OrderModePicker />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Menu or Checkout */}
              <div className="lg:col-span-2">
                {step === "browse" ? (
                  <MenuSection />
                ) : (
                  pending && (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: pending.clientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: {
                            colorPrimary: "#8a6416",
                            fontFamily: "Inter, system-ui, sans-serif",
                            borderRadius: "0px",
                          },
                        },
                      }}
                    >
                      <CheckoutForm
                        clientSecret={pending.clientSecret}
                        orderId={pending.orderId}
                        onBack={() => setStep("browse")}
                        onSuccess={handleSuccess}
                      />
                    </Elements>
                  )
                )}
              </div>

              {/* Right: Cart */}
              <div className="hidden lg:block">
                <div className="sticky top-20">
                  <CartSidebar
                    onCheckout={handleCheckout}
                  />
                  {creatingIntent && (
                    <p className="text-center text-xs text-gray-400 font-body mt-2 flex items-center justify-center gap-1">
                      <span className="w-3 h-3 border border-spice-400 border-t-transparent rounded-full animate-spin inline-block" />
                      Setting up payment…
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile cart FAB */}
            {step === "browse" && itemCount > 0 && (
              <div className="fixed bottom-6 left-4 right-4 lg:hidden z-40">
                {mobileCartOpen ? (
                  <div className="bg-white border border-gray-200 shadow-2xl rounded-none max-h-[70vh] overflow-y-auto">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                      <p className="font-display text-lg">Your Order</p>
                      <button onClick={() => setMobileCartOpen(false)} className="text-gray-400 text-sm font-body">Close</button>
                    </div>
                    <CartSidebar onCheckout={() => { setMobileCartOpen(false); handleCheckout(); }} />
                  </div>
                ) : (
                  <button
                    onClick={() => setMobileCartOpen(true)}
                    className="w-full bg-spice-500 text-white flex items-center justify-between px-6 py-4 shadow-xl"
                  >
                    <span className="flex items-center gap-2 font-body font-medium">
                      <ShoppingBag size={18} />
                      View Order ({itemCount} item{itemCount !== 1 ? "s" : ""})
                    </span>
                    <span className="font-display text-lg">£{total.toFixed(2)}</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
