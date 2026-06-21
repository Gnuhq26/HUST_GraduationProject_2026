import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/** Backend error response shape from NestJS exception filters */
interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
}

/** Endpoints that must NOT use the tenant-path prefix (no store context needed) */
const PUBLIC_PREFIXES = ['/auth/', '/auth'];

const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/**
 * Derive the app origin (without /api suffix) for building tenant paths.
 * - Local: "http://localhost:3000/api" → "http://localhost:3000"
 * - VPS relative: "/api" → window.location.origin
 */
const APP_ORIGIN =
  API_BASE.replace(/\/api\/?$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token và store ID vào mọi request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    const currentStoreId = localStorage.getItem('currentStoreId');
    const tenantIdentifier = localStorage.getItem('tenantIdentifier');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Thêm X-Store-ID header (fallback cho các route không qua TenantMiddleware)
    if (currentStoreId && !config.headers['X-Store-ID']) {
      config.headers['X-Store-ID'] = currentStoreId;
    }

    // Nếu có tenantIdentifier và đây không phải auth hoặc global endpoint
    // → rewrite URL sang /:tenant/api/... để đi qua TenantMiddleware
    const isPublic = PUBLIC_PREFIXES.some((p) =>
      config.url === p || config.url?.startsWith('/auth/'),
    ) || (config.url === '/stores' && config.method?.toLowerCase() === 'post');

    if (tenantIdentifier && config.url && !isPublic) {
      config.baseURL = APP_ORIGIN;
      config.url = `/${tenantIdentifier}/api${config.url}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi chung
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      // Xử lý các lỗi HTTP
      switch (error.response.status) {
        case 401:
          // Unauthorized - Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('stores');
          localStorage.removeItem('currentStoreId');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - Không có quyền truy cập — thông báo cho user qua toast
          window.dispatchEvent(
            new CustomEvent('app:toast', {
              detail: { type: 'error', message: 'Bạn không có quyền thực hiện hành động này' },
            })
          );
          break;
        case 404:
          console.error('Không tìm thấy tài nguyên');
          break;
        case 500:
          console.error('Lỗi máy chủ nội bộ');
          break;
        default:
          console.error('Đã xảy ra lỗi:', error.response.data?.message);
      }
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được phản hồi
      console.error('Không thể kết nối đến máy chủ');
    } else {
      // Lỗi khác
      console.error('Lỗi:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
