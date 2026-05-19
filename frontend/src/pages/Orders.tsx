import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, User, Download, Loader2, Calendar } from 'lucide-react';
import ordersService from '../services/ordersService';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import CreateOrderModal from '../components/orders/CreateOrderModal';
import ProtectedAction from '../components/ProtectedAction';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import type { Order } from '@/types';

interface OrderWithCount extends Order {
  _count?: { details: number };
}

type StatusTab = 'All' | 'Pending' | 'Completed' | 'Cancelled';

interface ConfirmState {
  open: boolean;
  orderId: number | null;
  orderCode: string | null;
  action: 'fulfill' | 'cancel' | null;
}

function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState<OrderWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusTab>('All');
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, orderId: null, orderCode: null, action: null });

  // Load orders — limit=1000 đảm bảo tải đủ đơn để tab counts chính xác
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersService.getAll({ limit: 1000 });
      setOrders((Array.isArray(res) ? res : (res as { data?: OrderWithCount[] })?.data ?? []) as OrderWithCount[]);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Alias — dùng sau các mutation để reload
  const reloadOrders = loadOrders;

  // Export Excel
  const handleExport = async () => {
    try {
      setExporting(true);
      await ordersService.exportOrders();
      toast.success('Xuất Excel thành công!');
    } catch (err) {
      console.error('Error exporting orders:', err);
      toast.error('Có lỗi khi xuất Excel');
    } finally {
      setExporting(false);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
  };

  // Hoàn tất đơn đặt trước
  const handleFulfillOrder = (orderId: number, orderCode: string) => {
    setConfirmState({ open: true, orderId, orderCode, action: 'fulfill' });
  };

  // Hủy đơn hàng
  const handleCancelOrder = (orderId: number, orderCode: string) => {
    setConfirmState({ open: true, orderId, orderCode, action: 'cancel' });
  };

  const handleConfirmAction = async () => {
    const { orderId, action } = confirmState;
    if (!orderId || !action) return;
    setConfirmState({ open: false, orderId: null, orderCode: null, action: null });

    if (action === 'fulfill') {
      try {
        await ordersService.fulfillOrder(orderId);
        toast.success('Hoàn tất đơn hàng thành công!');
        reloadOrders();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi hoàn tất đơn hàng');
      }
    } else {
      try {
        const res = await ordersService.cancelOrder(orderId);
        const refund = Number(res.refundAmount || 0);
        if (refund > 0) {
          toast.info(`Đã hủy đơn hàng. Cần hoàn tiền cọc: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refund)}`);
        } else {
          toast.success('Đã hủy đơn hàng thành công!');
        }
        reloadOrders();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
      }
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string): React.ReactElement => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Completed: { className: 'bg-accent-green text-basic-white', label: 'Hoàn thành' },
      Pending:   { className: 'bg-yellowfish-300 text-basic-white', label: 'Chờ xử lý' },
      Cancelled: { className: 'bg-accent-red text-basic-white',    label: 'Đã hủy' },
    };
    const config = statusMap[status] ?? statusMap['Completed'];
    return (
      <span className={`px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const TABS: { key: StatusTab; label: string }[] = [
    { key: 'All',       label: 'Tất cả' },
    { key: 'Pending',   label: 'Chờ xử lý' },
    { key: 'Completed', label: 'Hoàn thành' },
    { key: 'Cancelled', label: 'Đã hủy' },
  ];

  const filteredOrders = activeTab === 'All' ? orders : orders.filter((o) => o.Status === activeTab);
  const tabCount = (key: StatusTab) => key === 'All' ? orders.length : orders.filter((o) => o.Status === key).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-blacky-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-blacky-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-blacky-100 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 bg-blacky-100 rounded-lg animate-pulse" />)}
        </div>
        <div className="bg-basic-white rounded-xl border border-basic-border overflow-hidden">
          <div className="divide-y divide-basic-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-4 w-28 bg-blacky-100 rounded" />
                <div className="h-4 w-32 bg-blacky-100 rounded" />
                <div className="h-4 w-40 bg-blacky-100 rounded" />
                <div className="h-4 w-24 bg-blacky-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blacky-950">Quản lý Đơn hàng</h1>
          <p className="text-blacky-500 text-sm mt-1">Tạo và theo dõi đơn hàng bán hàng</p>
        </div>
        <div className="flex gap-3">
          <ProtectedAction action="read" subject="Order">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-secondary gap-2 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </ProtectedAction>
          <ProtectedAction action="create" subject="Order">
            <button onClick={handleOpenCreate} className="btn btn-primary gap-2">
              <Plus className="w-4 h-4" />
              Tạo đơn hàng
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-basic-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-yellowfish-400 text-bluesh-800'
                : 'border-transparent text-blacky-500 hover:text-blacky-700'
            }`}
          >
            {tab.label}
            <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === tab.key ? 'bg-bluesh-800 text-basic-white' : 'bg-blacky-100 text-blacky-500'
            }`}>
              {tabCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-blacky-400">
          <ShoppingCart className="w-12 h-12" />
          <p className="text-sm">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.OrderID}
              onClick={() => setSelectedOrderId(order.OrderID)}
              className="bg-basic-white rounded-xl border border-blacky-200 p-4 cursor-pointer hover:shadow-md hover:border-bluesh-800/30 transition-all"
            >
              {/* Top: OrderCode + Status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blacky-700 bg-yellowfish-50 px-2.5 py-1 rounded-lg truncate max-w-[55%]">
                  {order.OrderCode || `#${order.OrderID}`}
                </span>
                {getStatusBadge(order.Status)}
              </div>

              {/* Middle: Customer */}
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blacky-900 shrink-0" />
                <span className="text-sm font-medium text-blacky-900 truncate">
                  {order.customer?.CustomerName || 'Khách vãng lai'}
                </span>
              </div>

              {/* Bottom: Date */}
              <div className="flex items-center gap-1.5 text-xs text-blacky-700">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{formatDate(order.OrderDate)}</span>
              </div>

              {/* Actions for Pending orders */}
              {order.Status === 'Pending' && (
                <div
                  className="flex items-center gap-2 mt-3 pt-3 border-t border-basic-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleFulfillOrder(order.OrderID, order.OrderCode || `#${order.OrderID}`)}
                    className="flex-1 text-xs font-medium text-accent-green border border-accent-green/30 bg-accent-green/5 hover:bg-accent-green/10 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors"
                  >
                    Hoàn tất
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order.OrderID, order.OrderCode || `#${order.OrderID}`)}
                    className="flex-1 text-xs font-medium text-accent-red border border-accent-red/30 bg-accent-red/5 hover:bg-accent-red/10 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateOrderModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={reloadOrders}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.action === 'fulfill' ? 'Hoàn tất đơn hàng?' : 'Hủy đơn hàng?'}
        message={
          confirmState.action === 'fulfill'
            ? `Xác nhận hoàn tất đơn hàng ${confirmState.orderCode}? Thao tác này không thể hoàn tác.`
            : `Xác nhận hủy đơn hàng ${confirmState.orderCode}? Nếu đã đặt cọc sẽ cần hoàn tiền.`
        }
        confirmLabel={confirmState.action === 'fulfill' ? 'Hoàn tất' : 'Xác nhận hủy'}
        variant={confirmState.action === 'cancel' ? 'danger' : 'default'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ open: false, orderId: null, orderCode: null, action: null })}
      />

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

export default Orders;
