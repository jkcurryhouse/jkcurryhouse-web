import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // JK Curryhouse brand palette — black & gold (see docs/BRAND.md).
        // Legacy names (saffron / spice / charcoal) are kept so existing classes
        // pick up the new palette automatically.
        saffron: {            // light golds — accents on dark backgrounds
          50:  "#fbf4e2",
          100: "#f5e6bd",
          400: "#f2d27a",
          500: "#d4a437",
          600: "#b8892a",
        },
        spice: {              // deep bronze-gold — buttons, links & text on light backgrounds
          50:  "#faf4e6",
          100: "#f2e5c4",
          200: "#e6d09a",
          300: "#d6b86c",
          400: "#c49a3e",
          500: "#8a6416",
          600: "#6e4f11",
          700: "#553d0d",
          800: "#3a2a09",
          900: "#1f1705",
        },
        charcoal: {
          700: "#262626",
          800: "#141414",
          900: "#0b0b0b",
        },
        cream: "#f8f2e6",
        gold: {
          light:   "#f2d27a",
          DEFAULT: "#d4a437",
          deep:    "#9c6f1e",
        },
        stone: "#c9a27a",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-inter)", "system-ui", "sans-serif"],
        accent:  ["var(--font-cormorant)", "Georgia", "serif"],
        caps:    ["var(--font-cinzel)", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(to bottom, rgba(11,11,11,0.75) 0%, rgba(11,11,11,0.45) 60%, rgba(11,11,11,0.85) 100%)",
        "section-gradient": "linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 50%, #0b0b0b 100%)",
        "gold-gradient": "linear-gradient(180deg, #f2d27a 0%, #d4a437 50%, #9c6f1e 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
