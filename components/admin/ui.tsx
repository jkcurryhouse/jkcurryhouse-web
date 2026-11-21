"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-charcoal-900">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm font-body mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, colour = "border-charcoal-700" }: { label: string; value: ReactNode; colour?: string }) {
  return (
    <div className={`bg-white border-l-4 ${colour} border border-gray-100 p-4`}>
      <p className="font-display text-2xl text-charcoal-900">{value}</p>
      <p className="text-xs text-gray-500 font-body">{label}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white w-full ${wide ? "max-w-3xl" : "max-w-lg"} shadow-2xl border border-gray-200 my-8`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-xl text-charcoal-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300"}`}>
        <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
      <span>
        <span className="block text-sm font-body font-medium text-charcoal-800">{label}</span>
        {hint && <span className="block text-xs font-body text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-sm font-medium text-charcoal-800">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 font-body">{hint}</p>}
    </div>
  );
}

export const selectCls =
  "px-3 py-3 border border-gray-300 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400";
export const textareaCls =
  "w-full px-4 py-3 border border-gray-300 text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400 resize-none";

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
      <span className="font-body text-sm">{label}</span>
    </div>
  );
}

/** Download rows as a CSV file (client-side). */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc  = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv  = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const url  = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
