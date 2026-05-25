import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, FileText, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { productsService } from '../services/productsService';
import { customersService } from '../services/customersService';
import ordersService from '../services/ordersService';
import reportsService from '../services/reportsService';
import AiInsightsWidget from '../components/ai-analyst/AiInsightsWidget';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import RevenueByCategoryChart from '../components/dashboard/RevenueByCategoryChart';
import VirtualInventoryTrendChart from '../components/dashboard/VirtualInventoryTrendChart';
import MonthlyRevenueChart from '../components/dashboard/MonthlyRevenueChart';
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
    { icon: Package, label: 'Sản phẩm', value: stats.products, color: 'text-bluesh-800', bg: 'bg-basic-white', labelColor: 'text-blacky-700', valueColor: 'text-bluesh-800' },
    { icon: FileText, label: 'Đơn hàng', value: stats.orders, color: 'text-yellowfish-400', bg: 'bg-basic-white', labelColor: 'text-blacky-700', valueColor: 'text-yellowfish-400' },
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

      {/* Analytics Bar Chart */}
      <div className="mb-6">
        <MonthlyRevenueChart />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn hàng gần đây */}
        <div className="bg-basic-white rounded-xl border border-basic-border2 p-6 flex flex-col gap-3.5">
          {/* Card header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-blacky-950">Đơn hàng gần đây</h3>
            <Link to="/orders" className="text-sm font-medium text-bluesh-800 underline underline-offset-2 hover:opacity-80 transition-opacity">
              Xem tất cả
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 bg-blacky-100 animate-pulse rounded" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-6">
              <img src={EmptyShoppingCard} alt="Chưa có đơn hàng" className="w-32 h-32 mx-auto" />
              <p className="text-blacky-500 text-sm mt-2">Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div className="rounded-[14px] overflow-hidden">
              {/* Header row */}
              <div className="bg-bluesh-50 flex items-center gap-6 px-3 py-1.5 font-medium text-sm text-blacky-950">
                <span className="w-30 shrink-0">Mã đơn hàng</span>
                <span className="w-22.5 shrink-0">Trạng thái</span>
                <span className="flex-1 min-w-0">Khách hàng</span>
                <span className="w-30 shrink-0 text-right">Số tiền</span>
              </div>
              <div className="h-px bg-basic-border2" />
              {recentOrders.map((order, i) => {
                const statusMap: Record<string, { bg: string; label: string }> = {
                  Completed: { bg: 'bg-accent-green',    label: 'Hoàn thành' },
                  Pending:   { bg: 'bg-yellowfish-400',  label: 'Chờ xử lý' },
                  Cancelled: { bg: 'bg-accent-red',      label: 'Đã hủy' },
                };
                const badge = statusMap[order.Status] ?? { bg: 'bg-blacky-400', label: order.Status };
                return (
                  <div key={order.OrderID}>
                    <div className="flex items-center gap-6 px-3 py-2 text-sm">
                      <span className="w-30 shrink-0 text-blacky-950 font-normal truncate">
                        {order.OrderCode ?? `#${order.OrderID}`}
                      </span>
                      <div className="w-22.5 shrink-0">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-normal text-basic-white whitespace-nowrap ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="flex-1 min-w-0 text-blacky-950 truncate">
                        {order.customer?.CustomerName ?? 'Khách vãng lai'}
                      </span>
                      <span className="w-30 shrink-0 text-blacky-700 text-right tabular-nums">
                        {formatCurrency(parseFloat(order.TotalAmount ?? '0'))}
                      </span>
                    </div>
                    {i < recentOrders.length - 1 && <div className="h-px bg-basic-border2 opacity-90" />}
                  </div>
                );
              })}
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
