import { RawSupplierRow } from './supplier-import.parser';

export interface ValidatedSupplierRow extends RawSupplierRow {}

export interface InvalidSupplierRow {
  rowNumber: number;
  data: RawSupplierRow;
  errors: string[];
}

export interface SupplierValidationResult {
  validRows: ValidatedSupplierRow[];
  invalidRows: InvalidSupplierRow[];
}

const PHONE_REGEX = /^[0-9]{9,11}$/;

/**
 * Validate nhà cung cấp.
 * Lớp 1: Syntax (tên trống, SĐT sai format)
 * Lớp 2: Trùng tên trong cùng file (dedupe)
 */
export function validateSupplierRows(
  rows: RawSupplierRow[],
): SupplierValidationResult {
  const validRows: ValidatedSupplierRow[] = [];
  const invalidRows: InvalidSupplierRow[] = [];
  const seenNames = new Set<string>();

  for (const row of rows) {
    const errors: string[] = [];

    if (!row.supplierName) {
      errors.push('Thiếu tên nhà cung cấp');
    } else if (row.supplierName.length > 255) {
      errors.push('Tên nhà cung cấp không được quá 255 ký tự');
    } else {
      const lowerName = row.supplierName.toLowerCase();
      if (seenNames.has(lowerName)) {
        errors.push(`Tên "${row.supplierName}" bị trùng trong file`);
      } else {
        seenNames.add(lowerName);
      }
    }

    if (row.phone && !PHONE_REGEX.test(row.phone)) {
      errors.push('Số điện thoại không hợp lệ (9-11 chữ số)');
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: row.rowNumber, data: row, errors });
    } else {
      validRows.push({ ...row });
    }
  }

  return { validRows, invalidRows };
}
