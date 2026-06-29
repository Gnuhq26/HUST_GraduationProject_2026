import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PackageCheck, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-bluesh-50 flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
            <PackageCheck className="text-basic-white w-7 h-7" />
          </div>
          <span className="font-bold text-bluesh-900 text-xl tracking-tight">Gnuh Buildify</span>
        </div>

        <div className="flex flex-col items-center gap-3 bg-basic-white border border-basic-border2 rounded-xl px-8 py-6 shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.06)]">
          <Loader2 className="w-8 h-8 animate-spin text-bluesh-800" />
          <p className="text-sm text-blacky-600">Đang xử lý đăng nhập...</p>
        </div>
      </div>
    </div>
  );
}
