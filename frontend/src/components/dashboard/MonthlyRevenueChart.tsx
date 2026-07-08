import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { useTenantPath } from '../../hooks/useTenantPath';
import reportsService from '../../services/reportsService';
import type { MonthlyRevenueItem } from '../../types/models';

function formatVND(value: number): string {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1)}B ₫`;
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000)
    return `${(value / 1_000).toFixed(0)}K ₫`;
  return `${value} ₫`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-basic-white border border-basic-border rounded-xl px-4 py-2.5 shadow-lg text-sm">
      <p className="font-semibold text-blacky-950 mb-1">{label}</p>
      <p className="text-blacky-500">
        Doanh thu:{' '}
        <span className="text-yellowfish-400 font-medium">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            currencyDisplay: 'code',
          }).format(payload[0].value)}
        </span>
      </p>
    </div>
  );
};

const RefLineLabel = ({
  viewBox,
  growthPercent,
}: {
  viewBox?: { x?: number; y?: number; width?: number };
  growthPercent: number;
}) => {
  const x = (viewBox?.x ?? 0) - 4;
  const y = viewBox?.y ?? 0;
  return (
    <g>
      <text
        x={x}
        y={y - 14}
        textAnchor="end"
        fill="#574D4F"
        fontSize={11}
        fontFamily="Inter, sans-serif"
      >
        Hôm nay
      </text>
      <text
        x={x}
        y={y}
        textAnchor="end"
        fill="#292526"
        fontSize={11}
        fontWeight={700}
        fontFamily="Inter, sans-serif"
      >
        {growthPercent > 0 ? '+' : ''}
        {growthPercent}%
      </text>
    </g>
  );
};

export default function MonthlyRevenueChart() {
  const toTenantPath = useTenantPath();
  const [data, setData] = useState<MonthlyRevenueItem[]>([]);
  const [growthPercent, setGrowthPercent] = useState(0);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await reportsService.getMonthlyRevenue();
        // Only show months up to the current month
        const currentMonth = new Date().getMonth() + 1; // 1-indexed
        setData(res.months.filter((m) => m.month <= currentMonth));
        setGrowthPercent(res.growthPercent);
        setCurrentMonthRevenue(res.currentMonthRevenue);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const isGrowthPositive = growthPercent >= 0;

  return (
    <div className="bg-basic-white rounded-xl border border-basic-border2 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-blacky-950">Doanh thu theo tháng</h3>
        <Link
          to={toTenantPath('/reports')}
          className="text-sm font-medium text-bluesh-800 underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Xem báo cáo chi tiết
        </Link>
      </div>

      {/* Description */}
      {!loading && !error && (
        <p className="text-sm text-blacky-700">
          Doanh thu của bạn{' '}
          <strong className={isGrowthPositive ? 'text-accent-green' : 'text-accent-red'}>
            {isGrowthPositive ? 'tăng' : 'giảm'} {Math.abs(growthPercent)}%
          </strong>{' '}
          so với tháng trước.
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-4 bg-blacky-100 rounded w-64" />
          <div className="h-52 bg-blacky-100 rounded" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-accent-red text-center py-12">{error}</p>
      )}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 24, right: 8, left: 56, bottom: 0 }}
            barCategoryGap="30%"
          >
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#574D4F', fontFamily: 'Inter, sans-serif' }}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            {currentMonthRevenue > 0 && (
              <ReferenceLine
                y={currentMonthRevenue}
                stroke="#292526"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={(props: { viewBox?: { x?: number; y?: number; width?: number } }) => (
                  <RefLineLabel viewBox={props.viewBox} growthPercent={growthPercent} />
                )}
              />
            )}
            <Bar
              dataKey="revenue"
              fill="#FFC24B"
              radius={[6, 6, 6, 6]}
              maxBarSize={60}
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {!loading && !error && data.length === 0 && (
        <p className="text-sm text-blacky-400 text-center py-12">
          Chưa có dữ liệu doanh thu trong năm nay.
        </p>
      )}

      {/* Y-axis label */}
      {!loading && !error && data.length > 0 && (
        <p className="text-xs text-blacky-400 text-right -mt-2">
          Đơn vị: {formatVND(Math.max(...data.map((d) => d.revenue)) || 1).replace(/[\d.,]+/, 'x')}
        </p>
      )}
    </div>
  );
}
