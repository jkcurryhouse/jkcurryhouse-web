import type { Metadata } from "next";
import { ALLERGEN_LABELS } from "@/lib/menu-data";
import { AlertTriangle, Phone, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Allergen Information | JK Curryhouse Chippenham",
  description:
    "Full allergen information for all dishes at JK Curryhouse, Chippenham. All 14 major UK allergens listed. SN15 1HA.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk/allergens" },
};

const ALL_ALLERGENS = [
  ...Object.entries(ALLERGEN_LABELS),
  ["lupin",    { label: "Lupin",                    emoji: "🌸", color: "bg-pink-50 text-pink-700"   }],
  ["molluscs", { label: "Molluscs",                 emoji: "🦪", color: "bg-blue-50 text-blue-700"   }],
  ["sulphites",{ label: "Sulphur Dioxide & Sulphites", emoji: "🍷", color: "bg-purple-50 text-purple-700" }],
] as [string, { label: string; emoji: string; color: string }][];

export default function AllergensPage() {
  return (
    <div className="pt-24 min-h-screen bg-cream">

      {/* Header */}
      <div className="bg-section-gradient py-16 text-center relative overflow-hidden">
        <div className="absolute inset-6 border border-gold/10 pointer-events-none hidden md:block" />
        <div className="relative z-10 container-pad">
          <p className="eyebrow mb-3">Important Information</p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">Allergen Information</h1>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm font-body">
            Please read before ordering. We take allergens seriously and are happy to discuss your requirements.
          </p>
        </div>
      </div>

      <div className="container-pad py-12 max-w-4xl">

        {/* Critical warning */}
        <div className="bg-spice-50 border-l-4 border-spice-500 p-5 mb-10 flex items-start gap-4">
          <AlertTriangle size={22} className="text-spice-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg text-spice-800 mb-2">Please Read Before Ordering</h2>
            <p className="text-spice-700 text-sm font-body leading-relaxed mb-3">
              Our kitchen handles all 14 major allergens recognised by UK food law. While we take every
              precaution, <strong>we cannot guarantee that any dish is completely free from any allergen</strong> due
              to the risk of cross-contamination during preparation.
            </p>
            <p className="text-spice-700 text-sm font-body leading-relaxed">
              If you have a <strong>severe allergy or intolerance</strong>, please speak to a member of staff
              before ordering. Do not rely solely on the labelling — always tell your server.
            </p>
          </div>
        </div>

        {/* Contact first */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <a href="tel:01249123456"
            className="flex items-center gap-4 bg-white border border-gray-200 p-4 hover:border-spice-300 transition-colors group">
            <div className="w-10 h-10 bg-spice-500 flex items-center justify-center shrink-0">
              <Phone size={18} className="text-white" />
            </div>
            <div>
              <p className="font-body font-semibold text-charcoal-800 text-sm group-hover:text-spice-600 transition-colors">
                Call us about allergens
              </p>
              <p className="text-spice-500 text-sm font-body">01249 123456</p>
            </div>
          </a>
          <a href="mailto:hello@jkcurryhouse.co.uk"
            className="flex items-center gap-4 bg-white border border-gray-200 p-4 hover:border-spice-300 transition-colors group">
            <div className="w-10 h-10 bg-spice-500 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <p className="font-body font-semibold text-charcoal-800 text-sm group-hover:text-spice-600 transition-colors">
                Email your requirements
              </p>
              <p className="text-spice-500 text-sm font-body truncate">hello@jkcurryhouse.co.uk</p>
            </div>
          </a>
        </div>

        {/* The 14 allergens grid */}
        <h2 className="font-display text-2xl text-charcoal-900 mb-6">The 14 Major UK Allergens</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {ALL_ALLERGENS.map(([key, val]) => (
            <div key={key} className="flex items-center gap-4 bg-white border border-gray-100 p-4 hover:border-gray-200 transition-colors">
              <span className="text-3xl" role="img" aria-label={val.label}>{val.emoji}</span>
              <div>
                <p className="font-body font-semibold text-charcoal-800 text-sm">{val.label}</p>
                <span className={`inline-block text-xs px-2 py-0.5 mt-1 font-body ${val.color}`}>{key}</span>
              </div>
            </div>
          ))}
        </div>

        {/* How we label */}
        <div className="bg-white border border-gray-200 p-6 md:p-8 mb-8">
          <h2 className="font-display text-xl text-charcoal-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-500" /> How We Label Our Menu
          </h2>
          <div className="space-y-3 text-sm text-gray-600 font-body leading-relaxed">
            <p>
              Every dish on our menu and website lists the allergens it is known to contain as
              colour-coded emoji badges. This information is reviewed and updated whenever recipes change.
            </p>
            <p>
              Our menu uses the following symbols on each dish:
            </p>
            <ul className="list-none space-y-1 pl-4 border-l-2 border-gray-100">
              <li><strong className="text-charcoal-800">🌾 Gluten</strong> — wheat, rye, barley, oats</li>
              <li><strong className="text-charcoal-800">🥛 Dairy</strong> — milk, cream, butter, ghee, paneer, yoghurt</li>
              <li><strong className="text-charcoal-800">🥜 Nuts</strong> — almonds, cashews, pistachios, coconut</li>
              <li><strong className="text-charcoal-800">🦐 Shellfish</strong> — prawns, lobster, crab</li>
            </ul>
            <p>
              For the full allergen detail of any specific dish, please ask your server or call us in advance.
            </p>
          </div>
        </div>

        {/* Calorie info notice */}
        <div className="border border-gray-100 bg-gray-50 p-5 mb-8">
          <p className="text-sm text-gray-600 font-body">
            <strong className="text-charcoal-800">Calorie information:</strong>{" "}
            Calorie labelling will be introduced on our menu in a future update in compliance with UK
            calorie labelling regulations for businesses with 250+ employees. We are below the threshold
            but aim to provide this voluntarily.
          </p>
        </div>

        {/* Back to menu */}
        <div className="flex flex-wrap gap-4">
          <Link href="/menu" className="btn-primary">View Full Menu</Link>
          <Link href="/" className="btn-outline !border-charcoal-700 !text-charcoal-700 hover:!bg-charcoal-700 hover:!text-white">
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-gray-400 font-body mt-8">
          Last reviewed: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
