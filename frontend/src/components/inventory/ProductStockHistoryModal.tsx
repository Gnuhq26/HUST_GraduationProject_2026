import { useState, useEffect } from 'react';
import { X, Package, Truck, Calendar, FileText } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

interface StockHistoryItem {
  DetailID: number;
  Quantity: number;
  UnitPrice: number;
  DiscountRate: number;
  CostPrice: number;
  TotalPrice: number;
  UnitName: string;
  Note?: string;
  ImportDate: string;
  ReceiptID: number;
  Supplier?: { SupplierName: string };
}

interface ProductHistoryProduct {
  ProductName: string;
  SKU: string;
  BaseUnit: string;
}

interface ProductStockHistoryResponse {
  product: ProductHistoryProduct;
  history: StockHistoryItem[];
}

interface Props {
  productId: number;
  onClose: () => void;
}

function ProductStockHistoryModal({ productId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductStockHistoryResponse | null>(null);

  useEffect(() => {
    loadHistory();
  }, [productId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const result = await inventoryService.getProductStockHistory(productId);
      setData(result as ProductStockHistoryResponse);
    } catch (err) {
      console.error('Error loading stock history:', err);
      alert('Có lỗi khi tải lịch sử nhập kho');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 sticky top-0 bg-basic-white z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-blacky-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-bluesh-800" />Lịch sử nhập kho
              </h2>
              {data?.product && (
                <div className="text-blacky-500 text-sm mt-1">
                  {data.product.ProductName} - {data.product.SKU}
                </div>
              )}
            </div>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-blacky-50 hover:text-basic-white hover:bg-bluesh-800 rounded-lg p-2 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-blacky-400 font-medium">Đang tải dữ liệu...</div>
            </div>
          ) : !data || data.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-blacky-400">
              <Package className="w-12 h-12 mb-3 text-blacky-200" />
              <p>Chưa có lịch sử nhập kho</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bluesh-50 rounded-xl p-4 border border-bluesh-200 text-center">
                  <div className="text-2xl font-bold text-bluesh-800">{data.history.length}</div>
                  <div className="text-xs text-blacky-500 mt-1">Lần nhập</div>
                </div>
                <div className="bg-accent-green/10 rounded-xl p-4 border border-accent-green/30 text-center">
                  <div className="text-2xl font-bold text-accent-green">
                    {data.history.reduce((sum: number, item: StockHistoryItem) => sum + Number(item.Quantity), 0).toLocaleString('vi-VN')}
                  </div>
                  <div className="text-xs text-blacky-500 mt-1">Tổng số lượng ({data.product.BaseUnit})</div>
                </div>
                <div className="bg-blacky-50 rounded-xl p-4 border border-basic-border text-center">
                  <div className="text-lg font-bold text-blacky-950">
                    {formatCurrency(data.history.reduce((sum: number, item: StockHistoryItem) => sum + item.TotalPrice, 0))}
                  </div>
                  <div className="text-xs text-blacky-500 mt-1">Tổng giá trị</div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-basic-white rounded-xl border border-basic-border overflow-hidden">
                <table className="min-w-full divide-y divide-basic-border">
                  <thead className="bg-bluesh-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        Mã phiếu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-basic-white uppercase tracking-wider">
                        Giá vốn
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-basic-white uppercase tracking-wider">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-basic-white divide-y divide-basic-border">
                    {data.history.map((item: StockHistoryItem) => (
                      <tr key={item.DetailID} className="hover:bg-blacky-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm font-medium text-bluesh-800">
                            <FileText className="w-3.5 h-3.5" />
                            #{item.ReceiptID}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-blacky-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.ImportDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-blacky-700">
                            <Truck className="w-3.5 h-3.5 text-blacky-400 shrink-0" />
                            {item.Supplier?.SupplierName || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-blacky-950">
                            {Number(item.Quantity).toLocaleString('vi-VN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-bluesh-50 text-bluesh-800 rounded">
                            {item.UnitName}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-blacky-950">
                            {formatCurrency(item.CostPrice)}
                          </div>
                          {Number(item.DiscountRate) > 0 && (
                            <div className="text-xs text-blacky-400">
                              {formatCurrency(item.UnitPrice)} &minus; {(Number(item.DiscountRate) * 100).toFixed(0)}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-accent-green">
                            {formatCurrency(item.TotalPrice)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes if any */}
              {data.history.some((item: StockHistoryItem) => item.Note) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blacky-700">Ghi chú từng lần nhập:</h4>
                  {data.history
                    .filter((item: StockHistoryItem) => item.Note)
                    .map((item: StockHistoryItem) => (
                      <div key={item.DetailID} className="flex gap-2 text-sm text-blacky-700 bg-yellowfish-50 border border-yellowfish-400/30 rounded-lg p-2">
                        <span className="text-bluesh-800 font-medium shrink-0">#{item.ReceiptID}:</span>
                        <span>{item.Note}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-basic-border bg-basic-white">
          <button onClick={onClose} className="btn btn-secondary w-[30%]! mx-auto block">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductStockHistoryModal;
