import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCanPerform } from '../hooks/usePermission';
import { protectedRoutes } from '../routes/protectedRoutes';
import type { RouteConfig } from '../routes/protectedRoutes';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { canPerform, loading } = useCanPerform();

  const canAccessRoute = (route: RouteConfig): boolean => {
    if (!route.permission) return true;
    if (loading) return false; // Avoid flashing unauthorized items while loading

    return canPerform(route.permission.action, route.permission.subject);
  };

  // Filter menu items based on permissions
  const visibleMenuItems = protectedRoutes
    .filter((route) => route.menu?.group === 'main')
    .filter(canAccessRoute);

  const visibleStoreItems = protectedRoutes
    .filter((route) => route.menu?.group === 'store')
    .filter(canAccessRoute);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border border-basic-border rounded-2xl m-2 flex flex-col transition-all duration-300 shrink-0`}>
      {/* Toggle Button */}
      <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'} px-3 pt-3`}>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-blacky-50 text-blacky-400 hover:text-bluesh-800 transition-colors"
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Main Menu */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="px-4 text-xs font-semibold text-blacky-400 uppercase tracking-wider mb-2">
              Quản lý
            </h3>
          )}
          <ul className="space-y-0.5">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  title={collapsed ? item.menu.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-bluesh-800' : 'hover:bg-bluesh-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.menu.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-bluesh-800'}`} />
                      {!collapsed && (
                        <span className={`${isActive ? 'text-white' : 'text-blacky-700'}`}>{item.menu.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Store Management Menu */}
        <div>
          {!collapsed && (
            <h3 className="px-4 text-xs font-semibold text-blacky-400 uppercase tracking-wider mb-2">
              Cửa hàng
            </h3>
          )}
          <ul className="space-y-0.5">
            {visibleStoreItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  title={collapsed ? item.menu.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-bluesh-800' : 'hover:bg-blacky-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.menu.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-bluesh-800'}`} />
                      {!collapsed && (
                        <span className={`${isActive ? 'text-white' : 'text-blacky-700'}`}>{item.menu.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      
    </aside>
  );
}
