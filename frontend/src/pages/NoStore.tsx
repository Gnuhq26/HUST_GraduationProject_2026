import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageCheck, Store, Mail, LogOut, Plus, Copy, Check, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getTenantIdentifier } from '../utils/tenantPath';
import { useToast } from '../components/ToastProvider';

export default function NoStore() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout, user, refreshAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkStores = async () => {
      try {
        await refreshAuth();
        const currentStores = useAuthStore.getState().stores;

        if (currentStores.length === 1) {
          const tid = getTenantIdentifier(currentStores[0]);
          navigate(`/${tid}`, { replace: true });
        } else if (currentStores.length > 1) {
          navigate('/select-store', { replace: true });
        }
      } finally {
        setChecking(false);
      }
    };

    void checkStores();
  }, [refreshAuth, navigate]);

  const handleCreateStore = () => {
    navigate('/create-store');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopyEmail = async () => {
    if (!user?.Email) return;
    try {
      await navigator.clipboard.writeText(user.Email);
      setCopied(true);
      toast.success('Đã sao chép email');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép email');
    }
  };

  return (
    <div className="min-h-screen bg-basic-white flex flex-col">
      <header className="bg-basic-white border-b border-basic-border px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
            <PackageCheck className="text-basic-white w-7 h-7" />
          </div>
          <span className="font-bold text-bluesh-900 text-2xl tracking-tight">Gnuh Buildify</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-base font-medium text-accent-red hover:text-accent-red/80 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10 md:py-14">
        <div className="w-full max-w-4xl">
          {checking ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-blacky-500">
              <Loader2 className="w-8 h-8 animate-spin text-bluesh-800" />
              <p className="text-sm">Đang kiểm tra cửa hàng của bạn...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-[40px] font-bold leading-tight bg-linear-to-r from-[#0179B4] to-[#6FD0FF] bg-clip-text text-transparent pb-2 mb-3">
                  Chào mừng đến Buildify
                </h1>
                <p className="text-blacky-600 text-base max-w-xl mx-auto">
                  Tài khoản của bạn chưa được gán vào cửa hàng nào. Chọn một trong hai hướng dưới đây để
                  tiếp tục.
                </p>
                {user?.Email && (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm text-blacky-500 bg-basic-white border border-basic-border2 rounded-full px-4 py-1.5">
                    <Mail className="w-4 h-4 text-bluesh-800 shrink-0" />
                    <span>{user.Email}</span>
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Tạo cửa hàng */}
                <div
                  className="bg-yellowfish-50 rounded-xl border border-yellowfish-200 p-6 md:p-7 flex flex-col gap-5
                    shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6 text-basic-white" />
                    </div>
                    <span className="text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/30 px-2.5 py-1 rounded-full">
                      Chủ cửa hàng
                    </span>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-bluesh-800 mb-2">Tạo cửa hàng mới</h2>
                    <p className="text-sm text-blacky-600 leading-relaxed">
                      Bạn là chủ cửa hàng? Thiết lập cửa hàng đầu tiên, mời nhân viên và bắt đầu quản lý
                      bán hàng ngay.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateStore}
                    className="btn btn-primary w-full rounded-lg!"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo cửa hàng đầu tiên
                  </button>
                </div>

                {/* Chờ lời mời */}
                <div
                  className="bg-basic-white rounded-xl border border-basic-border2 p-6 md:p-7 flex flex-col gap-5
                    shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 bg-basic-white border border-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-bluesh-800" />
                    </div>
                    <span className="text-xs font-medium bg-bluesh-50 text-bluesh-800 border border-bluesh-200 px-2.5 py-1 rounded-full">
                      Nhân viên
                    </span>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-bluesh-800 mb-2">Chờ lời mời</h2>
                    <p className="text-sm text-blacky-600 leading-relaxed">
                      Bạn là nhân viên? Gửi email đăng nhập cho quản lý cửa hàng để được thêm vào hệ thống
                      và phân quyền truy cập.
                    </p>
                  </div>

                  {user?.Email && (
                    <div className="bg-yellowfish-50 border border-yellowfish-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-yellowfish-600 mb-2">Email cần cung cấp</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-yellowfish-600 font-mono truncate">{user.Email}</code>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          title="Sao chép email"
                          className="shrink-0 p-2 rounded-lg border border-bluesh-300 bg-basic-white text-bluesh-800 hover:bg-bluesh-100 transition-colors"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-accent-green" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-blacky-500 leading-relaxed">
                    Sau khi được thêm vào cửa hàng, đăng nhập lại hoặc tải lại trang để vào hệ thống.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
