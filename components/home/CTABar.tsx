import Link from "next/link";
import { UtensilsCrossed, ShoppingBag } from "lucide-react";

export default function CTABar() {
  return (
    <section className="bg-spice-500 py-16">
      <div className="container-pad">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center p-10 border-b md:border-b-0 md:border-r border-white/20">
            <UtensilsCrossed size={32} className="text-white/70 mb-4" />
            <h3 className="font-display text-2xl md:text-3xl text-white mb-3">Dine With Us</h3>
            <p className="text-white/80 text-sm font-body mb-6 leading-relaxed">
              Reserve your table for a special evening. Our warm, intimate dining room seats up to 60 guests.
            </p>
            <Link href="/reservations" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-spice-500">
              Reserve a Table
            </Link>
          </div>
          <div className="flex flex-col items-center text-center p-10">
            <ShoppingBag size={32} className="text-white/70 mb-4" />
            <h3 className="font-display text-2xl md:text-3xl text-white mb-3">Order at Home</h3>
            <p className="text-white/80 text-sm font-body mb-6 leading-relaxed">
              Delivery across Chippenham (SN15) or collect in 20–30 minutes. Order online any time.
            </p>
            <Link href="/order" className="inline-flex items-center justify-center gap-2 bg-white text-spice-500 px-8 py-3 font-body font-medium tracking-wide uppercase text-sm hover:bg-saffron-50 transition-colors">
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
