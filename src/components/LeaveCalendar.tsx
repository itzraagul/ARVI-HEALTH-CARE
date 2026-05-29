import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type LeaveRecord = {
  id: string; leave_type: string; user_id?: string; clinic_name?: string;
  start_date: string; end_date: string; status: string;
  userName?: string;
};

interface Props {
  leaves: LeaveRecord[];
  onDateClick?: (date: string) => void;
  selectedStart?: string;
  selectedEnd?: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function LeaveCalendar({ leaves, onDateClick, selectedStart, selectedEnd }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const leaveMap = useMemo(() => {
    const map: Record<string, { type: string; label: string }[]> = {};
    leaves.filter(l => l.status === 'active').forEach(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push({
          type: l.leave_type,
          label: l.leave_type === 'clinic_holiday' ? (l.clinic_name || 'Clinic') : (l.userName || 'User'),
        });
      }
    });
    return map;
  }, [leaves]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const isSelected = (dateStr: string) => {
    if (selectedStart && selectedEnd) {
      return dateStr >= selectedStart && dateStr <= selectedEnd;
    }
    return dateStr === selectedStart;
  };
  const isRangeStart = (dateStr: string) => dateStr === selectedStart && selectedEnd && selectedStart !== selectedEnd;
  const isRangeEnd = (dateStr: string) => dateStr === selectedEnd && selectedEnd !== selectedStart;

  const cells: (number | null)[] = [...Array(firstDayOfMonth).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0A3D62]">
        <button onClick={prevMonth} className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"><ChevronLeft size={18}/></button>
        <h3 className="text-white font-bold text-sm">{MONTHS[viewMonth]} {viewYear}</h3>
        <button onClick={nextMonth} className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"><ChevronRight size={18}/></button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-50" />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const todayStr = today.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const leaveItems = leaveMap[dateStr] || [];
          const hasUserLeave = leaveItems.some(l => l.type === 'user_leave');
          const hasClinicLeave = leaveItems.some(l => l.type === 'clinic_holiday');
          const sel = isSelected(dateStr);

          return (
            <div key={dateStr}
              onClick={() => !isPast && onDateClick && onDateClick(dateStr)}
              className={`aspect-square border-b border-r border-gray-50 flex flex-col items-center justify-start p-1 relative transition-colors
                ${!isPast && onDateClick ? 'cursor-pointer hover:bg-[#0F9FA8]/5' : ''}
                ${isPast ? 'opacity-40' : ''}
                ${sel ? 'bg-[#0F9FA8]/10' : ''}
                ${isToday && !sel ? 'bg-blue-50' : ''}
              `}
            >
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full leading-none
                ${isToday ? 'bg-[#0A3D62] text-white' : ''}
                ${isRangeStart(dateStr) || isRangeEnd(dateStr) ? 'bg-[#0F9FA8] text-white' : ''}
                ${sel && !isRangeStart(dateStr) && !isRangeEnd(dateStr) ? 'text-[#0F9FA8]' : ''}
                ${!isToday && !sel ? 'text-gray-700' : ''}
              `}>{day}</span>

              {/* Leave indicators */}
              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                {hasClinicLeave && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Clinic Holiday"/>}
                {hasUserLeave && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="User Leave"/>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"/><span className="text-gray-500">Clinic Holiday</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"/><span className="text-gray-500">User Leave</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#0A3D62]"/><span className="text-gray-500">Today</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#0F9FA8]"/><span className="text-gray-500">Selected</span></div>
      </div>
    </div>
  );
}
