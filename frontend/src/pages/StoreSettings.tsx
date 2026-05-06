import { useState, useEffect, type FormEvent } from 'react';
import { Save, Info, Users, Shield } from 'lucide-react';
import storesService from '../services/storesService';
import { useToast } from '../components/ToastProvider';
import type { Store } from '@/types';

interface StoreWithCount extends Store {
  _count?: {
    storeUsers?: number;
    roles?: number;
  };
}

export default function StoreSettings() {
  const toast = useToast();
  const [store, setStore] = useState<StoreWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadStoreDetails = async () => {
    try {
      setLoading(true);
      const data = await storesService.getStoreDetails() as StoreWithCount;
      setStore(data);
      setStoreName(data.StoreName);
      setSubdomain(data.Subdomain);
      setPhone(data.Phone || '');
      setAddress(data.Address || '');
    } catch (error) {
      console.error('Error loading store details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreDetails();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: Backend cần implement endpoint này
      // await storesService.updateStore({ storeName, phone, address });
      toast.info('Tính năng cập nhật thông tin store sẽ được bổ sung trong phiên bản tiếp theo');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blacky-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blacky-950">Cài đặt cửa hàng</h1>
        <p className="text-blacky-700 text-sm mt-1">Quản lý thông tin cửa hàng của bạn</p>
      </div>

      {/* Store Info Card */}
      <div className="bg-basic-white rounded-xl border border-bluesh-900 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-bluesh-900">Thông tin cơ bản</h2>
            <p className="text-sm text-blacky-700">Thông tin chung về cửa hàng</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
                Tên cửa hàng <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                placeholder="Cửa hàng ABC"
              />
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
                Subdomain
              </label>
              <input
                type="text"
                value={subdomain}
                disabled
                title="Subdomain không thể thay đổi"
                placeholder="abc-store"
                className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg bg-blacky-50 text-blacky-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-yellowfish-600">Subdomain không thể thay đổi sau khi tạo</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                placeholder="0123456789"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
                Trạng thái
              </label>
              <div className="flex items-center h-10">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    store?.Status === 'Active'
                      ? 'bg-accent-green/10 text-green-600'
                      : 'bg-blacky-100 text-bluesh-900'
                  }`}
                >
                  {store?.Status === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-bluesh-900 mb-1.5">Địa chỉ</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors resize-none"
              placeholder="Nhập địa chỉ cửa hàng"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary w-fit! px-6! rounded-lg!">
              <Save className="w-5 h-5" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Members Count */}
        <div className="bg-basic-white rounded-xl border border-bluesh-900 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-bluesh-800 rounded-lg">
              <Users className="w-6 h-6 text-basic-white" />
            </div>
            <div>
              <p className="text-sm text-blacky-700">Tổng số thành viên</p>
              <p className="text-2xl font-bold text-bluesh-800">{store?._count?.storeUsers || 0}</p>
            </div>
          </div>
        </div>

        {/* Roles Count */}
        <div className="bg-basic-white rounded-xl border border-bluesh-900 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-green rounded-lg">
              <Shield className="w-6 h-6 text-basic-white" />
            </div>
            <div>
              <p className="text-sm text-blacky-700">Số vai trò</p>
              <p className="text-2xl font-bold text-accent-green">{store?._count?.roles || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-yellowfish-50 border border-yellowfish-400 rounded-lg">
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-bluesh-900 shrink-0 mt-1" />
          <div className="text-bluesh-800">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Subdomain không thể thay đổi sau khi tạo cửa hàng</li>
              <li>Để quản lý thành viên và phân quyền, vui lòng vào menu tương ứng</li>
              <li>Mọi thay đổi sẽ được áp dụng ngay lập tức</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
