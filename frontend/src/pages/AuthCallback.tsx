import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getTenantIdentifier } from '../utils/tenantPath';

const ERROR_MESSAGES: Record<string, string> = {
  account_exists_local:
    'Email này đã được đăng ký bằng email/mật khẩu. Vui lòng đăng nhập thông thường.',
  unknown: 'Đăng nhập thất bại. Vui lòng thử lại.',
};

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loginWithToken = useAuthStore((s) => s.loginWithToken);
  const handledRef = useRef(false);

  useEffect(() => {
    // Prevent double-run in React StrictMode
    if (handledRef.current) return;
    handledRef.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      loginWithToken(token)
        .then(() => {
          const stores = useAuthStore.getState().stores;
          if (stores.length === 0) {
            navigate('/no-store', { replace: true });
          } else if (stores.length === 1) {
            const tid = getTenantIdentifier(stores[0]);
            navigate(`/${tid}`, { replace: true });
          } else {
            navigate('/select-store', { replace: true });
          }
        })
        .catch(() => {
          navigate('/login?error=unknown', { replace: true });
        });
    } else {
      const message =
        ERROR_MESSAGES[error ?? 'unknown'] ?? ERROR_MESSAGES['unknown'];
      navigate(`/login?oauthError=${encodeURIComponent(message)}`, {
        replace: true,
      });
    }
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1B4A6B] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
