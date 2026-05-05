import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiTruck, FiX, FiCreditCard } from 'react-icons/fi';
import debtsService from '../services/debtsService';

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

interface PaymentModal {
  type: 'customer' | 'supplier';
  referenceId: number;
  remaining: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
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
  const [paymentModal, setPaymentModal] = useState<PaymentModal | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      alert('Ghi nhận thanh toán thành công!');
      setPaymentModal(null);
      setPaymentAmount('');
      setPaymentNote('');
      loadDebts();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (type: 'customer' | 'supplier', referenceId: number, remaining: number) => {
    setPaymentModal({ type, referenceId, remaining });
    setPaymentAmount('');
    setPaymentNote('');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Công nợ</h1>
        <p className="text-gray-600 text-sm mt-1">Theo dõi và quản lý công nợ</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'customers'
              ? 'bg-primary-600 text-black'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiUsers />
          Công nợ khách hàng
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'suppliers'
              ? 'bg-primary-600 text-black'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiTruck />
          Công nợ nhà cung cấp
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      ) : activeTab === 'customers' ? (
        <>
          {/* Customer Debts Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-linear-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
              <p className="text-red-100 text-sm">Tổng nợ khách hàng</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(customerDebts?.totalDebtAmount || 0)}
              </p>
            </div>
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <p className="text-blue-100 text-sm">Khách hàng đang nợ</p>
              <p className="text-3xl font-bold mt-1">{customerDebts?.totalCustomersInDebt || 0}</p>
            </div>
          </div>

          {/* Customer Debts List */}
          <div className="space-y-4">
            {(customerDebts?.customers || []).length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                Không có công nợ khách hàng
              </div>
            ) : (
              customerDebts!.customers.map((customer, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.customerName}</h3>
                      <p className="text-sm text-gray-500">{customer.phone || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tổng nợ</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(customer.totalDebt)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Ngày đặt</th>
                          <th className="text-right py-2 px-2">Tổng tiền</th>
                          <th className="text-right py-2 px-2">Đã trả</th>
                          <th className="text-right py-2 px-2">Còn nợ</th>
                          <th className="text-center py-2 px-2">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.orders.map((order) => (
                          <tr key={order.orderId} className="border-b last:border-0">
                            <td className="py-2 px-2 font-medium">{formatDate(order.orderDate)}</td>
                            <td className="py-2 px-2 text-right text-gray-500 text-sm">{formatCurrency(order.totalAmount)}</td>
                            <td className="py-2 px-2 text-right text-green-600">{formatCurrency(order.paidAmount)}</td>
                            <td className="py-2 px-2 text-right text-red-600 font-medium">{formatCurrency(order.remainingAmount)}</td>
                            <td className="py-2 px-2 text-center">
                              {order.remainingAmount > 0 && (
                                <button
                                  onClick={() => openPaymentModal('customer', order.orderId, order.remainingAmount)}
                                  className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1 mx-auto"
                                >
                                  <FiCreditCard />
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
            <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <p className="text-orange-100 text-sm">Tổng nợ nhà cung cấp</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(supplierDebts?.totalDebtAmount || 0)}
              </p>
            </div>
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <p className="text-purple-100 text-sm">NCC đang nợ</p>
              <p className="text-3xl font-bold mt-1">{supplierDebts?.totalSuppliersInDebt || 0}</p>
            </div>
          </div>

          {/* Supplier Debts List */}
          <div className="space-y-4">
            {(supplierDebts?.suppliers || []).length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                Không có công nợ nhà cung cấp
              </div>
            ) : (
              supplierDebts!.suppliers.map((supplier, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.supplierName}</h3>
                      <p className="text-sm text-gray-500">{supplier.phone || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tổng nợ</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(supplier.totalDebt)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Ngày nhập</th>
                          <th className="text-right py-2 px-2">Tổng tiền</th>
                          <th className="text-right py-2 px-2">Đã trả</th>
                          <th className="text-right py-2 px-2">Còn nợ</th>
                          <th className="text-center py-2 px-2">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplier.receipts.map((receipt) => (
                          <tr key={receipt.receiptId} className="border-b last:border-0">
                            <td className="py-2 px-2 font-medium">{formatDate(receipt.importDate)}</td>
                            <td className="py-2 px-2 text-right text-gray-500 text-sm">{formatCurrency(receipt.totalAmount)}</td>
                            <td className="py-2 px-2 text-right text-green-600">{formatCurrency(receipt.paidAmount)}</td>
                            <td className="py-2 px-2 text-right text-orange-600 font-medium">{formatCurrency(receipt.remainingAmount)}</td>
                            <td className="py-2 px-2 text-center">
                              {receipt.remainingAmount > 0 && (
                                <button
                                  onClick={() => openPaymentModal('supplier', receipt.receiptId, receipt.remainingAmount)}
                                  className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1 mx-auto"
                                >
                                  <FiCreditCard />
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
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
          onClick={() => setPaymentModal(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Ghi nhận thanh toán</h2>
                <button onClick={() => setPaymentModal(null)} title="Đóng" className="text-gray-400 hover:text-gray-600">
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền thanh toán <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Còn nợ: {formatCurrency(paymentModal.remaining)}
                </p>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModal.remaining}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập số tiền..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ghi chú thanh toán..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-black rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
