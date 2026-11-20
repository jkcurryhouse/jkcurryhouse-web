import Image from "next/image";

export const BRAND = {
  name: "JK Curryhouse",
  tagline: "The Real Indian Kitchen",
};

/** Round gold JK monogram (transparent PNG — works on light or dark backgrounds). */
export function Monogram({
  size = 48,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/jk-monogram.png"
      alt="JK Curryhouse logo"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}

/**
 * Monogram + "Curryhouse" wordmark + tagline, styled after the shop sign.
 * size: "sm" for nav/admin bars, "md" for footer/auth, "lg" for the hero.
 */
export function Logo({
  size = "sm",
  showTagline = true,
  showMonogram = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  showMonogram?: boolean;
  className?: string;
}) {
  const s = {
    sm: { mono: 40, word: "text-2xl", jk: "text-xs", tag: "text-[9px] tracking-[0.3em]", gap: "gap-3" },
    md: { mono: 64, word: "text-4xl", jk: "text-sm", tag: "text-[10px] tracking-[0.3em]", gap: "gap-4" },
    lg: { mono: 140, word: "text-5xl sm:text-7xl md:text-8xl", jk: "text-xl md:text-2xl", tag: "text-xs sm:text-sm md:text-base tracking-[0.35em] md:tracking-[0.45em]", gap: "gap-5" },
  }[size];

  return (
    <span className={`inline-flex items-center ${s.gap} ${size === "lg" ? "flex-col" : ""} ${className}`}>
      {showMonogram && <Monogram size={s.mono} priority={size !== "md"} />}
      <span className={`flex flex-col leading-none ${size === "lg" ? "items-center" : ""}`}>
        <span className="flex items-baseline gap-1.5">
          <span className={`font-caps text-gold-gradient font-semibold ${s.jk}`}>JK</span>
          <span className={`font-display text-gold-gradient font-semibold ${s.word}`}>Curryhouse</span>
        </span>
        {showTagline && (
          <span className={`font-caps text-gold uppercase whitespace-nowrap mt-1.5 ${s.tag} flex items-center gap-2`}>
            {size === "lg" && <span className="hidden sm:block h-px w-10 md:w-16 bg-gold/60" />}
            {BRAND.tagline}
            {size === "lg" && <span className="hidden sm:block h-px w-10 md:w-16 bg-gold/60" />}
          </span>
        )}
      </span>
    </span>
  );
}
