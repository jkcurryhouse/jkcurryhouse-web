import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Logo, Monogram } from "@/components/brand/Logo";

const hours = [
  { day: "Monday – Thursday", time: "5:00 pm – 10:30 pm" },
  { day: "Friday – Saturday",  time: "5:00 pm – 11:00 pm" },
  { day: "Sunday",             time: "5:00 pm – 10:00 pm" },
  { day: "Lunch (Fri–Sun)",    time: "12:00 pm – 2:30 pm" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-gray-400 border-t border-gold/20">
      <div className="container-pad py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <Link href="/" aria-label="JK Curryhouse — home" className="inline-flex flex-col items-start gap-3 mb-5">
              <Monogram size={72} />
              <Logo size="md" showMonogram={false} />
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              Authentic Indian cuisine crafted with generations of passion, in the heart of Chippenham.
            </p>
            <div className="flex gap-4 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram" className="text-gray-500 hover:text-saffron-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook" className="text-gray-500 hover:text-saffron-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="font-display text-white text-lg mb-4 flex items-center gap-2"><Clock size={16} className="text-gold" /> Hours</h4>
            <ul className="space-y-2">
              {hours.map((h) => (
                <li key={h.day} className="flex flex-col text-sm">
                  <span className="text-gray-300 font-medium">{h.day}</span>
                  <span className="text-gray-500">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-white text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-gold mt-0.5 shrink-0" />
                <span>12 Market Place, Chippenham, Wiltshire, SN15 1HA</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gold shrink-0" />
                <a href="tel:01249123456" className="hover:text-saffron-400 transition-colors">01249 123456</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gold shrink-0" />
                <a href="mailto:hello@jkcurryhouse.co.uk" className="hover:text-saffron-400 transition-colors">hello@jkcurryhouse.co.uk</a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-white text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/menu",         label: "View Menu" },
                { href: "/order",        label: "Order Online" },
                { href: "/reservations", label: "Book a Table" },
                { href: "/offers",       label: "Offers" },
                { href: "/allergens",    label: "Allergen Info" },
                { href: "/privacy",      label: "Privacy Policy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-saffron-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-charcoal-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} JK Curryhouse. All rights reserved.</p>
          <p>Registered in England & Wales · VAT No. 000 0000 00</p>
        </div>
      </div>
    </footer>
  );
}
