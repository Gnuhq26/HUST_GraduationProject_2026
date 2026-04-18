import ExcelJS from 'exceljs';

/** Dữ liệu thô từ 1 dòng Excel sau khi parse */
export interface RawProductRow {
  rowNumber: number;
  sku: string;
  productName: string;
  categoryName: string;
  baseUnit: string;
  description: string;
  unitName: string;
  exchangeValue: number | null;
  priceName: string;
  unitPrice: number | null;
  minQuantity: number | null;
}

/**
 * Đọc file Excel (.xlsx) từ buffer, bỏ dòng header, map thành mảng RawProductRow.
 * Cột thứ tự:
 *   A: SKU | B: Tên sản phẩm | C: Danh mục | D: Đơn vị gốc
 *   E: Mô tả | F: Đơn vị quy đổi | G: Hệ số quy đổi
 *   H: Tên giá | I: Giá bán | J: Số lượng tối thiểu
 */
export async function parseExcel(buffer: Buffer): Promise<RawProductRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.getWorksheet(1);
  if (!sheet) {
    throw new Error('File Excel không có sheet nào');
  }

  const rows: RawProductRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Bỏ header

    const getString = (col: number): string => {
      const cell = row.getCell(col);
      return cell.value != null ? String(cell.value).trim() : '';
    };

    const getNumber = (col: number): number | null => {
      const cell = row.getCell(col);
      if (cell.value == null || cell.value === '') return null;
      const num = Number(cell.value);
      return isNaN(num) ? null : num;
    };

    rows.push({
      rowNumber,
      sku: getString(1),
      productName: getString(2),
      categoryName: getString(3),
      baseUnit: getString(4),
      description: getString(5),
      unitName: getString(6),
      exchangeValue: getNumber(7),
      priceName: getString(8),
      unitPrice: getNumber(9),
      minQuantity: getNumber(10),
    });
  });

  return rows;
}