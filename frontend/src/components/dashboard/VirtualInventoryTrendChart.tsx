import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import reportsService from '../../services/reportsService';
import type { VirtualInventoryTrendPoint } from '../../types/models';

interface Props {
  startDate: string;
  endDate: string;
}

function formatXAxisDate(dateStr: string): string {
  // YYYY-MM-DD → DD/MM
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

const TOOLTIP_COLOR_CLASS: Record<string, string> = {
  '#015F89': 'text-bluesh-800',
  '#FFAA20': 'text-yellowfish-400',
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-basic-white border border-basic-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-blacky-950 mb-2">{label ? formatXAxisDate(label) : ''}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-blacky-500">
          {p.name}:{' '}
          <span className={`font-medium ${TOOLTIP_COLOR_CLASS[p.color] ?? 'text-blacky-950'}`}>
            {p.value.toLocaleString('vi-VN')}
          </span>
        </p>
      ))}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center gap-6 justify-center mt-2 text-xs text-blacky-700">
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-6 h-0.5 bg-bluesh-800" />
      <span>Tồn ảo (đang về)</span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-6 h-0.5 bg-yellowfish-400" />
      <span>Xuất ảo (chờ giao)</span>
    </div>
  </div>
);

export default function VirtualInventoryTrendChart({ startDate, endDate }: Props) {
  const [data, setData] = useState<VirtualInventoryTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await reportsService.getVirtualInventoryTrend(startDate, endDate);
        setData(res.points);
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
      <h3 className="text-base font-semibold text-blacky-950">Xu hướng tồn kho ảo</h3>

      {loading && (
        <div className="animate-pulse space-y-2 pt-2">
          <div className="h-44 bg-blacky-100 rounded-lg" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-accent-red text-center py-8">{error}</p>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-blacky-400">
          <TrendingUp className="w-10 h-10" />
          <p className="text-sm">Không có phiếu đang xử lý trong kỳ này</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradInTransit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#015F89" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#015F89" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradReserved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFAA20" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FFAA20" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEF" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisDate}
                tick={{ fontSize: 11, fill: '#827579' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#827579' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="inTransitQty"
                name="Tồn ảo (đang về)"
                stroke="#015F89"
                strokeWidth={2}
                fill="url(#gradInTransit)"
                dot={false}
                activeDot={{ r: 4, fill: '#015F89' }}
              />
              <Area
                type="monotone"
                dataKey="reservedQty"
                name="Xuất ảo (chờ giao)"
                stroke="#FFAA20"
                strokeWidth={2}
                fill="url(#gradReserved)"
                dot={false}
                activeDot={{ r: 4, fill: '#FFAA20' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <CustomLegend />
        </>
      )}
    </div>
  );
}
