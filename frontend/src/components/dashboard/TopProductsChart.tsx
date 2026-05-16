import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';
import reportsService from '../../services/reportsService';
import type { TopProductItem } from '../../types/models';

interface Props {
  startDate: string;
  endDate: string;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: TopProductItem }[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-basic-white border border-basic-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-blacky-950 mb-1 max-w-48">{item.productName}</p>
      <p className="text-blacky-500">Doanh thu: <span className="text-bluesh-800 font-medium">{formatVND(item.totalRevenue)}</span></p>
      <p className="text-blacky-500">Số lượng: <span className="text-blacky-700 font-medium">{item.totalQuantity} {item.baseUnit}</span></p>
    </div>
  );
};

export default function TopProductsChart({ startDate, endDate }: Props) {
  const [data, setData] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await reportsService.getTopProducts(startDate, endDate, 'revenue', 5);
        setData(res.products);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [startDate, endDate]);

  const chartData = data.map((p) => ({
    ...p,
    shortName: p.productName.length > 22 ? p.productName.substring(0, 22) + '…' : p.productName,
  }));

  return (
    <div className="bg-basic-white rounded-xl border border-basic-border p-6 flex flex-col gap-4">
      <h3 className="text-base font-semibold text-blacky-950">Top 5 sản phẩm bán chạy</h3>

      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          {(['w-[60%]', 'w-[68%]', 'w-[76%]', 'w-[84%]', 'w-[92%]'] as const).map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 bg-blacky-100 rounded w-28 shrink-0" />
              <div className={`h-6 bg-blacky-100 rounded ${w}`} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-accent-red text-center py-8">{error}</p>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-blacky-400">
          <BarChart2 className="w-10 h-10" />
          <p className="text-sm">Chưa có dữ liệu bán hàng trong kỳ</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EFEFEF" />
            <XAxis
              type="number"
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}tr` : `${(v / 1_000).toFixed(0)}k`
              }
              tick={{ fontSize: 11, fill: '#827579' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={100}
              tick={{ fontSize: 11, fill: '#574D4F' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0F9FF' }} />
            <Bar dataKey="totalRevenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#015F89' : '#2A9D90'} fillOpacity={1 - i * 0.1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
