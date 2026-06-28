import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Package, BarChart2, Calendar, Award } from 'lucide-react';
import reportsService from '../services/reportsService';
import { useToast } from '../components/ToastProvider';
import DatePickerInput from '../components/DatePickerInput';
import CustomSelect from '../components/CustomSelect';
import { useCanPerform } from '../hooks/usePermission';

interface RevenueReport {
  totalSalesValue: number;
  confirmedRevenue: number;
  debtIncurred: number;
  pendingDeposit: number;
  pendingTotalValue: number;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

interface ProfitReport {
  totalProfit: number;
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
}

interface TopProduct {
  productId: number;
  productName: string;
  sku: string | null;
  baseUnit: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopProductsReport {
  products: TopProduct[];
}

function Reports() {
  const { canPerform, loading: permissionsLoading } = useCanPerform();
  const canReadReport = canPerform('read', 'Report');
  const canReadProfitReport = canPerform('read', 'ProfitReport');

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsReport | null>(null);

  const [sortBy, setSortBy] = useState<'revenue' | 'quantity'>('revenue');
  const [limit, setLimit] = useState(10);

  const loadReports = useCallback(async () => {
    if (permissionsLoading || (!canReadReport && !canReadProfitReport)) {
      return;
    }

    setLoading(true);
    let hadError = false;

    if (canReadReport) {
      try {
        const [revenue, products] = await Promise.all([
          reportsService.getRevenueReport(startDate, endDate),
          reportsService.getTopProducts(startDate, endDate, sortBy, limit),
        ]);
        setRevenueReport(revenue as RevenueReport);
        setTopProducts(products as TopProductsReport);
      } catch (err) {
        console.error('Error loading revenue reports:', err);
        setRevenueReport(null);
        setTopProducts(null);
        hadError = true;
      }
    } else {
      setRevenueReport(null);
      setTopProducts(null);
    }

    if (canReadProfitReport) {
      try {
        const profit = await reportsService.getProfitReport(startDate, endDate);
        setProfitReport(profit as ProfitReport);
      } catch (err) {
        console.error('Error loading profit report:', err);
        setProfitReport(null);
        hadError = true;
      }
    } else {
      setProfitReport(null);
    }

    if (hadError) {
      toast.error('Có lỗi khi tải báo cáo');
    }

    setLoading(false);
  }, [
    permissionsLoading,
    canReadReport,
    canReadProfitReport,
    startDate,
    endDate,
    sortBy,
    limit,
    toast,
  ]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleFilterChange = () => {
    loadReports();
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', currencyDisplay: 'code' }).format(value);

  const formatNumber = (value: number): string =>
    new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);

  const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

  const showReportSections = canReadReport;
  const showProfitSections = canReadProfitReport;
  const hasAnyReportData =
    (canReadReport && (revenueReport !== null || topProducts !== null)) ||
    (canReadProfitReport && profitReport !== null);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blacky-950">Báo cáo</h1>
        <p className="text-blacky-700 text-sm mt-1">
          {showReportSections && showProfitSections
            ? 'Thống kê doanh thu và lợi nhuận'
            : showProfitSections
              ? 'Phân tích lợi nhuận gộp'
              : 'Thống kê doanh thu và sản phẩm bán chạy'}
        </p>
      </div>

      <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-6 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-36">
            <label className="flex items-center gap-1 text-sm font-medium text-bluesh-900 mb-1">
              <Calendar className="w-5 h-5" />Từ ngày
            </label>
            <DatePickerInput title="Từ ngày" value={startDate} onChange={setStartDate} />
          </div>

          <div className="flex-1 min-w-36">
            <label className="flex items-center gap-1 text-sm font-medium text-bluesh-900 mb-1">
              <Calendar className="w-5 h-5" />Đến ngày
            </label>
            <DatePickerInput title="Đến ngày" value={endDate} onChange={setEndDate} />
          </div>

          {showReportSections && (
            <>
              <div className="flex-1 min-w-36">
                <label className="block text-sm font-medium text-bluesh-900 mb-1">Sắp xếp theo</label>
                <CustomSelect
                  value={sortBy}
                  onChange={(v) => setSortBy(v as 'revenue' | 'quantity')}
                  compact
                  options={[
                    { value: 'revenue', label: 'Doanh thu' },
                    { value: 'quantity', label: 'Số lượng' },
                  ]}
                />
              </div>

              <div className="w-32">
                <label className="block text-sm font-medium text-bluesh-900 mb-1">Hiển thị</label>
                <input
                  type="number"
                  title="Số lượng hiển thị"
                  min="1"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-basic-white border border-bluesh-600 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                />
              </div>
            </>
          )}

          <button
            onClick={handleFilterChange}
            disabled={loading || permissionsLoading}
            className="btn btn-primary w-fit! px-6! rounded-lg!"
          >
            <BarChart2 className="w-4 h-4" />
            {loading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
        </div>
      </div>

      {permissionsLoading || loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-blacky-500">Đang tải báo cáo...</div>
        </div>
      ) : !hasAnyReportData && !showReportSections && !showProfitSections ? (
        <div className="bg-bluesh-50 border border-bluesh-200 rounded-xl p-6 text-blacky-700 text-sm">
          Bạn chưa được phân quyền xem báo cáo trên cửa hàng này.
        </div>
      ) : (
        <>
          {(showReportSections || showProfitSections) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {showReportSections && (
                <>
                  <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
                        <DollarSign className="w-6 h-6 text-basic-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-blacky-700">Doanh thu thực thu</p>
                        <p className="text-xl font-bold text-bluesh-800 truncate">
                          {revenueReport ? formatCurrency(revenueReport.totalRevenue) : '-'}
                        </p>
                        <p className="text-xs text-blacky-500">
                          {revenueReport ? `${revenueReport.totalOrders} đơn hàng` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellowfish-50 rounded-xl border border-yellowfish-400 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellowfish-400 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-basic-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-blacky-700">SP bán chạy</p>
                        <p className="text-3xl font-bold text-yellowfish-600">
                          {topProducts ? topProducts.products.length : '-'}
                        </p>
                        <p className="text-xs text-blacky-500">Sản phẩm</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {showProfitSections && (
                <>
                  <div className="bg-accent-green/10 rounded-xl border border-accent-green p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent-green flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6 text-basic-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-blacky-700">Lợi nhuận</p>
                        <p className="text-xl font-bold text-accent-green truncate">
                          {profitReport ? formatCurrency(profitReport.totalProfit) : '-'}
                        </p>
                        <p className="text-xs text-blacky-500">
                          {profitReport ? `Tỷ suất: ${formatPercent(profitReport.profitMargin)}` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent-red/10 rounded-xl border border-accent-red p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent-red flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-basic-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-blacky-700">Giá vốn</p>
                        <p className="text-xl font-bold text-accent-red truncate">
                          {profitReport ? formatCurrency(profitReport.totalCost) : '-'}
                        </p>
                        <p className="text-xs text-blacky-500">Tổng chi phí</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {(showReportSections || showProfitSections) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {showReportSections && revenueReport && (
                <div className="bg-basic-white rounded-xl border border-basic-border2 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-bluesh-800">Thống kê Bán hàng & Dòng tiền</h3>
                    <div className="w-8 h-8 rounded-lg bg-bluesh-800 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-basic-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-basic-white border border-bluesh-100 rounded-lg">
                      <span className="text-blacky-700 text-base">Tổng giá trị bán ra (Doanh số)</span>
                      <span className="font-semibold text-bluesh-800">
                        {formatCurrency(revenueReport.totalSalesValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-basic-white border border-bluesh-100 rounded-lg">
                      <span className="text-blacky-700 text-base">Dòng tiền thu về/Thực thu</span>
                      <span className="font-semibold text-accent-green">
                        {formatCurrency(revenueReport.confirmedRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-basic-white border border-bluesh-100 rounded-lg">
                      <span className="text-blacky-700 text-base">
                        Tiền cọc đặt trước ({revenueReport.pendingOrders})
                      </span>
                      <span className="font-semibold text-yellowfish-600">
                        {formatCurrency(revenueReport.pendingDeposit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-accent-red/10 border border-accent-red rounded-lg">
                      <span className="text-blacky-700 text-base font-medium">Công nợ phát sinh</span>
                      <span className="font-bold text-accent-red">
                        {formatCurrency(revenueReport.debtIncurred)}
                      </span>
                    </div>
                    {revenueReport.pendingDeposit > 0 && (
                      <div className="flex justify-between items-center p-3 bg-basic-white border border-bluesh-100 rounded-lg">
                        <span className="text-blacky-700 text-base">
                          Tiền cọc đặt trước ({revenueReport.pendingOrders} đơn)
                        </span>
                        <span className="font-semibold text-yellowfish-600">
                          {formatCurrency(revenueReport.pendingDeposit)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-basic-white border border-bluesh-100 rounded-lg">
                      <span className="text-blacky-700 text-base">Đơn giao thành công</span>
                      <span className="font-semibold text-bluesh-800">
                        {revenueReport.completedOrders} đơn
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-bluesh-100 rounded-lg">
                      <span className="text-blacky-700 text-base">Giá trị TB/Đơn</span>
                      <span className="font-semibold text-accent-green">
                        {revenueReport.completedOrders > 0
                          ? formatCurrency(revenueReport.totalSalesValue / revenueReport.completedOrders)
                          : formatCurrency(0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {showProfitSections && profitReport && (
                <div className="bg-basic-white rounded-xl border border-basic-border2 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-900">Phân tích lợi nhuận Gộp</h3>
                    <div className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-basic-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border border-accent-green bg-accent-green/10 rounded-lg">
                      <span className="text-blacky-700 text-base">Doanh số bán hàng</span>
                      <span className="font-semibold text-accent-green">
                        {formatCurrency(profitReport.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-yellowfish-400 bg-yellowfish-50 rounded-lg">
                      <span className="text-blacky-700 text-base">Giá vốn</span>
                      <span className="font-semibold text-yellowfish-600">
                        {formatCurrency(profitReport.totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-accent-green bg-accent-green/10 rounded-lg">
                      <span className="text-blacky-700 text-base">Lợi nhuận gộp</span>
                      <span className="font-semibold text-accent-green">
                        {formatCurrency(profitReport.totalProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-bluesh-50 rounded-lg border border-bluesh-600">
                      <span className="text-blacky-700 text-base font-medium">Biên lợi nhuận gộp</span>
                      <span className="font-bold text-bluesh-800">
                        {formatPercent(profitReport.profitMargin)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {showReportSections && topProducts && (
            <div className="bg-basic-white rounded-xl border border-yellowfish-400 overflow-hidden">
              <div className="p-4 border-b border-basic-border flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellowfish-400 flex items-center justify-center">
                  <Award className="w-4 h-4 text-basic-white" />
                </div>
                <h3 className="font-semibold text-bluesh-800">
                  Top {topProducts.products.length} Sản phẩm bán chạy nhất
                </h3>
                <span className="text-sm text-blacky-700">
                  (Sắp xếp theo {sortBy === 'revenue' ? 'doanh thu' : 'số lượng'})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-bluesh-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                        Số lượng bán
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase tracking-wider">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-basic-border">
                    {topProducts.products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-blacky-500">
                          Không có dữ liệu sản phẩm trong khoảng thời gian này
                        </td>
                      </tr>
                    ) : (
                      topProducts.products.map((product, index) => (
                        <tr
                          key={product.productId}
                          className={`hover:bg-blacky-50 transition-colors ${index < 3 ? 'bg-bluesh-50/30' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Award
                                  className={`w-5 h-5 ${
                                    index === 0
                                      ? 'text-yellowfish-400'
                                      : index === 1
                                        ? 'text-blacky-400'
                                        : 'text-yellowfish-600'
                                  }`}
                                />
                              )}
                              <span className="font-medium text-blacky-950">{index + 1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-blacky-950">{product.productName}</div>
                            <div className="text-xs text-blacky-500">{product.baseUnit}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-blacky-900">
                            {product.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="font-semibold text-blacky-950">
                              {formatNumber(product.totalQuantity)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-semibold text-accent-green">
                              {formatCurrency(product.totalRevenue)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;
