import { getSettings } from "@/lib/settings";
import { Info } from "lucide-react";

/** Admin-controlled notice (Settings → Website notice). Renders nothing if unset or DB unavailable. */
export default async function NoticeBanner() {
  let text: string | null = null;
  try { text = (await getSettings()).noticeBanner; } catch { /* no DB — show nothing */ }
  if (!text) return null;
  return (
    <div className="bg-saffron-50 border-b border-gold/30 text-charcoal-900 text-sm font-body text-center px-4 py-2.5 flex items-center justify-center gap-2">
      <Info size={14} className="text-gold shrink-0" /> {text}
    </div>
  );
}
