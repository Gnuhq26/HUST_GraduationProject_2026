import type { ComponentType } from 'react';
import { Home, ShoppingBag, LayoutGrid, Package, ShoppingCart, Users, Truck, BarChart2, Settings, Shield, DollarSign } from 'lucide-react';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Customers from '../pages/Customers';
import Suppliers from '../pages/Suppliers';
import Inventory from '../pages/Inventory';
import Orders from '../pages/Orders';
import Reports from '../pages/Reports';
import Debts from '../pages/Debts';
import StoreSettings from '../pages/StoreSettings';
import StoreMembers from '../pages/StoreMembers';
import Roles from '../pages/Roles';

interface RoutePermission {
  action: string;
  subject: string;
}

interface RouteMenu {
  group: 'main' | 'store';
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface RouteConfig {
  path: string;
  component: ComponentType;
  permission: RoutePermission | null;
  menu: RouteMenu;
}

/**
 * Single source of truth for authenticated app routes.
 * This config is shared by both router and sidebar to avoid permission drift.
 */
export const protectedRoutes: RouteConfig[] = [
  {
    path: '/',
    component: Dashboard,
    permission: null,
    menu: {
      group: 'main',
      label: 'Dashboard',
      icon: Home,
    },
  },
  {
    path: '/products',
    component: Products,
    permission: { action: 'read', subject: 'Product' },
    menu: {
      group: 'main',
      label: 'Sản phẩm',
      icon: ShoppingBag,
    },
  },
  {
    path: '/categories',
    component: Categories,
    permission: { action: 'read', subject: 'Category' },
    menu: {
      group: 'main',
      label: 'Danh mục',
      icon: LayoutGrid,
    },
  },
  {
    path: '/inventory',
    component: Inventory,
    permission: { action: 'read', subject: 'Inventory' },
    menu: {
      group: 'main',
      label: 'Nhập kho',
      icon: Package,
    },
  },
  {
    path: '/orders',
    component: Orders,
    permission: { action: 'read', subject: 'Order' },
    menu: {
      group: 'main',
      label: 'Đơn hàng',
      icon: ShoppingCart,
    },
  },
  {
    path: '/customers',
    component: Customers,
    permission: { action: 'read', subject: 'Customer' },
    menu: {
      group: 'main',
      label: 'Khách hàng',
      icon: Users,
    },
  },
  {
    path: '/suppliers',
    component: Suppliers,
    permission: { action: 'read', subject: 'Supplier' },
    menu: {
      group: 'main',
      label: 'Nhà cung cấp',
      icon: Truck,
    },
  },
  {
    path: '/reports',
    component: Reports,
    permission: { action: 'read', subject: 'Report' },
    menu: {
      group: 'main',
      label: 'Báo cáo',
      icon: BarChart2,
    },
  },
  {
    path: '/debts',
    component: Debts,
    permission: { action: 'read', subject: 'Debt' },
    menu: {
      group: 'main',
      label: 'Công nợ',
      icon: DollarSign,
    },
  },
  {
    path: '/store/settings',
    component: StoreSettings,
    permission: { action: 'read', subject: 'Store' },
    menu: {
      group: 'store',
      label: 'Cài đặt',
      icon: Settings,
    },
  },
  {
    path: '/store/members',
    component: StoreMembers,
    permission: { action: 'read', subject: 'User' },
    menu: {
      group: 'store',
      label: 'Thành viên',
      icon: Users,
    },
  },
  {
    path: '/store/roles',
    component: Roles,
    permission: { action: 'read', subject: 'Role' },
    menu: {
      group: 'store',
      label: 'Vai trò',
      icon: Shield,
    },
  },
];
