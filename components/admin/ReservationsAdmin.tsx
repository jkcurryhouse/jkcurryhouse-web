"use client";
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Users, Phone, Mail, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  specialRequest?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
}

const STATUS_STYLES = {
  CONFIRMED: { bg: "bg-green-100 text-green-800",  icon: CheckCircle,  label: "Confirmed" },
  PENDING:   { bg: "bg-amber-100 text-amber-800",   icon: AlertCircle,  label: "Pending"   },
  CANCELLED: { bg: "bg-red-100 text-red-700",       icon: XCircle,      label: "Cancelled" },
};

export default function ReservationsAdmin() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate)   params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/reservations?${params}`);
      const data = await res.json();
      setReservations(data.reservations ?? []);
    } catch {
      toast("Failed to load reservations.", "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, toast]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(`Reservation ${status.toLowerCase()}.`, "success");
      fetchReservations();
    } catch {
      toast("Could not update reservation.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = reservations.reduce<Record<string, Reservation[]>>((acc, r) => {
    const key = format(new Date(r.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="w-48">
          <Input
            label="Filter by date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-charcoal-800">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400"
          >
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReservations} className="flex items-center gap-2 self-end">
          <RefreshCw size={14} /> Refresh
        </Button>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(""); setFilterStatus(""); }} className="text-sm text-gray-400 hover:text-gray-600 font-body self-end pb-3">
            Clear filters
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total", value: reservations.length, colour: "border-charcoal-700" },
          { label: "Confirmed", value: reservations.filter((r) => r.status === "CONFIRMED").length, colour: "border-green-400" },
          { label: "Covers", value: reservations.filter((r) => r.status !== "CANCELLED").reduce((s, r) => s + r.partySize, 0), colour: "border-gold" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border-l-4 ${s.colour} border border-gray-100 p-4`}>
            <p className="font-display text-2xl text-charcoal-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-12">
          <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-body text-sm">Loading reservations…</span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-body text-sm">No reservations found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, list]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-display text-lg text-charcoal-900">
                    {format(parseISO(dateKey), "EEEE d MMMM yyyy")}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 font-body">
                    {list.filter((r) => r.status !== "CANCELLED").reduce((s, r) => s + r.partySize, 0)} covers
                  </span>
                </div>
                <div className="border border-gray-200 divide-y divide-gray-100 bg-white">
                  {list.map((r) => {
                    const style = STATUS_STYLES[r.status];
                    const Icon = style.icon;
                    return (
                      <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Time + party */}
                        <div className="shrink-0 text-center sm:text-left sm:w-20">
                          <p className="font-display text-lg text-charcoal-900">{r.time}</p>
                          <div className="flex items-center gap-1 justify-center sm:justify-start text-gray-500">
                            <Users size={12} />
                            <span className="text-xs font-body">{r.partySize}</span>
                          </div>
                        </div>

                        {/* Guest info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-charcoal-800">{r.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500 font-body">
                              <Phone size={11} />{r.phone}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 font-body">
                              <Mail size={11} />{r.email}
                            </span>
                          </div>
                          {r.specialRequest && (
                            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 mt-2 font-body inline-block">
                              ✦ {r.specialRequest}
                            </p>
                          )}
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-body font-medium ${style.bg}`}>
                            <Icon size={12} />{style.label}
                          </span>
                          {r.status !== "CANCELLED" && (
                            <button
                              onClick={() => updateStatus(r.id, "CANCELLED")}
                              disabled={updatingId === r.id}
                              className="text-xs text-red-500 hover:text-red-700 font-body hover:underline disabled:opacity-50"
                            >
                              {updatingId === r.id ? "…" : "Cancel"}
                            </button>
                          )}
                          {r.status === "PENDING" && (
                            <button
                              onClick={() => updateStatus(r.id, "CONFIRMED")}
                              disabled={updatingId === r.id}
                              className="text-xs text-green-600 hover:text-green-800 font-body hover:underline disabled:opacity-50"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
