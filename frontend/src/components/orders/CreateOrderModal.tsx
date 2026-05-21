import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, AlertTriangle } from 'lucide-react';
import ordersService from '../../services/ordersService';
import { customersService } from '../../services/customersService';
import { productsService } from '../../services/productsService';
import { useToast } from '../ToastProvider';
import CustomerPhoneInput from './CustomerPhoneInput';
import CustomSelect from '../CustomSelect';
import type { Product, DeliveryMethod } from '@/types';

interface OrderFormItem {
  productId: string;
  unitName: string;
  quantity: string;
  /** Auto-filled from suggested-price API; user can override */
  unitPrice: string;
  /** Read-only cost price reference from API */
  costPrice: string;
  loadingPrice: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateOrderModal({ open, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Immediate');
  const [paidAmount, setPaidAmount] = useState('');
  const [items, setItems] = useState<OrderFormItem[]>([{ productId: '', unitName: '', quantity: '', unitPrice: '', costPrice: '', loadingPrice: false }]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const productsData = await productsService.getAll();
        setProducts(
          (Array.isArray(productsData)
            ? productsData
            : (productsData as { data?: Product[] })?.data ?? []
          ).filter((p: Product) => p.IsActive),
        );
      } catch (err) {
        console.error('Error loading products:', err);
      }
    })();
  }, [open]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', unitName: '', quantity: '', unitPrice: '', costPrice: '', loadingPrice: false }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const fetchSuggestedPrice = useCallback(async (index: number, productId: string, unitName: string) => {
    if (!productId || !unitName) return;
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], loadingPrice: true };
      return copy;
    });
    try {
      const result = await productsService.getSuggestedPrice(parseInt(productId), unitName);
      setItems(prev => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          unitPrice: String(result.suggestedPrice),
          costPrice: String(result.costPrice),
          loadingPrice: false,
        };
        return copy;
      });
    } catch {
      setItems(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], loadingPrice: false };
        return copy;
      });
    }
  }, []);

  const handleItemChange = (index: number, field: keyof OrderFormItem, value: string) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'productId') {
        const product = products.find((p) => p.ProductID === parseInt(value));
        newItems[index].unitName = product ? product.BaseUnit : '';
        newItems[index].unitPrice = '';
        newItems[index].costPrice = '';
        if (product && product.BaseUnit) {
          fetchSuggestedPrice(index, value, product.BaseUnit);
        }
      }
      if (field === 'unitName') {
        newItems[index].unitPrice = '';
        newItems[index].costPrice = '';
        if (newItems[index].productId && value) {
          fetchSuggestedPrice(index, newItems[index].productId, value);
        }
      }
      return newItems;
    });
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      if (isNaN(qty) || isNaN(price)) return sum;
      return sum + qty * price;
    }, 0);
  };

  const formatCurrency = (value: number | string): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code',
    }).format(Number(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validItems = items.filter(
      (item) => item.productId && item.unitName && item.quantity,
    );
    if (validItems.length === 0) {
      toast.warning('Vui lòng thêm ít nhất 1 sản phẩm hợp lệ');
      return;
    }
    try {
      // Nếu chưa chọn khách có sẵn nhưng có SĐT + tên → tạo khách mới trước
      let resolvedCustomerId: number | null = customerId;
      if (!customerId && customerPhone && customerName) {
        const newCustomer = await customersService.create({
          CustomerName: customerName,
          Phone: customerPhone,
        });
        resolvedCustomerId = newCustomer.CustomerID;
      }

      await ordersService.createOrder({
        customerId: resolvedCustomerId,
        note,
        deliveryMethod,
        ...(deliveryMethod === 'Reserved' && paidAmount !== '' ? { paidAmount: parseFloat(paidAmount) || 0 } : {}),
        items: validItems.map((item) => ({
          productId: parseInt(item.productId),
          unitName: item.unitName,
          quantity: item.quantity,
          ...(item.unitPrice ? { unitPrice: parseFloat(item.unitPrice) } : {}),
        })),
      });
      toast.success('Tạo đơn hàng thành công!');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      console.error('Error creating order:', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-yellowfish-400 bg-basic-white shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-blacky-950">Tạo đơn hàng mới</h2>
              <p className="text-sm text-blacky-500 mt-0.5">Chọn khách hàng và sản phẩm để tạo đơn</p>
            </div>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-bluesh-50 hover:text-basic-white hover:bg-bluesh-800 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">
              SĐT Khách hàng
            </label>
            <CustomerPhoneInput
              onChange={(id, name, phone) => {
                setCustomerId(id);
                setCustomerName(name);
                setCustomerPhone(phone);
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">Ghi chú</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field resize-none"
              placeholder="Ghi chú về đơn hàng..."
            />
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">Phương thức giao hàng</label>
            <CustomSelect
              value={deliveryMethod}
              onChange={(v) => setDeliveryMethod(v as DeliveryMethod)}
              options={[
                { value: 'Immediate', label: 'Giao ngay' },
                { value: 'Reserved', label: 'Đặt trước' },
              ]}
            />
          </div>

          {/* Deposit — chỉ hiện với đơn Đặt trước */}
          {deliveryMethod === 'Reserved' && (
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                Tiền đặt cọc <span className="text-blacky-400 font-normal">(để trống nếu chưa cọc)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-blacky-700">
                Danh sách sản phẩm <span className="text-accent-red">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-bluesh-800 bg-basic-white border border-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 text-base flex items-center gap-1 px-3 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />Thêm sản phẩm
              </button>
            </div>

            <div className="space-y-2">
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
                  <div key={index} className="flex gap-2 items-start p-3 bg-blacky-50 rounded-xl border border-basic-border">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <CustomSelect
                          compact
                          value={item.productId}
                          onChange={(v) => handleItemChange(index, 'productId', v)}
                          options={products.map((p) => ({ value: String(p.ProductID), label: `${p.ProductName} (${p.SKU})` }))}
                          placeholder="Chọn sản phẩm"
                        />

                        <CustomSelect
                          compact
                          value={item.unitName}
                          onChange={(v) => handleItemChange(index, 'unitName', v)}
                          options={availableUnits.map((unit) => ({
                            value: unit.UnitName,
                            label: unit.UnitName + (Number(unit.ExchangeValue) > 1 ? ` (1 = ${unit.ExchangeValue} ${selectedProduct?.BaseUnit || ''})` : ''),
                          }))}
                          placeholder="Chọn đơn vị"
                          disabled={!item.productId}
                        />

                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0.01"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="input-field"
                        />
                      </div>

                      {/* Pricing row */}
                      <div className="flex items-center gap-3 px-1 min-h-8">
                        {item.loadingPrice ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blacky-400" />
                        ) : item.productId && item.unitName ? (
                          <>
                            <span className="text-xs text-blacky-500 shrink-0">Đơn giá bán:</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Nhập giá bán..."
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              className="input-field text-sm py-1 w-36"
                            />
                            {item.costPrice && (
                              <span className="text-xs text-blacky-500 shrink-0">
                                Giá vốn: <span className="font-medium">{formatCurrency(parseFloat(item.costPrice))}</span>
                              </span>
                            )}
                            {item.unitPrice && item.costPrice &&
                              parseFloat(item.unitPrice) < parseFloat(item.costPrice) && (
                                <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Thấp hơn giá vốn
                                </span>
                              )}
                            {item.unitPrice && item.quantity && (
                              <span className="ml-auto text-xs font-medium text-blacky-700 shrink-0">
                                = {formatCurrency(parseFloat(item.unitPrice) * parseFloat(item.quantity))}
                              </span>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        title="Xóa dòng"
                        onClick={() => handleRemoveItem(index)}
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
            <div className="flex justify-between items-center">
              <span className="text-sm text-blacky-500">Tổng tiền (ước tính):</span>
              <span className="text-lg font-bold text-bluesh-800">{formatCurrency(calculateTotal())}</span>
            </div>
            <p className="text-xs text-blacky-400 mt-1">
              * Giá tự động tính theo biên lợi nhuận sản phẩm; bạn có thể điều chỉnh.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 justify-center">
            <button type="button" onClick={onClose} className="btn btn-secondary w-[30%] rounded-lg">Hủy</button>
            <button type="submit" className="btn btn-primary w-[30%] rounded-lg">Tạo đơn hàng</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default CreateOrderModal;
