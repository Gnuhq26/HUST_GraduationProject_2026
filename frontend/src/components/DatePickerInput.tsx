import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  className?: string;
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function toLocalDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function getDaysInGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  return grid;
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  title,
  className = '',
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Sync calendar view to the selected/current date when opening
  useEffect(() => {
    if (open) {
      const base = value ? new Date(value + 'T00:00:00') : new Date();
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
    }
  }, [open, value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (day: number) => {
    onChange(toLocalDateStr(viewYear, viewMonth, day));
    setOpen(false);
  };

  const days = getDaysInGrid(viewYear, viewMonth);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        title={title}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-basic-white border rounded-lg cursor-pointer transition-colors select-none ${
          open
            ? 'border-bluesh-800 bg-bluesh-50'
            : 'border-bluesh-600 hover:border-bluesh-800'
        }`}
      >
        <Calendar className="w-4 h-4 text-blacky-400 shrink-0" />
        <span className={`text-sm flex-1 ${value ? 'text-blacky-950' : 'text-blacky-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-basic-white border border-basic-border2 rounded-xl shadow-lg z-30 p-3 w-64">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              title="Tháng trước"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-blacky-50 text-blacky-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-blacky-950">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              title="Tháng sau"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-blacky-50 text-blacky-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className={`text-center text-xs font-medium py-1 ${
                  label === 'CN' ? 'text-accent-red' : 'text-blacky-400'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = toLocalDateStr(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              const isSunday = (i % 7 === 0);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-bluesh-800 text-basic-white font-semibold'
                      : isToday
                      ? 'border border-bluesh-800 text-bluesh-800 font-semibold hover:bg-bluesh-50'
                      : isSunday
                      ? 'text-accent-red hover:bg-accent-red/10'
                      : 'text-blacky-700 hover:bg-blacky-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-basic-border text-center">
            <button
              type="button"
              onClick={() => { onChange(todayStr); setOpen(false); }}
              className="text-xs text-bluesh-800 hover:underline"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
