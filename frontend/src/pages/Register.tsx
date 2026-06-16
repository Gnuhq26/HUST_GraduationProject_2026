import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { ShoppingBag, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import loginIllustration from '../assets/image.png';

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigate = useNavigate();
  const { register: registerAction, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    const result = await registerAction({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
    });

    if (result.success) {
      setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex bg-bluesh-50">
      {/* Left Panel - Light blue illustration area */}
      <div className="hidden lg:flex lg:w-[60%] flex-col items-center justify-center relative overflow-hidden">
        {/* Brand mark */}
        <div className="absolute top-10 left-10 z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <ShoppingBag className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-bluesh-800 text-2xl tracking-tight">Gnuh Buildify</span>
        </div>

        {/* Illustration image */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 px-8">
          <img
            src={loginIllustration}
            alt="Logistics illustration"
            className="w-full max-w-xl object-contain drop-shadow-xl"
          />
          <p className="text-bluesh-600 text-sm text-center leading-relaxed">
            Quản lý bán hàng toàn diện —<br />nhanh chóng, chính xác, hiệu quả.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-bluesh-800 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-bluesh-800 text-lg">Gnuh Buildify</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-bluesh-950 mb-1.5">Đăng ký</h1>
            <p className="text-bluesh-600 text-sm">
              Tạo tài khoản mới để bắt đầu sử dụng hệ thống.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-accent-red/10 border border-accent-red rounded-lg">
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 bg-accent-green/10 border border-accent-green rounded-lg">
              <p className="text-sm text-accent-green">{successMessage}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-bluesh-700 mb-1.5">
                Họ và tên
              </label>
              <input
                id="fullName"
                type="text"
                {...register('fullName', {
                  required: 'Họ và tên là bắt buộc',
                  minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
                })}
                className="input-field"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bluesh-700 mb-1.5">
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
              <label htmlFor="password" className="block text-sm font-medium text-bluesh-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Mật khẩu là bắt buộc',
                    minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                  })}
                  className="input-field pr-12"
                  placeholder="Ít nhất 6 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blacky-400 hover:text-blacky-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-bluesh-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (value) =>
                      value === password || 'Mật khẩu xác nhận không khớp',
                  })}
                  className="input-field pr-12"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blacky-400 hover:text-blacky-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-2 rounded-lg"
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-blacky-200" />
            <span className="text-xs text-blacky-400 uppercase tracking-wide font-medium">Hoặc đăng ký với</span>
            <div className="flex-1 h-px bg-blacky-200" />
          </div>

          {/* Social Sign Up — Google only (Facebook OAuth chưa triển khai) */}
          <div className="w-full">
            <button
              type="button"
              title="Đăng ký bằng Google"
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

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-blacky-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-bluesh-800 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
