import Link from "next/link";
import { menuItems } from "@/lib/menu-data";
import { formatPrice } from "@/lib/utils";
import { Flame, Star } from "lucide-react";

export default function FeaturedDishes() {
  const featured = menuItems.filter((i) => i.chefPick).slice(0, 4);

  return (
    <section className="section-pad bg-cream">
      <div className="container-pad">
        <div className="text-center mb-14">
          <p className="eyebrow mb-3">From the Kitchen</p>
          <h2 className="font-display text-4xl md:text-5xl text-charcoal-900 mb-2">Chef&apos;s Selections</h2>
          <div className="gold-divider" />
          <p className="text-gray-500 mt-4 max-w-xl mx-auto font-body text-sm">
            Our head chef&apos;s personal picks — dishes that have defined JK Curryhouse over the years.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((dish) => (
            <div
              key={dish.id}
              className="group border border-gray-200 bg-white hover:border-gold/60 hover:shadow-lg transition-all duration-300"
            >
              {/* Placeholder image area */}
              <div
                className="h-44 relative overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1a1a1a, #0b0b0b)" }}
              >
                <span className="text-5xl opacity-30">🍛</span>
                {dish.category === "special" && (
                  <span className="absolute top-3 left-3 bg-saffron-500 text-charcoal-900 text-xs font-semibold px-3 py-1 font-body tracking-wide uppercase">
                    Today&apos;s Special
                  </span>
                )}
                <div className="absolute top-3 right-3 bg-charcoal-900/80 rounded-full p-1.5">
                  <Star size={12} className="text-gold fill-gold" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg text-charcoal-900 leading-tight group-hover:text-spice-500 transition-colors">
                    {dish.name}
                  </h3>
                  {dish.isSpicy && <Flame size={16} className="text-spice-500 shrink-0 mt-0.5" />}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-4 font-body line-clamp-3">
                  {dish.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-spice-500">
                    {formatPrice(dish.price)}
                  </span>
                  <div className="flex gap-1.5">
                    {dish.isVegan && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 font-body">Ve</span>
                    )}
                    {dish.isVegetarian && !dish.isVegan && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 font-body">V</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/menu" className="btn-primary">
            View Full Menu
          </Link>
        </div>
      </div>
    </section>
  );
}
