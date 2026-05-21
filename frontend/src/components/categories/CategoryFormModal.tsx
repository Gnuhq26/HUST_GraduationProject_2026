import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { categoriesService } from '../../services/categoriesService';
import { useToast } from '../ToastProvider';
import type { Category } from '@/types';

interface CategoryFormData {
  CategoryName: string;
  Description?: string;
}

interface Props {
  open: boolean;
  editingCategory: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CategoryFormModal({ open, editingCategory, onClose, onSaved }: Props) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>();

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setValue('CategoryName', editingCategory.CategoryName);
        setValue('Description', editingCategory.Description ?? '');
      } else {
        reset({});
      }
    }
  }, [open, editingCategory, setValue, reset]);

  if (!open) return null;

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.CategoryID, data);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await categoriesService.create(data);
        toast.success('Thêm danh mục thành công');
      }
      onClose();
      onSaved();
    } catch (err: unknown) {
      console.error('Lỗi:', err);
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl border border-basic-border max-w-xl w-full shadow-lg">
        <div className="px-6 py-4 border-b border-yellowfish-400 flex items-center justify-between">
          <h2 className="text-lg font-bold text-blacky-950">
            {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button
            onClick={onClose}
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

          <div className="flex gap-3 pt-4 justify-center">
            <button type="button" onClick={onClose} className="btn btn-secondary w-[30%]! rounded-lg!">
              Hủy
            </button>
            <button type="submit" className="btn btn-primary w-[30%]! rounded-lg!">
              {editingCategory ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
