/**
 * Frontend TypeScript models — generated from Prisma schema
 *
 * IMPORTANT NOTES:
 * - Prisma `Decimal` fields are serialized as `string` in JSON responses.
 *   All monetary/quantity fields (TotalAmount, Quantity, UnitPrice, etc.) are `string`.
 * - DateTime fields are serialized as ISO-8601 strings.
 * - Nullable fields in Prisma schema map to `field | null` here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS (string unions — matches backend/DB values exactly)
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus = 'Pending' | 'Completed' | 'Cancelled';

export type DeliveryMethod = 'Immediate' | 'Reserved' | 'DirectShip';

export type StockReceiptStatus = 'Pending' | 'Received';

/** Direction of stock change */
export type InventoryChangeType = 'IN' | 'OUT' | 'ADJUST' | 'RETURN';

/** Which quantity bucket was affected */
export type InventoryQuantityType = 'Reserved' | 'InTransit' | 'Physical';

/** Source of the inventory change */
export type InventoryReferenceType = 'Order' | 'StockReceipt' | 'Manual';

export type StoreStatus = 'Active' | 'Inactive';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH & STORE
// ─────────────────────────────────────────────────────────────────────────────

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK';

export interface User {
  UserID: number;
  Email: string;
  FullName: string | null;
  Phone: string | null;
  Address: string | null;
  Provider: AuthProvider;
  CreatedAt: string;
}

/** Shape of each store entry inside the JWT / authStore */
export interface StoreInfo {
  storeId: number;
  storeName: string;
  subdomain: string;
  roleId: number;
  roleName: string;
}

export interface Store {
  StoreID: number;
  StoreName: string;
  Subdomain: string;
  Phone: string | null;
  Address: string | null;
  Status: StoreStatus;
  CreatedAt: string;
}

export interface Permission {
  PermissionID: number;
  Action: string;
  Subject: string;
}

export interface Role {
  RoleID: number;
  StoreID: number;
  RoleName: string;
  Description: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  permissions?: Permission[];
}

export interface StoreUser {
  StoreID: number;
  UserID: number;
  RoleID: number;
  CreatedAt: string;
  UpdatedAt: string;
  user?: Pick<User, 'UserID' | 'Email' | 'FullName' | 'Phone'>;
  role?: Pick<Role, 'RoleID' | 'RoleName'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────

export interface Category {
  CategoryID: number;
  StoreID: number;
  CategoryName: string;
  Description: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Conversion ratio between a selling unit and the BaseUnit.
 * ExchangeValue is Prisma Decimal → serialized as string.
 * Example: 1 Pallet = 500.000 Viên → ExchangeValue = "500000"
 */
export interface ProductUnit {
  UnitID: number;
  ProductID: number;
  UnitName: string;
  ExchangeValue: string;
  IsDefault: boolean;
}

export interface Product {
  ProductID: number;
  StoreID: number;
  CategoryID: number;
  ProductName: string;
  SKU: string | null;
  BaseUnit: string;
  Description: string | null;
  IsActive: boolean;
  /** Prisma Decimal → string (e.g. "0.15" = 15% margin) */
  MarginRate?: string;
  CreatedAt: string;
  UpdatedAt: string;
  // Eagerly loaded relations (present when backend includes them)
  category?: Pick<Category, 'CategoryID' | 'CategoryName'>;
  units?: ProductUnit[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER & INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

export interface Supplier {
  SupplierID: number;
  StoreID: number;
  SupplierName: string;
  Phone: string | null;
  Address: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * One row per (StoreID, ProductID).
 * All Qty fields are Prisma Decimal → string.
 * AvailableQty = Quantity + InTransitQty - ReservedQty (computed on backend).
 */
export interface Inventory {
  InventoryID: number;
  StoreID: number;
  ProductID: number;
  Quantity: string;
  ReservedQty: string;
  InTransitQty: string;
  LastUpdated: string;
  // Eagerly loaded
  product?: Pick<Product, 'ProductID' | 'ProductName' | 'SKU' | 'BaseUnit'> & {
    units?: ProductUnit[];
  };
  // Computed by backend
  AvailableQty?: string;
}

export interface StockReceiptDetail {
  DetailID: number;
  ReceiptID: number;
  ProductID: number;
  UnitName: string;
  Quantity: string;
  UnitPrice: string;
  /** Discount rate applied at receipt time (Decimal → string, e.g. "0.10" = 10%) */
  DiscountRate?: string;
  /** Net cost price after discount (Decimal → string) */
  CostPrice?: string;
  product?: Pick<Product, 'ProductID' | 'ProductName' | 'SKU' | 'BaseUnit'>;
}

export interface StockReceipt {
  ReceiptID: number;
  /** Business code, e.g. "PN-20260430-001". Null until assigned. */
  ReceiptCode: string | null;
  StoreID: number;
  SupplierID: number;
  ImportDate: string;
  TotalAmount: string;
  PaidAmount: string;
  Status: StockReceiptStatus;
  Note: string | null;
  CreatedAt: string;
  supplier?: Pick<Supplier, 'SupplierID' | 'SupplierName' | 'Phone'>;
  details?: StockReceiptDetail[];
}

export interface InventoryLog {
  LogID: number;
  StoreID: number;
  ProductID: number;
  ChangeType: InventoryChangeType;
  QuantityType: InventoryQuantityType;
  ReferenceType: InventoryReferenceType | null;
  ReferenceID: number | null;
  OldQuantity: string;
  ChangeQuantity: string;
  NewQuantity: string;
  Note: string | null;
  CreatedBy: number | null;
  CreatedAt: string;
  product?: Pick<Product, 'ProductID' | 'ProductName' | 'BaseUnit'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER & ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export interface Customer {
  CustomerID: number;
  /** Business code, e.g. "KH-20260430-001". Null until assigned. */
  //CustomerCode: string | null;
  StoreID: number;
  CustomerName: string;
  Phone: string | null;
  Address: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  orders?: Order[];
}

export interface OrderDetail {
  DetailID: number;
  OrderID: number;
  ProductID: number;
  UnitName: string;
  Quantity: string;
  UnitPrice: string;
  /** Cost price at time of sale — used for profit calculation. */
  CostPrice: string;
  product?: Pick<Product, 'ProductID' | 'ProductName' | 'SKU' | 'BaseUnit'>;
}

export interface Order {
  OrderID: number;
  /** Business code, e.g. "HD-20260430-001". Null until assigned. */
  OrderCode: string | null;
  StoreID: number;
  CustomerID: number | null;
  UserID: number;
  OrderDate: string;
  DeliveryMethod: DeliveryMethod;
  /**
   * FK to StockReceipt.ReceiptID — only set when DeliveryMethod = 'DirectShip'.
   * Links the simultaneous import + sale in a single atomic operation.
   */
  LinkedReceiptID: number | null;
  TotalAmount: string;
  PaidAmount: string;
  Status: OrderStatus;
  Note: string | null;
  customer?: Pick<Customer, 'CustomerID' | /*'CustomerCode'*/  'CustomerName' | 'Phone' | 'Address'> | null;
  user?: Pick<User, 'UserID' | 'FullName' | 'Email'>;
  details?: OrderDetail[];
  linkedReceipt?: Pick<StockReceipt, 'ReceiptID' | 'ReceiptCode'> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED / UTILITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard paginated response shape returned by the backend.
 * Used by: customers, orders, products, suppliers, etc.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Generic API error response from NestJS exception filters */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ─── Dashboard chart types ────────────────────────────────────────────────────

export interface TopProductItem {
  productId: number;
  productName: string;
  sku: string | null;
  baseUnit: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface TopProductsReportResponse {
  startDate: string;
  endDate: string;
  sortBy: string;
  products: TopProductItem[];
}

export interface RevenueByCategoryItem {
  categoryId: number;
  categoryName: string;
  totalRevenue: number;
  percentage: number;
}

export interface RevenueByCategoryReportResponse {
  items: RevenueByCategoryItem[];
  totalRevenue: number;
}

export interface VirtualInventoryTrendPoint {
  date: string;
  inTransitQty: number;
  reservedQty: number;
}

export interface VirtualInventoryTrendResponse {
  points: VirtualInventoryTrendPoint[];
}
