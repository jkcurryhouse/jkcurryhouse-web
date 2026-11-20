"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { menuItems, categoryOrder, categoryLabels, ALLERGEN_LABELS, type MenuItem, type AllergenKey } from "@/lib/menu-data";
import { formatPrice } from "@/lib/utils";
import { Plus, Minus, Flame, Leaf, Star } from "lucide-react";

export default function MenuSection() {
  const { items: cartItems, add, increment, decrement } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...categoryOrder];

  const filtered = activeCategory === "all"
    ? menuItems
    : menuItems.filter((i) => i.category === activeCategory);

  const grouped = categoryOrder.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const getCartQty = (id: string) =>
    cartItems.find((ci) => ci.item.id === id)?.quantity ?? 0;

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-xs font-body tracking-wide uppercase whitespace-nowrap shrink-0 transition-colors border ${
              activeCategory === cat
                ? "bg-spice-500 text-white border-spice-500"
                : "border-gray-300 text-gray-600 hover:border-spice-300 hover:text-spice-500"
            }`}
          >
            {cat === "all" ? "All" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Items by category */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-display text-xl text-charcoal-900">
                {categoryLabels[cat]}
              </h3>
              {cat === "special" && (
                <span className="bg-saffron-500 text-charcoal-900 text-xs font-semibold px-2 py-0.5 font-body uppercase tracking-wider">
                  Today
                </span>
              )}
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2">
              {items.map((dish) => {
                const qty = getCartQty(dish.id);
                return (
                  <div
                    key={dish.id}
                    className={`flex items-center gap-3 p-4 border transition-all ${
                      qty > 0 ? "border-spice-200 bg-spice-50/40" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    {/* Dish info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-body font-medium text-charcoal-800 text-sm leading-tight">{dish.name}</p>
                        {dish.chefPick && <Star size={11} className="text-gold fill-gold shrink-0" />}
                        {dish.isSpicy && <Flame size={11} className="text-spice-500 shrink-0" />}
                        {dish.isVegan && <Leaf size={11} className="text-green-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 font-body leading-snug line-clamp-2">{dish.description}</p>
                      {dish.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dish.allergens.slice(0, 3).map((a) => {
                            const al = ALLERGEN_LABELS[a as AllergenKey];
                            return al ? (
                              <span key={a} className="text-xs text-gray-400 font-body" title={al.label}>
                                {al.emoji}
                              </span>
                            ) : null;
                          })}
                          {dish.allergens.length > 3 && (
                            <span className="text-xs text-gray-400 font-body">+{dish.allergens.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price + qty control */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display text-base font-bold text-charcoal-900">
                        {formatPrice(dish.price)}
                      </span>
                      {qty === 0 ? (
                        <button
                          onClick={() => add(dish)}
                          className="w-8 h-8 bg-spice-500 text-white flex items-center justify-center hover:bg-spice-600 transition-colors"
                          aria-label={`Add ${dish.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => decrement(dish.id)}
                            className="w-8 h-8 border border-spice-300 text-spice-500 flex items-center justify-center hover:bg-spice-50 transition-colors"
                            aria-label="Remove one"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center font-body font-bold text-charcoal-900 text-sm">{qty}</span>
                          <button
                            onClick={() => increment(dish.id)}
                            className="w-8 h-8 bg-spice-500 text-white flex items-center justify-center hover:bg-spice-600 transition-colors"
                            aria-label="Add one more"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
