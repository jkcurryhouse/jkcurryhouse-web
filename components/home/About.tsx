export default function About() {
  return (
    <section id="about" className="section-pad bg-cream">
      <div className="container-pad">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div>
            <p className="eyebrow mb-3">Our Story</p>
            <h2 className="font-display text-4xl md:text-5xl text-charcoal-900 leading-tight mb-2">
              A Family Legacy<br />
              <em className="font-light text-spice-500">Since 1998</em>
            </h2>
            <div className="gold-divider !mx-0 mb-8" />

            <p className="text-gray-600 leading-relaxed mb-5 font-body">
              JK Curryhouse was founded by the Khan family with a singular ambition: to bring the true flavours of
              North and South Indian cooking to the heart of Chippenham. Our recipes travel back generations —
              from the tandoor ovens of Punjab to the spice markets of Kerala — and have been lovingly preserved
              and evolved over 25 years of cooking for this community.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8 font-body">
              Every dish is made from scratch, using whole spices freshly ground each morning, slow-cooked sauces
              that develop for hours, and ingredients sourced from trusted suppliers across the UK and direct
              from India. We believe good curry cannot be rushed.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { number: "25+", label: "Years Serving Chippenham" },
                { number: "60+", label: "Dishes on the Menu" },
                { number: "★ 4.8", label: "Average Guest Rating" },
              ].map((s) => (
                <div key={s.label} className="text-center border-t-2 border-gold pt-4">
                  <p className="font-display text-2xl md:text-3xl font-bold text-spice-500">{s.number}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card stack */}
          <div className="relative h-[420px] hidden lg:block">
            {/* Back card */}
            <div
              className="absolute top-6 right-0 w-72 h-80 rotate-3"
              style={{ background: "linear-gradient(135deg, #1a1a1a, #0b0b0b)", border: "1px solid rgba(212,164,55,0.3)" }}
            >
              <div className="p-8 h-full flex flex-col justify-end">
                <p className="font-accent text-gold text-lg italic leading-snug">
                  &ldquo;The finest ingredients, the oldest recipes, the warmest welcome.&rdquo;
                </p>
                <p className="text-gray-500 text-xs mt-3 font-body">— Rahul Khan, Head Chef</p>
              </div>
            </div>
            {/* Front card */}
            <div
              className="absolute top-0 left-0 w-72 h-80 -rotate-2 bg-spice-500 flex flex-col justify-between p-8"
            >
              <div className="text-white/20 font-display text-7xl font-bold leading-none">25</div>
              <div>
                <p className="font-accent text-white text-2xl italic">Years of<br />authentic Indian<br />cooking</p>
                <div className="w-10 h-0.5 bg-gold mt-4" />
              </div>
            </div>
            {/* Floating element */}
            <div className="absolute bottom-0 right-8 bg-saffron-500 text-charcoal-900 px-6 py-4 rotate-1 shadow-lg">
              <p className="font-body text-xs font-semibold tracking-widest uppercase">Chippenham, SN15 1HA</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
