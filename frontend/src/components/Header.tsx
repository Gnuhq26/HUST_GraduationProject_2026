import { useState, useEffect, useRef } from 'react';
import { User, LogOut, ChevronDown, WarehouseIcon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import type { StoreInfo } from '@/types';
import { getTenantIdentifier } from '../utils/tenantPath';
import { useTenantPath } from '../hooks/useTenantPath';
import Logo from '../assets/store.png';

export default function Header() {
  const { user, stores, currentStoreId, logout } = useAuthStore();
  const navigate = useNavigate();
  const toTenantPath = useTenantPath();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const storeMenuRef = useRef<HTMLDivElement>(null);

  const currentStore = stores.find((s) => s.storeId === currentStoreId);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node | null)) {
        setShowUserMenu(false);
      }
      if (storeMenuRef.current && !storeMenuRef.current.contains(event.target as Node | null)) {
        setShowStoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleStoreChange = async (store: StoreInfo) => {
    if (store.storeId === currentStoreId) {
      setShowStoreMenu(false);
      return;
    }

    setShowStoreMenu(false);

    // Resolve DisplayId/SlugName without touching Zustand — setCurrentStore here
    // races with useTenantSync (URL still shows the old tenant) and reverts the switch.
    let targetStore = store;
    if (!store.displayId && !store.slugName) {
      await useAuthStore.getState().refreshAuth();
      targetStore =
        useAuthStore.getState().stores.find((s) => s.storeId === store.storeId) ?? store;
    }

    const tid = getTenantIdentifier(targetStore);
    localStorage.setItem('currentStoreId', String(targetStore.storeId));
    localStorage.setItem('tenantIdentifier', tid);
    window.location.assign(`/${tid}`);
  };

  return (
    <header className="bg-basic-white border-b border-basic-border px-6 py-2.5 shrink-0">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Logo" className="w-14 h-14" />
          <span className="text-2xl font-bold text-bluesh-950">Gnuh Buildify</span>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Store Selector */}
          {stores.length > 1 && (
            <div className="relative" ref={storeMenuRef}>
              <button
                onClick={() => setShowStoreMenu(!showStoreMenu)}
                className="flex items-center border border-basic-white hover:border-yellowfish-100 gap-2 px-3 py-2 bg-basic-white hover:bg-yellowfish-50 rounded-lg transition-colors"
              >
                <WarehouseIcon className="w-4 h-4 text-bluesh-900" />
                <span className="text-base font-medium text-bluesh-900">
                  {currentStore?.storeName || 'Chọn cửa hàng'}
                </span>
                <ChevronDown className="w-4 h-4 text-bluesh-900" />
              </button>

              {showStoreMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-yellowfish-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-basic-border">
                    <p className="text-xs font-semibold text-bluesh-800 uppercase">Chọn cửa hàng</p>
                  </div>
                  {stores.map((store) => (
                    <button
                      key={store.storeId}
                      onClick={() => handleStoreChange(store)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-yellowfish-50 transition-colors ${
                        store.storeId === currentStoreId ? 'bg-bluesh-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${
                            store.storeId === currentStoreId ? 'text-bluesh-800' : 'text-blacky-500'
                          }`}>
                            {store.storeName}
                          </div>
                          <div className="text-xs text-blacky-500">{store.displayId}</div>
                        </div>
                        {store.storeId === currentStoreId && (
                          <div className="w-2 h-2 bg-bluesh-800 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-2 border border-basic-white hover:border-yellowfish-100 hover:bg-yellowfish-50 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 bg-bluesh-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-basic-white" />
              </div>
              <div className="text-left">
                <div className="text-base font-medium text-bluesh-900">{user?.FullName || 'User'}</div>
                <div className="text-sm text-yellowfish-500">{user?.Email}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-bluesh-900" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-yellowfish-200 py-1 z-50">
                <button
                  onClick={() => {
                    navigate(toTenantPath('/profile'));
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-yellowfish-50 hover:text-bluesh-900 transition-colors flex items-center gap-2 text-bluesh-900"
                >
                  <Settings className="w-4 h-4" />
                  <span>Tài khoản</span>
                </button>
                <div className="border-t border-basic-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-yellowfish-50 transition-colors flex items-center gap-2 text-accent-red"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
