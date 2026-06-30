import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Truck, CreditCard, Search, ChevronDown, Phone, Loader2, Wallet, Receipt } from 'lucide-react';
import debtsService from '../services/debtsService';
import { useToast } from '../components/ToastProvider';
import DebtPaymentModal, { PaymentModalData } from '../components/debts/DebtPaymentModal';
import ProtectedAction from '../components/ProtectedAction';

interface DebtOrder {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

interface CustomerDebt {
  customerName: string;
  phone: string | null;
  totalDebt: number;
  orders: DebtOrder[];
}

interface CustomerDebtsResponse {
  totalDebtAmount: number;
  totalCustomersInDebt: number;
  customers: CustomerDebt[];
}

interface DebtReceipt {
  receiptId: number;
  importDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

interface SupplierDebt {
  supplierName: string;
  phone: string | null;
  totalDebt: number;
  receipts: DebtReceipt[];
}

interface SupplierDebtsResponse {
  totalDebtAmount: number;
  totalSuppliersInDebt: number;
  suppliers: SupplierDebt[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function paymentProgress(paid: number, total: number): number {
  if (total <= 0) return 100;
  return Math.min(100, Math.round((paid / total) * 100));
}

interface DebtProgressBarProps {
  paid: number;
  total: number;
  tone: 'customer' | 'supplier';
}

function DebtProgressBar({ paid, total, tone }: DebtProgressBarProps) {
  const pct = paymentProgress(paid, total);
  const barColor = tone === 'customer' ? 'bg-accent-green' : 'bg-accent-green';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-blacky-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-blacky-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function Debts() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [customerDebts, setCustomerDebts] = useState<CustomerDebtsResponse | null>(null);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const loadDebts = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'customers') {
        const data = await debtsService.getCustomerDebts();
        setCustomerDebts(data as CustomerDebtsResponse);
      } else {
        const data = await debtsService.getSupplierDebts();
        setSupplierDebts(data as SupplierDebtsResponse);
      }
    } catch (err) {
      console.error('Error loading debts:', err);
      toast.error('Không thể tải dữ liệu công nợ');
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadDebts();
    setSearchTerm('');
    setExpandedKeys(new Set());
  }, [loadDebts]);

  const filteredCustomers = useMemo(() => {
    const list = customerDebts?.customers ?? [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q),
    );
  }, [customerDebts, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    const list = supplierDebts?.suppliers ?? [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toLowerCase();
    return list.filter(
      (s) =>
        s.supplierName.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q),
    );
  }, [supplierDebts, searchTerm]);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentModal || !paymentAmount) return;

    try {
      setSubmitting(true);
      await debtsService.recordPayment({
        type: paymentModal.type,
        referenceId: paymentModal.referenceId,
        amount: paymentAmount,
        note: paymentNote,
      });
      toast.success('Ghi nhận thanh toán thành công!');
      setPaymentModal(null);
      setPaymentAmount('');
      setPaymentNote('');
      loadDebts();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (type: 'customer' | 'supplier', referenceId: number, remaining: number) => {
    setPaymentModal({ type, referenceId, remaining } satisfies PaymentModalData);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const isCustomerTab = activeTab === 'customers';
  const debtTone = isCustomerTab ? 'customer' : 'supplier';
  const debtColorClass = isCustomerTab ? 'text-accent-red' : 'text-yellowfish-600';
  const debtBgClass = isCustomerTab ? 'bg-accent-red/10 border-accent-red/30' : 'bg-yellowfish-50 border-yellowfish-300';
  const debtIconBg = isCustomerTab ? 'bg-accent-red' : 'bg-yellowfish-500';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blacky-950">Quản lý Công nợ</h1>
        <p className="text-blacky-500 text-sm mt-1">Theo dõi và quản lý công nợ khách hàng & nhà cung cấp</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-bluesh-50 p-1.5 rounded-xl w-fit border border-bluesh-100">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
            isCustomerTab
              ? 'bg-basic-white text-bluesh-800 shadow-sm border border-basic-border2'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <Users className="w-4 h-4" />
          Công nợ khách hàng
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
            !isCustomerTab
              ? 'bg-basic-white text-bluesh-800 shadow-sm border border-basic-border2'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <Truck className="w-4 h-4" />
          Công nợ nhà cung cấp
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-bluesh-800" />
          <p className="text-sm text-blacky-500">Đang tải dữ liệu công nợ...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className={`rounded-xl border p-5 shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.04)] ${debtBgClass}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${debtIconBg}`}>
                  <Wallet className="w-6 h-6 text-basic-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-blacky-600">
                    {isCustomerTab ? 'Tổng nợ khách hàng' : 'Tổng nợ nhà cung cấp'}
                  </p>
                  <p className={`text-2xl font-bold truncate ${debtColorClass}`}>
                    {formatCurrency(
                      isCustomerTab
                        ? customerDebts?.totalDebtAmount ?? 0
                        : supplierDebts?.totalDebtAmount ?? 0,
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-bluesh-50 rounded-xl border border-bluesh-200 p-5 shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
                  {isCustomerTab ? (
                    <Users className="w-6 h-6 text-basic-white" />
                  ) : (
                    <Truck className="w-6 h-6 text-basic-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-blacky-600">
                    {isCustomerTab ? 'Khách hàng đang nợ' : 'NCC đang nợ'}
                  </p>
                  <p className="text-3xl font-bold text-bluesh-800">
                    {isCustomerTab
                      ? customerDebts?.totalCustomersInDebt ?? 0
                      : supplierDebts?.totalSuppliersInDebt ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blacky-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isCustomerTab ? 'Tìm khách hàng, SĐT...' : 'Tìm nhà cung cấp, SĐT...'}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-basic-border2 rounded-lg bg-basic-white text-blacky-950 placeholder:text-blacky-400 focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
            />
          </div>

          {/* List */}
          {isCustomerTab ? (
            <DebtEntityList
              emptyMessage="Không có công nợ khách hàng"
              emptyFilteredMessage="Không tìm thấy khách hàng phù hợp"
              items={filteredCustomers}
              totalItems={customerDebts?.customers.length ?? 0}
              debtTone={debtTone}
              debtColorClass={debtColorClass}
              expandedKeys={expandedKeys}
              onToggle={toggleExpanded}
              getKey={(c) => `c-${c.customerName}-${c.phone ?? ''}`}
              renderHeader={(customer) => ({
                name: customer.customerName,
                phone: customer.phone,
                totalDebt: customer.totalDebt,
                countLabel: `${customer.orders.length} đơn nợ`,
              })}
              renderRows={(customer) =>
                customer.orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-bluesh-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-blacky-950 whitespace-nowrap">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-blacky-700">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <DebtProgressBar paid={order.paidAmount} total={order.totalAmount} tone={debtTone} />
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-accent-green font-medium">
                      {formatCurrency(order.paidAmount)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-semibold ${debtColorClass}`}>
                      {formatCurrency(order.remainingAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {order.remainingAmount > 0 && (
                        <ProtectedAction action="manage" subject="Debt">
                          <button
                            type="button"
                            onClick={() => openPaymentModal('customer', order.orderId, order.remainingAmount)}
                            className="btn btn-secondary text-xs! h-9! px-3! rounded-lg! gap-1.5!"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Thanh toán
                          </button>
                        </ProtectedAction>
                      )}
                    </td>
                  </tr>
                ))
              }
              dateColumnLabel="Ngày đặt"
            />
          ) : (
            <DebtEntityList
              emptyMessage="Không có công nợ nhà cung cấp"
              emptyFilteredMessage="Không tìm thấy nhà cung cấp phù hợp"
              items={filteredSuppliers}
              totalItems={supplierDebts?.suppliers.length ?? 0}
              debtTone={debtTone}
              debtColorClass={debtColorClass}
              expandedKeys={expandedKeys}
              onToggle={toggleExpanded}
              getKey={(s) => `s-${s.supplierName}-${s.phone ?? ''}`}
              renderHeader={(supplier) => ({
                name: supplier.supplierName,
                phone: supplier.phone,
                totalDebt: supplier.totalDebt,
                countLabel: `${supplier.receipts.length} phiếu nhập`,
              })}
              renderRows={(supplier) =>
                supplier.receipts.map((receipt) => (
                  <tr key={receipt.receiptId} className="hover:bg-bluesh-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-blacky-950 whitespace-nowrap">
                      {formatDate(receipt.importDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-blacky-700">
                      {formatCurrency(receipt.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <DebtProgressBar paid={receipt.paidAmount} total={receipt.totalAmount} tone={debtTone} />
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-accent-green font-medium">
                      {formatCurrency(receipt.paidAmount)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-semibold ${debtColorClass}`}>
                      {formatCurrency(receipt.remainingAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {receipt.remainingAmount > 0 && (
                        <ProtectedAction action="manage" subject="Debt">
                          <button
                            type="button"
                            onClick={() =>
                              openPaymentModal('supplier', receipt.receiptId, receipt.remainingAmount)
                            }
                            className="btn btn-secondary text-xs! h-9! px-3! rounded-lg! gap-1.5!"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Thanh toán
                          </button>
                        </ProtectedAction>
                      )}
                    </td>
                  </tr>
                ))
              }
              dateColumnLabel="Ngày nhập"
            />
          )}
        </>
      )}

      {paymentModal && (
        <DebtPaymentModal
          paymentModal={paymentModal}
          paymentAmount={paymentAmount}
          paymentNote={paymentNote}
          submitting={submitting}
          onClose={() => setPaymentModal(null)}
          onAmountChange={setPaymentAmount}
          onNoteChange={setPaymentNote}
          onSubmit={handlePayment}
        />
      )}
    </div>
  );
}

interface DebtEntityListProps<T> {
  items: T[];
  totalItems: number;
  emptyMessage: string;
  emptyFilteredMessage: string;
  debtTone: 'customer' | 'supplier';
  debtColorClass: string;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  getKey: (item: T) => string;
  renderHeader: (item: T) => {
    name: string;
    phone: string | null;
    totalDebt: number;
    countLabel: string;
  };
  renderRows: (item: T) => React.ReactNode;
  dateColumnLabel: string;
}

function DebtEntityList<T>({
  items,
  totalItems,
  emptyMessage,
  emptyFilteredMessage,
  debtColorClass,
  expandedKeys,
  onToggle,
  getKey,
  renderHeader,
  renderRows,
  dateColumnLabel,
}: DebtEntityListProps<T>) {
  if (totalItems === 0) {
    return (
      <div className="bg-basic-white rounded-xl border-2 border-basic-border flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-bluesh-50 flex items-center justify-center">
          <Receipt className="w-7 h-7 text-bluesh-300" />
        </div>
        <p className="text-blacky-500 font-medium">{emptyMessage}</p>
        <p className="text-sm text-blacky-400">Tất cả khoản nợ đã được thanh toán đủ</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-basic-white rounded-xl border-2 border-basic-border flex flex-col items-center justify-center py-12 gap-2">
        <Search className="w-10 h-10 text-blacky-200" />
        <p className="text-blacky-500">{emptyFilteredMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const key = getKey(item);
        const { name, phone, totalDebt, countLabel } = renderHeader(item);
        const isOpen = expandedKeys.has(key);

        return (
          <div
            key={key}
            className={`bg-basic-white rounded-xl border-2 overflow-hidden transition-shadow ${
              isOpen ? 'border-bluesh-200 shadow-md' : 'border-basic-border hover:border-basic-border2'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(key)}
              className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-blacky-50/50 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-bluesh-800 text-basic-white font-bold text-sm flex items-center justify-center shrink-0">
                {getInitials(name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-blacky-950 truncate">{name}</h3>
                  <span className="text-xs font-medium bg-blacky-100 text-blacky-600 px-2 py-0.5 rounded-full">
                    {countLabel}
                  </span>
                </div>
                {phone && (
                  <p className="text-sm text-blacky-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {phone}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-blacky-500">Tổng nợ</p>
                <p className={`text-lg font-bold ${debtColorClass}`}>{formatCurrency(totalDebt)}</p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-blacky-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-basic-border px-4 pb-4 md:px-5 md:pb-5">
                <div className="sm:hidden flex justify-between items-center py-3 border-b border-basic-border mb-2">
                  <span className="text-xs text-blacky-500">Tổng nợ</span>
                  <span className={`font-bold ${debtColorClass}`}>{formatCurrency(totalDebt)}</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-basic-border2 mt-2">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-bluesh-50 border-b border-bluesh-100">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-bluesh-800 uppercase tracking-wide">
                          {dateColumnLabel}
                        </th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-bluesh-800 uppercase tracking-wide">
                          Tổng tiền
                        </th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-bluesh-800 uppercase tracking-wide min-w-[140px]">
                          Tiến độ
                        </th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-bluesh-800 uppercase tracking-wide">
                          Đã trả
                        </th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-bluesh-800 uppercase tracking-wide">
                          Còn nợ
                        </th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-bluesh-800 uppercase tracking-wide">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-basic-border bg-basic-white">
                      {renderRows(item)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
