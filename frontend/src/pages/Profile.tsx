import { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, Save, KeyRound } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import { useToast } from '../components/ToastProvider';

type Tab = 'info' | 'password';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  //Info form
  const [fullName, setFullName] = useState(user?.FullName ?? '');
  const [phone, setPhone] = useState(user?.Phone ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  //Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  //Handlers
  const handleSaveInfo = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSavingInfo(true);
      const updated = await authService.updateProfile({ fullName, phone });
      updateUser({ FullName: updated.FullName, Phone: updated.Phone });
      toast.success('Cập nhật thông tin thành công!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setSavingPassword(true);
      await authService.updateProfile({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Mật khẩu hiện tại không đúng');
    } finally {
      setSavingPassword(false);
    }
  };

  //Derived
  const initials = user?.FullName ? user.FullName.trim()
        .split(/\s+/)
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : (user?.Email?.[0]?.toUpperCase() ?? 'U');

  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blacky-950">Tài khoản của tôi</h1>
        <p className="text-blacky-500 text-sm mt-1">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>

      {/* Identity card */}
      <div className="bg-basic-white rounded-xl border border-bluesh-800 p-5 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-bluesh-800 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-basic-white">{initials}</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-blacky-950">{user?.FullName || 'Chưa cập nhật'}</p>
          <p className="text-sm text-blacky-700">{user?.Email}</p>
          {user?.CreatedAt && (
            <p className="text-xs text-blacky-500 mt-0.5">
              Tham gia từ {new Date(user.CreatedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex space-x-1 mb-6 bg-bluesh-50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'info'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <User className="w-5 h-5" />
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === 'password'
              ? 'bg-basic-white text-bluesh-800 shadow-sm'
              : 'text-blacky-500 hover:text-blacky-950'
          }`}
        >
          <Lock className="w-5 h-5" />
          Đổi mật khẩu
        </button>
      </div>

      {/* Profile Info */}
      {activeTab === 'info' && (
        <div className="bg-basic-white rounded-xl border border-basic-border p-6">
          <h2 className="text-base font-semibold text-bluesh-900 mb-5">Thông tin cá nhân</h2>
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                placeholder="Nhập họ và tên..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                placeholder="Nhập số điện thoại..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.Email ?? ''}
                readOnly
                title="Email"
                placeholder="Email"
                className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg bg-blacky-50 text-blacky-500 cursor-not-allowed"
              />
              <p className="text-xs text-blacky-500 mt-1">Email không thể thay đổi</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingInfo}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Form */}
      {activeTab === 'password' && (
        <div className="bg-basic-white rounded-xl border border-basic-border p-6">
          <h2 className="text-base font-semibold text-bluesh-900 mb-1">Đổi mật khẩu</h2>
          <p className="text-sm text-blacky-500 mb-5">Mật khẩu mới phải có ít nhất 6 ký tự</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
                Mật khẩu hiện tại <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                  placeholder="Nhập mật khẩu hiện tại..."
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blacky-600 hover:text-blacky-800"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
                Mật khẩu mới <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                  placeholder="Nhập mật khẩu mới..."
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blacky-600 hover:text-blacky-800"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-blacky-700 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none transition-colors ${
                    passwordMismatch
                      ? 'border-accent-red focus:border-accent-red bg-red-50'
                      : 'border-blacky-200 focus:border-bluesh-800 focus:bg-bluesh-50'
                  }`}
                  placeholder="Nhập lại mật khẩu mới..."
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blacky-600 hover:text-blacky-800"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordMismatch && (
                <p className="text-xs text-accent-red mt-1">Mật khẩu xác nhận không khớp</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword || passwordMismatch}
                className="btn btn-primary flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
