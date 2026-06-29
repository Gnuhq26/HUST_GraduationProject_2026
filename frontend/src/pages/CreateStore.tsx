import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageCheck, Store, ArrowLeft, Loader2 } from 'lucide-react';
import storesService from '../services/storesService';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ToastProvider';

function slugFromStoreName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CreateStoreFormData {
  storeName: string;
  phone: string;
  address: string;
}

function CreateStore() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshAuth, setCurrentStore, stores } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStoreFormData>({
    storeName: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Tên cửa hàng không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      const subdomain = slugFromStoreName(formData.storeName) || `store-${Date.now()}`;
      await storesService.createStore({
        storeName: formData.storeName,
        subdomain,
        phone: formData.phone,
        address: formData.address,
      });

      await refreshAuth();
      const updatedStores = useAuthStore.getState().stores;

      if (updatedStores.length > 0) {
        const createdStore =
          updatedStores.find((s) => s.subdomain === subdomain) ??
          updatedStores[updatedStores.length - 1];

        if (createdStore) {
          setCurrentStore(createdStore);
        }
      }

      toast.success('Tạo cửa hàng thành công!');
      const tid = useAuthStore.getState().tenantIdentifier;
      navigate(tid ? `/${tid}` : '/select-store');
    } catch (err: unknown) {
      console.error('Error creating store:', err);
      const e = err as { response?: { data?: { message?: string } } };
      if (e.response?.data?.message?.includes('subdomain') || e.response?.data?.message?.includes('Subdomain')) {
        setErrors({ storeName: 'Tên cửa hàng trùng với cửa hàng đã tồn tại. Vui lòng đổi tên.' });
        toast.error('Tên cửa hàng trùng với cửa hàng đã tồn tại. Vui lòng đổi tên.');
      } else {
        toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi tạo cửa hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(stores.length === 0 ? '/no-store' : '/select-store');
  };

  return (
    <div className="min-h-screen bg-bluesh-50 flex flex-col">
      <header className="bg-basic-white border-b border-basic-border px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
            <PackageCheck className="text-basic-white w-7 h-7" />
          </div>
          <span className="font-bold text-bluesh-900 text-2xl tracking-tight">Gnuh Buildify</span>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-blacky-600 hover:text-bluesh-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10 md:py-14">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-[36px] font-bold leading-tight bg-linear-to-r from-[#0179B4] to-[#6FD0FF] bg-clip-text text-transparent pb-2 mb-2">
              Tạo cửa hàng mới
            </h1>
            <p className="text-blacky-600 text-sm">
              Điền thông tin cửa hàng để bắt đầu quản lý trên Buildify
            </p>
          </div>

          <div className="bg-basic-white rounded-xl border border-basic-border2 p-6 md:p-8 shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-basic-border">
              <div className="w-11 h-11 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-7 h-7 text-basic-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-bluesh-900">Thông tin cửa hàng</h2>
                <p className="text-sm text-blacky-500">Các trường có dấu <span className="text-accent-red">*</span> là bắt buộc</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-blacky-700 mb-1.5">
                  Tên cửa hàng <span className="text-accent-red">*</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Cửa hàng ABC"
                  className={`input-field ${errors.storeName ? 'input-error' : ''}`}
                />
                {errors.storeName && (
                  <p className="mt-1.5 text-xs text-accent-red">{errors.storeName}</p>
                )}
              </div>

              <p className="text-sm text-blacky-600 bg-yellowfish-50 border border-yellowfish-200 rounded-xl px-4 py-3 leading-relaxed">
                Sau khi tạo, hệ thống tự sinh <strong className="text-yellowfish-500">Display ID</strong> cho URL dạng{' '}
                <code className="text-xs text-yellowfish-500 bg-basic-white border border-yellowfish-200 px-1.5 py-0.5 rounded">domain/abc1234/</code>
                {' '} - không cần nhập subdomain.
              </p>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-blacky-700 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0123456789"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-blacky-700 mb-1.5">
                  Địa chỉ
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="79 Cầu Giấy, Hà Nội"
                  rows={3}
                  className="input-field resize-none min-h-[100px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full rounded-lg!"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    Tạo cửa hàng
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateStore;
