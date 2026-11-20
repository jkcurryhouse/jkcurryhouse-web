import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 35%, #1c1810 0%, #0b0b0b 65%)",
      }}
    >
      {/* Decorative spice pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, #f2d27a 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, #d4a437 1px, transparent 1px),
            radial-gradient(circle at 60% 20%, #9c6f1e 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, #f2d27a 0.5px, transparent 0.5px)
          `,
          backgroundSize: "80px 80px, 120px 120px, 60px 60px, 100px 100px",
        }}
      />

      {/* Warm vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/40 via-transparent to-charcoal-900/80" />

      {/* Decorative border frame */}
      <div className="absolute inset-6 md:inset-12 border border-gold/15 pointer-events-none" />
      <div className="absolute inset-8 md:inset-14 border border-gold/10 pointer-events-none" />

      {/* Corner ornaments */}
      {["top-6 left-6", "top-6 right-6", "bottom-6 left-6", "bottom-6 right-6"].map((pos) => (
        <div key={pos} className={`absolute ${pos} w-8 h-8 border-gold/40 md:w-12 md:h-12`}
          style={{
            borderTopWidth: pos.includes("top") ? "2px" : "0",
            borderBottomWidth: pos.includes("bottom") ? "2px" : "0",
            borderLeftWidth: pos.includes("left") ? "2px" : "0",
            borderRightWidth: pos.includes("right") ? "2px" : "0",
            borderColor: "#d4a437",
          }}
        />
      ))}

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Eyebrow */}
        <p className="eyebrow eyebrow-dark mb-8 animate-pulse" style={{ animationDuration: "3s" }}>
          ✦ Est. 1998 · Chippenham, Wiltshire ✦
        </p>

        {/* Main heading — logo lockup styled after the shop sign */}
        <h1 className="mb-2">
          <span className="sr-only">JK Curryhouse — The Real Indian Kitchen</span>
          <span aria-hidden="true">
            <Logo size="lg" />
          </span>
        </h1>

        {/* Divider */}
        <div className="gold-rule my-8" aria-hidden="true">
          <span className="text-xl">✦</span>
        </div>

        {/* Tagline */}
        <p className="font-accent text-gray-300 text-xl md:text-2xl font-light italic leading-relaxed max-w-2xl mx-auto mb-10">
          &ldquo;Where every dish tells a story from the subcontinent to your table&rdquo;
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/reservations" className="btn-primary !py-4 !px-10 !text-sm">
            Reserve a Table
          </Link>
          <Link href="/order" className="btn-outline !py-4 !px-10 !text-sm">
            Order Online
          </Link>
          <Link href="/menu" className="inline-flex items-center justify-center gap-2 text-gray-400 hover:text-saffron-400 transition-colors text-sm font-body tracking-wide uppercase py-4 px-6">
            View Menu →
          </Link>
        </div>

        {/* Opening status */}
        <div className="mt-10 inline-flex items-center gap-3 bg-charcoal-800/60 backdrop-blur-sm border border-gold/20 px-6 py-3">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm font-body">Open today · 5:00 pm – 10:30 pm</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold/60 hover:text-gold transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} />
      </a>
    </section>
  );
}
