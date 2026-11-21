"use client";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Save, X, CalendarOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { authFetch } from "@/lib/api-client";
import { Toggle, Spinner } from "./ui";

interface Settings {
  acceptingOrders: boolean; acceptingReservations: boolean; deliveryEnabled: boolean;
  deliveryFee: number; freeDeliveryThreshold: number; minDeliveryOrder: number;
  deliveryPostcodes: string[]; maxBookingsPerSlot: number; maxCoversPerSlot: number;
  maxPartySize: number; closedDates: string[]; noticeBanner: string | null; updatedAt?: string;
}

function Section({ title, children, sub }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 p-6">
      <h2 className="font-display text-xl text-charcoal-900">{title}</h2>
      {sub && <p className="text-xs text-gray-500 font-body mt-0.5 mb-4">{sub}</p>}
      <div className={sub ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default function SettingsAdmin() {
  const { toast } = useToast();
  const [s, setS]           = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);
  const [newClosed, setNewClosed]   = useState("");
  const [postcodes, setPostcodes]   = useState("");

  useEffect(() => {
    authFetch("/api/admin/settings").then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setS(d.settings);
      setPostcodes((d.settings.deliveryPostcodes ?? []).join(", "));
    }).catch((e) => toast(e.message || "Failed to load settings.", "error"));
  }, [toast]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS((p) => p && { ...p, [k]: v }); setDirty(true); };
  const num = (v: string) => (v === "" ? 0 : Number(v));

  const save = async (patch?: Partial<Settings>) => {
    if (!s) return;
    setSaving(true);
    try {
      const body = patch ?? {
        ...s,
        deliveryPostcodes: postcodes.split(/[\s,]+/).map((p) => p.trim().toUpperCase()).filter(Boolean),
        noticeBanner: s.noticeBanner?.trim() || null,
      };
      delete (body as Partial<Settings>).updatedAt;
      const res  = await authFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setS(data.settings);
      setPostcodes(data.settings.deliveryPostcodes.join(", "));
      setDirty(false);
      toast("Settings saved — live on the website.", "success");
    } catch (e) {
      toast((e as Error).message || "Could not save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Big switches save immediately — staff flip these mid-service
  const flip = (k: "acceptingOrders" | "acceptingReservations" | "deliveryEnabled", v: boolean) => {
    setS((p) => p && { ...p, [k]: v });
    save({ [k]: v });
  };

  if (!s) return <Spinner label="Loading settings…" />;

  const addClosed = () => {
    if (!newClosed) return;
    set("closedDates", Array.from(new Set([...s.closedDates, newClosed])).sort());
    setNewClosed("");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Service switches" sub="Take effect immediately on the website.">
        <div className="space-y-4">
          <Toggle checked={s.acceptingOrders} onChange={(v) => flip("acceptingOrders", v)}
            label="Accept online orders" hint="Turn off when the kitchen is too busy or closed." />
          <Toggle checked={s.deliveryEnabled} onChange={(v) => flip("deliveryEnabled", v)}
            label="Offer delivery" hint="Off = takeaway only (e.g. no driver tonight)." />
          <Toggle checked={s.acceptingReservations} onChange={(v) => flip("acceptingReservations", v)}
            label="Accept online table bookings" hint="Phone bookings can still be added here in the admin." />
        </div>
      </Section>

      <Section title="Website notice" sub="Optional banner shown at the top of the menu, order and booking pages.">
        <Input value={s.noticeBanner ?? ""} onChange={(e) => set("noticeBanner", e.target.value)}
          placeholder="e.g. Closed Boxing Day · Open from 5pm on 27 Dec" maxLength={300} />
      </Section>

      <Section title="Delivery">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Delivery fee (£)" type="number" min="0" step="0.01" value={s.deliveryFee}
            onChange={(e) => set("deliveryFee", num(e.target.value))} />
          <Input label="Free delivery over (£)" type="number" min="0" step="0.01" value={s.freeDeliveryThreshold}
            onChange={(e) => set("freeDeliveryThreshold", num(e.target.value))} />
          <Input label="Minimum delivery order (£)" type="number" min="0" step="0.01" value={s.minDeliveryOrder}
            onChange={(e) => set("minDeliveryOrder", num(e.target.value))} />
          <div className="md:col-span-3">
            <Input label="Postcode districts we deliver to" value={postcodes}
              onChange={(e) => { setPostcodes(e.target.value); setDirty(true); }}
              hint="Comma-separated, e.g. SN15, SN14" />
          </div>
        </div>
      </Section>

      <Section title="Table capacity" sub="Used for online availability and to stop double-booking.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Max. bookings per time slot" type="number" min="1" value={s.maxBookingsPerSlot}
            onChange={(e) => set("maxBookingsPerSlot", num(e.target.value))} />
          <Input label="Max. guests per time slot" type="number" min="1" value={s.maxCoversPerSlot}
            onChange={(e) => set("maxCoversPerSlot", num(e.target.value))} />
          <Input label="Largest party bookable online" type="number" min="1" value={s.maxPartySize}
            onChange={(e) => set("maxPartySize", num(e.target.value))} hint="Bigger groups are asked to call" />
        </div>
      </Section>

      <Section title="Closed dates" sub="No online bookings on these days (holidays, private events).">
        <div className="flex gap-2 items-end mb-4">
          <input type="date" value={newClosed} onChange={(e) => setNewClosed(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 text-sm font-body" />
          <Button size="sm" variant="outline" onClick={addClosed} disabled={!newClosed}><CalendarOff size={13} /> Add</Button>
        </div>
        {s.closedDates.length === 0 ? (
          <p className="text-xs text-gray-400 font-body">No closed dates set.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {s.closedDates.map((d) => (
              <span key={d} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-body px-2.5 py-1">
                {format(parseISO(d), "EEE d MMM yyyy")}
                <button onClick={() => set("closedDates", s.closedDates.filter((x) => x !== d))} aria-label={`Remove ${d}`}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <div className="sticky bottom-4 flex items-center gap-3 bg-white/90 backdrop-blur border border-gray-200 p-3 shadow-sm">
        <Button onClick={() => save()} loading={saving} disabled={!dirty}><Save size={14} /> Save settings</Button>
        <span className="text-xs text-gray-500 font-body">{dirty ? "Unsaved changes" : s.updatedAt ? `Last saved ${format(new Date(s.updatedAt), "d MMM HH:mm")}` : ""}</span>
      </div>
    </div>
  );
}
