import ExcelJS from 'exceljs';

/** Dữ liệu thô từ 1 dòng Excel sau khi parse */
export interface RawProductRow {
  rowNumber: number;
  sku: string;
  productName: string;
  categoryName: string;
  baseUnit: string;
  description: string;
  marginRate: number | null;
  unitName: string;
  exchangeValue: number | null;
}

/**
 * Đọc file Excel (.xlsx) từ buffer, bỏ dòng header, map thành mảng RawProductRow.
 * Cột thứ tự:
 *   A: SKU | B: Tên sản phẩm | C: Danh mục | D: Đơn vị gốc
 *   E: Mô tả | F: Biên lợi nhuận (0.10=10%) | G: Đơn vị quy đổi | H: Hệ số quy đổi
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
      marginRate: getNumber(6),
      unitName: getString(7),
      exchangeValue: getNumber(8),
    });
  });

  return rows;
}