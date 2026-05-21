import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, User, X, Loader2, UserPlus } from 'lucide-react';
import { customersService } from '../../services/customersService';
import type { Customer } from '@/types';

interface Props {
  onChange: (customerId: number | null, customerName: string, phone: string) => void;
}

type InputMode = 'idle' | 'searching' | 'selected' | 'new-customer';

export default function CustomerPhoneInput({ onChange }: Props) {
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [mode, setMode] = useState<InputMode>('idle');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = useCallback(async (query: string): Promise<boolean> => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return false;
    }
    setLoading(true);
    try {
      const res = await customersService.getAll({ search: query, limit: 8 });
      const list = Array.isArray(res) ? res : (res as { data?: Customer[] })?.data ?? [];
      setSuggestions(list);
      setShowDropdown(list.length > 0);
      return list.length > 0;
    } catch {
      setSuggestions([]);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    // Chỉ cho nhập số và dấu +, -, space
    const cleaned = value.replace(/[^\d+\-\s]/g, '');
    setPhone(cleaned);
    setSelectedCustomer(null);
    setCustomerName('');

    if (!cleaned) {
      setMode('idle');
      setSuggestions([]);
      setShowDropdown(false);
      onChange(null, '', '');
      return;
    }

    setMode('searching');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length < 6) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      const found = await searchCustomers(digits);
      if (!found) {
        setMode('new-customer');
        onChange(null, '', cleaned);
      }
    }, 1500);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPhone(customer.Phone || phone);
    setMode('selected');
    setShowDropdown(false);
    setSuggestions([]);
    onChange(customer.CustomerID, customer.CustomerName, customer.Phone || phone);
  };

  const handleReset = () => {
    setPhone('');
    setCustomerName('');
    setSelectedCustomer(null);
    setMode('idle');
    setSuggestions([]);
    setShowDropdown(false);
    onChange(null, '', '');
  };

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    onChange(null, value, phone);
  };

  // --- Render: đã chọn khách có sẵn ---
  if (mode === 'selected' && selectedCustomer) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-green/5 border border-accent-green/30 rounded-lg">
        <User className="w-4 h-4 text-accent-green shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-blacky-900 truncate">{selectedCustomer.CustomerName}</div>
          {selectedCustomer.Phone && (
            <div className="text-xs text-blacky-500">{selectedCustomer.Phone}</div>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          title="Xóa chọn"
          className="p-1 text-blacky-400 hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Phone input */}
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blacky-400 pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blacky-400 animate-spin" />
        )}
        <input
          type="text"
          inputMode="tel"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Số điện thoại"
          className="input-field pl-9 pr-9"
        />

        {/* Dropdown gợi ý */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-basic-white border border-blacky-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {suggestions.map((customer) => (
              <button
                key={customer.CustomerID}
                type="button"
                onClick={() => handleSelectCustomer(customer)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-yellowfish-50 transition-colors"
              >
                <User className="w-4 h-4 text-blacky-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blacky-900 truncate">{customer.CustomerName}</div>
                  {customer.Phone && (
                    <div className="text-xs text-blacky-500">{customer.Phone}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Name input — chỉ hiện khi đang tạo khách mới */}
      {mode === 'new-customer' && (
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellowfish-500 pointer-events-none" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Tên khách hàng (sẽ tạo mới)"
            className="input-field pl-9 border-yellowfish-400 focus:ring-yellowfish-400/30"
            autoFocus
          />
          <div className="text-xs text-yellowfish-600 mt-1 flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
            Số điện thoại chưa có trong hệ thống — sẽ tạo khách hàng mới khi tạo đơn
          </div>
        </div>
      )}
    </div>
  );
}
