import { Clock } from "lucide-react";

const schedule = [
  { day: "Monday",             lunch: null,              dinner: "5:00 pm – 10:30 pm" },
  { day: "Tuesday",            lunch: null,              dinner: "5:00 pm – 10:30 pm" },
  { day: "Wednesday",          lunch: null,              dinner: "5:00 pm – 10:30 pm" },
  { day: "Thursday",           lunch: null,              dinner: "5:00 pm – 10:30 pm" },
  { day: "Friday",             lunch: "12:00 pm – 2:30 pm", dinner: "5:00 pm – 11:00 pm" },
  { day: "Saturday",           lunch: "12:00 pm – 2:30 pm", dinner: "5:00 pm – 11:00 pm" },
  { day: "Sunday",             lunch: "12:00 pm – 2:30 pm", dinner: "5:00 pm – 10:00 pm" },
];

export default function OpeningHours() {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <section className="section-pad bg-section-gradient">
      <div className="container-pad">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="eyebrow mb-3">When to Visit</p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-2">Opening Hours</h2>
          <div className="gold-divider" />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="border border-gold/20 divide-y divide-gold/10">
            {schedule.map((s) => {
              const isToday = s.day === today;
              return (
                <div
                  key={s.day}
                  className={`flex items-center justify-between px-6 py-4 transition-colors ${
                    isToday ? "bg-gold/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isToday && (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                    <span
                      className={`font-body text-sm w-28 ${
                        isToday ? "text-saffron-400 font-semibold" : "text-gray-300"
                      }`}
                    >
                      {s.day}
                      {isToday && <span className="ml-2 text-xs text-green-400">Today</span>}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    {s.lunch && (
                      <p className="text-gray-400 font-body">
                        <span className="text-gray-500 text-xs mr-2">Lunch</span>
                        {s.lunch}
                      </p>
                    )}
                    <p className={`font-body ${isToday ? "text-white font-medium" : "text-gray-300"}`}>
                      {s.lunch && <span className="text-gray-500 text-xs mr-2">Dinner</span>}
                      {s.dinner}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 text-sm text-gray-500 border border-gold/10 px-6 py-4 bg-charcoal-800/30">
            <Clock size={16} className="text-gold mt-0.5 shrink-0" />
            <p>Last food orders are taken 30 minutes before closing. Kitchen may close earlier during quiet periods — call ahead to be sure.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
