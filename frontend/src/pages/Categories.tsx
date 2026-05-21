import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import { categoriesService } from '../services/categoriesService';
import ProtectedAction from '../components/ProtectedAction';
import ConfirmModal from '../components/ConfirmModal';
import CategoryFormModal from '../components/categories/CategoryFormModal';
import { useToast } from '../components/ToastProvider';
import type { Category } from '@/types';

interface CategoryWithCount extends Category {
  _count?: {
    products?: number;
  };
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const toast = useToast();

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
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Tên danh mục</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase">Mô tả</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase">Số sản phẩm</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-basic-border">
                {categories.map((category, idx) => (
                  <tr key={category.CategoryID} className="hover:bg-blacky-50">
                    <td className="px-6 py-4 text-sm text-left text-blacky-700">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-left font-medium text-blacky-900">
                      {category.CategoryName}
                    </td>
                    <td className="px-6 py-4 text-sm  text-blacky-700">
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

      {/* Category Form Modal */}
      <CategoryFormModal
        open={showModal}
        editingCategory={editingCategory}
        onClose={() => setShowModal(false)}
        onSaved={() => loadCategories(searchTerm)}
      />

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
