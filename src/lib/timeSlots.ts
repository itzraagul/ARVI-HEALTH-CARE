// Clinic Availability
// Mon-Sat : 10:00 AM - 1:00 PM  |  5:00 PM - 10:00 PM
// Sunday  : 10:00 AM - 6:00 PM  (on appointment basis)

export type SlotGroups = { morning: string[]; evening: string[]; sunday_afternoon: string[] };

function buildSlots(from_h24: number, from_m: number, to_h24: number, to_m: number): string[] {
  const slots: string[] = [];
  let h = from_h24, m = from_m;
  while (h < to_h24 || (h === to_h24 && m <= to_m)) {
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? 'AM' : 'PM';
    slots.push(`${h12}:${m === 0 ? '00' : '30'} ${ampm}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return slots;
}

const MORNING_SLOTS = buildSlots(10, 0, 13, 0);
const EVENING_SLOTS = buildSlots(17, 0, 22, 0);
const SUNDAY_SLOTS = buildSlots(10, 0, 18, 0);

export function generateTimeSlots(date?: string): SlotGroups {
  if (date) {
    const day = new Date(date + 'T12:00:00').getDay();
    if (day === 0) {
      return { morning: SUNDAY_SLOTS.slice(0, 7), evening: [], sunday_afternoon: SUNDAY_SLOTS.slice(7) };
    }
  }
  return { morning: MORNING_SLOTS, evening: EVENING_SLOTS, sunday_afternoon: [] };
}

export function isSlotPast(date: string, timeSlot: string): boolean {
  if (!date || !timeSlot) return false;
  const today = new Date().toISOString().split('T')[0];
  if (date !== today) return false;
  const parts = timeSlot.trim().split(' ');
  const ampm = parts[1];
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr);
  const m = parseInt(mStr);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const slotTime = new Date();
  slotTime.setHours(h, m, 0, 0);
  return slotTime <= new Date();
}

export function isSunday(date: string): boolean {
  if (!date) return false;
  return new Date(date + 'T12:00:00').getDay() === 0;
}
