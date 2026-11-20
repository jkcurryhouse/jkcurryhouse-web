"use client";
import { useState } from "react";
import { menuItems, categoryOrder, categoryLabels, ALLERGEN_LABELS, type MenuItem, type AllergenKey } from "@/lib/menu-data";
import { formatPrice } from "@/lib/utils";
import { Flame, Leaf, Star, AlertCircle } from "lucide-react";

export default function MenuClient() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showAllergenKey, setShowAllergenKey] = useState(false);

  const categories = ["all", ...categoryOrder];

  const filtered = activeCategory === "all"
    ? menuItems
    : menuItems.filter((i) => i.category === activeCategory);

  const grouped = categoryOrder.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-section-gradient py-20 text-center">
        <p className="eyebrow mb-3">Chippenham&apos;s Favourite</p>
        <h1 className="font-display text-5xl md:text-6xl text-white mb-3">Our Menu</h1>
        <div className="gold-divider" />
        <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm font-body">
          All dishes are freshly prepared to order. Please inform your server of any allergies.
        </p>
      </div>

      {/* Allergen notice */}
      <div className="bg-spice-50 border-y border-spice-200">
        <div className="container-pad py-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-spice-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-spice-800 font-body">
                <strong>Allergen Notice:</strong> Our kitchen handles all 14 major allergens. Dishes are labelled but cross-contamination cannot be guaranteed.
                Always speak to a member of staff if you have a severe allergy.{" "}
                <button onClick={() => setShowAllergenKey(!showAllergenKey)} className="underline text-spice-600 hover:text-spice-800">
                  {showAllergenKey ? "Hide" : "Show"} allergen key
                </button>
              </p>
              {showAllergenKey && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(ALLERGEN_LABELS).map(([key, val]) => (
                    <span key={key} className={`text-xs px-2 py-1 font-body ${val.color}`}>
                      {val.emoji} {val.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-pad py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-12 sticky top-16 bg-cream py-4 z-20 border-b border-gray-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 text-sm font-body tracking-wide uppercase transition-colors border ${
                activeCategory === cat
                  ? "bg-spice-500 text-white border-spice-500"
                  : "border-gray-300 text-gray-600 hover:border-spice-400 hover:text-spice-500"
              }`}
            >
              {cat === "all" ? "All Dishes" : categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Menu sections */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-display text-3xl md:text-4xl text-charcoal-900">
                {categoryLabels[cat]}
              </h2>
              {cat === "special" && (
                <span className="bg-saffron-500 text-charcoal-900 text-xs font-semibold px-3 py-1.5 font-body tracking-wider uppercase">
                  Changes Daily
                </span>
              )}
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((dish) => (
                <div
                  key={dish.id}
                  className="flex gap-4 p-5 border border-gray-200 hover:border-gold/50 hover:shadow-sm transition-all bg-white group"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg text-charcoal-900 group-hover:text-spice-500 transition-colors leading-tight">
                          {dish.name}
                        </h3>
                        {dish.chefPick && <Star size={13} className="text-gold fill-gold shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {dish.isSpicy && <Flame size={14} className="text-spice-500" />}
                        {dish.isVegan && <Leaf size={14} className="text-green-600" />}
                        {dish.isVegetarian && !dish.isVegan && (
                          <span className="text-green-600 font-bold text-xs font-body">V</span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed mb-3 font-body">{dish.description}</p>

                    {/* Allergens */}
                    {dish.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {dish.allergens.map((a) => {
                          const al = ALLERGEN_LABELS[a as AllergenKey];
                          return al ? (
                            <span key={a} className={`text-xs px-2 py-0.5 font-body ${al.color}`} title={al.label}>
                              {al.emoji} {al.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="font-display text-xl font-bold text-spice-500">
                      {formatPrice(dish.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="border border-gray-200 p-6 mt-8 bg-white">
          <p className="font-body text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Key</p>
          <div className="flex flex-wrap gap-5 text-sm text-gray-600 font-body">
            <span className="flex items-center gap-2"><Star size={13} className="text-gold fill-gold" /> Chef&apos;s Pick</span>
            <span className="flex items-center gap-2"><Flame size={14} className="text-spice-500" /> Contains Chilli / Hot</span>
            <span className="flex items-center gap-2"><Leaf size={14} className="text-green-600" /> Vegan</span>
            <span className="flex items-center gap-2 font-bold text-green-600">V Vegetarian</span>
          </div>
        </div>
      </div>
    </div>
  );
}
