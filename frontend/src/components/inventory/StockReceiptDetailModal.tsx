import { useState, useEffect } from 'react';
import { X, FileText, Truck, Calendar, Package, CheckCircle } from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import ConfirmModal from '../ConfirmModal';
import { useToast } from '../ToastProvider';
import type { StockReceipt } from '@/types';

interface Props {
  receiptId: number;
  onClose: () => void;
  onConfirmed?: () => void;
}

function StockReceiptDetailModal({ receiptId, onClose, onConfirmed }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<StockReceipt | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadReceiptDetail();
  }, [receiptId]);

  const loadReceiptDetail = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getStockReceiptById(receiptId);
      setReceipt(data);
    } catch (err) {
      console.error('Error loading receipt detail:', err);
      toast.error('Có lỗi khi tải chi tiết phiếu nhập');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code'
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatQuantity = (quantity: number | string) => {
    return Number(quantity).toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 sticky top-0 bg-basic-white z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-blacky-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-bluesh-800" />
                {receipt?.ReceiptCode || `Chi tiết phiếu nhập #${receiptId}`}
              </h2>
              {receipt && (
                <div className="flex items-center gap-4 text-blacky-500 text-sm mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(receipt.ImportDate)}</span>
                  </div>
                </div>
              )}
            </div>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-blacky-50 hover:text-basic-white hover:bg-bluesh-800 rounded-lg p-2 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-blacky-400 font-medium">Đang tải dữ liệu...</div>
            </div>
          ) : !receipt ? (
            <div className="flex flex-col items-center justify-center h-64 text-blacky-400">
              <FileText className="w-12 h-12 mb-3 text-blacky-200" />
              <p>Không tìm thấy phiếu nhập</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Receipt Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blacky-50 rounded-xl p-4 border border-basic-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-blacky-500 mb-1">
                    <Truck className="w-4 h-4" />
                    <span>Nhà cung cấp</span>
                  </div>
                  <div className="font-semibold text-blacky-950">
                    {receipt.supplier?.SupplierName || 'N/A'}
                  </div>
                  <div className="text-sm text-blacky-700 mt-1">
                    Số ĐT: {receipt.supplier?.Phone || '-'}
                  </div>
                  <div className="text-sm text-blacky-700 mt-1">
                    Địa chỉ: {receipt.supplier?.Address || '-'}
                  </div>
                </div>

                <div className="bg-blacky-50 rounded-xl p-4 border border-basic-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-blacky-500 mb-1">
                    <span>Tổng giá trị</span>
                  </div>
                  <div className="font-bold text-2xl text-accent-green">
                    {formatCurrency(receipt.TotalAmount)}
                  </div>
                </div>
              </div>

              {/* Note */}
              {receipt.Note && (
                <div className="bg-bluesh-50 rounded-xl p-4 border border-bluesh-800/20">
                  <div className="flex items-center gap-2 text-sm text-bluesh-800 font-medium mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Ghi chú</span>
                  </div>
                  <p className="text-blacky-700">{receipt.Note}</p>
                </div>
              )}

              {/* Products Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-blacky-700" />
                  <h3 className="font-semibold text-blacky-950">Danh sách sản phẩm</h3>
                  <span className="text-sm text-blacky-400">
                    ({(receipt.details || []).length} sản phẩm)
                  </span>
                </div>

                <div className="bg-basic-white rounded-xl border border-basic-border overflow-hidden">
                  <table className="min-w-full divide-y divide-basic-border">
                    <thead className="bg-bluesh-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-basic-white uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                          Chiết khấu
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                          Tiền CK
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-basic-white divide-y divide-basic-border">
                      {(receipt.details || []).map((detail) => {
                        const totalPrice = Number(detail.Quantity) * Number(detail.UnitPrice);
                        return (
                          <tr key={detail.DetailID} className="hover:bg-blacky-50">
                            <td className="px-4 py-4">
                              <div className="font-medium text-blacky-950">
                                {detail.product?.ProductName || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-bluesh-50 text-bluesh-800 rounded">
                                {detail.UnitName}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-semibold text-blacky-950">
                                {formatQuantity(detail.Quantity)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm text-blacky-700">
                                {formatCurrency(detail.UnitPrice)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-blacky-700">
                                {Number(detail.DiscountRate)*100}%
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-blacky-500">
                                {formatCurrency(Number(detail.Quantity) * Number(detail.UnitPrice) * (Number(detail.DiscountRate) || 0))}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-semibold text-accent-green">
                                {formatCurrency(totalPrice)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-blacky-50 divide-y divide-basic-border">
                      {(() => {
                        const subtotal = (receipt.details || []).reduce(
                          (sum, d) => sum + Number(d.Quantity) * Number(d.UnitPrice), 0
                        );
                        const totalDiscount = (receipt.details || []).reduce(
                          (sum, d) => sum + Number(d.Quantity) * Number(d.UnitPrice) * Number(d.DiscountRate || 0), 0
                        );
                        return (
                          <>
                            <tr>
                              <td colSpan={6} className="px-4 py-2 text-right text-sm text-blacky-500">Tổng tiền hàng:</td>
                              <td className="px-4 py-2 text-center text-sm text-blacky-950 font-medium">{formatCurrency(subtotal)}</td>
                            </tr>
                            <tr>
                              <td colSpan={6} className="px-4 py-2 text-right text-sm text-blacky-500">Tổng chiết khấu:</td>
                              <td className="px-4 py-2 text-center text-sm text-blacky-950 font-medium">{formatCurrency(totalDiscount)}</td>
                            </tr>
                            <tr>
                              <td colSpan={6} className="px-4 py-3 text-right font-semibold text-blacky-700">Tổng thanh toán:</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-lg font-bold text-accent-green">{formatCurrency(receipt.TotalAmount)}</span>
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-basic-border bg-basic-white flex gap-3 justify-center">
          {receipt?.Status === 'Pending' && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={confirming}
              className="btn btn-primary w-[30%]!  rounded-lg!"
            >
              <CheckCircle className="w-4 h-4" />
              {confirming ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary w-[30%]! rounded-lg!">
            Đóng
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận nhận hàng"
        message="Xác nhận đã nhận hàng cho phiếu nhập này? Tồn kho sẽ được cập nhật ngay lập tức."
        confirmLabel="Xác nhận nhận hàng"
        variant="default"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          try {
            setConfirming(true);
            await inventoryService.confirmReceipt(receiptId);
            toast.success('Xác nhận nhận hàng thành công!');
            onConfirmed?.();
            loadReceiptDetail();
          } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
          } finally {
            setConfirming(false);
          }
        }}
      />
    </div>
  );
}

export default StockReceiptDetailModal;
