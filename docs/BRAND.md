# JK Curryhouse — Brand in Code

**Name:** JK Curryhouse · **Tagline:** The Real Indian Kitchen

## Logo files
| File | Use |
|---|---|
| `public/brand/jk-monogram.png` | Transparent gold JK monogram (512px) — site UI |
| `public/brand/jk-monogram-192.png` | Smaller monogram — email header |
| `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | Browser tab / home-screen icons (auto-picked up by Next.js) |
| `public/og-image.jpg` | 1200×630 social share image (shop sign) |

Use the `<Logo />` and `<Monogram />` components in `components/brand/Logo.tsx` rather than hand-writing the name.

## Colours (`tailwind.config.ts`)
| Token | Hex | Notes |
|---|---|---|
| `charcoal-900` | `#0b0b0b` | Base black |
| `charcoal-800` | `#141414` | Panels |
| `gold` / `gold-light` / `gold-deep` | `#d4a437` / `#f2d27a` / `#9c6f1e` | Logo golds |
| `saffron-*` | light golds | Accents/hover on dark backgrounds |
| `spice-*` | bronze-gold (`spice-500` = `#8a6416`) | Buttons, links and text on light backgrounds (passes WCAG AA on cream and with white text) |
| `cream` | `#f8f2e6` | Light section background |

The old `saffron` / `spice` names were kept so every existing class picked up the new palette.

Helpers in `app/globals.css`: `.btn-primary` (gold foil button), `.text-gold-gradient`, `.gold-rule` (ornamental divider), `.eyebrow` (auto-brightens on dark sections; add `.eyebrow-dark` if needed).

## Fonts
- `font-display` — Cormorant Garamond (headings, wordmark)
- `font-caps` — Cinzel (tagline, eyebrows)
- `font-body` — Inter
