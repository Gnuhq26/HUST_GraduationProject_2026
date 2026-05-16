import React, { useState, useEffect, useCallback } from 'react';
import { Users, Truck, CreditCard } from 'lucide-react';
import debtsService from '../services/debtsService';
import { useToast } from '../components/ToastProvider';
import DebtPaymentModal, { PaymentModalData } from '../components/debts/DebtPaymentModal';

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

export default function Debts() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [customerDebts, setCustomerDebts] = useState<CustomerDebtsResponse | null>(null);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blacky-950">Quản lý Công nợ</h1>
        <p className="text-blacky-500 text-sm mt-1">Theo dõi và quản lý công nợ</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-bluesh-50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'customers'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <Users className="w-4 h-4" />Công nợ khách hàng
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <Truck className="w-4 h-4" />Công nợ nhà cung cấp
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-blacky-500">Đang tải...</div>
        </div>
      ) : activeTab === 'customers' ? (
        <>
          {/* Customer Debts Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-accent-red/10 rounded-xl border border-accent-red p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-red flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-base text-blacky-700">Tổng nợ khách hàng</p>
                  <p className="text-2xl font-bold text-accent-red">
                    {formatCurrency(customerDebts?.totalDebtAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-base text-blacky-700">Khách hàng đang nợ</p>
                  <p className="text-3xl font-bold text-bluesh-800">{customerDebts?.totalCustomersInDebt || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Debts List */}
          <div className="space-y-4">
            {(customerDebts?.customers || []).length === 0 ? (
              <div className="bg-basic-white rounded-xl border border-basic-border p-8 text-center text-blacky-500">
                Không có công nợ khách hàng
              </div>
            ) : (
              customerDebts!.customers.map((customer, idx) => (
                <div key={idx} className="bg-basic-white rounded-xl border border-basic-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-blacky-950">{customer.customerName}</h3>
                      <p className="text-base text-blacky-500">{customer.phone || ' '}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blacky-700">Tổng nợ</p>
                      <p className="text-lg font-bold text-accent-red">{formatCurrency(customer.totalDebt)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-basic-border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-bluesh-800">
                        <tr>
                          <th className="text-left py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Ngày đặt</th>
                          <th className="text-right py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Tổng tiền</th>
                          <th className="text-right py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Đã trả</th>
                          <th className="text-right py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Còn nợ</th>
                          <th className="text-center py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-basic-border">
                        {customer.orders.map((order) => (
                          <tr key={order.orderId} className="hover:bg-blacky-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-blacky-950">{formatDate(order.orderDate)}</td>
                            <td className="py-2 px-3 text-right text-blacky-700">{formatCurrency(order.totalAmount)}</td>
                            <td className="py-2 px-3 text-right text-accent-green font-medium">{formatCurrency(order.paidAmount)}</td>
                            <td className="py-2 px-3 text-right text-accent-red font-semibold">{formatCurrency(order.remainingAmount)}</td>
                            <td className="py-2 px-3 text-center">
                              {order.remainingAmount > 0 && (
                                <button
                                  onClick={() => openPaymentModal('customer', order.orderId, order.remainingAmount)}
                                  className="text-bluesh-800 hover:text-bluesh-600 text-sm font-medium inline-flex items-center gap-1 transition-colors"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Thanh toán
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Supplier Debts Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-yellowfish-50 rounded-xl border border-yellowfish-400 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellowfish-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-sm text-blacky-700">Tổng nợ nhà cung cấp</p>
                  <p className="text-2xl font-bold text-yellowfish-600">
                    {formatCurrency(supplierDebts?.totalDebtAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-sm text-blacky-700">NCC đang nợ</p>
                  <p className="text-3xl font-bold text-bluesh-800">{supplierDebts?.totalSuppliersInDebt || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Debts List */}
          <div className="space-y-4">
            {(supplierDebts?.suppliers || []).length === 0 ? (
              <div className="bg-basic-white rounded-xl border border-basic-border p-8 text-center text-blacky-500">
                Không có công nợ nhà cung cấp
              </div>
            ) : (
              supplierDebts!.suppliers.map((supplier, idx) => (
                <div key={idx} className="bg-basic-white rounded-xl border border-basic-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-blacky-950">{supplier.supplierName}</h3>
                      <p className="text-sm text-blacky-500">{supplier.phone || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blacky-700">Tổng nợ</p>
                      <p className="text-lg font-bold text-yellowfish-600">{formatCurrency(supplier.totalDebt)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-basic-border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-bluesh-800">
                        <tr>
                          <th className="text-left py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Ngày nhập</th>
                          <th className="text-right py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Tổng tiền</th>
                          <th className="text-right py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Đã trả</th>
                          <th className="text-right py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Còn nợ</th>
                          <th className="text-center py-2 px-3 text-basic-white font-medium text-xs uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-basic-border">
                        {supplier.receipts.map((receipt) => (
                          <tr key={receipt.receiptId} className="hover:bg-blacky-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-blacky-950">{formatDate(receipt.importDate)}</td>
                            <td className="py-2 px-3 text-right text-blacky-700">{formatCurrency(receipt.totalAmount)}</td>
                            <td className="py-2 px-3 text-right text-accent-green font-medium">{formatCurrency(receipt.paidAmount)}</td>
                            <td className="py-2 px-3 text-right text-yellowfish-600 font-semibold">{formatCurrency(receipt.remainingAmount)}</td>
                            <td className="py-2 px-3 text-center">
                              {receipt.remainingAmount > 0 && (
                                <button
                                  onClick={() => openPaymentModal('supplier', receipt.receiptId, receipt.remainingAmount)}
                                  className="text-bluesh-800 hover:text-bluesh-600 text-sm font-medium inline-flex items-center gap-1 transition-colors"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Thanh toán
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
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
