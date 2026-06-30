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

/** Bỏ qua dòng trống hoặc dòng ghi chú/hướng dẫn trong template (không phải dữ liệu SP). */
function isSkippableRow(row: Omit<RawProductRow, 'rowNumber'>): boolean {
  const textFields = [
    row.sku,
    row.productName,
    row.categoryName,
    row.baseUnit,
    row.description,
    row.unitName,
  ];
  const hasText = textFields.some((v) => v.length > 0);
  const hasNumber = row.marginRate != null || row.exchangeValue != null;

  if (!hasText && !hasNumber) {
    return true;
  }

  const blob = textFields.join(' ').toLowerCase();
  if (/hướng dẫn/.test(blob) || /lưu ý\s*:/.test(blob)) {
    return true;
  }

  return false;
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

    const parsed: Omit<RawProductRow, 'rowNumber'> = {
      sku: getString(1),
      productName: getString(2),
      categoryName: getString(3),
      baseUnit: getString(4),
      description: getString(5),
      marginRate: getNumber(6),
      unitName: getString(7),
      exchangeValue: getNumber(8),
    };

    if (isSkippableRow(parsed)) {
      return;
    }

    rows.push({
      rowNumber,
      ...parsed,
    });
  });

  return rows;
}