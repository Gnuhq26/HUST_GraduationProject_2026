import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Upload, Download, Edit2, Trash2 } from 'lucide-react';
import { productsService } from '../services/productsService';
import ProtectedAction from '../components/ProtectedAction';
import ImportProductModal from '../components/products/ImportProductModal';
import ProductDetailPanel from '../components/products/ProductDetailPanel';
import ProductFormModal from '../components/products/ProductFormModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import { categoriesService } from '../services/categoriesService';
import type { Product, Category } from '@/types';
import productImg from '../assets/product.png';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const selectedProductIdRef = useRef<number | null>(null);

  const toast = useToast();

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsService.getAll(showInactive ? { isActive: false } : { isActive: true });
      setProducts(data ?? []);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    categoriesService.getAll().then(setCategories).catch(() => {});
  }, []);

  // Sync selectedProduct object when the products list reloads (e.g. after unit CRUD)
  useEffect(() => {
    const id = selectedProductIdRef.current;
    if (id !== null) {
      const updated = products.find((p) => p.ProductID === id);
      if (updated) setSelectedProduct(updated);
    }
  }, [products]);

  const handleSelectProduct = (product: Product) => {
    if (selectedProduct?.ProductID === product.ProductID) {
      setSelectedProduct(null);
      selectedProductIdRef.current = null;
    } else {
      setSelectedProduct(product);
      selectedProductIdRef.current = product.ProductID;
    }
  };

  const handleUnitUpdated = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  // Open modal for create
  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  // Delete product
  const handleDelete = (id: number) => {
    setConfirmDelete(id);
  };

  const doDelete = async () => {
    if (confirmDelete === null) return;
    setConfirmDelete(null);
    try {
      await productsService.delete(confirmDelete);
      toast.success('Xóa sản phẩm thành công');
      loadProducts();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi xóa:', error);
      toast.error(e.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  // Export products to Excel
  const handleExport = async () => {
    try {
      await productsService.exportProducts();
      toast.success('Xuất file Excel thành công');
    } catch (error) {
      console.error('Lỗi export:', error);
      toast.error('Không thể xuất file Excel');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blacky-850">Sản phẩm</h1>
          <p className="text-blacky-500 mt-1">Quản lý danh sách sản phẩm</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-blacky-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Hiển thị đã ngưng
          </label>
          <ProtectedAction action="read" subject="Product">
            <button onClick={handleExport} className="btn btn-secondary w-fit! px-4! rounded-lg!">
              <Download className="w-4 h-4" />Export Excel
            </button>
          </ProtectedAction>
          <ProtectedAction action="create" subject="Product">
            <button onClick={() => setShowImportModal(true)} className="btn btn-secondary w-fit! px-4! rounded-lg!">
              <Upload className="w-4 h-4" />Import Excel
            </button>
          </ProtectedAction>
          <ProtectedAction action="create" subject="Product">
            <button onClick={handleCreate} className="btn btn-primary w-fit! px-4! rounded-lg!">
              <Plus className="w-4 h-4" />Thêm sản phẩm
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Panel + Table */}
      <div className="flex gap-4 items-start">
        {/* Table — shrinks automatically */}
        <div className="flex-1 bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden min-w-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-blacky-400 font-medium">Đang tải...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <img src= {productImg} alt="Không có sản phẩm" className="w-50 h-50 object-contain opacity-80" />
            <p className="text-blacky-500">Chưa có sản phẩm nào</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bluesh-800 border-b border-basic-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Mã SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Đơn vị</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase">Biên LN</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product, idx) => (
                  <tr
                    key={product.ProductID}
                    className={`cursor-pointer hover:bg-bluesh-50 transition-colors ${
                      selectedProduct?.ProductID === product.ProductID ? 'bg-bluesh-50' : ''
                    }`}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <td className="px-6 py-4 text-sm text-left text-blacky-700">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-blacky-900">{product.SKU}</td>
                    <td className="px-6 py-4 text-sm text-blacky-900">{product.ProductName}</td>
                    <td className="px-6 py-4 text-sm text-blacky-900">{product.BaseUnit}</td>
                    <td className="px-6 py-4 text-sm text-right text-blacky-700">
                      {product.MarginRate != null ? (parseFloat(product.MarginRate) * 100).toFixed(0) + '%' : '—'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {product.IsActive ? 'Hoạt động' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <ProtectedAction action="update" subject="Product">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          title="Chỉnh sửa"
                          className="text-bluesh-800 hover:text-bluesh-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction action="delete" subject="Product">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(product.ProductID); }}
                          title="Xóa"
                          className="text-accent-red hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        )}
        </div>

        {/* Detail panel — slides in from the right */}
        <div
          className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            selectedProduct ? 'w-95' : 'w-0'
          }`}
        >
          {selectedProduct && (
            <ProductDetailPanel
              product={selectedProduct}
              onClose={() => { setSelectedProduct(null); selectedProductIdRef.current = null; }}
              onUpdated={handleUnitUpdated}
            />
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSuccess={loadProducts}
        />
      )}
      {/* Import Modal */}
      {showImportModal && (
        <ImportProductModal
          onClose={() => setShowImportModal(false)}
          onSuccess={loadProducts}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Xóa sản phẩm"
        message="Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
