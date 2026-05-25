import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { X, User, Phone, MapPin, Calendar, ShoppingCart, Loader2, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { customersService } from '../../services/customersService';
import type { Customer, Order } from '@/types';

interface Props {
  customerId: number;
  onClose: () => void;
}

interface StatusBadge {
  label: string;
  color: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export default function CustomerDetailModal({ customerId, onClose }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomerDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await customersService.getById(customerId);
        setCustomer(data);
      } catch (err) {
        console.error('Lỗi tải chi tiết khách hàng:', err);
        setError('Không thể tải thông tin khách hàng');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomerDetail();
    }
  }, [customerId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
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

  const getStatusBadge = (order: Order): StatusBadge => {
    const debt = Number(order.TotalAmount) - Number(order.PaidAmount);
    
    if (debt > 0) {
      return { 
        label: 'Chưa thanh toán', 
        color: 'bg-yellowfish-50 text-yellowfish-700', 
        icon: DollarSign 
      };
    }
    
    const statusConfig: Record<string, StatusBadge> = {
      Completed: { label: 'Hoàn thành', color: 'bg-accent-green/10 text-accent-green', icon: CheckCircle },
      Pending: { label: 'Chờ xử lý', color: 'bg-yellowfish-50 text-yellowfish-600', icon: Clock },
      Cancelled: { label: 'Đã hủy', color: 'bg-accent-red/10 text-accent-red', icon: XCircle },
    };
    
    return statusConfig[order.Status] || { label: order.Status, color: 'bg-blacky-100 text-blacky-700', icon: Clock };
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-60 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 flex items-center justify-between shrink-0 bg-basic-white z-10">
          <h2 className="text-xl font-bold text-blacky-950">Chi tiết khách hàng</h2>
          <button onClick={onClose} title="Đóng" className="p-2 rounded-lg bg-bluesh-50 text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable area */}
        <div className="overflow-y-auto flex-1">
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-bluesh-800" />
              <span className="ml-3 text-blacky-500">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-accent-red">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 btn btn-secondary"
              >
                Đóng
              </button>
            </div>
          ) : customer ? (
            <div className="space-y-6">
              {/* Customer Info Card */}
              <div className="bg-bluesh-50 border border-bluesh-800/20 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-bluesh-800 rounded-full shadow-sm">
                    <User className="w-8 h-8 text-basic-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-blacky-950 mb-1">
                      {customer.CustomerName}
                    </h3>
                    <p className="text-sm text-blacky-500">
                      {customer.CustomerCode && (
                        <span className="font-mono font-medium text-bluesh-800  px-0.5 py-0.5 rounded-lg mr-2">
                          {customer.CustomerCode}
                        </span>
                      )}
                    </p>
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
                        {customer.Phone || <span className="text-blacky-400 italic">Chưa có</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-bluesh-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-bluesh-800 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blacky-700">Địa chỉ</p>
                      <p className="text-sm font-medium text-blacky-950">
                        {customer.Address || <span className="text-blacky-400 italic">Chưa có</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Summary */}
              {customer.orders && customer.orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blacky-700 uppercase mb-3">
                    Lịch sử mua hàng
                  </h4>
                  <div className="flex items-center gap-3 p-4 bg-basic-white border border-accent-green rounded-xl">
                    <div className="p-3 bg-accent-green rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-basic-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blacky-700">Đơn hàng gần đây</p>
                      <p className="text-2xl font-bold text-accent-green">
                        {customer.orders.length} đơn
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders List */}
              {customer.orders && customer.orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blacky-700 uppercase mb-3">
                    Chi tiết đơn hàng
                  </h4>
                  <div className="space-y-3">
                    {customer.orders.map((order) => {
                      const status = getStatusBadge(order);
                      const debt = Number(order.TotalAmount) - Number(order.PaidAmount);
                      
                      return (
                        <div 
                          key={order.OrderID}
                          className="p-4 bg-basic-white border border-basic-border rounded-xl hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-blacky-950">
                                Đơn hàng {order.OrderCode}
                              </p>
                              <p className="text-xs text-blacky-600 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(order.OrderDate)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-basic-border">
                            <div>
                              <p className="text-xs text-blacky-700">Tổng tiền</p>
                              <p className="text-sm font-bold text-blacky-950">
                                {formatCurrency(order.TotalAmount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-blacky-700">Đã trả</p>
                              <p className="text-sm font-semibold text-accent-green">
                                {formatCurrency(order.PaidAmount)}
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

                          {order.Note && (
                            <div className="mt-2 text-xs text-gray-600 italic">
                              Ghi chú: {order.Note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                    <span className="font-medium text-blacky-950">
                      {formatDate(customer.CreatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-bluesh-800" />
                    <span className="text-blacky-700">Cập nhật lần cuối:</span>
                    <span className="font-medium text-blacky-950">
                      {formatDate(customer.UpdatedAt)}
                    </span>
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
