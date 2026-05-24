// Appointment slots: 9:00 AM to 11:30 PM in 30-min increments
export function generateTimeSlots(): { morning: string[]; afternoon: string[]; night: string[] } {
  const morning: string[] = [];
  const afternoon: string[] = [];
  const night: string[] = [];

  // Morning: 9:00 AM – 11:30 AM (h24: 9,10,11)
  for (let h = 9; h <= 11; h++) {
    for (const m of [0, 30]) {
      morning.push(`${h}:${m === 0 ? '00' : '30'} AM`);
    }
  }

  // Afternoon: 12:00 PM – 6:00 PM (h24: 12–18)
  for (let h24 = 12; h24 <= 18; h24++) {
    for (const m of [0, 30]) {
      const h12 = h24 === 12 ? 12 : h24 - 12;
      afternoon.push(`${h12}:${m === 0 ? '00' : '30'} PM`);
    }
  }

  // Night: 6:30 PM – 11:30 PM (h24: 18:30 – 23:30)
  for (let h24 = 18; h24 <= 23; h24++) {
    const mins = h24 === 18 ? [30] : [0, 30];
    for (const m of mins) {
      const h12 = h24 - 12;
      night.push(`${h12}:${m === 0 ? '00' : '30'} PM`);
    }
  }

  return { morning, afternoon, night };
}

// Returns true if slot is in the past for today's date
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
