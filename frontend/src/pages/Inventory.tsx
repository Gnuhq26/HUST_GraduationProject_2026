import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { Plus, Package, Truck, ShoppingBag, AlertTriangle, FileText, Eye, CheckCircle, Download, Search, SlidersHorizontal, History } from 'lucide-react';
import inventoryService from '../services/inventoryService';
import suppliersService from '../services/suppliersService';
import { productsService } from '../services/productsService';
import { customersService } from '../services/customersService';
import ProductStockHistoryModal from '../components/inventory/ProductStockHistoryModal';
import InventoryMovementTab from '../components/inventory/InventoryMovementTab';
import StockReceiptDetailModal from '../components/inventory/StockReceiptDetailModal';
import StockInModal, { type StockInFormItem } from '../components/inventory/StockInModal';
import DirectShipModal, { type DirectShipState } from '../components/inventory/DirectShipModal';
import ProtectedAction from '../components/ProtectedAction';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import type { Supplier, Customer, Product, StockReceiptStatus } from '@/types';

interface InventoryItem {
  InventoryID: number;
  StoreID: number;
  ProductID: number;
  ProductName: string;
  SKU: string | null;
  BaseUnit: string;
  Category?: { CategoryName: string };
  Quantity: string;
  ReservedQty: string;
  InTransitQty: string;
  AvailableQty?: string;
}

interface StockReceiptWithCount {
  ReceiptID: number;
  ReceiptCode: string | null;
  ImportDate: string;
  TotalAmount: string;
  Status: string;
  supplier?: { SupplierName: string };
  _count?: { details: number };
}

function Inventory() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'inventory' | 'receipts' | 'movements'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [receipts, setReceipts] = useState<StockReceiptWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [isDirectShipModalOpen, setIsDirectShipModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmReceipt, setConfirmReceipt] = useState<{ id: number; code: string } | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventoryFilterOpen, setInventoryFilterOpen] = useState(false);
  const inventoryFilterRef = useRef<HTMLDivElement>(null);

  // Stock-In Form States
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [stockInStatus, setStockInStatus] = useState<StockReceiptStatus>('Pending');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<StockInFormItem[]>([{ productId: '', unitName: '', quantity: '', unitPrice: '', discountRate: '' }]);

  // Direct Ship Form States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ds, setDs] = useState<DirectShipState>({
    supplierId: '', productId: '', unitName: '', totalQty: '', deliverQty: '',
    importUnitPrice: '', discountRate: '', saleUnitPrice: '', customerId: '', note: '',
  });

  // Load danh sách tồn kho
  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory();
      setInventory((Array.isArray(res) ? res : (res as { data?: InventoryItem[] })?.data ?? []) as unknown as InventoryItem[]);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách phiếu nhập kho
  const loadReceipts = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getStockReceipts();
      setReceipts(res as StockReceiptWithCount[]);
    } catch (err) {
      console.error('Error loading receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers và products khi mở modal
  const loadFormData = async () => {
    try {
      const [suppliersRes, productsData] = await Promise.all([
        suppliersService.getAll(),
        productsService.getAll(),
      ]);
      const suppliersArr = Array.isArray(suppliersRes) ? suppliersRes : (suppliersRes as { data?: Supplier[] })?.data ?? [];
      setSuppliers(suppliersArr as Supplier[]);
      const productsArr = Array.isArray(productsData) ? productsData : (productsData as { data?: Product[] })?.data ?? [];
      setProducts((productsArr as Product[]).filter((p: Product) => p.IsActive));
    } catch (err) {
      console.error('Error loading form data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    } else if (activeTab === 'receipts') {
      loadReceipts();
    }
  }, [activeTab]);

  // Đóng filter dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inventoryFilterRef.current && !inventoryFilterRef.current.contains(e.target as Node)) {
        setInventoryFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mở modal nhập kho
  const handleOpenStockIn = async () => {
    await loadFormData();
    setSelectedSupplier('');
    setStockInStatus('Pending');
    setNote('');
    setItems([{ productId: '', unitName: '', quantity: '', unitPrice: '', discountRate: '' }]);
    setIsStockInModalOpen(true);
  };

  // Thêm dòng item
  const handleAddItem = () => {
    setItems([...items, { productId: '', unitName: '', quantity: '', unitPrice: '', discountRate: '' }]);
  };

  // Xóa dòng item
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Cập nhật item
  const handleItemChange = (index: number, field: keyof StockInFormItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Khi chọn product, tự động điền BaseUnit
    if (field === 'productId') {
      const product = products.find((p) => p.ProductID === parseInt(value));
      if (product) {
        newItems[index].unitName = product.BaseUnit;
      }
    }

    setItems(newItems);
  };

  // Submit nhập kho
  const handleSubmitStockIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!selectedSupplier) {
      toast.warning('Vui lòng chọn nhà cung cấp');
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.unitName && item.quantity && item.unitPrice
    );

    if (validItems.length === 0) {
      toast.warning('Vui lòng thêm ít nhất 1 sản phẩm hợp lệ');
      return;
    }

    try {
      await inventoryService.stockIn({
        supplierId: parseInt(selectedSupplier),
        status: stockInStatus,
        note,
        items: validItems.map((item) => ({
          productId: parseInt(item.productId),
          unitName: item.unitName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate,
        })),
      });

      toast.success('Nhập kho thành công!');
      setIsStockInModalOpen(false);
      if (activeTab === 'inventory') {
        loadInventory();
      } else {
        loadReceipts();
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi nhập kho');
      console.error('Error stock-in:', err);
    }
  };

  // Tính tổng tiền (áp dụng chiết khấu → giá vốn thực tế)
  const calculateTotal = (): number => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discountRate) || 0;
      const costPrice = price * (1 - discount / 100);
      return sum + quantity * costPrice;
    }, 0);
  };

  // === Export Excel ===
  const handleExport = async () => {
    try {
      setExporting(true);
      await inventoryService.exportInventory();
    } catch (err) {
      console.error('Error exporting inventory:', err);
    } finally {
      setExporting(false);
    }
  };

  // === Direct Ship ===
  const handleOpenDirectShip = async () => {
    await loadFormData();
    try {
      const custRes = await customersService.getAll();
      setCustomers((Array.isArray(custRes) ? custRes : (custRes as { data?: Customer[] })?.data ?? []) as Customer[]);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
    setDs({
      supplierId: '', productId: '', unitName: '', totalQty: '', deliverQty: '',
      importUnitPrice: '', discountRate: '', saleUnitPrice: '', customerId: '', note: '',
    });
    setIsDirectShipModalOpen(true);
  };

  const handleDsChange = (field: keyof DirectShipState, value: string) => {
    setDs((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'productId') {
        const product = products.find((p) => p.ProductID === parseInt(value));
        if (product) next.unitName = product.BaseUnit;
      }
      return next;
    });
  };

  const handleSubmitDirectShip = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ds.supplierId || !ds.productId || !ds.totalQty || !ds.deliverQty || !ds.importUnitPrice || !ds.saleUnitPrice) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (parseFloat(ds.deliverQty) > parseFloat(ds.totalQty)) {
      toast.warning('Số lượng giao không được lớn hơn tổng số lượng nhập');
      return;
    }
    try {
      await inventoryService.directShip({
        supplierId: parseInt(ds.supplierId),
        productId: parseInt(ds.productId),
        unitName: ds.unitName,
        totalQty: ds.totalQty,
        deliverQty: ds.deliverQty,
        importUnitPrice: ds.importUnitPrice,
        importDiscountRate: ds.discountRate || undefined,
        saleUnitPrice: ds.saleUnitPrice,
        customerId: ds.customerId ? parseInt(ds.customerId) : undefined,
        note: ds.note || undefined,
      });
      toast.success('Giao thẳng thành công! Đã tạo phiếu nhập + đơn hàng.');
      setIsDirectShipModalOpen(false);
      loadInventory();
      loadReceipts();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi giao thẳng');
      console.error('Error direct ship:', err);
    }
  };

  // Derived unique categories from inventory
  const inventoryCategories = useMemo(() => {
    const names = inventory
      .map((item) => item.Category?.CategoryName)
      .filter((name): name is string => !!name);
    return [...new Set(names)].sort();
  }, [inventory]);

  // Filtered inventory for display
  const displayedInventory = useMemo(() => {
    let result = inventory;
    if (inventorySearch.trim()) {
      const q = inventorySearch.trim().toLowerCase();
      result = result.filter((item) => item.ProductName.toLowerCase().includes(q));
    }
    if (inventoryCategoryFilter) {
      result = result.filter((item) => item.Category?.CategoryName === inventoryCategoryFilter);
    }
    return result;
  }, [inventory, inventorySearch, inventoryCategoryFilter]);

  // Format currency
  const formatCurrency = (value: number | string): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code'

    }).format(Number(value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blacky-400 font-medium">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blacky-950">Quản lý Tồn kho</h1>
          <p className="text-blacky-500 mt-1">Theo dõi tồn kho và nhập hàng</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'inventory' && (
            <ProtectedAction action="read" subject="Inventory">
              <button onClick={handleExport} disabled={exporting} className="btn btn-secondary w-fit! px-4! rounded-lg!">
                <Download className="w-4 h-4" />{exporting ? 'Đang xuất...' : 'Xuất Excel'}
              </button>
            </ProtectedAction>
          )}
          <ProtectedAction action="create" subject="Inventory">
            <button onClick={handleOpenDirectShip} className="btn btn-secondary w-fit! px-4! rounded-lg!">
              Giao thẳng
            </button>
          </ProtectedAction>
          <ProtectedAction action="create" subject="Inventory">
            <button onClick={handleOpenStockIn} className="btn btn-primary w-fit! px-4! rounded-lg!">
              <Plus className="w-4 h-4" />Nhập kho
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-bluesh-50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <Package className="w-4 h-4" />Danh sách tồn kho
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'receipts'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-bluesh-800'
          }`}
        >
          <FileText className="w-4 h-4" />Phiếu nhập kho
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-bluesh-800'
          }`}
        >
          <History className="w-4 h-4" />Biến động kho
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-bluesh-50 border border-bluesh-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blacky-700 text-sm font-medium">Tổng sản phẩm</p>
                  <p className="text-3xl font-bold mt-1 text-bluesh-800">{inventory.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-basic-white" />
                </div>
              </div>
            </div>

            <div className="bg-basic-white border-2 border-basic-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blacky-700 text-sm font-medium">Còn hàng</p>
                  <p className="text-3xl font-bold mt-1 text-accent-green">
                    {inventory.filter((item) => Number(item.Quantity) > 0).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl border border-accent-green bg-accent-green/10 flex items-center justify-center">
                  <Package className="w-6 h-6  text-accent-green" />
                </div>
              </div>
            </div>

            <div className="bg-basic-white border-2 border-basic-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blacky-700 text-sm font-medium">Hết hàng</p>
                  <p className="text-3xl font-bold mt-1 text-accent-red">
                    {inventory.filter((item) => Number(item.Quantity) === 0).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl border border-accent-red bg-accent-red/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-accent-red" />
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blacky-400" />
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-basic-border2 rounded-lg bg-basic-white text-blacky-950 placeholder:text-blacky-400 focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
              />
            </div>
            <div className="relative" ref={inventoryFilterRef}>
              <button
                onClick={() => setInventoryFilterOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  inventoryCategoryFilter
                    ? 'border-bluesh-800 text-bluesh-800 bg-bluesh-50'
                    : 'border-basic-border text-blacky-700 bg-basic-white hover:border-bluesh-800 hover:text-bluesh-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {inventoryCategoryFilter || 'Lọc'}
              </button>
              {inventoryFilterOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-basic-white border border-basic-border2 rounded-xl shadow-lg z-20 p-1.5">
                  <button
                    onClick={() => { setInventoryCategoryFilter(''); setInventoryFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                      !inventoryCategoryFilter
                        ? 'bg-bluesh-50 text-bluesh-800 font-medium'
                        : 'text-blacky-700 hover:bg-blacky-50'
                    }`}
                  >
                    Tất cả danh mục
                    {!inventoryCategoryFilter && <span className="w-1.5 h-1.5 rounded-full bg-bluesh-800 shrink-0" />}
                  </button>
                  {inventoryCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setInventoryCategoryFilter(cat); setInventoryFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                        inventoryCategoryFilter === cat
                          ? 'bg-bluesh-50 text-bluesh-800 font-medium'
                          : 'text-blacky-700 hover:bg-blacky-50'
                      }`}
                    >
                      {cat}
                      {inventoryCategoryFilter === cat && <span className="w-1.5 h-1.5 rounded-full bg-bluesh-800 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Inventory Table */}
          <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
            {inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Package className="w-12 h-12 text-blacky-200" />
                <p className="text-blacky-500">Chưa có dữ liệu tồn kho</p>
              </div>
            ) : displayedInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="w-12 h-12 text-blacky-200" />
                <p className="text-blacky-500">Không tìm thấy sản phẩm phù hợp</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bluesh-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">STT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Danh mục</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Đơn vị</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Tồn kho</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Đã đặt</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Đang về</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Có thể bán</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-basic-border">
                    {displayedInventory.map((item, idx) => {
                      const quantity = Number(item.Quantity);
                      const isOutOfStock = quantity === 0;
                      return (
                        <tr
                          key={item.InventoryID}
                          onClick={() => setSelectedProductId(item.ProductID)}
                          className="hover:bg-blacky-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 text-left text-blacky-700">{idx + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-blacky-950">{item.ProductName || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-blacky-700">
                            {item.Category?.CategoryName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-blacky-500">{item.SKU || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-blacky-700">{item.BaseUnit || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`font-semibold ${isOutOfStock ? 'text-accent-red' : 'text-blacky-950'}`}>
                              {quantity.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-yellowfish-600 font-medium">
                              {Number(item.ReservedQty || 0).toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-bluesh-700 font-medium">
                              {Number(item.InTransitQty || 0).toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-accent-green font-semibold">
                              {Number(item.AvailableQty ?? quantity).toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isOutOfStock ? (
                              <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-accent-red/10 text-accent-red">
                                Hết hàng
                              </span>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-accent-green/10 text-accent-green">
                                Còn hàng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'receipts' ? (
        <>
          {/* Receipts Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-bluesh-50 border border-bluesh-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blacky-950 text-sm font-medium">Tổng phiếu nhập</p>
                  <p className="text-3xl font-bold mt-1 text-bluesh-800">{receipts.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-basic-white" />
                </div>
              </div>
            </div>

            <div className="bg-basic-white border-2 border-basic-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blacky-950 text-sm font-medium">Tổng sản phẩm nhập</p>
                  <p className="text-3xl font-bold mt-1 text-yellowfish-400">
                    {receipts.reduce((sum, r) => sum + (r._count?.details || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl border border-yellowfish-500 bg-yellowfish-50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-yellowfish-500" />
                </div>
              </div>
            </div>

            <div className="bg-basic-white border-2 border-basic-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blacky-500 text-sm font-medium">Tổng giá trị</p>
                  <p className="text-2xl font-bold mt-1 text-accent-green">
                    {formatCurrency(receipts.reduce((sum, r) => sum + Number(r.TotalAmount), 0))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl border border-accent-green bg-accent-green/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-accent-green" />
                </div>
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
            {receipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <FileText className="w-12 h-12 text-blacky-200" />
                <p className="text-blacky-500">Chưa có phiếu nhập kho</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bluesh-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">STT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Mã phiếu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Ngày nhập</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Nhà cung cấp</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Số SP</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Tổng tiền</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-basic-border">
                    {receipts.map((receipt, idx) => (
                      <tr key={receipt.ReceiptID} className="hover:bg-blacky-50">
                        <td className="px-6 py-4 text-left text-blacky-500">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-bluesh-800 px-2 py-1 rounded">
                            {receipt.ReceiptCode || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blacky-950 font-medium">
                          {new Date(receipt.ImportDate).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blacky-400" />
                            <span className="text-blacky-950">{receipt.supplier?.SupplierName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-bluesh-50 text-bluesh-800 rounded">
                            {receipt._count?.details || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blacky-700 font-medium">
                          {formatCurrency(receipt.TotalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            receipt.Status === 'Pending'
                              ? 'bg-yellowfish-50 text-yellowfish-700'
                              : 'bg-accent-green/10 text-accent-green'
                          }`}>
                            {receipt.Status === 'Pending' ? 'Đang về' : 'Đã nhập'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => setSelectedReceiptId(receipt.ReceiptID)}
                              className="text-bluesh-800 hover:text-bluesh-900 font-medium flex items-center gap-1 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              Chi tiết
                            </button>
                            {receipt.Status === 'Pending' && (
                              <ProtectedAction action="create" subject="Inventory">
                                <button
                                  onClick={() => setConfirmReceipt({ id: receipt.ReceiptID , code: receipt.ReceiptCode || '' })}
                                  className="text-accent-green hover:text-accent-green/80 font-medium flex items-center gap-1 text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Xác nhận
                                </button>
                              </ProtectedAction>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <InventoryMovementTab
          products={inventory.map((item) => ({
            ProductID: item.ProductID,
            ProductName: item.ProductName,
            SKU: item.SKU,
          }))}
        />
      )}

      {/* Stock-In Modal */}
      <StockInModal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        onSubmit={handleSubmitStockIn}
        suppliers={suppliers}
        products={products}
        selectedSupplier={selectedSupplier}
        onSupplierChange={setSelectedSupplier}
        stockInStatus={stockInStatus}
        onStatusChange={setStockInStatus}
        note={note}
        onNoteChange={setNote}
        items={items}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onItemChange={handleItemChange}
        calculateTotal={calculateTotal}
      />

      {/* Direct Ship Modal */}
      <DirectShipModal
        isOpen={isDirectShipModalOpen}
        onClose={() => setIsDirectShipModalOpen(false)}
        onSubmit={handleSubmitDirectShip}
        suppliers={suppliers}
        products={products}
        customers={customers}
        ds={ds}
        onDsChange={handleDsChange}
      />

      {/* Product Stock History Modal */}
      {selectedProductId && (
        <ProductStockHistoryModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {/* Stock Receipt Detail Modal */}
      {selectedReceiptId && (
        <StockReceiptDetailModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
          onConfirmed={() => loadReceipts()}
        />
      )}

      {/* Confirm Receipt Modal */}
      <ConfirmModal
        open={confirmReceipt !== null}
        title="Xác nhận nhận hàng"
        message={`Xác nhận đã nhận hàng cho phiếu nhập ${confirmReceipt?.code || ''}? Tồn kho sẽ được cập nhật ngay lập tức.`}
        confirmLabel="Xác nhận nhận hàng"
        variant="default"
        onCancel={() => setConfirmReceipt(null)}
        onConfirm={async () => {
          if (!confirmReceipt) return;
          try {
            await inventoryService.confirmReceipt(confirmReceipt.id);
            toast.success('Xác nhận nhận hàng thành công!');
            setConfirmReceipt(null);
            loadReceipts();
            loadInventory();
          } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
            setConfirmReceipt(null);
          }
        }}
      />
    </div>
  );
}

export default Inventory;
