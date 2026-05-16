import React, { useState, useEffect } from 'react';
import { Plus, User, X } from 'lucide-react';
import ordersService from '../../services/ordersService';
import { customersService } from '../../services/customersService';
import { productsService } from '../../services/productsService';
import { useToast } from '../ToastProvider';
import type { Customer, Product, DeliveryMethod } from '@/types';

interface OrderFormItem {
  productId: string;
  unitName: string;
  quantity: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateOrderModal({ open, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [note, setNote] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Immediate');
  const [items, setItems] = useState<OrderFormItem[]>([{ productId: '', unitName: '', quantity: '' }]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [customersRes, productsData] = await Promise.all([
          customersService.getAll(),
          productsService.getAll(),
        ]);
        const customersArr = Array.isArray(customersRes)
          ? customersRes
          : (customersRes as { data?: Customer[] })?.data ?? [];
        setCustomers(customersArr as Customer[]);
        setProducts(
          (Array.isArray(productsData)
            ? productsData
            : (productsData as { data?: Product[] })?.data ?? []
          ).filter((p: Product) => p.IsActive),
        );
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    })();
  }, [open]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', unitName: '', quantity: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof OrderFormItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'productId') {
      const product = products.find((p) => p.ProductID === parseInt(value));
      if (product) {
        newItems[index].unitName = product.BaseUnit;
      }
    }
    setItems(newItems);
  };

  const resolvePrice = (productId: string, unitName: string, quantity: string) => {
    const product = products.find((p) => p.ProductID === parseInt(productId));
    if (!product || !unitName || !quantity) return null;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return null;
    const matching = (product.prices || [])
      .filter((p) => p.UnitName === unitName)
      .sort((a, b) => b.MinQuantity - a.MinQuantity);
    if (matching.length === 0) return null;
    return matching.find((p) => qty >= p.MinQuantity) ?? matching[matching.length - 1];
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => {
      const price = resolvePrice(item.productId, item.unitName, item.quantity);
      if (!price) return sum;
      return sum + parseFloat(item.quantity) * parseFloat(price.UnitPrice);
    }, 0);
  };

  const formatCurrency = (value: number | string): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
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
      await ordersService.createOrder({
        customerId: selectedCustomer ? parseInt(selectedCustomer) : null,
        note,
        deliveryMethod,
        items: validItems.map((item) => ({
          productId: parseInt(item.productId),
          unitName: item.unitName,
          quantity: item.quantity,
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
              Khách hàng <span className="text-blacky-400 font-normal">(để trống nếu khách vãng lai)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blacky-400" />
              <select
                title="Khách hàng"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="input-field pl-9"
              >
                <option value="">-- Khách vãng lai --</option>
                {customers.map((customer) => (
                  <option key={customer.CustomerID} value={customer.CustomerID}>
                    {customer.CustomerName} - {customer.Phone}
                  </option>
                ))}
              </select>
            </div>
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
            <select
              title="Phương thức giao hàng"
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
              className="input-field"
            >
              <option value="Immediate">Giao ngay</option>
              <option value="Reserved">Đặt trước</option>
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-blacky-700">
                Danh sách sản phẩm <span className="text-accent-red">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-bluesh-800 hover:text-bluesh-900 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Thêm sản phẩm
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

                const appliedPrice = resolvePrice(item.productId, item.unitName, item.quantity);

                return (
                  <div key={index} className="flex gap-2 items-start p-3 bg-blacky-50 rounded-xl border border-basic-border">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          required
                          title="Sản phẩm"
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="input-field"
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.map((product) => (
                            <option key={product.ProductID} value={product.ProductID}>
                              {product.ProductName} ({product.SKU})
                            </option>
                          ))}
                        </select>

                        <select
                          required
                          title="Đơn vị tính"
                          disabled={!item.productId}
                          value={item.unitName}
                          onChange={(e) => handleItemChange(index, 'unitName', e.target.value)}
                          className="input-field disabled:opacity-50"
                        >
                          <option value="">-- Chọn đơn vị --</option>
                          {availableUnits.map((unit, idx) => (
                            <option key={idx} value={unit.UnitName}>
                              {unit.UnitName}{' '}
                              {Number(unit.ExchangeValue) > 1 &&
                                `(1 = ${unit.ExchangeValue} ${selectedProduct?.BaseUnit || ''})`}
                            </option>
                          ))}
                        </select>

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

                      {appliedPrice && (
                        <div className="flex items-center justify-between px-1 text-xs text-blacky-500">
                          <span>
                            Đơn giá áp dụng:{' '}
                            <span className="font-semibold text-bluesh-800">
                              {formatCurrency(parseFloat(appliedPrice.UnitPrice))}
                            </span>
                            {appliedPrice.PriceName && (
                              <span className="ml-1 text-blacky-400">({appliedPrice.PriceName})</span>
                            )}
                          </span>
                          {item.quantity && (
                            <span className="font-medium text-blacky-700">
                              = {formatCurrency(parseFloat(item.quantity) * parseFloat(appliedPrice.UnitPrice))}
                            </span>
                          )}
                        </div>
                      )}
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
              * Giá cuối sẽ tính theo bảng giá và số lượng mua
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Hủy</button>
            <button type="submit" className="btn btn-primary flex-1">Tạo đơn hàng</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default CreateOrderModal;
