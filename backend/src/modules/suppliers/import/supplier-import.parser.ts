import ExcelJS from 'exceljs';

export interface RawSupplierRow {
  rowNumber: number;
  supplierName: string;
  phone: string;
  address: string;
}

/**
 * Đọc file Excel → mảng RawSupplierRow.
 * Cột: A: Tên NCC | B: SĐT | C: Địa chỉ
 */
export async function parseSupplierExcel(
  buffer: Buffer,
): Promise<RawSupplierRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.getWorksheet(1);
  if (!sheet) throw new Error('File Excel không có sheet nào');

  const rows: RawSupplierRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const getString = (col: number): string => {
      const cell = row.getCell(col);
      return cell.value != null ? String(cell.value).trim() : '';
    };

    rows.push({
      rowNumber,
      supplierName: getString(1),
      phone: getString(2),
      address: getString(3),
    });
  });

  return rows;
}
