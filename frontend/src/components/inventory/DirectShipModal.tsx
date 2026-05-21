import { type FormEvent } from 'react';
import { Package, Truck, X } from 'lucide-react';
import type { Supplier, Product, Customer } from '@/types';
import CustomSelect from '../CustomSelect';

export interface DirectShipState {
  supplierId: string;
  productId: string;
  unitName: string;
  totalQty: string;
  deliverQty: string;
  importUnitPrice: string;
  discountRate: string;
  saleUnitPrice: string;
  customerId: string;
  note: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  ds: DirectShipState;
  onDsChange: (field: keyof DirectShipState, value: string) => void;
}

const formatCurrency = (value: number | string): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));

function DirectShipModal({ isOpen, onClose, onSubmit, suppliers, products, customers, ds, onDsChange }: Props) {
  if (!isOpen) return null;

  const getDsUnits = () => {
    if (!ds.productId) return [];
    const product = products.find((p) => p.ProductID === parseInt(ds.productId));
    if (!product) return [];
    return [
      { UnitName: product.BaseUnit, ExchangeValue: 1 },
      ...(product.units || []),
    ];
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 bg-basic-white shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-blacky-950 flex items-center gap-2">
                Giao thẳng
              </h2>
              <p className="text-sm text-blacky-500 mt-1">Nhập hàng từ NCC và giao một phần trực tiếp cho khách</p>
            </div>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-blacky-50 hover:text-basic-white hover:bg-bluesh-800 rounded-lg p-2 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="direct-ship-form" onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">
              Nhà cung cấp <span className="text-accent-red">*</span>
            </label>
            <CustomSelect
              value={ds.supplierId}
              onChange={(v) => onDsChange('supplierId', v)}
              options={suppliers.map((s) => ({ value: String(s.SupplierID), label: s.SupplierName }))}
              placeholder="Chọn nhà cung cấp"
            />
          </div>

          {/* Product + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1">
                Sản phẩm <span className="text-accent-red">*</span>
              </label>
              <CustomSelect
                value={ds.productId}
                onChange={(v) => onDsChange('productId', v)}
                options={products.map((p) => ({ value: String(p.ProductID), label: `${p.ProductName} (${p.SKU})` }))}
                placeholder="Chọn sản phẩm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1">
                Đơn vị tính <span className="text-accent-red">*</span>
              </label>
              <CustomSelect
                value={ds.unitName}
                onChange={(v) => onDsChange('unitName', v)}
                options={getDsUnits().map((u) => ({ value: u.UnitName, label: u.UnitName + (Number(u.ExchangeValue) > 1 ? ` (×${u.ExchangeValue})` : '') }))}
                placeholder="Chọn đơn vị"
                disabled={!ds.productId}
              />
            </div>
          </div>

          {/* Quantities */}
          <div className="bg-yellowfish-50 border border-yellowfish-400/30 rounded-xl p-4">
            <h4 className="font-medium text-blacky-950 mb-3">Phân bổ số lượng</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-blacky-500 mb-1">
                  Tổng NCC giao <span className="text-accent-red">*</span>
                </label>
                <input
                  type="number" required step="0.01" min="0.01"
                  placeholder="VD: 20"
                  value={ds.totalQty}
                  onChange={(e) => onDsChange('totalQty', e.target.value)}
                  className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
                />
              </div>
              <div>
                <label className="block text-sm text-blacky-500 mb-1">
                  Giao cho khách <span className="text-accent-red">*</span>
                </label>
                <input
                  type="number" required step="0.01" min="0.01"
                  max={ds.totalQty || undefined}
                  placeholder="VD: 8"
                  value={ds.deliverQty}
                  onChange={(e) => onDsChange('deliverQty', e.target.value)}
                  className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
                />
              </div>
            </div>
            {ds.totalQty && ds.deliverQty && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-accent-green" />
                <span className="text-blacky-700">
                  Nhập kho: <strong className="text-accent-green">{Math.max(0, parseFloat(ds.totalQty) - parseFloat(ds.deliverQty)).toLocaleString('vi-VN')}</strong> {ds.unitName}
                </span>
                <span className="text-blacky-400">|</span>
                <Truck className="w-4 h-4 text-yellowfish-600" />
                <span className="text-blacky-700">
                  Giao khách: <strong className="text-yellowfish-600">{parseFloat(ds.deliverQty).toLocaleString('vi-VN')}</strong> {ds.unitName}
                </span>
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1">
                Giá nhập (VNĐ) <span className="text-accent-red">*</span>
              </label>
              <input
                type="number" required step="0.01" min="0"
                placeholder="Giá mua từ NCC"
                value={ds.importUnitPrice}
                onChange={(e) => onDsChange('importUnitPrice', e.target.value)}
                className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1">
                Chiết khấu NCC (%)
              </label>
              <input
                type="number" step="0.01" min="0" max="100"
                placeholder="VD: 5"
                value={ds.discountRate}
                onChange={(e) => onDsChange('discountRate', e.target.value)}
                className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1">
                Giá bán (VNĐ) <span className="text-accent-red">*</span>
              </label>
              <input
                type="number" required step="0.01" min="0"
                placeholder="Giá bán cho khách"
                value={ds.saleUnitPrice}
                onChange={(e) => onDsChange('saleUnitPrice', e.target.value)}
                className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              />
            </div>
          </div>

          {/* Summary */}
          {ds.totalQty && ds.importUnitPrice && ds.deliverQty && ds.saleUnitPrice && (
            <div className="bg-blacky-50 border border-basic-border rounded-xl p-4 space-y-1 text-sm">
              {(() => {
                const totalQty = parseFloat(ds.totalQty);
                const deliverQty = parseFloat(ds.deliverQty);
                const importPrice = parseFloat(ds.importUnitPrice);
                const salePrice = parseFloat(ds.saleUnitPrice);
                const discount = ds.discountRate ? parseFloat(ds.discountRate) / 100 : 0;
                const costPrice = importPrice * (1 - discount);
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blacky-500">Tổng nhập (NCC):</span>
                      <span className="font-medium text-blacky-950">{formatCurrency(totalQty * importPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blacky-500">Chiết khấu ({ds.discountRate}%):</span>
                        <span className="font-medium text-accent-green">-{formatCurrency(totalQty * importPrice * discount)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blacky-500">Giá vốn thực tế:</span>
                        <span className="font-medium text-blacky-700">{formatCurrency(costPrice)}/đvt</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-blacky-500">Doanh thu (bán):</span>
                      <span className="font-medium text-accent-green">{formatCurrency(deliverQty * salePrice)}</span>
                    </div>
                    <div className="flex justify-between border-t border-basic-border pt-1">
                      <span className="text-blacky-500">Lợi nhuận giao thẳng:</span>
                      <span className="font-bold text-yellowfish-600">
                        {formatCurrency(deliverQty * (salePrice - costPrice))}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Customer (optional) */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">
              Khách hàng <span className="text-blacky-400">(tùy chọn)</span>
            </label>
            <CustomSelect
              value={ds.customerId}
              onChange={(v) => onDsChange('customerId', v)}
              options={customers.map((c) => ({ value: String(c.CustomerID), label: c.CustomerName }))}
              placeholder="Khách vãng lai"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={ds.note}
              onChange={(e) => onDsChange('note', e.target.value)}
              className="input-field resize-none"
              placeholder="VD: Giao nửa xe tại công trình Đông Anh..."
            />
          </div>

          </form>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-basic-border bg-basic-white shrink-0">
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={onClose} className="btn btn-secondary w-[30%]! rounded-lg!">
              Hủy
            </button>
            <button type="submit" form="direct-ship-form" className="btn btn-primary w-[30%]! rounded-lg!">
              Xác nhận giao thẳng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectShipModal;
