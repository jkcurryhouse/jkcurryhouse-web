"use client";
import { useState, useEffect, useCallback } from "react";
import { format, parseISO, addDays } from "date-fns";
import {
  Calendar, Users, Phone, Mail, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Plus, Edit2, Armchair, UserX, CheckCheck, Download, Search, Globe, PhoneCall, Footprints,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { authFetch } from "@/lib/api-client";
import { getSlotsForDate, formatSlot } from "@/lib/reservations";
import { Modal, Field, StatCard, Spinner, Toggle, selectCls, textareaCls, downloadCsv } from "./ui";

type Status = "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
type Source = "ONLINE" | "PHONE" | "WALK_IN";

interface Reservation {
  id: string; name: string; email: string; phone: string;
  date: string; time: string; partySize: number; specialRequest?: string | null;
  status: Status; source: Source; tableNumber?: string | null; adminNotes?: string | null;
  createdAt: string;
}

const STATUS: Record<Status, { cls: string; label: string; icon: typeof CheckCircle }> = {
  PENDING:   { cls: "bg-amber-100 text-amber-800",   label: "Pending",   icon: AlertCircle },
  CONFIRMED: { cls: "bg-green-100 text-green-800",   label: "Confirmed", icon: CheckCircle },
  SEATED:    { cls: "bg-blue-100 text-blue-800",     label: "Seated",    icon: Armchair },
  COMPLETED: { cls: "bg-gray-100 text-gray-600",     label: "Completed", icon: CheckCheck },
  NO_SHOW:   { cls: "bg-purple-100 text-purple-800", label: "No-show",   icon: UserX },
  CANCELLED: { cls: "bg-red-100 text-red-700",       label: "Cancelled", icon: XCircle },
};
const SOURCE_ICON: Record<Source, typeof Globe> = { ONLINE: Globe, PHONE: PhoneCall, WALK_IN: Footprints };

const day = (d: Date) => format(d, "yyyy-MM-dd");
const ukToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());

type Range = "today" | "week" | "upcoming" | "date" | "past";

interface FormState {
  name: string; phone: string; email: string; date: string; time: string; customTime: boolean;
  partySize: string; source: Source; status: Status; tableNumber: string;
  adminNotes: string; specialRequest: string; sendEmail: boolean;
}
const emptyForm = (): FormState => ({
  name: "", phone: "", email: "", date: ukToday(), time: "19:00", customTime: false,
  partySize: "2", source: "PHONE", status: "CONFIRMED", tableNumber: "",
  adminNotes: "", specialRequest: "", sendEmail: true,
});

export default function ReservationsAdmin() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [range, setRange]           = useState<Range>("today");
  const [pickDate, setPickDate]     = useState(ukToday());
  const [filterStatus, setFilterStatus] = useState("");
  const [q, setQ]                   = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Reservation | null>(null);
  const [form, setForm]         = useState<FormState>(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [slotInfo, setSlotInfo] = useState<Record<string, number>>({});

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const t = ukToday();
      if (range === "today")    { params.set("from", t); params.set("to", t); }
      if (range === "week")     { params.set("from", t); params.set("to", day(addDays(parseISO(t), 6))); }
      if (range === "upcoming") { params.set("from", t); }
      if (range === "date")     { params.set("from", pickDate); params.set("to", pickDate); }
      if (range === "past")     { params.set("from", day(addDays(parseISO(t), -30))); params.set("to", day(addDays(parseISO(t), -1))); }
      if (filterStatus) params.set("status", filterStatus);
      if (q.trim())     params.set("q", q.trim());
      const res  = await authFetch(`/api/admin/reservations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReservations(data.reservations ?? []);
    } catch (e) {
      toast((e as Error).message || "Failed to load reservations.", "error");
    } finally {
      setLoading(false);
    }
  }, [range, pickDate, filterStatus, q, toast]);

  useEffect(() => {
    const t = setTimeout(fetchReservations, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchReservations, q]);

  // Slot availability for the booking form
  useEffect(() => {
    if (!formOpen || !form.date) return;
    authFetch(`/api/reservations/availability?date=${form.date}`)
      .then((r) => r.json())
      .then((d) => {
        const m: Record<string, number> = {};
        for (const s of d.slots ?? []) m[s.time] = s.remaining;
        setSlotInfo(m);
      })
      .catch(() => setSlotInfo({}));
  }, [formOpen, form.date]);

  const sf = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(emptyForm()); setFormOpen(true); };
  const openEdit = (r: Reservation) => {
    setEditing(r);
    const d = r.date.slice(0, 10);
    setForm({
      name: r.name, phone: r.phone, email: r.email, date: d, time: r.time,
      customTime: !getSlotsForDate(d).includes(r.time),
      partySize: String(r.partySize), source: r.source, status: r.status,
      tableNumber: r.tableNumber ?? "", adminNotes: r.adminNotes ?? "",
      specialRequest: r.specialRequest ?? "", sendEmail: false,
    });
    setFormOpen(true);
  };

  const save = async (overrideCapacity = false) => {
    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time) {
      toast("Name, phone, date and time are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const common = {
        name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
        date: form.date, time: form.time, partySize: Number(form.partySize) || 1,
        tableNumber: form.tableNumber.trim() || (editing ? null : undefined),
        adminNotes: form.adminNotes.trim() || (editing ? null : undefined),
        specialRequest: form.specialRequest.trim() || (editing ? null : undefined),
        overrideCapacity,
      };
      const res = editing
        ? await authFetch(`/api/admin/reservations/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify({ ...common, status: form.status, notifyGuest: form.sendEmail }),
          })
        : await authFetch("/api/admin/reservations", {
            method: "POST",
            body: JSON.stringify({ ...common, source: form.source,
              status: form.status === "SEATED" || form.status === "PENDING" ? form.status : "CONFIRMED",
              sendEmail: form.sendEmail }),
          });
      const data = await res.json();
      if (res.status === 409 && data.canOverride) {
        if (confirm(`${data.error}\n\nBook it anyway (override capacity)?`)) return save(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      toast(`${editing ? "Booking updated" : "Booking added"}${data.emailed ? " — guest emailed" : ""}.`, "success");
      setFormOpen(false);
      fetchReservations();
    } catch (e) {
      toast((e as Error).message || "Could not save booking.", "error");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (r: Reservation, status: Status) => {
    let notifyGuest = false;
    if (status === "CANCELLED") {
      if (!confirm(`Cancel ${r.name}'s booking for ${r.partySize} at ${r.time}?`)) return;
      notifyGuest = !!r.email && confirm("Email the guest to let them know it's cancelled?");
    }
    setUpdatingId(r.id);
    try {
      const res  = await authFetch(`/api/admin/reservations/${r.id}`, {
        method: "PATCH", body: JSON.stringify({ status, notifyGuest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`${r.name}: ${STATUS[status].label.toLowerCase()}${data.emailed ? " — guest emailed" : ""}.`, "success");
      fetchReservations();
    } catch (e) {
      toast((e as Error).message || "Could not update reservation.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = reservations.reduce<Record<string, Reservation[]>>((acc, r) => {
    const key = r.date.slice(0, 10);
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  const live   = reservations.filter((r) => !["CANCELLED", "NO_SHOW"].includes(r.status));
  const covers = live.reduce((s, r) => s + r.partySize, 0);
  const slots  = getSlotsForDate(form.date || ukToday());

  const exportCsv = () => downloadCsv(`bookings-${ukToday()}.csv`, reservations.map((r) => ({
    date: r.date.slice(0, 10), time: r.time, name: r.name, party: r.partySize, phone: r.phone, email: r.email,
    status: r.status, source: r.source, table: r.tableNumber ?? "", request: r.specialRequest ?? "", notes: r.adminNotes ?? "",
    ref: r.id.slice(-8).toUpperCase(),
  })));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <Button size="sm" onClick={openNew}><Plus size={15} /> New booking</Button>
        <div className="flex gap-1 flex-wrap">
          {([["today","Today"],["week","Next 7 days"],["upcoming","All upcoming"],["date","Pick a date"],["past","Last 30 days"]] as [Range,string][]).map(([k, l]) => (
            <button key={k} onClick={() => setRange(k)}
              className={`px-3 py-2 text-xs font-body border transition-colors ${range === k ? "bg-charcoal-800 text-white border-charcoal-800" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
              {l}
            </button>
          ))}
        </div>
        {range === "date" && (
          <input type="date" value={pickDate} onChange={(e) => setPickDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm font-body" />
        )}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${selectCls} py-2`}>
          <option value="">All statuses</option>
          {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, email, ref…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-spice-400 font-body w-56" />
        </div>
        <Button variant="outline" size="sm" onClick={fetchReservations}><RefreshCw size={13} /> Refresh</Button>
        <Button variant="ghost" size="sm" onClick={exportCsv} disabled={!reservations.length}><Download size={13} /> CSV</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Bookings"  value={live.length} />
        <StatCard label="Covers"    value={covers} colour="border-gold" />
        <StatCard label="Pending"   value={reservations.filter((r) => r.status === "PENDING").length} colour="border-amber-400" />
        <StatCard label="Seated now" value={reservations.filter((r) => r.status === "SEATED").length} colour="border-blue-400" />
      </div>

      {/* List */}
      {loading ? <Spinner label="Loading reservations…" /> : reservations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-body text-sm">No reservations found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, list]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-display text-lg text-charcoal-900">{format(parseISO(dateKey), "EEEE d MMMM yyyy")}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 font-body">
                  {list.filter((r) => !["CANCELLED","NO_SHOW"].includes(r.status)).reduce((s, r) => s + r.partySize, 0)} covers
                </span>
              </div>
              <div className="border border-gray-200 divide-y divide-gray-100 bg-white">
                {list.map((r) => {
                  const st = STATUS[r.status]; const Icon = st.icon; const Src = SOURCE_ICON[r.source];
                  const busy = updatingId === r.id;
                  const done = ["CANCELLED", "NO_SHOW", "COMPLETED"].includes(r.status);
                  return (
                    <div key={r.id} className={`p-5 flex flex-col lg:flex-row lg:items-center gap-4 ${done ? "opacity-60" : ""}`}>
                      <div className="shrink-0 lg:w-24">
                        <p className="font-display text-lg text-charcoal-900">{formatSlot(r.time)}</p>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-body">
                          <span className="flex items-center gap-1"><Users size={12} />{r.partySize}</span>
                          {r.tableNumber && <span className="bg-charcoal-800 text-white px-1.5">T{r.tableNumber}</span>}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-charcoal-800 flex items-center gap-2">
                          {r.name}
                          <Src size={12} className="text-gray-400" aria-label={r.source} />
                          <span className="text-[10px] text-gray-400 font-normal">#{r.id.slice(-8).toUpperCase()}</span>
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-xs text-gray-500 font-body hover:text-spice-500"><Phone size={11} />{r.phone}</a>
                          {r.email && <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-xs text-gray-500 font-body hover:text-spice-500"><Mail size={11} />{r.email}</a>}
                        </div>
                        {r.specialRequest && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 mt-2 font-body inline-block">✦ {r.specialRequest}</p>
                        )}
                        {r.adminNotes && (
                          <p className="text-xs text-blue-800 bg-blue-50 px-2 py-1 mt-2 ml-0 font-body block w-fit">Staff: {r.adminNotes}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-body font-medium ${st.cls}`}>
                          <Icon size={12} />{st.label}
                        </span>
                        {r.status === "PENDING" && <ActionBtn busy={busy} onClick={() => setStatus(r, "CONFIRMED")} cls="text-green-700">Confirm</ActionBtn>}
                        {(r.status === "CONFIRMED" || r.status === "PENDING") && <ActionBtn busy={busy} onClick={() => setStatus(r, "SEATED")} cls="text-blue-700">Seat</ActionBtn>}
                        {r.status === "SEATED" && <ActionBtn busy={busy} onClick={() => setStatus(r, "COMPLETED")} cls="text-gray-700">Complete</ActionBtn>}
                        {(r.status === "CONFIRMED" || r.status === "PENDING") && <ActionBtn busy={busy} onClick={() => setStatus(r, "NO_SHOW")} cls="text-purple-700">No-show</ActionBtn>}
                        {!done && <ActionBtn busy={busy} onClick={() => setStatus(r, "CANCELLED")} cls="text-red-600">Cancel</ActionBtn>}
                        {done && r.status !== "COMPLETED" && <ActionBtn busy={busy} onClick={() => setStatus(r, "CONFIRMED")} cls="text-gray-600">Restore</ActionBtn>}
                        <button onClick={() => openEdit(r)} title="Edit booking"
                          className="p-2 text-gray-400 hover:text-spice-500 border border-transparent hover:border-spice-200"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New / edit booking */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} wide
        title={editing ? `Edit booking #${editing.id.slice(-8).toUpperCase()}` : "New booking"}
        footer={<>
          <Button variant="ghost" onClick={() => setFormOpen(false)}>Close</Button>
          <Button onClick={() => save()} loading={saving}>{editing ? "Save changes" : "Add booking"}</Button>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Guest name *" value={form.name} onChange={(e) => sf("name", e.target.value)} />
          <Input label="Phone *" type="tel" value={form.phone} onChange={(e) => sf("phone", e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => sf("email", e.target.value)}
            hint="Optional — needed for a confirmation email" />
          <Input label="Party size *" type="number" min={1} max={60} value={form.partySize}
            onChange={(e) => sf("partySize", e.target.value)} />
          <Input label="Date *" type="date" value={form.date} onChange={(e) => sf("date", e.target.value)} />
          <Field label="Time *" hint={form.customTime ? "Outside normal slots — will need a capacity override" : "Number = tables left in that slot"}>
            {form.customTime ? (
              <div className="flex gap-2">
                <input type="time" value={form.time} onChange={(e) => sf("time", e.target.value)} className={`${selectCls} flex-1`} />
                <button type="button" className="text-xs text-spice-500 font-body" onClick={() => sf("customTime", false)}>Slots</button>
              </div>
            ) : (
              <select value={slots.includes(form.time) ? form.time : ""} className={selectCls}
                onChange={(e) => e.target.value === "__other" ? sf("customTime", true) : sf("time", e.target.value)}>
                <option value="" disabled>Choose…</option>
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {formatSlot(t)}{slotInfo[t] != null ? ` — ${slotInfo[t]} left` : ""}
                  </option>
                ))}
                <option value="__other">Other time…</option>
              </select>
            )}
          </Field>
          {!editing ? (
            <Field label="Booked via">
              <select value={form.source} onChange={(e) => sf("source", e.target.value as Source)} className={selectCls}>
                <option value="PHONE">Phone</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="ONLINE">Online / other</option>
              </select>
            </Field>
          ) : (
            <Field label="Status">
              <select value={form.status} onChange={(e) => sf("status", e.target.value as Status)} className={selectCls}>
                {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
            </Field>
          )}
          <Input label="Table" value={form.tableNumber} onChange={(e) => sf("tableNumber", e.target.value)} placeholder="e.g. 7 or 7+8" />
          <div className="md:col-span-2">
            <Field label="Guest's special request">
              <textarea rows={2} value={form.specialRequest} onChange={(e) => sf("specialRequest", e.target.value)} className={textareaCls}
                placeholder="Birthday, high chair, allergies…" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Staff notes (not shown to guest)">
              <textarea rows={2} value={form.adminNotes} onChange={(e) => sf("adminNotes", e.target.value)} className={textareaCls} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Toggle checked={form.sendEmail && !!form.email} onChange={(v) => sf("sendEmail", v)}
              label={editing ? "Email the guest about this change" : "Send confirmation email to guest"}
              hint={form.email ? undefined : "Add an email address to enable"} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ActionBtn({ children, onClick, busy, cls }: { children: React.ReactNode; onClick: () => void; busy: boolean; cls: string }) {
  return (
    <button onClick={onClick} disabled={busy}
      className={`text-xs font-body hover:underline disabled:opacity-50 px-1 ${cls}`}>
      {busy ? "…" : children}
    </button>
  );
}
