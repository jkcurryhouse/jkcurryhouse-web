import Link from "next/link";
import { CheckCircle, Calendar, Clock, Users, Mail } from "lucide-react";
import Button from "@/components/ui/Button";

interface BookingResult {
  id: string;
  ref: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
}

export default function ConfirmationCard({
  booking,
  guestEmail,
}: {
  booking: BookingResult;
  guestName: string;
  guestEmail: string;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 px-6 py-5 flex items-start gap-4">
        <CheckCircle size={24} className="text-green-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display text-xl text-green-800 mb-1">Table Booked!</h3>
          <p className="text-green-700 text-sm font-body">
            Your reservation is confirmed. A confirmation email has been sent to{" "}
            <strong>{guestEmail}</strong>.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="bg-charcoal-900 px-6 py-4 flex items-center justify-between">
          <p className="font-display text-white text-lg">Booking Summary</p>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-body">Reference</p>
            <p className="text-gold font-display text-lg font-bold">#{booking.ref}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <DetailRow icon={<Calendar size={16} />} label="Date"        value={booking.date} />
          <DetailRow icon={<Clock size={16} />}    label="Time"        value={booking.time} />
          <DetailRow icon={<Users size={16} />}    label="Party"       value={`${booking.partySize} ${booking.partySize === 1 ? "guest" : "guests"}`} />
          <DetailRow icon={<Mail size={16} />}     label="Confirmed to" value={guestEmail} />
          <div className="pt-2 border-t border-gray-100">
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1.5 font-body font-medium">
              <CheckCircle size={12} />{booking.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 px-5 py-4 space-y-2">
        <p className="font-body text-sm font-semibold text-amber-800">Good to know</p>
        <ul className="text-xs text-amber-700 font-body space-y-1 list-disc list-inside">
          <li>We hold reserved tables for 15 minutes past the booking time.</li>
          <li>To cancel or amend, call us on <a href="tel:01249123456" className="underline">01249 123456</a> at least 2 hours before.</li>
          <li>Please let your server know about any allergies on arrival.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/menu"><Button variant="primary">Browse Our Menu</Button></Link>
        <Link href="/"><Button variant="outline">Back to Homepage</Button></Link>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gold shrink-0">{icon}</span>
      <span className="text-gray-500 text-sm font-body w-24 shrink-0">{label}</span>
      <span className="text-charcoal-800 text-sm font-body font-medium">{value}</span>
    </div>
  );
}
