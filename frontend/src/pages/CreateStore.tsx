import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';
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
  const { refreshAuth, setCurrentStore } = useAuthStore();
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
      
      // Refresh auth to get updated stores list
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
      // Navigate to the newly created store's tenant dashboard
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

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/no-store')}
          className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-600 text-white p-3 rounded-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tạo cửa hàng mới</h1>
              <p className="text-gray-600 text-sm">Điền thông tin cửa hàng của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Ví dụ: Cửa hàng ABC"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.storeName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.storeName && (
                <p className="text-red-500 text-sm mt-1">{errors.storeName}</p>
              )}
            </div>

            <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              Sau khi tạo, hệ thống tự sinh <strong>Display ID</strong> cho URL dạng{' '}
              <code className="text-xs bg-white px-1 rounded">domain/abc1234/</code> — không cần nhập subdomain.
            </p>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="79 Cầu Giấy, Hà Nội"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5" />
              {loading ? 'Đang tạo...' : 'Tạo cửa hàng'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateStore;
