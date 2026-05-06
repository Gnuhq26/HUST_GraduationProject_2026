import { useState, useEffect } from 'react';
import { X, FileText, User, Calendar, Package, DollarSign, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import ordersService from '../../services/ordersService';
import { useToast } from '../ToastProvider';
import type { Order } from '@/types';

interface Props {
  orderId: number;
  onClose: () => void;
}

function OrderDetailModal({ orderId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error loading order detail:', err);
      toast.error('Có lỗi khi tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code',
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: typeof CheckCircle; className: string; label: string }> = {
      Completed: { icon: CheckCircle, className: 'bg-accent-green/10 text-accent-green', label: 'Hoàn thành' },
      Pending:   { icon: Clock,        className: 'bg-yellowfish-50 text-yellowfish-600', label: 'Chờ xử lý' },
      Cancelled: { icon: XCircle,      className: 'bg-accent-red/10 text-accent-red',    label: 'Đã hủy' },
    };
    const cfg = map[status] ?? map['Completed'];
    const Icon = cfg.icon;
    return (
      <span className={`px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${cfg.className}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const debt = order ? Number(order.TotalAmount) - Number(order.PaidAmount ?? 0) : 0;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 sticky top-0 bg-basic-white z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-blacky-500" />
                <h2 className="text-lg font-semibold text-blacky-950">
                  {order?.OrderCode || `Chi tiết đơn hàng #${orderId}`}
                </h2>
                {order && getStatusBadge(order.Status)}
              </div>
              {order && (
                <div className="flex items-center gap-1.5 text-sm text-blacky-700">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(order.OrderDate)}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-bluesh-50 hover:text-basic-white hover:bg-bluesh-800 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 gap-3 text-blacky-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-blacky-400">
              <FileText className="w-12 h-12" />
              <p className="text-sm">Không tìm thấy đơn hàng</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer + Staff Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blacky-50 rounded-xl border border-bluesh-700 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blacky-700 mb-2">
                    <User className="w-4 h-4" />
                    <span>Thông tin khách hàng</span>
                  </div>
                  <div className="font-semibold text-blacky-950">
                    {order.customer?.CustomerName || 'Khách vãng lai'}
                  </div>
                  {order.customer && (
                    <>
                      <div className="text-sm text-blacky-700 mt-1">{order.customer.Phone}</div>
                      {order.customer.Address && (
                        <div className="text-sm text-blacky-700 mt-0.5">{order.customer.Address}</div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-blacky-50 rounded-xl border border-bluesh-700 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blacky-700 mb-2">
                    <User className="w-4 h-4" />
                    <span>Nhân viên bán hàng</span>
                  </div>
                  <div className="font-semibold text-blacky-950">
                    {order.user?.FullName || order.user?.Email}
                  </div>
                  <div className="text-sm text-blacky-700 mt-1">{order.user?.Email}</div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bluesh-50 rounded-xl border border-bluesh-700 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-bluesh-800 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Tổng tiền</span>
                  </div>
                  <div className="font-bold text-xl text-bluesh-800">
                    {formatCurrency(order.TotalAmount)}
                  </div>
                </div>

                <div className="bg-accent-green/5 rounded-xl border border-accent-green p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent-green mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Đã thanh toán</span>
                  </div>
                  <div className="font-bold text-xl text-accent-green">
                    {formatCurrency(order.PaidAmount ?? 0)}
                  </div>
                </div>

                <div className={`rounded-xl border border-yellowfish-400 p-4 ${debt > 0 ? 'bg-yellowfish-50' : 'bg-blacky-50'}`}>
                  <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${debt > 0 ? 'text-yellowfish-700' : 'text-blacky-500'}`}>
                    <DollarSign className="w-4 h-4" />
                    <span>Còn nợ</span>
                  </div>
                  <div className={`font-bold text-xl ${debt > 0 ? 'text-yellowfish-700' : 'text-blacky-500'}`}>
                    {formatCurrency(debt)}
                  </div>
                </div>
              </div>

              {/* Note */}
              {order.Note && (
                <div className="bg-yellowfish-50 rounded-xl border border-basic-border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellowfish-700 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Ghi chú</span>
                  </div>
                  <p className="text-sm text-blacky-700">{order.Note}</p>
                </div>
              )}

              {/* Products Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-bluesh-800" />
                  <h3 className="font-semibold text-bluesh-800">Danh sách sản phẩm</h3>
                  <span className="text-sm text-bluesh-900">({(order.details || []).length} sản phẩm)</span>
                </div>

                <div className="bg-basic-white rounded-xl border border-blacky-500 overflow-hidden">
                  <table className="min-w-full divide-y divide-basic-border">
                    <thead>
                      <tr className="bg-bluesh-800">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wider">Sản phẩm</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wider">Đơn vị</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-basic-white uppercase tracking-wider">Số lượng</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-basic-white uppercase tracking-wider">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-basic-white uppercase tracking-wider">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-basic-border">
                      {(order.details || []).map((detail) => {
                        const totalPrice = Number(detail.Quantity) * Number(detail.UnitPrice);
                        return (
                          <tr key={detail.DetailID} className="hover:bg-blacky-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="text-sm text-blacky-700">
                                {detail.product?.ProductName || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-blacky-700">{detail.product?.SKU || '-'}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-blacky-700">
                                {detail.UnitName}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-blacky-700">
                                {formatQuantity(detail.Quantity)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-blacky-700">{formatCurrency(detail.UnitPrice)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-blacky-800">
                                {formatCurrency(totalPrice)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-basic-white">
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-right font-semibold text-blacky-700">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-lg font-bold text-blacky-800">
                            {formatCurrency(order.TotalAmount)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-basic-border bg-basic-white">
          <button onClick={onClose} className="btn btn-secondary mx-auto block w-[30%]">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
