import { useCallback, useEffect, useState } from 'react';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import { useToast } from '../ToastProvider';
import type { InventoryChangeType, InventoryQuantityType } from '@/types';

interface MovementLog {
  LogID: number;
  ProductID: number;
  ChangeType: InventoryChangeType;
  QuantityType: InventoryQuantityType;
  ReferenceType: string | null;
  ReferenceID: number | null;
  ReferenceCode: string | null;
  OldQuantity: string | number;
  ChangeQuantity: string | number;
  NewQuantity: string | number;
  Note: string | null;
  CreatedAt: string;
  product?: {
    ProductID: number;
    ProductName: string;
    SKU: string | null;
    BaseUnit: string;
  };
}

interface ProductOption {
  ProductID: number;
  ProductName: string;
  SKU: string | null;
}

const CHANGE_TYPE_LABELS: Record<InventoryChangeType, string> = {
  IN: 'Nhập',
  OUT: 'Xuất',
  ADJUST: 'Điều chỉnh',
  RETURN: 'Hoàn trả',
};

const CHANGE_TYPE_STYLES: Record<InventoryChangeType, string> = {
  IN: 'bg-accent-green/10 text-accent-green',
  OUT: 'bg-accent-red/10 text-accent-red',
  ADJUST: 'bg-yellowfish-50 text-yellowfish-600',
  RETURN: 'bg-bluesh-50 text-bluesh-800',
};

const QUANTITY_TYPE_LABELS: Record<InventoryQuantityType, string> = {
  Physical: 'Tồn thực',
  Reserved: 'Đã giữ',
  InTransit: 'Đang về',
};

interface Props {
  products: ProductOption[];
}

function InventoryMovementTab({ products }: Props) {
  const toast = useToast();
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await inventoryService.getInventoryLogs({
        productId: productFilter ? parseInt(productFilter, 10) : undefined,
        changeType: changeTypeFilter || undefined,
        page,
        limit,
      });
      setLogs(result.data as MovementLog[]);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      console.error('Error loading inventory logs:', err);
      toast.error('Có lỗi khi tải sổ biến động kho');
    } finally {
      setLoading(false);
    }
  }, [productFilter, changeTypeFilter, page, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(1);
  }, [productFilter, changeTypeFilter]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatQty = (value: string | number) =>
    Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 });

  const formatReference = (log: MovementLog) => {
    if (!log.ReferenceType || !log.ReferenceID) return '—';
    const code = log.ReferenceCode ?? `#${log.ReferenceID}`;
    if (log.ReferenceType === 'Order') return `ĐH ${code}`;
    if (log.ReferenceType === 'StockReceipt') return `PN ${code}`;
    // Giao thẳng từ nhập kho: ReferenceID = ReceiptID; BE trả "PN-code · HD-code"
    if (log.ReferenceType === 'DirectShip') return `Giao thẳng ${code}`;
    return code;
  };

  /** Diễn giải thao tác theo tầng — tránh hiểu nhầm SL mới = tổng tồn SP */
  const describeLayerAction = (log: MovementLog) => {
    const qtyType = log.QuantityType as InventoryQuantityType;
    const change = Number(log.ChangeQuantity);
    const layer = QUANTITY_TYPE_LABELS[qtyType] ?? log.QuantityType;

    if (log.ChangeType === 'IN' && qtyType === 'InTransit' && change < 0) {
      return `Giảm ${layer} (đã nhận vào kho)`;
    }
    if (log.ChangeType === 'IN' && qtyType === 'InTransit' && change > 0) {
      return `Tăng ${layer} (chờ nhận)`;
    }
    if (log.ChangeType === 'IN' && qtyType === 'Physical' && change > 0) {
      return `Tăng ${layer}`;
    }
    if (log.ChangeType === 'OUT' && qtyType === 'Reserved' && change > 0) {
      return `Tăng ${layer} (giữ hàng)`;
    }
    if (log.ChangeType === 'OUT' && qtyType === 'Reserved' && change < 0) {
      return `Giảm ${layer}`;
    }
    if (log.ChangeType === 'OUT' && qtyType === 'Physical' && change < 0) {
      return `Giảm ${layer}`;
    }
    return change >= 0 ? `Tăng ${layer}` : `Giảm ${layer}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="input-field text-sm py-2 max-w-xs"
          aria-label="Lọc theo sản phẩm"
        >
          <option value="">Tất cả sản phẩm</option>
          {products.map((p) => (
            <option key={p.ProductID} value={p.ProductID}>
              {p.ProductName} {p.SKU ? `(${p.SKU})` : ''}
            </option>
          ))}
        </select>
        <select
          value={changeTypeFilter}
          onChange={(e) => setChangeTypeFilter(e.target.value)}
          className="input-field text-sm py-2 w-40"
          aria-label="Lọc theo loại biến động"
        >
          <option value="">Tất cả loại</option>
          <option value="IN">Nhập</option>
          <option value="OUT">Xuất</option>
          <option value="ADJUST">Điều chỉnh</option>
          <option value="RETURN">Hoàn trả</option>
        </select>
        <span className="text-sm text-blacky-500 ml-auto">
          {total.toLocaleString('vi-VN')} bản ghi
        </span>
      </div>
      <p className="text-xs text-blacky-500 mb-4">
        Mỗi dòng là biến động trên <span className="font-medium text-blacky-700">một tầng tồn</span>
        {' '}(Tồn thực / Đang về / Đã giữ), không phải tổng tồn của sản phẩm.
        Khi nhận hàng, hệ thống ghi 2 dòng: giảm Đang về và tăng Tồn thực.
      </p>

      <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-blacky-400">
            Đang tải...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <History className="w-12 h-12 text-blacky-200" />
            <p className="text-blacky-500">Chưa có biến động kho nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bluesh-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase">Sản phẩm</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase">Biến động theo tầng</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase">Chứng từ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-basic-border">
                {logs.map((log) => {
                  const change = Number(log.ChangeQuantity);
                  const changeType = log.ChangeType as InventoryChangeType;
                  const layer =
                    QUANTITY_TYPE_LABELS[log.QuantityType as InventoryQuantityType] ?? log.QuantityType;
                  return (
                    <tr key={log.LogID} className="hover:bg-blacky-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-blacky-600 whitespace-nowrap">
                        {formatDate(log.CreatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-blacky-950 text-sm">
                          {log.product?.ProductName ?? `SP #${log.ProductID}`}
                        </div>
                        <div className="text-xs text-blacky-400">
                          {log.product?.SKU ?? '—'} · {log.product?.BaseUnit ?? ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            CHANGE_TYPE_STYLES[changeType] ?? 'bg-blacky-50 text-blacky-600'
                          }`}
                        >
                          {CHANGE_TYPE_LABELS[changeType] ?? log.ChangeType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-blacky-800">{describeLayerAction(log)}</div>
                        <div className="text-sm mt-0.5 whitespace-nowrap">
                          <span className="text-blacky-500">{layer}:</span>{' '}
                          <span className="text-blacky-700">{formatQty(log.OldQuantity)}</span>
                          <span className="text-blacky-400 mx-1">→</span>
                          <span className="font-semibold text-blacky-950">{formatQty(log.NewQuantity)}</span>
                          <span
                            className={`ml-1.5 font-medium ${
                              change > 0
                                ? 'text-accent-green'
                                : change < 0
                                  ? 'text-accent-red'
                                  : 'text-blacky-500'
                            }`}
                          >
                            ({change > 0 ? '+' : ''}
                            {formatQty(change)})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-bluesh-800 whitespace-nowrap">
                        {formatReference(log)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-basic-border bg-blacky-50">
            <span className="text-sm text-blacky-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                title="Trang trước"
                aria-label="Trang trước"
                className="p-1.5 rounded-lg border border-basic-border disabled:opacity-40 hover:bg-basic-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                title="Trang sau"
                aria-label="Trang sau"
                className="p-1.5 rounded-lg border border-basic-border disabled:opacity-40 hover:bg-basic-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default InventoryMovementTab;
