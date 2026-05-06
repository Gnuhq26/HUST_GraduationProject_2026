import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import suppliersService from '../../services/suppliersService';
import { useToast } from '../ToastProvider';
import type { Supplier } from '@/types';

interface SupplierWithCount extends Supplier {
  _count?: { receipts: number };
}

export interface SupplierFormData {
  SupplierName: string;
  Phone?: string;
  Address?: string;
}

interface Props {
  supplier: SupplierWithCount | null; // null = create mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierFormModal({ supplier, onClose, onSuccess }: Props) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>();

  useEffect(() => {
    if (supplier) {
      reset({
        SupplierName: supplier.SupplierName,
        Phone: supplier.Phone ?? '',
        Address: supplier.Address ?? '',
      });
    } else {
      reset({ SupplierName: '', Phone: '', Address: '' });
    }
  }, [supplier, reset]);

  const onSubmit: SubmitHandler<SupplierFormData> = async (data) => {
    try {
      if (supplier) {
        await suppliersService.update(supplier.SupplierID, data);
        toast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await suppliersService.create(data);
        toast.success('Thêm nhà cung cấp thành công');
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi:', error);
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl border border-basic-border max-w-xl w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-yellowfish-400 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blacky-950">
            {supplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}
          </h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-2 text-bluesh-800 bg-bluesh-50 hover:text-basic-white hover:bg-bluesh-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">
              Tên nhà cung cấp <span className="text-accent-red">*</span>
            </label>
            <input
              {...register('SupplierName', {
                required: 'Tên nhà cung cấp là bắt buộc',
                maxLength: { value: 255, message: 'Tên không được quá 255 ký tự' },
              })}
              className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              placeholder="Nhập tên nhà cung cấp"
            />
            {errors.SupplierName && (
              <p className="mt-1 text-sm text-accent-red">{errors.SupplierName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">Số điện thoại</label>
            <input
              {...register('Phone', {
                maxLength: { value: 20, message: 'Số điện thoại không được quá 20 ký tự' },
              })}
              className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              placeholder="0912345678"
            />
            {errors.Phone && (
              <p className="mt-1 text-sm text-accent-red">{errors.Phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">Địa chỉ</label>
            <textarea
              {...register('Address', {
                maxLength: { value: 255, message: 'Địa chỉ không được quá 255 ký tự' },
              })}
              rows={3}
              className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              placeholder="Nhập địa chỉ nhà cung cấp"
            />
            {errors.Address && (
              <p className="mt-1 text-sm text-accent-red">{errors.Address.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1!">
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1! disabled:opacity-50">
              {supplier ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
