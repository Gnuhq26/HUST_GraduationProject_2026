import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import reportsService from '../../services/reportsService';
import type { RevenueByCategoryItem } from '../../types/models';

interface Props {
  startDate: string;
  endDate: string;
}

const COLORS = ['#015F89', '#2A9D90', '#FFAA20', '#F98608', '#EA4335', '#0A4E71'];
const COLOR_BG_CLASSES = [
  'bg-bluesh-800',
  'bg-accent-green',
  'bg-yellowfish-400',
  'bg-yellowfish-500',
  'bg-accent-red',
  'bg-bluesh-900',
];

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: RevenueByCategoryItem }[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-basic-white border border-basic-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-blacky-950 mb-1">{item.categoryName}</p>
      <p className="text-blacky-500">Doanh thu: <span className="text-bluesh-800 font-medium">{formatVND(item.totalRevenue)}</span></p>
      <p className="text-blacky-500">Tỷ lệ: <span className="text-blacky-700 font-medium">{item.percentage.toFixed(1)}%</span></p>
    </div>
  );
};

const CustomLegend = ({ items }: { items: RevenueByCategoryItem[] }) => (
  <div className="flex flex-col gap-1.5 mt-2">
    {items.map((item, i) => (
      <div key={item.categoryId} className="flex items-center gap-2 text-xs">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_BG_CLASSES[i % COLOR_BG_CLASSES.length]}`}
        />
        <span className="text-blacky-700 truncate max-w-32">{item.categoryName}</span>
        <span className="text-blacky-400 ml-auto shrink-0">{item.percentage.toFixed(1)}%</span>
      </div>
    ))}
  </div>
);

export default function RevenueByCategoryChart({ startDate, endDate }: Props) {
  const [data, setData] = useState<RevenueByCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await reportsService.getRevenueByCategoryReport(startDate, endDate);
        setData(res.items);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [startDate, endDate]);

  return (
    <div className="bg-basic-white rounded-xl border border-basic-border p-6 flex flex-col gap-4">
      <h3 className="text-base font-semibold text-blacky-950">Doanh thu theo danh mục</h3>

      {loading && (
        <div className="flex items-center justify-center gap-6 animate-pulse py-4">
          <div className="w-28 h-28 rounded-full bg-blacky-100" />
          <div className="flex flex-col gap-2 flex-1">
            {(['w-[70%]', 'w-[60%]', 'w-[50%]', 'w-[40%]'] as const).map((w, i) => (
              <div key={i} className={`h-3 bg-blacky-100 rounded ${w}`} />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-accent-red text-center py-8">{error}</p>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-blacky-400">
          <PieChartIcon className="w-10 h-10" />
          <p className="text-sm">Chưa có dữ liệu theo danh mục</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="totalRevenue"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0">
            <CustomLegend items={data} />
          </div>
        </div>
      )}
    </div>
  );
}
