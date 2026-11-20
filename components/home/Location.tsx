import { MapPin, Phone, Mail, ExternalLink, Car } from "lucide-react";

export default function Location() {
  return (
    <section id="contact" className="section-pad bg-cream">
      <div className="container-pad">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Info */}
            <div>
              <p className="eyebrow mb-3">Find Us</p>
              <h2 className="font-display text-4xl md:text-5xl text-charcoal-900 mb-2">
                Visit JK Curryhouse
              </h2>
              <div className="gold-divider !mx-0 mb-8" />

              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-spice-500 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-charcoal-800 text-sm">Address</p>
                    <p className="text-gray-600 text-sm mt-0.5">
                      12 Market Place<br />
                      Chippenham, Wiltshire<br />
                      SN15 1HA
                    </p>
                    <a
                      href="https://maps.google.com/?q=12+Market+Place+Chippenham+SN15+1HA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-spice-500 text-xs mt-2 hover:underline"
                    >
                      Get directions <ExternalLink size={11} />
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-spice-500 flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-charcoal-800 text-sm">Phone</p>
                    <a href="tel:01249123456" className="text-gray-600 text-sm hover:text-spice-500 transition-colors">
                      01249 123456
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-spice-500 flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-charcoal-800 text-sm">Email</p>
                    <a href="mailto:hello@jkcurryhouse.co.uk" className="text-gray-600 text-sm hover:text-spice-500 transition-colors break-all">
                      hello@jkcurryhouse.co.uk
                    </a>
                  </div>
                </li>
              </ul>

              <div className="mt-8 p-5 border border-gold/30 bg-saffron-50 flex items-start gap-3">
                <Car size={18} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-base text-charcoal-900 mb-0.5">Free Parking Nearby</p>
                  <p className="text-gray-600 text-sm">
                    Borough Parade and Emery Gate both within 5 minutes&apos; walk. Evening rates from 6 pm.
                  </p>
                </div>
              </div>
            </div>

            {/* Google Maps embed — mobile-responsive height */}
            <div className="h-72 sm:h-96 lg:h-[420px] border border-gray-200 overflow-hidden shadow-lg w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2474.5!2d-2.1167!3d51.4583!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48717b0000000000%3A0x0!2sMarket+Pl%2C+Chippenham+SN15+1HA!5e0!3m2!1sen!2suk!4v1699999999999!5m2!1sen!2suk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="JK Curryhouse Location — Chippenham, SN15 1HA"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
