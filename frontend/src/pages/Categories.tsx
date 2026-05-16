import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Edit2, Trash2, X, Search, Package } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { categoriesService } from '../services/categoriesService';
import ProtectedAction from '../components/ProtectedAction';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import type { Category } from '@/types';

interface CategoryWithCount extends Category {
  _count?: {
    products?: number;
  };
}

interface CategoryFormData {
  CategoryName: string;
  Description?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const toast = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormData>();

  // Load categories
  const loadCategories = async (search = '') => {
    setLoading(true);
    try {
      const data = await categoriesService.getAll(search);
      setCategories(data as CategoryWithCount[]);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Search handler
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadCategories(searchTerm);
  };

  // Open modal for create
  const handleCreate = () => {
    setEditingCategory(null);
    reset({});
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue('CategoryName', category.CategoryName);
    setValue('Description', category.Description ?? '');
    setShowModal(true);
  };

  // Submit form
  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.CategoryID, data);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await categoriesService.create(data);
        toast.success('Thêm danh mục thành công');
      }
      setShowModal(false);
      loadCategories(searchTerm);
    } catch (err: unknown) {
      console.error('Lỗi:', err);
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete category
  const handleDelete = (id: number, categoryName: string) => {
    setConfirmDelete({ id, name: categoryName });
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setConfirmDelete(null);
    try {
      await categoriesService.delete(confirmDelete.id);
      toast.success('Xóa danh mục thành công');
      loadCategories(searchTerm);
    } catch (err: unknown) {
      console.error('Lỗi xóa:', err);
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Không thể xóa danh mục (có thể đang có sản phẩm)');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blacky-950">Danh mục</h1>
          <p className="text-blacky-500 mt-1">Quản lý danh mục sản phẩm</p>
        </div>
        <ProtectedAction action="create" subject="Category">
          <button onClick={handleCreate} className="btn btn-primary w-fit! px-4! rounded-lg!">
            <Plus className="w-4 h-4" />Thêm danh mục
          </button>
        </ProtectedAction>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blacky-700 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="input-field pl-11! h-12.5!"
            />
          </div>
          <button type="submit" className="btn btn-secondary w-fit! px-4! rounded-lg!">
            Tìm kiếm
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); loadCategories(); }}
              className="btn btn-secondary w-fit! px-4! rounded-lg!"
            >
              Xóa lọc
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-blacky-400 font-medium">Đang tải...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-12 h-12 text-blacky-200" />
            <p className="text-blacky-500">
              {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bluesh-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Tên danh mục</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Mô tả</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Số sản phẩm</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-basic-border">
                {categories.map((category) => (
                  <tr key={category.CategoryID} className="hover:bg-blacky-50">
                    <td className="px-6 py-4 text-sm font-medium text-blacky-900">
                      {category.CategoryName}
                    </td>
                    <td className="px-6 py-4 text-sm text-blacky-700">
                      {category.Description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-blacky-700">
                      <div className="flex items-center justify-center gap-1.5">
                        <Package className="w-4 h-4 text-yellowfish-300" />
                        {category._count?.products || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <ProtectedAction action="update" subject="Category">
                        <button
                          onClick={() => handleEdit(category)}
                          title="Chỉnh sửa"
                          className="text-bluesh-800 hover:text-bluesh-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction action="delete" subject="Category">
                        <button
                          onClick={() => handleDelete(category.CategoryID, category.CategoryName)}
                          title="Xóa"
                          className="text-accent-red hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
          <div className="bg-basic-white rounded-2xl border border-basic-border max-w-xl w-full shadow-lg">
            <div className="px-6 py-4 border-b border-yellowfish-400 flex items-center justify-between">
              <h2 className="text-lg font-bold text-blacky-950">
                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                title="Đóng"
                className="p-1.5 rounded-lg bg-bluesh-50 text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                  Tên danh mục <span className="text-accent-red">*</span>
                </label>
                <input
                  {...register('CategoryName', {
                    required: 'Tên danh mục là bắt buộc',
                    minLength: { value: 1, message: 'Tên danh mục quá ngắn' },
                    maxLength: { value: 255, message: 'Tên danh mục quá dài' },
                  })}
                  className="input-field"
                  placeholder="Nhập tên danh mục"
                />
                {errors.CategoryName && (
                  <p className="mt-1 text-sm text-accent-red">{errors.CategoryName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blacky-700 mb-1.5">Mô tả</label>
                <textarea
                  {...register('Description')}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Nhập mô tả danh mục (không bắt buộc)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục "${confirmDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
