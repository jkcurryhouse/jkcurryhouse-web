"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { formatDiscount, daysUntilExpiry, type OfferRecord } from "@/lib/offers";
import { format } from "date-fns";
import {
  Tag, Clock, Lock, Sparkles, Copy, ChevronRight,
  CheckCircle, ShoppingBag, Star, Gift
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function OffersClient() {
  const { user }                    = useAuth();
  const { setDiscount, discountCode } = useCart();
  const { toast }                   = useToast();

  const [general,  setGeneral]  = useState<OfferRecord[]>([]);
  const [personal, setPersonal] = useState<OfferRecord[]>([]);
  const [stats,    setStats]    = useState<{ completedOrders: number; totalSpend: number } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [applied,  setApplied]  = useState<string | null>(discountCode || null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      // General offers (public)
      const gRes  = await fetch(user ? `/api/offers?userId=${user.userId}` : "/api/offers");
      const gData = await gRes.json();
      setGeneral(gData.general ?? []);
      setPersonal(gData.personal ?? []);

      // Trigger personalisation engine for logged-in users
      if (user) {
        const pRes  = await fetch(`/api/offers/user?userId=${user.userId}`);
        const pData = await pRes.json();
        setStats(pData.stats);
        if ((pData.offers ?? []).length > 0) setPersonal(pData.offers);
      }
    } catch {
      toast("Could not load offers.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const handleApply = async (offer: OfferRecord) => {
    if (applied === offer.code) {
      toast("This code is already applied to your order.", "info");
      return;
    }
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
      <div className="min-h-screen bg-cream pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-spice-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-body">Loading offers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-section-gradient py-20 text-center relative overflow-hidden">
        <div className="absolute inset-6 border border-gold/10 pointer-events-none hidden md:block" />
        <div className="relative z-10">
          <p className="eyebrow mb-3">Save More, Eat Well</p>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-3">Offers & Deals</h1>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-4 max-w-lg mx-auto text-sm font-body">
            General deals for everyone, plus exclusive rewards for loyal customers.
          </p>
        </div>
      </div>

      <div className="container-pad py-14 max-w-5xl">

        {/* Loyalty progress for logged-in users */}
        {user && stats && (
          <LoyaltyProgress stats={stats} />
        )}

        {/* Not logged in nudge */}
        {!user && (
          <div className="mb-10 border border-gold/30 bg-saffron-50 px-6 py-5 flex items-start gap-4">
            <Lock size={20} className="text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-lg text-charcoal-900 mb-1">Unlock personalised offers</p>
              <p className="text-gray-600 text-sm font-body mb-3">
                Create an account to earn loyalty rewards based on your order history. The more you order, the better the deals.
              </p>
              <div className="flex gap-3">
                <Link href="/auth/register" className="btn-primary !py-2 !px-5 !text-xs">Create Account</Link>
                <Link href="/auth/login"    className="btn-outline !py-2 !px-5 !text-xs !border-charcoal-700 !text-charcoal-700 hover:!bg-charcoal-700 hover:!text-white">Sign In</Link>
              </div>
            </div>
          </div>
        )}

        {/* Personalised offers */}
        {user && (
          <section className="mb-14">
            <SectionHeader
              icon={<Sparkles size={20} className="text-gold" />}
              title="Your Personal Offers"
              sub={personal.length > 0
                ? `${personal.length} exclusive offer${personal.length > 1 ? "s" : ""} unlocked for you`
                : "Keep ordering to unlock exclusive deals"}
            />
            {personal.length === 0 ? (
              <PersonalEmptyState stats={stats} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personal.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isPersonal
                    applied={applied === offer.code}
                    onApply={() => handleApply(offer)}
                    onCopy={() => handleCopy(offer.code)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* General offers */}
        <section>
          <SectionHeader
            icon={<Tag size={20} className="text-spice-500" />}
            title="Current Offers"
            sub="Available to everyone — no account needed"
          />
          {general.length === 0 ? (
            <div className="border border-dashed border-gray-200 py-12 text-center">
              <Tag size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-body text-sm">No general offers available right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {general.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isPersonal={false}
                  applied={applied === offer.code}
                  onApply={() => handleApply(offer)}
                  onCopy={() => handleCopy(offer.code)}
                />
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <HowItWorks />
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h2 className="font-display text-2xl text-charcoal-900">{title}</h2>
        <p className="text-gray-500 text-sm font-body mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function OfferCard({
  offer, isPersonal, applied, onApply, onCopy,
}: {
  offer: OfferRecord;
  isPersonal: boolean;
  applied: boolean;
  onApply: () => void;
  onCopy: () => void;
}) {
  const days     = daysUntilExpiry(offer.expiresAt);
  const expiring = days <= 3 && days >= 0;
  const label    = formatDiscount(offer);
  const expDate  = format(new Date(offer.expiresAt), "d MMM yyyy");

  return (
    <div className={`relative border bg-white overflow-hidden transition-shadow hover:shadow-md ${
      isPersonal ? "border-gold/40" : "border-gray-200"
    } ${applied ? "ring-2 ring-green-400" : ""}`}>
      {/* Top colour bar */}
      <div className={`h-1.5 w-full ${isPersonal ? "bg-gradient-to-r from-gold to-saffron-400" : "bg-spice-500"}`} />

      {/* Badges */}
      <div className="absolute top-4 right-4 flex gap-1.5">
        {isPersonal && (
          <span className="bg-gold/10 text-gold border border-gold/30 text-xs px-2 py-0.5 font-body flex items-center gap-1">
            <Star size={10} className="fill-gold" /> Exclusive
          </span>
        )}
        {expiring && (
          <span className="bg-spice-50 text-spice-600 border border-spice-200 text-xs px-2 py-0.5 font-body flex items-center gap-1">
            <Clock size={10} /> {days === 0 ? "Last day!" : `${days}d left`}
          </span>
        )}
        {applied && (
          <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 font-body flex items-center gap-1">
            <CheckCircle size={10} /> Applied
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Discount callout */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display text-3xl font-bold text-spice-500">{label}</span>
        </div>
        <p className="font-display text-lg text-charcoal-900 mb-1">{offer.title}</p>
        <p className="text-gray-500 text-sm font-body leading-relaxed mb-4">{offer.description}</p>

        {/* Code + actions */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 border-dashed px-4 py-2 flex-1">
            <Tag size={13} className="text-gray-400 shrink-0" />
            <span className="font-mono font-bold text-charcoal-900 tracking-widest text-sm">{offer.code}</span>
          </div>
          <button
            onClick={onCopy}
            className="p-2.5 border border-gray-200 text-gray-500 hover:text-charcoal-800 hover:border-gray-300 transition-colors"
            title="Copy code"
          >
            <Copy size={15} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400 font-body flex items-center gap-1">
            <Clock size={11} /> Expires {expDate}
          </p>
          {applied ? (
            <Link href="/order" className="flex items-center gap-1.5 text-sm text-green-600 font-body font-medium hover:underline">
              Go to order <ChevronRight size={14} />
            </Link>
          ) : (
            <Button size="sm" onClick={onApply}>
              Apply to Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Milestones for loyalty progress
const MILESTONES = [
  { orders: 1,  spend: 0,  reward: "First order discount",       icon: Gift    },
  { orders: 3,  spend: 40, reward: "10% off your next order",    icon: Tag     },
  { orders: 5,  spend: 80, reward: "Free delivery for a month",  icon: ShoppingBag },
  { orders: 10, spend: 150,reward: "VIP 20% loyalty reward",     icon: Star    },
];

function LoyaltyProgress({ stats }: { stats: { completedOrders: number; totalSpend: number } }) {
  const nextMilestone = MILESTONES.find(
    (m) => stats.completedOrders < m.orders || stats.totalSpend < m.spend
  );
  const currentLevel = MILESTONES.filter(
    (m) => stats.completedOrders >= m.orders && stats.totalSpend >= m.spend
  ).length;

  return (
    <div className="mb-12 bg-white border border-gray-200 p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow mb-1">Your Loyalty Status</p>
          <h2 className="font-display text-2xl text-charcoal-900">
            {currentLevel === 0 ? "Welcome" : currentLevel === 1 ? "Regular" : currentLevel === 2 ? "Loyal" : "VIP"} Member
          </h2>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-spice-500">{stats.completedOrders}</p>
          <p className="text-xs text-gray-400 font-body">orders placed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 font-body mb-1.5">
          <span>Level {currentLevel}</span>
          <span>Level {Math.min(currentLevel + 1, MILESTONES.length)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-spice-500 to-saffron-400 transition-all duration-700"
            style={{ width: `${Math.min((currentLevel / MILESTONES.length) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MILESTONES.map((m, i) => {
          const unlocked = stats.completedOrders >= m.orders && stats.totalSpend >= m.spend;
          const Icon = m.icon;
          return (
            <div key={i} className={`p-3 border text-center transition-colors ${
              unlocked ? "border-gold/40 bg-saffron-50" : "border-gray-100 bg-gray-50"
            }`}>
              <Icon size={18} className={`mx-auto mb-1.5 ${unlocked ? "text-gold" : "text-gray-300"}`} />
              <p className={`text-xs font-body leading-tight ${unlocked ? "text-charcoal-800" : "text-gray-400"}`}>
                {m.reward}
              </p>
              {!unlocked && (
                <p className="text-xs text-gray-400 font-body mt-1">
                  {m.orders} orders · £{m.spend}+
                </p>
              )}
              {unlocked && (
                <p className="text-xs text-green-600 font-body mt-1 flex items-center gap-0.5 justify-center">
                  <CheckCircle size={10} /> Unlocked
                </p>
              )}
            </div>
          );
        })}
      </div>

      {nextMilestone && (
        <p className="text-xs text-gray-500 font-body mt-4 text-center">
          Next reward: <strong>{nextMilestone.reward}</strong> — reach {nextMilestone.orders} orders and £{nextMilestone.spend} spend
        </p>
      )}
    </div>
  );
}

function PersonalEmptyState({ stats }: { stats: { completedOrders: number; totalSpend: number } | null }) {
  return (
    <div className="border border-dashed border-gold/30 bg-saffron-50/50 py-10 text-center mb-8">
      <Gift size={32} className="text-gold/50 mx-auto mb-3" />
      <p className="font-display text-lg text-charcoal-900 mb-1">No personal offers yet</p>
      <p className="text-gray-500 text-sm font-body max-w-sm mx-auto">
        {stats && stats.completedOrders === 0
          ? "Place your first order to start earning loyalty rewards."
          : `You've made ${stats?.completedOrders ?? 0} order${stats?.completedOrders !== 1 ? "s" : ""}. Keep going to unlock exclusive deals!`}
      </p>
      <Link href="/order" className="inline-flex items-center gap-2 mt-4 text-sm text-spice-500 font-body hover:underline">
        Order now <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <h2 className="font-display text-2xl text-charcoal-900 mb-8 text-center">How Loyalty Rewards Work</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { step: "1", title: "Create an Account", body: "Sign up free in under a minute. Your order history is tracked automatically." },
          { step: "2", title: "Order & Earn",       body: "Every completed order counts toward your next loyalty milestone." },
          { step: "3", title: "Unlock & Redeem",    body: "Exclusive offers appear in your account. Apply them in one click at checkout." },
        ].map((s) => (
          <div key={s.step} className="text-center">
            <div className="w-10 h-10 bg-spice-500 text-white font-display text-lg font-bold flex items-center justify-center mx-auto mb-4">
              {s.step}
            </div>
            <h3 className="font-display text-lg text-charcoal-900 mb-2">{s.title}</h3>
            <p className="text-gray-500 text-sm font-body leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
