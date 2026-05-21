import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder, className, disabled, compact }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between border rounded-lg outline-none transition-colors ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-4.5 text-base'} ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-blacky-100 border-blacky-200'
            : open
              ? 'bg-bluesh-50 border-bluesh-800 cursor-pointer'
              : 'bg-basic-white border-blacky-200 hover:border-blacky-300 cursor-pointer'
        }`}
      >
        <span className={selected ? 'text-blacky-950' : 'text-blacky-600'}>
          {selected ? selected.label : (placeholder ?? 'Chọn...')}
        </span>
        <ChevronDown
          className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-yellowfish-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-basic-white border border-blacky-200 rounded-lg shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 ${compact ? 'py-2' : 'py-3'} text-sm transition-colors ${
                value === option.value
                  ? 'bg-yellowfish-50 text-yellowfish-500 font-semibold'
                  : 'text-blacky-700 hover:bg-blacky-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
