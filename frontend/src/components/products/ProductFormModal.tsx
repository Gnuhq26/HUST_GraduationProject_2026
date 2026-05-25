import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { productsService } from '../../services/productsService';
import CustomSelect from '../CustomSelect';
import { useToast } from '../ToastProvider';
import type { Product, Category } from '@/types';

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

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductFormModal({ product, categories, onClose, onSuccess }: Props) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductFormData>();

  useEffect(() => {
    if (product) {
      setValue('ProductName', product.ProductName);
      setValue('Description', product.Description ?? '');
      setValue('SKU', product.SKU ?? '');
      setValue('BaseUnit', product.BaseUnit);
      setValue('CategoryID', product.CategoryID);
      setValue('IsActive', String(product.IsActive));
      setValue('marginRate', product.MarginRate ? parseFloat(product.MarginRate) * 100 : 10);
    } else {
      reset({});
    }
  }, [product, setValue, reset]);

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    const payload = {
      productName: data.ProductName,
      categoryId: data.CategoryID ? Number(data.CategoryID) : undefined,
      sku: data.SKU || undefined,
      baseUnit: data.BaseUnit,
      description: data.Description || undefined,
      isActive: data.IsActive !== undefined ? data.IsActive === 'true' : undefined,
      marginRate: data.marginRate != null ? data.marginRate / 100 : 0.1,
    };
    try {
      if (product) {
        await productsService.update(product.ProductID, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await productsService.create(payload);
        toast.success('Thêm sản phẩm thành công');
      }
      onClose();
      onSuccess();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi:', error);
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl border border-basic-border max-w-2xl w-full max-h-[90vh] flex flex-col shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-yellowfish-300 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-blacky-950">
            {product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-1.5 rounded-lg text-bluesh-800 hover:text-blacky-600 hover:bg-blacky-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
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
            {errors.ProductName && (
              <p className="mt-1 text-sm text-accent-red">{errors.ProductName.message}</p>
            )}
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
              {errors.BaseUnit && (
                <p className="mt-1 text-sm text-accent-red">{errors.BaseUnit.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1.5">Danh mục</label>
              <Controller
                name="CategoryID"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value != null ? String(field.value) : ''}
                    onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                    options={[
                      { value: '', label: 'Không có danh mục' },
                      ...categories.map((c) => ({
                        value: String(c.CategoryID),
                        label: c.CategoryName,
                      })),
                    ]}
                    placeholder="Chọn danh mục"
                  />
                )}
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
              {errors.marginRate && (
                <p className="mt-1 text-sm text-accent-red">Giá trị từ 0 đến 100</p>
              )}
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

          <div className="flex gap-3 pt-4 justify-center">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 rounded-lg">
              Hủy
            </button>
            <button type="submit" className="btn btn-primary flex-1 rounded-lg">
              {product ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
