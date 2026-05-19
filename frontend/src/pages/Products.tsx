import { useState, useEffect, useCallback } from 'react';
import { Plus, Upload, Download, Edit2, Trash2, X } from 'lucide-react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { productsService } from '../services/productsService';
import ProtectedAction from '../components/ProtectedAction';
import ImportProductModal from '../components/products/ImportProductModal';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import type { Product } from '@/types';

interface ProductFormData {
  ProductName: string;
  Description?: string;
  SKU?: string;
  BaseUnit: string;
  CategoryID?: number;
  IsActive?: string;
  /** Displayed as percentage (e.g. 15 = 15%). Converted to decimal on submit. */
  marginRate?: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const toast = useToast();
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<ProductFormData>();

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsService.getAll(showInactive ? {} : { isActive: true });
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

  // Open modal for create
  const handleCreate = () => {
    setEditingProduct(null);
    reset({});
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue('ProductName', product.ProductName);
    setValue('Description', product.Description ?? '');
    setValue('SKU', product.SKU ?? '');
    setValue('BaseUnit', product.BaseUnit);
    setValue('CategoryID', product.CategoryID);
    setValue('IsActive', String(product.IsActive));
    setValue('marginRate', product.MarginRate ? parseFloat(product.MarginRate) * 100 : 10);
    setShowModal(true);
  };

  // Submit form
  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    const payload = {
      productName: data.ProductName,
      categoryId: data.CategoryID ? Number(data.CategoryID) : undefined,
      sku: data.SKU || undefined,
      baseUnit: data.BaseUnit,
      description: data.Description || undefined,
      isActive: data.IsActive !== undefined ? data.IsActive === 'true' : undefined,
      marginRate: data.marginRate != null ? data.marginRate / 100 : 0.10,
    };
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.ProductID, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await productsService.create(payload);
        toast.success('Thêm sản phẩm thành công');
      }
      setShowModal(false);
      loadProducts();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi:', error);
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
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

      {/* Table */}
      <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-blacky-400 font-medium">Đang tải...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <img src="/src/assets/product.png" alt="Không có sản phẩm" className="w-50 h-50 object-contain opacity-80" />
            <p className="text-blacky-500">Chưa có sản phẩm nào</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bluesh-800 border-b border-basic-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Mã SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Đơn vị</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase">Biên LN</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                  <tr key={product.ProductID} className="hover:bg-gray-50">
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
                          onClick={() => handleEdit(product)}
                          title="Chỉnh sửa"
                          className="text-bluesh-800 hover:text-bluesh-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction action="delete" subject="Product">
                        <button
                          onClick={() => handleDelete(product.ProductID)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
          <div className="bg-basic-white rounded-2xl border border-basic-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="px-6 py-4 border-b border-yellowfish-300 flex items-center justify-between">
              <h2 className="text-lg font-bold text-blacky-950">
                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowModal(false)} title="Đóng" className="p-1.5 rounded-lg text-bluesh-800 hover:text-blacky-600 hover:bg-blacky-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                  Tên sản phẩm <span className="text-accent-red">*</span>
                </label>
                <input
                  {...register('ProductName', { required: 'Tên sản phẩm là bắt buộc' })}
                  className="input-field"
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.ProductName && <p className="mt-1 text-sm text-accent-red">{errors.ProductName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-blacky-700 mb-1.5">Mô tả</label>
                <textarea
                  {...register('Description')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Nhập mô tả sản phẩm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                    Mã SKU <span className="text-accent-red">*</span>
                  </label>
                  <input
                    {...register('SKU', { required: 'Mã SKU là bắt buộc' })}
                    className="input-field"
                    placeholder="SKU-001"
                  />
                  {errors.SKU && <p className="mt-1 text-sm text-accent-red">{errors.SKU.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                    Đơn vị gốc <span className="text-accent-red">*</span>
                  </label>
                  <input
                    {...register('BaseUnit', { required: 'Đơn vị gốc là bắt buộc' })}
                    className="input-field"
                    placeholder="Viên, Kg, Bao..."
                  />
                  {errors.BaseUnit && <p className="mt-1 text-sm text-accent-red">{errors.BaseUnit.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blacky-700 mb-1.5">ID Danh mục</label>
                  <input
                    type="number"
                    {...register('CategoryID')}
                    className="input-field"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                    Biên lợi nhuận (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register('marginRate', { min: 0, max: 100 })}
                    className="input-field"
                    placeholder="10"
                  />
                  <p className="mt-1 text-xs text-blacky-400">Ví dụ: 15 = 15% — dùng để tính giá bán gợi ý</p>
                  {errors.marginRate && <p className="mt-1 text-sm text-accent-red">Giá trị từ 0 đến 100</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blacky-700 mb-1.5">Trạng thái</label>
                  <Controller
                    name="IsActive"
                    control={control}
                    defaultValue="true"
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value ?? 'true'}
                        onChange={field.onChange}
                        options={[
                          { value: 'true', label: 'Hoạt động' },
                          { value: 'false', label: 'Ngưng hoạt động' },
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
