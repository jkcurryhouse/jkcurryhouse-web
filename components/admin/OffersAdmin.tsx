"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Tag, Plus, Trash2, Edit2, CheckCircle, XCircle, Users, Globe, RefreshCw, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatDiscount, daysUntilExpiry, type OfferRecord } from "@/lib/offers";

interface FormState {
  title: string; description: string; code: string;
  discount: string; isPercent: boolean; isGeneral: boolean;
  minOrders: string; minSpend: string; expiresAt: string;
}

const EMPTY_FORM: FormState = {
  title: "", description: "", code: "",
  discount: "", isPercent: true, isGeneral: true,
  minOrders: "0", minSpend: "0", expiresAt: "",
};

export default function OffersAdmin() {
  const { toast } = useToast();
  const [offers,      setOffers]      = useState<OfferRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [filterType,  setFilterType]  = useState<"all"|"general"|"personal">("all");

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/offers");
      const data = await res.json();
      setOffers([...(data.general ?? []), ...(data.personal ?? [])]);
    } catch {
      toast("Failed to load offers.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (offer: OfferRecord) => {
    setEditing(offer.id);
    setForm({
      title:       offer.title,
      description: offer.description,
      code:        offer.code,
      discount:    String(offer.discount),
      isPercent:   offer.isPercent,
      isGeneral:   offer.isGeneral,
      minOrders:   String(offer.minOrders ?? 0),
      minSpend:    String(offer.minSpend ?? 0),
      expiresAt:   format(new Date(offer.expiresAt), "yyyy-MM-dd"),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.code || !form.discount || !form.expiresAt) {
      toast("Please fill in all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        code:        form.code.trim().toUpperCase(),
        discount:    parseFloat(form.discount),
        isPercent:   form.isPercent,
        isGeneral:   form.isGeneral,
        minOrders:   parseInt(form.minOrders) || 0,
        minSpend:    parseFloat(form.minSpend) || 0,
        expiresAt:   new Date(form.expiresAt).toISOString(),
      };

      const res = editing
        ? await fetch(`/api/offers/${editing}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/offers", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error();
      toast(editing ? "Offer updated." : "Offer created.", "success");
      setShowForm(false);
      fetchOffers();
    } catch {
      toast("Could not save offer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Offer deleted.", "success");
      fetchOffers();
    } catch {
      toast("Could not delete offer.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = offers.filter((o) =>
    filterType === "all" ? true :
    filterType === "general" ? o.isGeneral :
    !o.isGeneral
  );

  const stats = {
    total:   offers.length,
    active:  offers.filter((o) => new Date(o.expiresAt) > new Date()).length,
    general: offers.filter((o) => o.isGeneral).length,
    personal:offers.filter((o) => !o.isGeneral).length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Offers",     value: stats.total,    colour: "border-charcoal-700" },
          { label: "Active",           value: stats.active,   colour: "border-green-400" },
          { label: "General",          value: stats.general,  colour: "border-blue-400" },
          { label: "Personalised",     value: stats.personal, colour: "border-gold" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border-l-4 ${s.colour} border border-gray-100 p-4`}>
            <p className="font-display text-2xl text-charcoal-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <Button onClick={openCreate} size="sm">
          <Plus size={15} /> New Offer
        </Button>
        <div className="flex gap-1">
          {(["all","general","personal"] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-body capitalize transition-colors border ${
                filterType === t ? "bg-charcoal-800 text-white border-charcoal-800" : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}>
              {t}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchOffers}>
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-xl text-charcoal-900">
              {editing ? "Edit Offer" : "Create Offer"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Title *" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Welcome Discount" />
            <Input label="Code *" value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} placeholder="WELCOME10" className="font-mono" />
            <div className="md:col-span-2">
              <Input label="Description *" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="e.g. 10% off your first order" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-sm font-medium text-charcoal-800">Discount Amount *</label>
              <div className="flex gap-2">
                <input type="number" min="0" step="0.01" value={form.discount}
                  onChange={(e) => setField("discount", e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400"
                  placeholder="10" />
                <div className="flex border border-gray-300">
                  <button onClick={() => setField("isPercent", true)}
                    className={`px-4 py-3 text-sm font-body transition-colors ${form.isPercent ? "bg-spice-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    %
                  </button>
                  <button onClick={() => setField("isPercent", false)}
                    className={`px-4 py-3 text-sm font-body transition-colors ${!form.isPercent ? "bg-spice-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    £
                  </button>
                </div>
              </div>
            </div>
            <Input label="Expiry Date *" type="date" value={form.expiresAt} onChange={(e) => setField("expiresAt", e.target.value)} />

            {/* Visibility */}
            <div className="md:col-span-2">
              <label className="font-body text-sm font-medium text-charcoal-800 block mb-2">Visibility</label>
              <div className="flex gap-3">
                <button onClick={() => setField("isGeneral", true)}
                  className={`flex items-center gap-2 px-4 py-3 border text-sm font-body transition-colors flex-1 ${form.isGeneral ? "border-spice-500 bg-spice-50 text-spice-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <Globe size={15} /> General (everyone)
                </button>
                <button onClick={() => setField("isGeneral", false)}
                  className={`flex items-center gap-2 px-4 py-3 border text-sm font-body transition-colors flex-1 ${!form.isGeneral ? "border-gold bg-saffron-50 text-gold" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <Users size={15} /> Personalised (criteria-based)
                </button>
              </div>
            </div>

            {/* Unlock criteria for personalised offers */}
            {!form.isGeneral && (
              <>
                <Input label="Min. Orders to Unlock" type="number" min="0" value={form.minOrders}
                  onChange={(e) => setField("minOrders", e.target.value)}
                  hint="0 = no order minimum" />
                <Input label="Min. Spend to Unlock (£)" type="number" min="0" step="0.01" value={form.minSpend}
                  onChange={(e) => setField("minSpend", e.target.value)}
                  hint="0 = no spend minimum" />
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <Button onClick={handleSave} loading={saving}>{editing ? "Save Changes" : "Create Offer"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Offers list */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-12">
          <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-body text-sm">Loading offers…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <Tag size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-body text-sm">No offers found. Create one above.</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white divide-y divide-gray-100">
          {filtered.map((offer) => {
            const days    = daysUntilExpiry(offer.expiresAt);
            const expired = days < 0;
            return (
              <div key={offer.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 ${expired ? "opacity-50" : ""}`}>
                {/* Offer info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-charcoal-900 bg-gray-100 px-2 py-0.5">{offer.code}</span>
                    <span className={`text-xs px-2 py-0.5 font-body flex items-center gap-1 ${offer.isGeneral ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                      {offer.isGeneral ? <><Globe size={10} /> General</> : <><Users size={10} /> Personal</>}
                    </span>
                    {!expired && <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 font-body flex items-center gap-1"><CheckCircle size={10} />Active</span>}
                    {expired  && <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 font-body flex items-center gap-1"><XCircle size={10} />Expired</span>}
                  </div>
                  <p className="font-body font-medium text-charcoal-800">{offer.title}</p>
                  <p className="text-xs text-gray-500 font-body mt-0.5">{offer.description}</p>
                  {!offer.isGeneral && (offer.minOrders > 0 || offer.minSpend > 0) && (
                    <p className="text-xs text-amber-600 font-body mt-1">
                      Unlocks after: {offer.minOrders > 0 ? `${offer.minOrders} orders` : ""}{offer.minOrders > 0 && offer.minSpend > 0 ? " & " : ""}{offer.minSpend > 0 ? `£${offer.minSpend} spend` : ""}
                    </p>
                  )}
                </div>

                {/* Discount + expiry */}
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl text-spice-500">{formatDiscount(offer)}</p>
                  <p className="text-xs text-gray-400 font-body mt-0.5">
                    {expired ? "Expired" : `${days}d remaining`} · {format(new Date(offer.expiresAt), "d MMM yy")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(offer)} className="p-2 text-gray-400 hover:text-spice-500 transition-colors border border-gray-200 hover:border-spice-300">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    disabled={deletingId === offer.id}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200 disabled:opacity-50"
                  >
                    {deletingId === offer.id
                      ? <div className="w-3.5 h-3.5 border border-red-300 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
