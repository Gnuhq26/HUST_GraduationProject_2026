import { useState, useEffect } from 'react';
import { X, Truck, Phone, MapPin, FileBox, Banknote, Calendar, Loader2, CheckCircle, Clock } from 'lucide-react';
import suppliersService from '../../services/suppliersService';
import inventoryService from '../../services/inventoryService';
import type { Supplier, StockReceipt } from '@/types';

interface Props {
  supplierId: number;
  onClose: () => void;
}

export default function SupplierDetailModal({ supplierId, onClose }: Props) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [supplierData, receiptData] = await Promise.all([
          suppliersService.getById(supplierId),
          inventoryService.getStockReceipts(supplierId),
        ]);
        setSupplier(supplierData);
        setReceipts(receiptData);
      } catch (err) {
        console.error('Lỗi tải chi tiết nhà cung cấp:', err);
        setError('Không thể tải thông tin nhà cung cấp');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [supplierId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return '0đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code',
    }).format(Number(amount));
  };

  const totalAmount = receipts.reduce((sum, r) => sum + Number(r.TotalAmount), 0);

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-basic-white rounded-2xl border border-basic-border max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 flex items-center justify-between shrink-0 bg-basic-white z-10">
          <h2 className="text-xl font-bold text-blacky-950">Chi tiết nhà cung cấp</h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-2 rounded-lg bg-bluesh-50 text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable area */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-bluesh-800" />
                <span className="ml-3 text-blacky-500">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-accent-red">{error}</p>
                <button onClick={onClose} className="mt-4 btn btn-secondary">
                  Đóng
                </button>
              </div>
            ) : supplier ? (
              <div className="space-y-6">
                {/* Supplier Info Card */}
                <div className="bg-bluesh-50 border border-bluesh-800/20 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-bluesh-800 rounded-full shadow-sm">
                      <Truck className="w-8 h-8 text-basic-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blacky-950">
                        {supplier.SupplierName}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-semibold text-blacky-700 uppercase mb-3">
                    Thông tin liên hệ
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-bluesh-50 rounded-lg">
                      <Phone className="w-5 h-5 text-bluesh-800 mr-2 shrink-0" />
                      <div>
                        <p className="text-xs text-blacky-700">Số điện thoại</p>
                        <p className="text-sm font-medium text-blacky-950">
                          {supplier.Phone ?? '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-bluesh-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-bluesh-800 mr-2 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-blacky-700">Địa chỉ</p>
                        <p className="text-sm font-medium text-blacky-950">
                          {supplier.Address ?? '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {receipts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blacky-700 uppercase mb-3">
                      Tổng quan nhập hàng
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-4 bg-basic-white border border-bluesh-800 rounded-xl">
                        <div className="p-3 bg-bluesh-800 rounded-lg">
                          <FileBox className="w-6 h-6 text-basic-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blacky-700">Số phiếu nhập</p>
                          <p className="text-2xl font-bold text-bluesh-800">{receipts.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-basic-white border border-accent-green rounded-xl">
                        <div className="p-3 bg-accent-green rounded-lg">
                          <Banknote className="w-6 h-6 text-basic-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blacky-700">Tổng giá trị</p>
                          <p className="text-lg font-bold text-accent-green leading-tight">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Receipt List */}
                {receipts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blacky-700 uppercase mb-3">
                      Chi tiết phiếu nhập
                    </h4>
                    <div className="space-y-3">
                      {receipts.map((receipt) => {
                        const debt = Number(receipt.TotalAmount) - Number(receipt.PaidAmount);
                        const isReceived = receipt.Status === 'Received';
                        return (
                          <div
                            key={receipt.ReceiptID}
                            className="p-4 bg-basic-white border border-basic-border rounded-xl hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-bluesh-800">
                                  {receipt.ReceiptCode ?? `Phiếu #${receipt.ReceiptID}`}
                                </p>
                                <p className="text-xs text-blacky-600 flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(receipt.ImportDate)}
                                </p>
                              </div>
                              {isReceived ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green">
                                  <CheckCircle className="w-3 h-3" />
                                  Đã nhận
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellowfish-50 text-yellowfish-600">
                                  <Clock className="w-3 h-3" />
                                  Chờ nhận
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-basic-border">
                              <div>
                                <p className="text-xs text-blacky-700">Tổng tiền</p>
                                <p className="text-sm font-bold text-blacky-950">
                                  {formatCurrency(receipt.TotalAmount)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-blacky-700">Đã thanh toán</p>
                                <p className="text-sm font-semibold text-accent-green">
                                  {formatCurrency(receipt.PaidAmount)}
                                </p>
                              </div>
                            </div>

                            {debt > 0 && (
                              <div className="mt-2 p-2 bg-yellowfish-50 border border-yellowfish-400/30 rounded-lg flex items-center gap-2">
                                <span className="text-xs text-yellowfish-700">
                                  Còn nợ: <strong>{formatCurrency(debt)}</strong>
                                </span>
                              </div>
                            )}

                            {receipt.Note && (
                              <div className="mt-2 text-xs text-blacky-600 italic">
                                Ghi chú: {receipt.Note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {receipts.length === 0 && (
                  <div className="text-center py-6 text-blacky-500 text-sm">
                    Chưa có phiếu nhập nào
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <h4 className="text-sm font-semibold text-blacky-700 uppercase mb-3">
                    Thông tin hệ thống
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-bluesh-800" />
                      <span className="text-blacky-700">Ngày tạo:</span>
                      <span className="font-medium text-blacky-950">{formatDate(supplier.CreatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-bluesh-800" />
                      <span className="text-blacky-700">Cập nhật lần cuối:</span>
                      <span className="font-medium text-blacky-950">{formatDate(supplier.UpdatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {!loading && !error && (
            <div className="px-6 py-4 border-t border-basic-border flex justify-center">
              <button onClick={onClose} className="btn btn-secondary w-[30%] rounded-lg">
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
