import { useState, useEffect, useRef } from 'react';
import { User, LogOut, ChevronDown, WarehouseIcon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import type { StoreInfo } from '@/types';
import { getTenantIdentifier } from '../utils/tenantPath';

export default function Header() {
  const { user, stores, currentStoreId, logout } = useAuthStore();
  const navigate = useNavigate();
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
    <header className="bg-basic-white border-b border-basic-border px-6 py-3.5 shrink-0">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-bluesh-800 rounded-xl flex items-center justify-center shrink-0">
            <WarehouseIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-blacky-950">Gnuh Buildify</span>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Store Selector */}
          {stores.length > 1 && (
            <div className="relative" ref={storeMenuRef}>
              <button
                onClick={() => setShowStoreMenu(!showStoreMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-blacky-50 hover:bg-blacky-100 rounded-lg transition-colors"
              >
                <WarehouseIcon className="w-4 h-4 text-blacky-600" />
                <span className="text-sm font-medium text-blacky-700">
                  {currentStore?.storeName || 'Chọn cửa hàng'}
                </span>
                <ChevronDown className="w-4 h-4 text-blacky-400" />
              </button>

              {showStoreMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-basic-border py-1 z-50">
                  <div className="px-4 py-2 border-b border-basic-border">
                    <p className="text-xs font-semibold text-blacky-400 uppercase">Chọn cửa hàng</p>
                  </div>
                  {stores.map((store) => (
                    <button
                      key={store.storeId}
                      onClick={() => handleStoreChange(store)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-blacky-50 transition-colors ${
                        store.storeId === currentStoreId ? 'bg-bluesh-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${
                            store.storeId === currentStoreId ? 'text-bluesh-800' : 'text-blacky-950'
                          }`}>
                            {store.storeName}
                          </div>
                          <div className="text-xs text-blacky-500">{store.subdomain}</div>
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
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blacky-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-bluesh-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-bluesh-800" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-blacky-950">{user?.FullName || 'User'}</div>
                <div className="text-xs text-blacky-500">{user?.Email}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-blacky-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-basic-border py-1 z-50">
                <button
                  onClick={() => { const t = useAuthStore.getState().tenantIdentifier; navigate(t ? `/${t}/profile` : '/profile'); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-blacky-50 transition-colors flex items-center gap-2 text-blacky-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>Tài khoản</span>
                </button>
                <div className="border-t border-basic-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-blacky-50 transition-colors flex items-center gap-2 text-accent-red"
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
