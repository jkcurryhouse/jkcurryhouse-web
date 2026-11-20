import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | JK Curryhouse Chippenham",
  description: "Privacy policy for JK Curryhouse, Chippenham — how we collect, use and protect your personal data under UK GDPR.",
  alternates: { canonical: "https://www.jkcurryhouse.co.uk/privacy" },
  robots: { index: true, follow: false },
};

const UPDATED = "4 July 2026";

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-100 pb-8">
      <h2 className="font-display text-xl md:text-2xl text-charcoal-900 mb-3">
        <span className="text-spice-500 mr-2">{num}.</span>{title}
      </h2>
      <div className="text-gray-700 text-sm font-body leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="pt-24 min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-section-gradient py-14 text-center">
        <div className="container-pad">
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">Privacy Policy</h1>
          <div className="gold-divider" />
          <p className="text-gray-500 text-xs mt-4 font-body">Last updated: {UPDATED}</p>
        </div>
      </div>

      <div className="container-pad py-12 max-w-3xl">

        {/* Summary box */}
        <div className="bg-saffron-50 border border-gold/30 p-5 mb-10">
          <p className="font-display text-lg text-charcoal-900 mb-2">Summary</p>
          <ul className="text-sm text-gray-600 font-body space-y-1 list-disc pl-5">
            <li>We collect only what we need to run your orders, reservations and account.</li>
            <li>We never sell your data or share it with advertisers.</li>
            <li>You can request deletion of your data at any time.</li>
            <li>We use Stripe for payments — we never see your full card number.</li>
          </ul>
        </div>

        <div className="space-y-8">
          <Section num="1" title="Who We Are">
            <p>
              JK Curryhouse (&ldquo;JK Curryhouse&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
              is a restaurant business registered in England &amp; Wales, operating from 12 Market Place,
              Chippenham, Wiltshire, SN15 1HA. We are the data controller for personal data collected
              through this website.
            </p>
          </Section>

          <Section num="2" title="What Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> name, email address, hashed password (stored by AWS Cognito)</li>
              <li><strong>Order data:</strong> items ordered, delivery address, payment reference (not card details)</li>
              <li><strong>Reservation data:</strong> name, phone number, email, party size, date &amp; time, special requests</li>
              <li><strong>Usage data:</strong> pages visited, browser type, device type (via optional analytics)</li>
              <li><strong>Cookie data:</strong> session tokens, consent preferences</li>
            </ul>
          </Section>

          <Section num="3" title="How We Use Your Data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and fulfil delivery and takeaway orders</li>
              <li>To confirm and manage table reservations</li>
              <li>To send order and booking confirmation emails via AWS SES</li>
              <li>To provide personalised loyalty offers to account holders (with consent)</li>
              <li>To prevent fraud and maintain site security</li>
              <li>To improve our website and services (with analytics consent)</li>
            </ul>
          </Section>

          <Section num="4" title="Legal Basis (UK GDPR)">
            <p>We process your data under the following legal bases:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contract performance</strong> — orders and reservations</li>
              <li><strong>Legitimate interests</strong> — security, fraud prevention, service improvement</li>
              <li><strong>Consent</strong> — marketing offers, analytics cookies</li>
              <li><strong>Legal obligation</strong> — financial records required by HMRC</li>
            </ul>
          </Section>

          <Section num="5" title="Data Retention">
            <p>
              Order and payment records are retained for 7 years as required by HMRC.
              Reservation data is retained for 2 years. Account data is retained until you request deletion.
            </p>
            <p>
              To request deletion of your account and associated personal data, email{" "}
              <a href="mailto:hello@jkcurryhouse.co.uk" className="text-spice-500 hover:underline">
                hello@jkcurryhouse.co.uk
              </a>. We will respond within 30 days.
            </p>
          </Section>

          <Section num="6" title="Your Rights Under UK GDPR">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access</strong> — request a copy of your personal data</li>
              <li><strong>Rectification</strong> — correct inaccurate data</li>
              <li><strong>Erasure</strong> — request deletion (&ldquo;right to be forgotten&rdquo;)</li>
              <li><strong>Restriction</strong> — limit how we process your data</li>
              <li><strong>Portability</strong> — receive your data in a portable format</li>
              <li><strong>Object</strong> — object to processing based on legitimate interests</li>
            </ul>
            <p>
              To exercise any right, contact us at{" "}
              <a href="mailto:hello@jkcurryhouse.co.uk" className="text-spice-500 hover:underline">
                hello@jkcurryhouse.co.uk
              </a>. You may also lodge a complaint with the ICO at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener" className="text-spice-500 hover:underline">
                ico.org.uk
              </a>.
            </p>
          </Section>

          <Section num="7" title="Cookies">
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Essential:</strong> login sessions (AWS Cognito), shopping cart, security tokens. These cannot be disabled.</li>
              <li><strong>Analytics:</strong> anonymised page view data to improve the site. Only set with your consent.</li>
              <li><strong>Marketing:</strong> personalised offer tracking. Only set with your explicit consent.</li>
            </ul>
            <p>Manage your cookie preferences at any time using the banner at the bottom of this page.</p>
          </Section>

          <Section num="8" title="Third-Party Services">
            <p>We share data with the following processors, all of whom are GDPR-compliant:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe</strong> — payment processing (PCI DSS Level 1 certified)</li>
              <li><strong>AWS Cognito</strong> — user authentication and account management</li>
              <li><strong>AWS RDS</strong> — encrypted database hosting (eu-west-2)</li>
              <li><strong>AWS SES</strong> — transactional email delivery</li>
              <li><strong>AWS S3 / CloudFront</strong> — static asset and image hosting</li>
            </ul>
            <p>We do not use advertising networks or social media tracking pixels.</p>
          </Section>

          <Section num="9" title="Data Security">
            <p>
              All data is encrypted in transit (TLS 1.2+) and at rest. Our AWS infrastructure is
              hosted in the eu-west-2 (London) region. Passwords are never stored — authentication
              is handled entirely by AWS Cognito. Payment card data is processed directly by Stripe
              and never passes through our servers.
            </p>
          </Section>

          <Section num="10" title="Contact">
            <p>
              Data controller: JK Curryhouse, 12 Market Place, Chippenham,
              SN15 1HA. For data requests or complaints:{" "}
              <a href="mailto:hello@jkcurryhouse.co.uk" className="text-spice-500 hover:underline">
                hello@jkcurryhouse.co.uk
              </a>
            </p>
          </Section>
        </div>

        <div className="flex flex-wrap gap-4 mt-10 pt-8 border-t border-gray-100">
          <Link href="/" className="btn-primary">Back to Home</Link>
          <Link href="/allergens" className="btn-outline !border-charcoal-700 !text-charcoal-700 hover:!bg-charcoal-700 hover:!text-white">
            Allergen Info
          </Link>
        </div>
      </div>
    </div>
  );
}
