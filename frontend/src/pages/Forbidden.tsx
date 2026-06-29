import { Link } from 'react-router-dom';
import { PackageCheck, ShieldOff } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Forbidden() {
  const tenantIdentifier = useAuthStore((s) => s.tenantIdentifier);
  const homePath = tenantIdentifier ? `/${tenantIdentifier}` : '/select-store';

  return (
    <div className="min-h-screen bg-bluesh-50 flex flex-col">
      <header className="bg-basic-white border-b border-basic-border px-6 md:px-8 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
          <PackageCheck className="text-basic-white w-7 h-7" />
        </div>
        <span className="font-bold text-bluesh-900 text-2xl tracking-tight">Gnuh Buildify</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md text-center">
          <div className="bg-basic-white rounded-xl border border-basic-border2 p-8 md:p-10 shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
              <ShieldOff className="w-8 h-8 text-accent-red" />
            </div>

            <h1 className="text-2xl font-bold text-blacky-950 mb-2">Không có quyền truy cập</h1>
            <p className="text-blacky-600 text-sm leading-relaxed mb-8">
              Tài khoản của bạn không có quyền thực hiện hành động này trong cửa hàng hiện tại.
              Liên hệ quản lý nếu bạn cần được cấp quyền.
            </p>

            <Link to={homePath} className="btn btn-primary w-full rounded-lg! inline-flex">
              Quay về Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
