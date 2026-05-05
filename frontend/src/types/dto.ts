/**
 * Request DTOs (Data Transfer Objects) — shapes sent TO the API.
 * Response shapes that are DB entities live in models.ts.
 */

import type {
  User,
  StoreInfo,
  Permission,
  DeliveryMethod,
  StockReceiptStatus,
} from './models';

// ===== AUTH =====

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  stores: StoreInfo[];
}

/** Shape returned by GET /auth/profile */
export type ProfileResponse = User & { stores: StoreInfo[] };

// ===== CATEGORIES =====

export interface CreateCategoryDto {
  CategoryName: string;
  Description?: string;
}
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

// ===== PRODUCTS =====

export interface ProductFilterParams {
  search?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
}

export interface ProductUnitDto {
  unitName: string;
  conversionFactor: number;
  isBase: boolean;
  sellingPrice: string;
  importPrice: string;
}

export interface CreateProductDto {
  ProductName: string;
  CategoryID?: number | null;
  Description?: string | null;
  units?: ProductUnitDto[];
}
export type UpdateProductDto = Partial<CreateProductDto>;

// ===== CUSTOMERS =====

export interface CreateCustomerDto {
  CustomerName: string;
  Phone?: string | null;
  Address?: string | null;
}
export type UpdateCustomerDto = Partial<CreateCustomerDto>;

// ===== SUPPLIERS =====

export interface CreateSupplierDto {
  SupplierName: string;
  Phone?: string | null;
  Address?: string | null;
}
export type UpdateSupplierDto = Partial<CreateSupplierDto>;

// ===== ORDERS =====

export interface CreateOrderItemDto {
  productId: number;
  unitName: string;
  /** String from form input — service calls parseFloat() before sending */
  quantity: string;
}

export interface CreateOrderDto {
  customerId?: number | null;
  note?: string;
  deliveryMethod?: DeliveryMethod;
  items: CreateOrderItemDto[];
}

// ===== INVENTORY =====

export interface InventoryFilterParams {
  search?: string;
  lowStockThreshold?: number | null;
}

export interface StockInItemDto {
  productId: number;
  unitName: string;
  /** String from form input — service calls parseFloat() before sending */
  quantity: string;
  /** String from form input — service calls parseFloat() before sending */
  unitPrice: string;
}

export interface StockInDto {
  supplierId: number;
  status?: StockReceiptStatus;
  note?: string;
  items: StockInItemDto[];
}

export interface DirectShipDto {
  supplierId: number;
  productId: number;
  unitName: string;
  /** String from form input — service calls parseFloat() before sending */
  totalQty: string;
  /** String from form input — service calls parseFloat() before sending */
  deliverQty: string;
  /** String from form input — service calls parseFloat() before sending */
  importUnitPrice: string;
  /** String from form input — service calls parseFloat() before sending */
  saleUnitPrice: string;
  customerId?: number;
  note?: string;
}

// ===== DEBTS =====

export interface RecordPaymentDto {
  type: 'customer' | 'supplier';
  referenceId: number;
  /** String from form input — service calls parseFloat() before sending */
  amount: string;
  note?: string;
}

// ===== ROLES =====

export interface CreateRoleDto {
  roleName: string;
  description?: string;
}
export type UpdateRoleDto = Partial<CreateRoleDto>;

export interface AssignPermissionsDto {
  permissionIds: number[];
}

// ===== STORES =====

export interface CreateStoreDto {
  storeName: string;
  address?: string;
  phone?: string;
  subdomain: string;
}

export interface AddMemberDto {
  email: string;
  roleId: number;
}

// ===== REPORTS =====

export interface ReportDateParams {
  startDate: string;
  endDate: string;
}

export interface TopProductsParams extends ReportDateParams {
  sortBy?: 'revenue' | 'quantity';
  limit?: number;
}

// ===== AI ANALYST =====

export interface AiInsightsResponse {
  insights: string;
  generatedAt: string;
}

// ===== PERMISSIONS (grouped response) =====

export interface PermissionGroup {
  subject: string;
  permissions: Permission[];
}

// ===== IMPORT / EXPORT =====

export interface ImportPreviewRow {
  rowNumber: number;
  errors: string[];
  isValid?: boolean;
  action?: string;
  // Customer fields
  customerName?: string;
  // Supplier fields
  supplierName?: string;
  // Shared contact fields
  phone?: string;
  address?: string;
  // Product fields
  sku?: string;
  productName?: string;
  categoryName?: string;
  baseUnit?: string;
  unitName?: string;
  unitPrice?: number | null;
  [key: string]: unknown;
}

export interface ImportPreviewResponse {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validRows?: ImportPreviewRow[];
  invalidRows?: ImportPreviewRow[];
}

export interface ImportCommitResponse {
  created: number;
  updated: number;
  skipped: number;
}
