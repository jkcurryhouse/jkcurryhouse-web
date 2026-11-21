"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Tag, Plus, Trash2, Edit2, Users, Globe, RefreshCw, Rocket, Pause, Play, Mail, Copy,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { authFetch } from "@/lib/api-client";
import { formatDiscount } from "@/lib/offers";
import { Modal, StatCard, Spinner, Toggle } from "./ui";

interface Offer {
  id: string; title: string; description: string; code: string;
  discount: number; isPercent: boolean; isGeneral: boolean; isActive: boolean;
  minOrders: number; minSpend: number; minOrderValue: number;
  maxRedemptions: number | null; redemptionCount: number;
  startsAt: string; expiresAt: string; lastRolledOutAt: string | null;
  _count?: { UserOffers: number };
}

interface FormState {
  title: string; description: string; code: string; discount: string;
  isPercent: boolean; isGeneral: boolean; isActive: boolean;
  minOrders: string; minSpend: string; minOrderValue: string; maxRedemptions: string;
  startsAt: string; expiresAt: string;
}

const today = () => format(new Date(), "yyyy-MM-dd");
const inDays = (n: number) => format(new Date(Date.now() + n * 86400000), "yyyy-MM-dd");
const EMPTY = (): FormState => ({
  title: "", description: "", code: "", discount: "", isPercent: true, isGeneral: true, isActive: true,
  minOrders: "0", minSpend: "0", minOrderValue: "0", maxRedemptions: "", startsAt: today(), expiresAt: inDays(30),
});

type State = "live" | "scheduled" | "paused" | "expired" | "used";
function stateOf(o: Offer): State {
  const now = Date.now();
  if (new Date(o.expiresAt).getTime() <= now) return "expired";
  if (o.maxRedemptions != null && o.redemptionCount >= o.maxRedemptions) return "used";
  if (!o.isActive) return "paused";
  if (new Date(o.startsAt).getTime() > now) return "scheduled";
  return "live";
}
const STATE_BADGE: Record<State, string> = {
  live: "bg-green-50 text-green-700", scheduled: "bg-blue-50 text-blue-700",
  paused: "bg-gray-100 text-gray-600", expired: "bg-red-50 text-red-600", used: "bg-purple-50 text-purple-700",
};
const STATE_LABEL: Record<State, string> = {
  live: "Live", scheduled: "Scheduled", paused: "Paused", expired: "Expired", used: "Fully redeemed",
};

interface Preview {
  live: boolean; accountHolders: number; eligible: number; newlyAssigned: number;
  alreadyNotified: number; optedOut: number; noEmail: number; toEmail: number;
}

export default function OffersAdmin() {
  const { toast } = useToast();
  const [offers, setOffers]       = useState<Offer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<FormState>(EMPTY());
  const [filter, setFilter]       = useState<"all" | State>("all");

  const [rollout, setRollout]     = useState<Offer | null>(null);
  const [preview, setPreview]     = useState<Preview | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [rolling, setRolling]     = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/admin/offers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOffers(data.offers ?? []);
    } catch (e) {
      toast((e as Error).message || "Failed to load offers.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const sf = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY()); setFormOpen(true); };
  const openEdit = (o: Offer) => {
    setEditing(o.id);
    setForm({
      title: o.title, description: o.description, code: o.code, discount: String(o.discount),
      isPercent: o.isPercent, isGeneral: o.isGeneral, isActive: o.isActive,
      minOrders: String(o.minOrders), minSpend: String(o.minSpend), minOrderValue: String(o.minOrderValue),
      maxRedemptions: o.maxRedemptions != null ? String(o.maxRedemptions) : "",
      startsAt: format(new Date(o.startsAt), "yyyy-MM-dd"), expiresAt: format(new Date(o.expiresAt), "yyyy-MM-dd"),
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.code || !form.discount || !form.expiresAt) {
      toast("Title, code, discount and expiry are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), description: form.description.trim(), code: form.code.trim().toUpperCase(),
        discount: parseFloat(form.discount), isPercent: form.isPercent, isGeneral: form.isGeneral, isActive: form.isActive,
        minOrders: form.isGeneral ? 0 : parseInt(form.minOrders) || 0,
        minSpend:  form.isGeneral ? 0 : parseFloat(form.minSpend) || 0,
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
        // start of start-day, end of expiry-day (UK)
        startsAt:  new Date(`${form.startsAt}T00:00:00`).toISOString(),
        expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString(),
      };
      const res = editing
        ? await authFetch(`/api/admin/offers/${editing}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await authFetch("/api/admin/offers", { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(editing ? "Offer updated." : "Offer created.", "success");
      setFormOpen(false);
      fetchOffers();
      if (!editing && data.offer && stateOf(data.offer) === "live" && confirm("Offer is live. Roll it out to customers now?")) {
        openRollout(data.offer);
      }
    } catch (e) {
      toast((e as Error).message || "Could not save offer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: Offer) => {
    try {
      const res  = await authFetch(`/api/admin/offers/${o.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !o.isActive }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(o.isActive ? `${o.code} paused — customers can't use it.` : `${o.code} resumed.`, "success");
      fetchOffers();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const handleDelete = async (o: Offer) => {
    if (!confirm(`Delete ${o.code}? Customers holding this code will lose it. Pausing keeps the history instead.`)) return;
    try {
      const res  = await authFetch(`/api/admin/offers/${o.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Offer deleted.", "success");
      fetchOffers();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const openRollout = async (o: Offer) => {
    setRollout(o); setPreview(null); setSendEmail(true);
    try {
      const res  = await authFetch(`/api/admin/offers/${o.id}/rollout`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.preview);
    } catch (e) { toast((e as Error).message, "error"); setRollout(null); }
  };

  const doRollout = async () => {
    if (!rollout) return;
    setRolling(true);
    try {
      const res  = await authFetch(`/api/admin/offers/${rollout.id}/rollout`, {
        method: "POST", body: JSON.stringify({ sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(
        `Rolled out to ${data.assigned} customer(s)` +
        (sendEmail ? ` — ${data.sent} emailed${data.failed ? `, ${data.failed} failed` : ""}` : "") +
        (data.remaining ? `. ${data.remaining} still to email — click Roll out again.` : "."),
        data.failed ? "error" : "success",
      );
      if (data.remaining) { openRollout(rollout); } else { setRollout(null); }
      fetchOffers();
    } catch (e) {
      toast((e as Error).message || "Rollout failed.", "error");
    } finally {
      setRolling(false);
    }
  };

  const filtered = offers.filter((o) => filter === "all" || stateOf(o) === filter);
  const counts   = offers.reduce<Record<State, number>>((acc, o) => { acc[stateOf(o)]++; return acc; },
    { live: 0, scheduled: 0, paused: 0, expired: 0, used: 0 });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Live now"  value={counts.live} colour="border-green-400" />
        <StatCard label="Scheduled" value={counts.scheduled} colour="border-blue-400" />
        <StatCard label="Paused"    value={counts.paused} colour="border-gray-300" />
        <StatCard label="Total redemptions" value={offers.reduce((s, o) => s + o.redemptionCount, 0)} colour="border-gold" />
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <Button onClick={openCreate} size="sm"><Plus size={15} /> New offer</Button>
        <div className="flex gap-1 flex-wrap">
          {(["all", "live", "scheduled", "paused", "expired", "used"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-body transition-colors border ${filter === t ? "bg-charcoal-800 text-white border-charcoal-800" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
              {t === "all" ? "All" : STATE_LABEL[t]}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchOffers}><RefreshCw size={13} /> Refresh</Button>
      </div>

      {loading ? <Spinner label="Loading offers…" /> : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <Tag size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-body text-sm">No offers here yet.</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white divide-y divide-gray-100">
          {filtered.map((o) => {
            const st = stateOf(o);
            return (
              <div key={o.id} className={`flex flex-col lg:flex-row lg:items-center gap-4 p-5 ${st === "expired" ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <button onClick={() => navigator.clipboard.writeText(o.code).then(() => toast(`Copied ${o.code}`, "info"))}
                      className="font-mono text-sm font-bold text-charcoal-900 bg-gray-100 px-2 py-0.5 flex items-center gap-1 hover:bg-gray-200" title="Copy code">
                      {o.code} <Copy size={10} className="text-gray-400" />
                    </button>
                    <span className={`text-xs px-2 py-0.5 font-body flex items-center gap-1 ${o.isGeneral ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                      {o.isGeneral ? <><Globe size={10} /> Everyone</> : <><Users size={10} /> Loyalty</>}
                    </span>
                    <span className={`text-xs px-2 py-0.5 font-body ${STATE_BADGE[st]}`}>{STATE_LABEL[st]}</span>
                  </div>
                  <p className="font-body font-medium text-charcoal-800">{o.title}</p>
                  {o.description && <p className="text-xs text-gray-500 font-body mt-0.5">{o.description}</p>}
                  <p className="text-xs text-gray-500 font-body mt-1">
                    {[
                      !o.isGeneral && (o.minOrders > 0 || o.minSpend > 0)
                        ? `Unlocks after ${[o.minOrders > 0 ? `${o.minOrders} orders` : "", o.minSpend > 0 ? `£${o.minSpend} spend` : ""].filter(Boolean).join(" & ")}`
                        : null,
                      o.minOrderValue > 0 ? `Min. basket £${o.minOrderValue.toFixed(2)}` : null,
                      `Used ${o.redemptionCount}${o.maxRedemptions != null ? ` / ${o.maxRedemptions}` : ""}×`,
                      !o.isGeneral && o._count ? `${o._count.UserOffers} customers hold it` : null,
                      o.lastRolledOutAt ? `Last rolled out ${format(new Date(o.lastRolledOutAt), "d MMM HH:mm")}` : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <div className="shrink-0 lg:text-right">
                  <p className="font-display text-xl text-spice-500">{formatDiscount(o)}</p>
                  <p className="text-xs text-gray-400 font-body mt-0.5">
                    {format(new Date(o.startsAt), "d MMM")} – {format(new Date(o.expiresAt), "d MMM yy")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {st === "live" && (
                    <Button size="sm" variant="outline" onClick={() => openRollout(o)}><Rocket size={13} /> Roll out</Button>
                  )}
                  {(st === "live" || st === "scheduled" || st === "paused") && (
                    <button onClick={() => toggleActive(o)} title={o.isActive ? "Pause" : "Resume"}
                      className="p-2 text-gray-400 hover:text-charcoal-800 border border-gray-200">
                      {o.isActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                  <button onClick={() => openEdit(o)} title="Edit" className="p-2 text-gray-400 hover:text-spice-500 border border-gray-200 hover:border-spice-300"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(o)} title="Delete" className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} wide title={editing ? "Edit offer" : "New offer"}
        footer={<>
          <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? "Save changes" : "Create offer"}</Button>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title *" value={form.title} onChange={(e) => sf("title", e.target.value)} placeholder="e.g. Midweek Curry Club" />
          <Input label="Code *" value={form.code} onChange={(e) => sf("code", e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="CURRY20" className="font-mono" />
          <div className="md:col-span-2">
            <Input label="Description" value={form.description} onChange={(e) => sf("description", e.target.value)} placeholder="Shown to customers and in the email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-charcoal-800">Discount *</label>
            <div className="flex gap-2">
              <input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => sf("discount", e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400" placeholder="10" />
              <div className="flex border border-gray-300">
                {[true, false].map((pct) => (
                  <button key={String(pct)} type="button" onClick={() => sf("isPercent", pct)}
                    className={`px-4 py-3 text-sm font-body ${form.isPercent === pct ? "bg-spice-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    {pct ? "%" : "£"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Input label="Minimum basket (£)" type="number" min="0" step="0.01" value={form.minOrderValue}
            onChange={(e) => sf("minOrderValue", e.target.value)} hint="0 = any order size" />
          <Input label="Starts" type="date" value={form.startsAt} onChange={(e) => sf("startsAt", e.target.value)} />
          <Input label="Expires *" type="date" value={form.expiresAt} onChange={(e) => sf("expiresAt", e.target.value)} hint="Valid until the end of this day" />
          <Input label="Max. total uses" type="number" min="1" value={form.maxRedemptions}
            onChange={(e) => sf("maxRedemptions", e.target.value)} hint="Leave blank for unlimited" />
          <div className="flex items-end pb-2">
            <Toggle checked={form.isActive} onChange={(v) => sf("isActive", v)} label="Active" hint="Switch off to pause without deleting" />
          </div>

          <div className="md:col-span-2">
            <label className="font-body text-sm font-medium text-charcoal-800 block mb-2">Who can use it</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => sf("isGeneral", true)}
                className={`flex items-center gap-2 px-4 py-3 border text-sm font-body flex-1 ${form.isGeneral ? "border-spice-500 bg-spice-50 text-spice-700" : "border-gray-200 text-gray-600"}`}>
                <Globe size={15} /> Everyone (shown on Offers page)
              </button>
              <button type="button" onClick={() => sf("isGeneral", false)}
                className={`flex items-center gap-2 px-4 py-3 border text-sm font-body flex-1 ${!form.isGeneral ? "border-gold bg-saffron-50 text-amber-800" : "border-gray-200 text-gray-600"}`}>
                <Users size={15} /> Loyal account holders only
              </button>
            </div>
          </div>
          {!form.isGeneral && (
            <>
              <Input label="Unlocks after this many orders" type="number" min="0" value={form.minOrders}
                onChange={(e) => sf("minOrders", e.target.value)} hint="0 = no minimum" />
              <Input label="…or lifetime spend of (£)" type="number" min="0" step="0.01" value={form.minSpend}
                onChange={(e) => sf("minSpend", e.target.value)} hint="Both must be met if both set" />
            </>
          )}
        </div>
      </Modal>

      {/* Rollout */}
      <Modal open={!!rollout} onClose={() => setRollout(null)} title={`Roll out ${rollout?.code ?? ""}`}
        footer={<>
          <Button variant="ghost" onClick={() => setRollout(null)}>Cancel</Button>
          <Button onClick={doRollout} loading={rolling} disabled={!preview || preview.eligible === 0}>
            <Rocket size={14} /> {sendEmail && preview?.toEmail ? `Roll out & email ${Math.min(preview.toEmail, 150)}` : "Roll out"}
          </Button>
        </>}>
        {!preview ? <Spinner label="Working out who qualifies…" /> : (
          <div className="space-y-4 font-body text-sm text-charcoal-800">
            <p>
              {rollout?.isGeneral
                ? "This offer is already visible to everyone on the Offers page. Rolling out lets you email it to your account holders."
                : "Gives this loyalty offer to every account holder who meets the unlock rules, so it appears in their account and works at checkout."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Account holders" value={preview.accountHolders} />
              <StatCard label="Qualify" value={preview.eligible} colour="border-green-400" />
              {!rollout?.isGeneral && <StatCard label="New to this offer" value={preview.newlyAssigned} colour="border-gold" />}
              <StatCard label="Will be emailed" value={preview.toEmail} colour="border-blue-400" />
            </div>
            <p className="text-xs text-gray-500">
              Skipped from email: {preview.alreadyNotified} already notified · {preview.optedOut} unsubscribed · {preview.noEmail} no email on file.
              Emails go out up to 150 at a time; run again to continue.
            </p>
            <Toggle checked={sendEmail} onChange={setSendEmail} label="Email customers about this offer"
              hint="Each email includes an unsubscribe link (required under UK GDPR / PECR)" />
            {sendEmail && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> Sent from your SES address with the code and expiry date.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
