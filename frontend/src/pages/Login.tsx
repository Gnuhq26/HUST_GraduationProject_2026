import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { PackageCheck , Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import loginIllustration from '../assets/image1.png';
import { getTenantIdentifier } from '../utils/tenantPath';

type LoginFormData = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, isAuthenticated, refreshAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const oauthError = searchParams.get('oauthError');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Check if user is already authenticated and redirect accordingly
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (isAuthenticated) {
        // Refresh to get latest store list
        await refreshAuth();
        const stores = useAuthStore.getState().stores;

        if (stores.length === 0) {
          navigate('/no-store', { replace: true });
        } else if (stores.length === 1) {
          const tid = getTenantIdentifier(stores[0]);
          navigate(`/${tid}`, { replace: true });
        } else {
          navigate('/select-store', { replace: true });
        }
      }
    };

    checkAuthAndRedirect();
  }, [isAuthenticated, refreshAuth, navigate]);

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      const stores = useAuthStore.getState().stores;

      // Multi-store routing logic
      if (stores.length === 0) {
        // No stores - show create/wait options
        navigate('/no-store');
      } else if (stores.length === 1) {
        // Single store - go directly to dashboard
        const tid = getTenantIdentifier(stores[0]);
        navigate(`/${tid}`);
      } else {
        // Multiple stores - show selection page
        navigate('/select-store');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-bluesh-50">
      {/* Left Panel - Light blue illustration area (Figma style) */}
      <div className="hidden lg:flex lg:w-[60%] flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle wave/gradient decoration */}
        <div className="absolute inset-0 " />

        {/* Brand mark */}
        <div className="absolute top-10 left-10 z-10 flex items-center gap-3">
          <div className="w-16 h-16 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <PackageCheck  className="text-white w-10 h-10" />
          </div>
          <span className="font-bold text-bluesh-800 text-4xl tracking-tight">Gnuh Buildify</span>
        </div>

        {/* Illustration image */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 px-4">
          <img
            src={loginIllustration}
            alt="Logistics illustration"
            className="w-full max-w-2xl object-contain drop-shadow-xl"
          />
          <p className="text-bluesh-700 text-sm text-center leading-relaxed">
            Quản lý bán hàng toàn diện<br />nhanh chóng, chính xác, hiệu quả.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-bluesh-800 rounded-xl flex items-center justify-center">
              <PackageCheck  className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-blacky-950 text-lg">Gnuh Buildify</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-blacky-950 mb-1.5">Đăng nhập</h1>
            <p className="text-blacky-500 text-sm">
              Nhập thông tin tài khoản để truy cập hệ thống quản lý.
            </p>
          </div>

          {/* Error Message */}
          {(error || oauthError) && (
            <div className="mb-5 p-3 bg-accent-red/10 border border-accent-red rounded-lg">
              <p className="text-sm text-accent-red">{oauthError ?? error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blacky-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email là bắt buộc',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ',
                  },
                })}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blacky-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Mật khẩu là bắt buộc',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                  })}
                className="input-field pr-12"
                  placeholder="password"
                />
                <button
                  type="button"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blacky-400 hover:text-blacky-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-blacky-300 accent-bluesh-800"
                />
                <span className="text-sm text-blacky-600">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-sm text-bluesh-800 hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-2 rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-blacky-200" />
            <span className="text-xs text-blacky-400 uppercase tracking-wide font-medium">Hoặc đăng nhập với</span>
            <div className="flex-1 h-px bg-blacky-200" />
          </div>

          {/* Social login — Google only (Facebook OAuth chưa triển khai) */}
          <div className="w-full">
            <button
              type="button"
              title="Đăng nhập bằng Google"
              onClick={() => { window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`; }}
              className="w-full h-12 rounded-lg border bg-basic-white border-basic-border2 flex items-center justify-center gap-2 hover:border-bluesh-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-blacky-700">Google</span>
            </button>
          </div>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-blacky-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-bluesh-800 hover:underline font-semibold">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
