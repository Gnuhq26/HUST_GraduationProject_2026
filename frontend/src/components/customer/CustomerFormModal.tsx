import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { customersService } from '../../services/customersService';
import { useToast } from '../ToastProvider';
import type { Customer } from '@/types';

interface CustomerWithCount extends Customer {
  _count?: { orders: number };
}

export interface CustomerFormData {
  CustomerName: string;
  Phone?: string;
  Address?: string;
}

interface CustomerFormModalProps {
  customer: CustomerWithCount | null; // null = create mode
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerFormModal({ customer, onClose, onSuccess }: CustomerFormModalProps) {
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>();

  useEffect(() => {
    if (customer) {
      reset({
        CustomerName: customer.CustomerName,
        Phone: customer.Phone ?? '',
        Address: customer.Address ?? '',
      });
    } else {
      reset({});
    }
  }, [customer, reset]);

  const onSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    try {
      if (customer) {
        await customersService.update(customer.CustomerID, data);
        toast.success('Cập nhật khách hàng thành công');
      } else {
        await customersService.create(data);
        toast.success('Thêm khách hàng thành công');
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
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl border border-basic-border max-w-xl w-full shadow-lg">
        <div className="px-6 py-5 border-b border-yellowfish-400 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blacky-950">
            {customer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
          </h2>
          <button onClick={onClose} title="Đóng" className="p-2 text-bluesh-800 bg-bluesh-50 hover:text-basic-white hover:bg-bluesh-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">
              Tên khách hàng <span className="text-accent-red">*</span>
            </label>
            <input
              {...register('CustomerName', {
                required: 'Tên khách hàng là bắt buộc',
                maxLength: { value: 100, message: 'Tên khách hàng không được quá 100 ký tự' },
              })}
              className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50"
              placeholder="Nhập tên khách hàng"
            />
            {errors.CustomerName && (
              <p className="mt-1 text-sm text-accent-red">{errors.CustomerName.message}</p>
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
              placeholder="Nhập địa chỉ khách hàng"
            />
            {errors.Address && (
              <p className="mt-1 text-sm text-accent-red">{errors.Address.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1!">
              Hủy
            </button>
            <button type="submit" className="btn btn-primary flex-1!">
              {customer ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
