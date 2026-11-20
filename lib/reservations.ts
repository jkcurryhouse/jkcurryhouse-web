import { format, parseISO, addMinutes } from "date-fns";

// Available time slots (restaurant opens 5 pm, last booking 9:30 pm, lunches Fri-Sun)
export const DINNER_SLOTS = [
  "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00", "21:30",
];

export const LUNCH_SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
];

export const LUNCH_DAYS = [5, 6, 0]; // Fri, Sat, Sun (getDay())

export function formatSlot(time: string) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return format(date, "h:mm a"); // e.g. "7:00 PM"
}

export function getSlotsForDate(dateStr: string): string[] {
  const date = parseISO(dateStr);
  const day = date.getDay();
  const isLunchDay = LUNCH_DAYS.includes(day);
  return isLunchDay ? [...LUNCH_SLOTS, ...DINNER_SLOTS] : DINNER_SLOTS;
}

export function formatDateDisplay(dateStr: string) {
  return format(parseISO(dateStr), "EEEE d MMMM yyyy"); // "Friday 14 March 2025"
}

export function formatTimeDisplay(time: string) {
  return formatSlot(time);
}

// Min date = today, max date = 90 days ahead
export function getDateConstraints() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = addMinutes(today, 90 * 24 * 60);
  return {
    min: format(today, "yyyy-MM-dd"),
    max: format(max, "yyyy-MM-dd"),
  };
}
