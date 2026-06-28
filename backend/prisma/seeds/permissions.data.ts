/** Danh mục quyền toàn hệ thống — dùng chung cho seed và sync-permissions. */
export const SYSTEM_PERMISSIONS: Array<{
  Action: string;
  Subject: string;
  note?: string;
}> = [
  { Action: 'manage', Subject: 'all', note: 'Super Admin' },

  { Action: 'read', Subject: 'Product' },
  { Action: 'create', Subject: 'Product' },
  { Action: 'update', Subject: 'Product' },
  { Action: 'delete', Subject: 'Product' },

  { Action: 'read', Subject: 'Order' },
  { Action: 'create', Subject: 'Order' },
  { Action: 'update', Subject: 'Order' },

  { Action: 'read', Subject: 'CostPrice', note: 'Xem giá vốn' },

  { Action: 'read', Subject: 'Report', note: 'Báo cáo doanh thu, top sản phẩm' },
  { Action: 'read', Subject: 'ProfitReport', note: 'Báo cáo lợi nhuận' },

  { Action: 'read', Subject: 'Debt', note: 'Xem công nợ' },
  { Action: 'manage', Subject: 'Debt', note: 'Ghi nhận thanh toán công nợ' },

  { Action: 'read', Subject: 'AiAnalyst', note: 'Phân tích AI' },

  { Action: 'read', Subject: 'Supplier' },
  { Action: 'create', Subject: 'Supplier' },
  { Action: 'update', Subject: 'Supplier' },
  { Action: 'delete', Subject: 'Supplier' },
  { Action: 'manage', Subject: 'Supplier', note: 'Import nhà cung cấp' },

  { Action: 'read', Subject: 'Inventory' },
  { Action: 'create', Subject: 'Inventory', note: 'Nhập kho / giao thẳng' },
  { Action: 'update', Subject: 'Inventory', note: 'Điều chỉnh tồn kho' },

  { Action: 'read', Subject: 'Category' },
  { Action: 'create', Subject: 'Category' },
  { Action: 'update', Subject: 'Category' },
  { Action: 'delete', Subject: 'Category' },

  { Action: 'read', Subject: 'Customer' },
  { Action: 'create', Subject: 'Customer' },
  { Action: 'update', Subject: 'Customer' },
  { Action: 'delete', Subject: 'Customer' },
  { Action: 'manage', Subject: 'Customer', note: 'Thêm / import khách hàng' },

  { Action: 'read', Subject: 'Store', note: 'Xem cài đặt cửa hàng' },
  { Action: 'update', Subject: 'Store', note: 'Cập nhật cài đặt cửa hàng' },

  { Action: 'read', Subject: 'User', note: 'Xem thành viên' },
  { Action: 'create', Subject: 'User', note: 'Mời thành viên' },
  { Action: 'update', Subject: 'User', note: 'Đổi vai trò thành viên' },
  { Action: 'delete', Subject: 'User', note: 'Loại thành viên' },

  { Action: 'read', Subject: 'Role', note: 'Xem vai trò' },
  { Action: 'create', Subject: 'Role', note: 'Tạo vai trò' },
  { Action: 'update', Subject: 'Role', note: 'Sửa vai trò / phân quyền' },
  { Action: 'delete', Subject: 'Role', note: 'Xóa vai trò' },

  { Action: 'read', Subject: 'Permission', note: 'Xem danh mục quyền hệ thống' },
];
