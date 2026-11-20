"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, ChevronDown, ChevronUp } from "lucide-react";

type Consent = { essential: true; analytics: boolean; marketing: boolean };

const STORAGE_KEY = "jk_cookie_consent";

export default function CookieBanner() {
  const [visible,      setVisible]      = useState(false);
  const [showDetails,  setShowDetails]  = useState(false);
  const [consent,      setConsent]      = useState<Consent>({
    essential: true, analytics: false, marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) { setVisible(true); return; }
      // Already consented — apply preferences silently
      applyConsent(JSON.parse(stored));
    } catch {
      setVisible(true);
    }
  }, []);

  function applyConsent(c: Consent) {
    // In production: initialise/block analytics scripts based on c.analytics
    // e.g. window.gtag?.("consent", "update", { analytics_storage: c.analytics ? "granted" : "denied" })
    console.debug("[Cookie consent]", c);
  }

  function save(c: Consent) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch { /* */ }
    applyConsent(c);
    setVisible(false);
  }

  const acceptAll   = () => save({ essential: true, analytics: true,  marketing: true  });
  const rejectAll   = () => save({ essential: true, analytics: false, marketing: false });
  const saveCustom  = () => save(consent);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-[200] bg-charcoal-900 border-t border-gold/20 shadow-2xl"
    >
      <div className="container-pad py-5 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          {/* Icon + text */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie size={22} className="text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-white text-base mb-1">We use cookies</p>
              <p className="text-gray-400 text-sm font-body leading-relaxed">
                We use essential cookies to keep the site working and optional analytics cookies to
                understand how you use it. No advertising cookies without your consent.{" "}
                <Link href="/privacy" className="text-saffron-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>

              {/* Expandable details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 font-body mt-2 transition-colors"
              >
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDetails ? "Hide" : "Manage"} cookie preferences
              </button>

              {showDetails && (
                <div className="mt-4 space-y-3">
                  {[
                    {
                      key:      "essential" as const,
                      label:    "Essential",
                      desc:     "Login sessions, cart, security. Cannot be disabled.",
                      locked:   true,
                    },
                    {
                      key:      "analytics" as const,
                      label:    "Analytics",
                      desc:     "Page views and usage patterns (anonymised). Helps us improve the site.",
                      locked:   false,
                    },
                    {
                      key:      "marketing" as const,
                      label:    "Marketing",
                      desc:     "Personalised offers and retargeting. Only used if you opt in.",
                      locked:   false,
                    },
                  ].map(({ key, label, desc, locked }) => (
                    <div key={key} className="flex items-start gap-3">
                      <div className="relative mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          id={`cookie-${key}`}
                          checked={consent[key]}
                          disabled={locked}
                          onChange={(e) =>
                            setConsent((c) => ({ ...c, [key]: e.target.checked }))
                          }
                          className="w-4 h-4 accent-spice-500 disabled:opacity-50"
                        />
                      </div>
                      <label htmlFor={`cookie-${key}`} className="flex-1">
                        <span className="text-sm text-white font-body font-medium">
                          {label}{locked && <span className="ml-1 text-xs text-gray-500">(required)</span>}
                        </span>
                        <p className="text-xs text-gray-500 font-body mt-0.5">{desc}</p>
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={saveCustom}
                    className="text-xs text-saffron-400 hover:underline font-body mt-1"
                  >
                    Save my preferences
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={acceptAll}
              className="flex-1 md:flex-none bg-spice-500 text-white px-6 py-2.5 text-sm font-body font-medium tracking-wide uppercase hover:bg-spice-600 transition-colors whitespace-nowrap"
            >
              Accept All
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 md:flex-none border border-gray-600 text-gray-300 px-6 py-2.5 text-sm font-body font-medium tracking-wide uppercase hover:border-gray-400 hover:text-white transition-colors whitespace-nowrap"
            >
              Essential Only
            </button>
          </div>

          {/* Close */}
          <button
            onClick={rejectAll}
            aria-label="Close cookie banner"
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 md:relative md:top-auto md:right-auto"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
