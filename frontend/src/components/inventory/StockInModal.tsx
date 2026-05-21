import { type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { Supplier, Product, StockReceiptStatus } from '@/types';
import CustomSelect from '../CustomSelect';

export interface StockInFormItem {
  productId: string;
  unitName: string;
  quantity: string;
  unitPrice: string;
  discountRate: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  suppliers: Supplier[];
  products: Product[];
  selectedSupplier: string;
  onSupplierChange: (val: string) => void;
  stockInStatus: StockReceiptStatus;
  onStatusChange: (val: StockReceiptStatus) => void;
  note: string;
  onNoteChange: (val: string) => void;
  items: StockInFormItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: keyof StockInFormItem, value: string) => void;
  calculateTotal: () => number;
}

const formatCurrency = (value: number | string): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));

function StockInModal({
  isOpen, onClose, onSubmit, suppliers, products,
  selectedSupplier, onSupplierChange, stockInStatus, onStatusChange,
  note, onNoteChange, items, onAddItem, onRemoveItem, onItemChange, calculateTotal,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 bg-basic-white shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blacky-950">Nhập kho</h2>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-blacky-50 hover:text-basic-white hover:bg-bluesh-800 rounded-lg p-2 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
        <form id="stock-in-form" onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">
              Nhà cung cấp <span className="text-accent-red">*</span>
            </label>
            <CustomSelect
              value={selectedSupplier}
              onChange={onSupplierChange}
              options={suppliers.map((s) => ({ value: String(s.SupplierID), label: s.SupplierName }))}
              placeholder="Chọn nhà cung cấp"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">
              Trạng thái nhập kho <span className="text-accent-red">*</span>
            </label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                stockInStatus === 'Pending' ? 'border-yellowfish-400 bg-yellowfish-50' : 'border-blacky-200 hover:border-blacky-400'
              }`}>
                <input
                  type="radio"
                  name="stockInStatus"
                  value="Pending"
                  checked={stockInStatus === 'Pending'}
                  onChange={(e) => onStatusChange(e.target.value as StockReceiptStatus)}
                  className="text-yellowfish-500"
                />
                <div>
                  <span className="font-medium text-blacky-950">Đặt hàng từ NCC</span>
                  <p className="text-xs text-blacky-500">Hàng đang trên đường về</p>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                stockInStatus === 'Received' ? 'border-accent-green bg-accent-green/10' : 'border-blacky-200 hover:border-blacky-400'
              }`}>
                <input
                  type="radio"
                  name="stockInStatus"
                  value="Received"
                  checked={stockInStatus === 'Received'}
                  onChange={(e) => onStatusChange(e.target.value as StockReceiptStatus)}
                  className="text-accent-green"
                />
                <div>
                  <span className="font-medium text-blacky-950">Mua đứt / Nhập trực tiếp</span>
                  <p className="text-xs text-blacky-500">Hàng có sẵn, cộng tồn kho thực ngay</p>
                </div>
              </label>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className="input-field resize-none"
              placeholder="Ghi chú về phiếu nhập..."
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-blacky-700">
                Danh sách sản phẩm <span className="text-accent-red">*</span>
              </label>
              <button
                type="button"
                onClick={onAddItem}
                className="text-bluesh-800 bg-basic-white border border-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 text-sm flex items-center gap-1 px-3 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" /> Thêm sản phẩm
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedProduct = item.productId
                  ? products.find((p) => p.ProductID === parseInt(item.productId))
                  : null;

                const availableUnits = selectedProduct
                  ? [
                      { UnitName: selectedProduct.BaseUnit, ExchangeValue: 1, IsDefault: true },
                      ...(selectedProduct.units || []),
                    ]
                  : [];

                return (
                  <div key={index} className="flex gap-2 items-start p-3 bg-basic-white border border-bluesh-600 rounded-lg">
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      <CustomSelect
                        compact
                        value={item.productId}
                        onChange={(val) => onItemChange(index, 'productId', val)}
                        options={products.map((p) => ({ value: String(p.ProductID), label: `${p.ProductName} (${p.SKU})` }))}
                        placeholder="Chọn sản phẩm"
                      />
                      <CustomSelect
                        compact
                        disabled={!item.productId}
                        value={item.unitName}
                        onChange={(val) => onItemChange(index, 'unitName', val)}
                        options={availableUnits.map((unit) => ({
                          value: unit.UnitName,
                          label: unit.UnitName + (Number(unit.ExchangeValue) > 1 ? ` (1 = ${unit.ExchangeValue} ${selectedProduct?.BaseUnit || ''})` : ''),
                        }))}
                        placeholder="Chọn đơn vị"
                      />
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        placeholder="Số lượng"
                        value={item.quantity}
                        onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                        className="px-3 py-2 border border-blacky-300 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
                      />
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        placeholder="Đơn giá"
                        value={item.unitPrice}
                        onChange={(e) => onItemChange(index, 'unitPrice', e.target.value)}
                        className="px-3 py-2 border border-blacky-300 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Chiết khấu (%)"
                        title="Chiết khấu từ nhà cung cấp (%)"
                        value={item.discountRate}
                        onChange={(e) => onItemChange(index, 'discountRate', e.target.value)}
                        className="px-3 py-2 border border-blacky-300 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        title="Xóa dòng"
                        onClick={() => onRemoveItem(index)}
                        className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-basic-border pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-blacky-950">Tổng tiền:</span>
              <span className="text-bluesh-800">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

        </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-basic-border bg-basic-white shrink-0">
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={onClose} className="btn btn-secondary w-[20%]! rounded-lg!">Hủy</button>
            <button type="submit" form="stock-in-form" className="btn btn-primary w-[25%]! rounded-lg!">Xác nhận nhập kho</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockInModal;
