"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { formatDiscount, daysUntilExpiry, type OfferRecord } from "@/lib/offers";
import { format } from "date-fns";
import { Tag, Clock, CheckCircle, Copy, ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function OffersTab({ userId }: { userId: string }) {
  const { setDiscount, discountCode } = useCart();
  const { toast }                     = useToast();
  const [offers,  setOffers]  = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<string | null>(discountCode || null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`/api/offers/user?userId=${userId}`);
        const data = await res.json();
        setOffers(data.offers ?? []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleApply = (offer: OfferRecord) => {
    const percent = offer.isPercent ? offer.discount : 0;
    const amount  = offer.isPercent ? 0 : offer.discount;
    setDiscount(offer.code, amount, percent);
    setApplied(offer.code);
    toast(`${formatDiscount(offer)} applied to your order!`, "success");
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast(`Copied ${code}`, "info"));
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-8 flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-body text-sm">Loading your offers…</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-display text-xl text-charcoal-900">My Offers</h2>
        <Link href="/offers" className="text-xs text-spice-500 hover:underline font-body">
          See all offers →
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="p-8 text-center">
          <Gift size={36} className="text-gray-200 mx-auto mb-4" />
          <p className="font-display text-lg text-charcoal-900 mb-2">No personal offers yet</p>
          <p className="text-gray-400 text-sm font-body mb-5 max-w-xs mx-auto">
            Complete orders to unlock loyalty rewards. The more you order, the better the deals.
          </p>
          <Link href="/order"><Button size="sm">Order Now</Button></Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {offers.map((offer) => {
            const days     = daysUntilExpiry(offer.expiresAt);
            const expiring = days <= 3 && days >= 0;
            const isApplied = applied === offer.code;
            return (
              <li key={offer.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-lg text-spice-500">{formatDiscount(offer)}</span>
                    {expiring && (
                      <span className="text-xs bg-spice-50 text-spice-600 border border-spice-200 px-2 py-0.5 font-body flex items-center gap-1">
                        <Clock size={10} /> {days === 0 ? "Last day" : `${days}d left`}
                      </span>
                    )}
                    {isApplied && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 font-body flex items-center gap-1">
                        <CheckCircle size={10} /> Applied
                      </span>
                    )}
                  </div>
                  <p className="font-body font-medium text-charcoal-800 text-sm">{offer.title}</p>
                  <p className="text-gray-400 text-xs font-body mt-0.5">{offer.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs text-charcoal-700 bg-gray-100 px-2 py-1 flex items-center gap-1.5">
                      <Tag size={10} className="text-gray-400" />{offer.code}
                    </span>
                    <button onClick={() => handleCopy(offer.code)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Copy size={12} />
                    </button>
                    <span className="text-xs text-gray-400 font-body">Expires {format(new Date(offer.expiresAt), "d MMM yyyy")}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isApplied ? (
                    <Link href="/order" className="flex items-center gap-1 text-sm text-green-600 font-body font-medium hover:underline">
                      Go to order <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <Button size="sm" onClick={() => handleApply(offer)}>Apply</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
