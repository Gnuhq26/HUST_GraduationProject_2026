import { PrismaService } from '../../../common/prisma';
import { RawProductRow } from './product-import.parser';

export interface ValidatedRow extends RawProductRow {
  categoryId: number;
}

export interface InvalidRow {
  rowNumber: number;
  data: RawProductRow;
  errors: string[];
}

export interface ValidationResult {
  validRows: ValidatedRow[];
  invalidRows: InvalidRow[];
}

/**
 * Validate mảng raw rows theo 2 lớp:
 *   Lớp 1: Syntax (thiếu trường bắt buộc, giá âm, sai kiểu)
 *   Lớp 2: Logic DB (danh mục có tồn tại trong store không)
 *
 * Multi-tenant: Mọi truy vấn DB PHẢI kèm storeId.
 */
export async function validateRows(
  rows: RawProductRow[],
  storeId: number,
  prisma: PrismaService,
): Promise<ValidationResult> {
  const validRows: ValidatedRow[] = [];
  const invalidRows: InvalidRow[] = [];

  // Pre-load: Lấy tất cả category của store 1 lần → tránh N+1
  const categories = await prisma.category.findMany({
    where: { StoreID: storeId },
    select: { CategoryID: true, CategoryName: true },
  });
  const categoryMap = new Map(
    categories.map((c) => [c.CategoryName.toLowerCase(), c.CategoryID]),
  );

  // Pre-load: Lấy tất cả SKU đã tồn tại trong store (để thông báo update vs create)
  const existingProducts = await prisma.product.findMany({
    where: { StoreID: storeId, SKU: { not: null } },
    select: { SKU: true },
  });
  const existingSkuSet = new Set(
    existingProducts.map((p) => p.SKU!.toLowerCase()),
  );

  for (const row of rows) {
    const errors: string[] = [];

    // ── Lớp 1: Syntax Validation ──────────────────────────
    if (!row.sku) {
      errors.push('Thiếu mã SKU');
    }

    if (!row.productName) {
      errors.push('Thiếu tên sản phẩm');
    }

    if (!row.categoryName) {
      errors.push('Thiếu tên danh mục');
    }

    if (!row.baseUnit) {
      errors.push('Thiếu đơn vị gốc');
    }

    // Validate unit nếu có
    if (row.unitName) {
      if (row.exchangeValue == null) {
        errors.push(`Đơn vị "${row.unitName}" thiếu hệ số quy đổi`);
      } else if (row.exchangeValue <= 0) {
        errors.push('Hệ số quy đổi phải lớn hơn 0');
      }
    }

    // Validate marginRate nếu có
    if (row.marginRate != null && (row.marginRate < 0 || row.marginRate > 1)) {
      errors.push('Biên lợi nhuận phải từ 0.00 đến 1.00 (ví dụ: 0.15 = 15%)');
    }

    // ── Lớp 2: Logic DB Validation ────────────────────────
    let categoryId = 0;

    if (row.categoryName) {
      const foundId = categoryMap.get(row.categoryName.toLowerCase());
      if (!foundId) {
        errors.push(
          `Danh mục "${row.categoryName}" không tồn tại trong cửa hàng`,
        );
      } else {
        categoryId = foundId;
      }
    }

    // ── Kết quả ───────────────────────────────────────────
    if (errors.length > 0) {
      invalidRows.push({ rowNumber: row.rowNumber, data: row, errors });
    } else {
      validRows.push({ ...row, categoryId });
    }
  }

  return { validRows, invalidRows };
}