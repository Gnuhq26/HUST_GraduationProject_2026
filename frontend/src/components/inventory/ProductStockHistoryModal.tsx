import { useState, useEffect } from 'react';
import { FiX, FiPackage, FiTruck, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import inventoryService from '../../services/inventoryService';

interface StockHistoryItem {
  DetailID: number;
  Quantity: number;
  UnitPrice: number;
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
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-linear-to-r from-indigo-500 to-indigo-600">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <FiPackage />
                Lịch sử nhập kho
              </h2>
              {data?.product && (
                <div className="text-indigo-100 text-sm">
                  {data.product.ProductName} — SKU: {data.product.SKU}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              title="Đóng"
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
          ) : !data || data.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiPackage className="text-5xl mb-3 text-gray-300" />
              <p>Chưa có lịch sử nhập kho</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 text-center">
                  <div className="text-2xl font-bold text-indigo-700">{data.history.length}</div>
                  <div className="text-xs text-indigo-600 mt-1">Lần nhập</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {data.history.reduce((sum: number, item: StockHistoryItem) => sum + Number(item.Quantity), 0).toLocaleString('vi-VN')}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Tổng số lượng ({data.product.BaseUnit})</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {formatCurrency(data.history.reduce((sum: number, item: StockHistoryItem) => sum + item.TotalPrice, 0))}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Tổng giá trị</div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã phiếu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.history.map((item: StockHistoryItem) => (
                      <tr key={item.DetailID} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                            <FiFileText size={14} />
                            #{item.ReceiptID}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiCalendar size={14} />
                            {formatDate(item.ImportDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <FiTruck size={14} className="text-gray-400 shrink-0" />
                            {item.Supplier?.SupplierName || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {Number(item.Quantity).toLocaleString('vi-VN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {item.UnitName}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 text-sm text-gray-700">
                            <FiDollarSign size={14} className="text-gray-400" />
                            {formatCurrency(item.UnitPrice)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-green-600">
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
                  <h4 className="text-sm font-medium text-gray-600">Ghi chú từng lần nhập:</h4>
                  {data.history
                    .filter((item: StockHistoryItem) => item.Note)
                    .map((item: StockHistoryItem) => (
                      <div key={item.DetailID} className="flex gap-2 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                        <span className="text-indigo-600 font-medium shrink-0">#{item.ReceiptID}:</span>
                        <span>{item.Note}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductStockHistoryModal;
