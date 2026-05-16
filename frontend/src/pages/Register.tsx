import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { FiShoppingBag, FiEye, FiEyeOff } from 'react-icons/fi';
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
            <FiShoppingBag className="text-white text-xl" />
          </div>
          <span className="font-bold text-bluesh-800 text-2xl tracking-tight">POS System</span>
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
              <FiShoppingBag className="text-white text-lg" />
            </div>
            <span className="font-bold text-bluesh-800 text-lg">POS System</span>
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
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-bluesh-400 hover:text-bluesh-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-bluesh-400 hover:text-bluesh-600"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
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
              className="btn btn-primary w-full mt-2"
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-bluesh-200" />
            <span className="text-xs text-bluesh-400 whitespace-nowrap">Hoặc đăng ký với</span>
            <div className="flex-1 h-px bg-bluesh-200" />
          </div>

          {/* Social Sign Up */}
          <div className="flex gap-3 w-full">
            {/* Google */}
            <button
              type="button"
              className="flex-1 h-12 rounded-lg border border-bluesh-200 flex items-center justify-center hover:bg-bluesh-50 transition-colors"
              aria-label="Đăng ký với Google"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.378C34.197 6.212 29.337 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.378C34.197 6.212 29.337 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.312 0-9.615-3.328-11.285-7.934l-6.527 5.028C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C39.968 36.306 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              className="flex-1 h-12 rounded-lg border border-bluesh-200 flex items-center justify-center hover:bg-bluesh-50 transition-colors"
              aria-label="Đăng ký với Apple"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>

            {/* Facebook */}
            <button
              type="button"
              className="flex-1 h-12 rounded-lg border border-bluesh-200 flex items-center justify-center hover:bg-bluesh-50 transition-colors"
              aria-label="Đăng ký với Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-bluesh-500">
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
