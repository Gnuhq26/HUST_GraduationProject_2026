import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiMapPin, FiPlus, FiChevronRight } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import type { StoreInfo } from '@/types';

function SelectStore() {
  const navigate = useNavigate();
  const { stores, setCurrentStore } = useAuthStore();

  const handleSelectStore = (store: StoreInfo) => {
    setCurrentStore(store);
    navigate('/');
  };

  const handleCreateNewStore = () => {
    navigate('/create-store');
  };

  useEffect(() => {
    if (stores.length === 0) {
      navigate('/no-store', { replace: true });
    } else if (stores.length === 1) {
      setCurrentStore(stores[0]);
      navigate('/', { replace: true });
    }
  }, [stores, navigate, setCurrentStore]);

  return (
    <div className="min-h-screen bg- flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-basic-border px-8 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
          <FiShoppingBag className="text-white text-lg" />
        </div>
        <span className="font-bold text-blacky-950 text-lg">POS System</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-[40px] font-bold leading-[1.1] bg-linear-to-r from-[#0179B4] to-[#6FD0FF] bg-clip-text text-transparent pb-3 mb-3">
              Chọn cửa hàng
            </h1>
            <p className="text-blacky-600 text-base">
              Bạn có quyền truy cập vào {stores.length} cửa hàng. Chọn cửa hàng bạn muốn quản lý.
            </p>
          </div>

          {/* Store grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stores.map((store) => (
              <div
                key={store.storeId}
                onClick={() => handleSelectStore(store)}
                className="bg-yellowfish-50 rounded-xl p-6 flex flex-col gap-4 cursor-pointer
                shadow-[3.12px_9.37px_21.85px_0px_rgba(0,0,0,0.06)] hover:shadow-md transition-all group"
              >
                {/* Icon + role badge */}
                <div className="flex items-start  justify-between">
                  <div className="w-11 h-11 bg-bluesh-100 border  rounded-lg flex items-center justify-center">
                    <FiShoppingBag className="text-bluesh-800 text-xl" />
                  </div>
                  <span className="text-xs font-medium bg-bluesh-50 text-bluesh-800 border border-bluesh-200 px-2.5 py-1 rounded-full">
                    {store.roleName}
                  </span>
                </div>

                {/* Store info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-bluesh-800 mb-1.5">
                    {store.storeName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-blacky-500 text-sm">
                    <FiMapPin size={14} className="shrink-0" />
                    <span className="font-mono text-xs bg-blacky-100 text-blacky-700 px-2 py-0.5 rounded">
                      {store.subdomain}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  className="btn btn-primary w-full group-hover:bg-bluesh-900"
                  onClick={(e) => { e.stopPropagation(); handleSelectStore(store); }}
                >
                  Chọn cửa hàng này
                  <FiChevronRight size={18} />
                </button>
              </div>
            ))}

            {/* Create new store card */}
            <div
              onClick={handleCreateNewStore}
              className="bg-white border-2 border-dashed border-basic-border2 rounded-xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer
                         hover:border-accent-green hover:shadow-md transition-all min-h-55"
            >
              <div className="w-12 h-12 bg-[#E8F8F7] rounded-full flex items-center justify-center">
                <FiPlus className="text-accent-green text-2xl" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-blacky-950 mb-1">
                  Tạo cửa hàng mới
                </h3>
                <p className="text-sm text-blacky-500">
                  Mở rộng kinh doanh của bạn
                </p>
              </div>
              <button className="btn btn-secondary border-accent-green text-accent-green hover:bg-[#E8F8F7]">
                <FiPlus size={16} />
                Tạo mới
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SelectStore;
