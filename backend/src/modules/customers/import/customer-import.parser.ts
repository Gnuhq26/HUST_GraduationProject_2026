import ExcelJS from 'exceljs';

export interface RawCustomerRow {
  rowNumber: number;
  customerName: string;
  phone: string;
  address: string;
}

/**
 * Đọc file Excel → mảng RawCustomerRow.
 * Cột: A: Tên KH | B: SĐT | C: Địa chỉ
 */
export async function parseCustomerExcel(
  buffer: Buffer,
): Promise<RawCustomerRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.getWorksheet(1);
  if (!sheet) throw new Error('File Excel không có sheet nào');

  const rows: RawCustomerRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const getString = (col: number): string => {
      const cell = row.getCell(col);
      return cell.value != null ? String(cell.value).trim() : '';
    };

    rows.push({
      rowNumber,
      customerName: getString(1),
      phone: getString(2),
      address: getString(3),
    });
  });

  return rows;
}
