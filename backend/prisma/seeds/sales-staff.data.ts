/** Ví dụ cấu hình vai trò Nhân viên bán hàng — khớp mô tả Chương 5 (không phải quyền mặc định khi tạo cửa hàng). */
export const SALES_STAFF_ROLE_NAME = 'Nhân viên bán hàng';

export const SALES_STAFF_ROLE_DESCRIPTION = 'Bán hàng, quản lý đơn hàng';

export const SALES_STAFF_PERMISSIONS: Array<[action: string, subject: string]> = [
  ['read', 'Product'],
  ['read', 'Category'],
  ['read', 'Inventory'],
  ['create', 'Order'],
  ['read', 'Order'],
  ['update', 'Order'],
  ['manage', 'Customer'],
  ['read', 'Customer'],
  ['update', 'Customer'],
  ['read', 'Debt'],
  ['manage', 'Debt'],
];

/** Tài khoản demo để so sánh giao diện Chủ cửa hàng vs Nhân viên bán hàng khi bảo vệ. */
export const SALES_STAFF_DEMO_USER = {
  Email: 'nhanvien@app.com',
  FullName: 'Trần Thị Bán Hàng',
  Password: '123456',
};
