import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/components/ui/Toast";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jkcurryhouse.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JK Curryhouse — The Real Indian Kitchen | Chippenham, Wiltshire",
    template: "%s | JK Curryhouse Chippenham",
  },
  description:
    "JK Curryhouse in Chippenham, Wiltshire. Award-winning authentic Indian cuisine, online ordering for delivery & takeaway, table reservations. SN15 1HA.",
  keywords: [
    "Indian restaurant Chippenham",
    "curry house Chippenham",
    "Indian takeaway SN15",
    "Indian takeaway Chippenham",
    "JK Curryhouse restaurant Chippenham",
    "Indian food Wiltshire",
    "best curry Chippenham",
    "Chippenham restaurant",
    "takeaway SN15 1HA",
    "Indian delivery Chippenham",
    "curry delivery SN15",
    "JK Curryhouse Indian Chippenham",
    "Wiltshire Indian restaurant",
  ],
  authors:   [{ name: "JK Curryhouse" }],
  creator:   "JK Curryhouse",
  publisher: "JK Curryhouse",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title:       "JK Curryhouse — The Real Indian Kitchen | Chippenham",
    description: "Authentic Indian cuisine in the heart of Chippenham. Dine in, takeaway or get it delivered across SN15.",
    type:        "website",
    locale:      "en_GB",
    url:         SITE_URL,
    siteName:    "JK Curryhouse",
    images:      [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "JK Curryhouse — The Real Indian Kitchen shop sign" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "JK Curryhouse — The Real Indian Kitchen | Chippenham",
    description: "Authentic Indian cuisine in Chippenham. Order online or book a table.",
    images:      ["/og-image.jpg"],
  },
  alternates: { canonical: SITE_URL },
  other: {
    "geo.region":    "GB-WIL",
    "geo.placename": "Chippenham",
    "geo.position":  "51.458;-2.116",
    "ICBM":          "51.458, -2.116",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: "JK Curryhouse",
              url: SITE_URL,
              logo: `${SITE_URL}/brand/jk-monogram.png`,
              image: `${SITE_URL}/og-image.jpg`,
              telephone: "+441249123456",
              address: {
                "@type": "PostalAddress",
                streetAddress: "12 Market Place",
                addressLocality: "Chippenham",
                addressRegion: "Wiltshire",
                postalCode: "SN15 1HA",
                addressCountry: "GB",
              },
              geo: { "@type": "GeoCoordinates", latitude: 51.458, longitude: -2.116 },
              openingHoursSpecification: [
                { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday"], opens: "17:00", closes: "22:30" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday","Saturday"], opens: "12:00", closes: "23:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], opens: "12:00", closes: "22:00" },
              ],
              servesCuisine: "Indian",
              priceRange: "££",
              hasMenu: `${SITE_URL}/menu`,
            }),
          }}
        />
      </head>
      <body>
        {/* Skip to main content — keyboard accessibility */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <main id="main-content">{children}</main>
              <Footer />
              <CookieBanner />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}