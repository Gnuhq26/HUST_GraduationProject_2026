import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShoppingBag, ShoppingCart, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { productsService } from '../services/productsService';
import { customersService } from '../services/customersService';
import ordersService from '../services/ordersService';
import reportsService from '../services/reportsService';
import AiInsightsWidget from '../components/ai-analyst/AiInsightsWidget';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import RevenueByCategoryChart from '../components/dashboard/RevenueByCategoryChart';
import VirtualInventoryTrendChart from '../components/dashboard/VirtualInventoryTrendChart';
import type { Order, PaginatedResult, Product, Customer } from '@/types';
import EmptyShoppingCard from '../assets/empty_orders.png';


interface DashboardStats {
  products: number;
  orders: number;
  customers: number;
  revenue: number;
}

interface StatCard {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  labelColor: string;
  valueColor: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', currencyDisplay: 'code' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

type DatePreset = '7d' | '30d' | '90d';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    const days = datePreset === '7d' ? 7 : datePreset === '30d' ? 30 : 90;
    start.setDate(end.getDate() - days + 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: fmt(start), endDate: fmt(end) };
  }, [datePreset]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [productsRes, customersRes, ordersRes, revenueRes] = await Promise.all([
          productsService.getAll({ isActive: true }).catch((): Product[] => []),
          customersService.getAll().catch((): PaginatedResult<Customer> => ({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } })),
          ordersService.getAll().catch((): PaginatedResult<Order> => ({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } })),
          reportsService.getRevenueReport('2020-01-01', today).catch(() => ({ totalRevenue: 0 })),
        ]);

        const orders = ordersRes.data;
        const revenue = (revenueRes as { totalRevenue: number }).totalRevenue;

        setStats({
          products: productsRes.length,
          customers: customersRes.meta?.total ?? customersRes.data.length,
          orders: ordersRes.meta?.total ?? orders.length,
          revenue,
        });

        // 5 đơn hàng gần nhất
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards: StatCard[] = [
    { icon: ShoppingBag, label: 'Sản phẩm', value: stats.products, color: 'text-bluesh-800', bg: 'bg-basic-white', labelColor: 'text-blacky-700', valueColor: 'text-bluesh-800' },
    { icon: ShoppingCart, label: 'Đơn hàng', value: stats.orders, color: 'text-yellowfish-400', bg: 'bg-basic-white', labelColor: 'text-blacky-700', valueColor: 'text-yellowfish-400' },
    { icon: Users, label: 'Khách hàng', value: stats.customers, color: 'text-yellowfish-700', bg: 'bg-basic-white', labelColor: 'text-blacky-700', valueColor: 'text-yellowfish-700' },
    { icon: TrendingUp, label: 'Doanh thu', value: formatCurrency(stats.revenue), color: 'text-accent-green', bg: 'bg-basic-white', labelColor: 'text-blacky-700', valueColor: 'text-accent-green' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blacky-950">Dashboard</h1>
        <p className="text-blacky-600 mt-1">Tổng quan hệ thống quản lý bán hàng</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-basic-white rounded-xl border border-basic-border2 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-3xl font-bold truncate ${stat.valueColor}`}>{stat.value}</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
                ) : (
                  <p className={`text-sm font-medium my-2 ${stat.labelColor}`}>{stat.label}</p>
                )}
              </div>
              <div className={`shrink-0 ${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-9 h-9" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date Preset Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text text-blacky-800 mr-1">Kỳ phân tích:</span>
        {(['7d', '30d', '90d'] as DatePreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setDatePreset(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              datePreset === p
                ? 'bg-bluesh-800 text-basic-white border-bluesh-800'
                : 'bg-basic-white text-blacky-700 border-basic-border hover:border-bluesh-800 hover:text-bluesh-800'
            }`}
          >
            {p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : '90 ngày'}
          </button>
        ))}
      </div>

      {/* Charts Row 1: Top Products + Revenue By Category */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-6">
        <div className="lg:col-span-4">
          <TopProductsChart startDate={startDate} endDate={endDate} />
        </div>
        <div className="lg:col-span-3">
          <RevenueByCategoryChart startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* Charts Row 2: Virtual Inventory Trend */}
      <div className="mb-6">
        <VirtualInventoryTrendChart startDate={startDate} endDate={endDate} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn hàng gần đây */}
        <div className="bg-basic-white rounded-xl border border-basic-border2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blacky-950">Đơn hàng gần đây</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center pt-6">
              <div className="inline-flex items-center justify-center w-48 h-48">
                <img src={EmptyShoppingCard} alt="Chưa có đơn hàng" className="w-48 h-48" />
              </div>
              <p className="text-blacky-500">Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order.OrderID} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bluesh-800">
                      {order.customer?.CustomerName || 'Khách vãng lai'}
                    </p>
                    <p className="text-xs text-blacky-600">{formatDate(order.OrderDate)}</p>
                  </div>
                  <span className="text-sm text-accent-green font-semibold">
                    {formatCurrency(parseFloat(order.TotalAmount || '0'))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thống kê nhanh */}
        <div className="bg-basic-white rounded-xl border border-basic-border2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blacky-950">Thống kê nhanh</h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-bluesh-800 font-medium">Tổng sản phẩm</span>
                <span className="text-lg font-bold text-bluesh-800">{stats.products}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-yellowfish-400 font-medium">Tổng đơn hàng</span>
                <span className="text-lg font-bold text-yellowfish-400">{stats.orders}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-yellowfish-700 font-medium">Tổng khách hàng</span>
                <span className="text-lg font-bold text-yellowfish-700">{stats.customers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-accent-green font-medium">Tổng doanh thu</span>
                <span className="text-lg font-bold text-accent-green">{formatCurrency(stats.revenue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Business Analyst */}
      <div className="mt-6">
        <AiInsightsWidget />
      </div>
    </div>
  );
}
