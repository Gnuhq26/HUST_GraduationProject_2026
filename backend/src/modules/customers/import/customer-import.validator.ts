import { RawCustomerRow } from './customer-import.parser';

export interface ValidatedCustomerRow extends RawCustomerRow {}

export interface InvalidCustomerRow {
  rowNumber: number;
  data: RawCustomerRow;
  errors: string[];
}

export interface CustomerValidationResult {
  validRows: ValidatedCustomerRow[];
  invalidRows: InvalidCustomerRow[];
}

const PHONE_REGEX = /^[0-9]{9,11}$/;

export function validateCustomerRows(
  rows: RawCustomerRow[],
): CustomerValidationResult {
  const validRows: ValidatedCustomerRow[] = [];
  const invalidRows: InvalidCustomerRow[] = [];

  for (const row of rows) {
    const errors: string[] = [];

    if (!row.customerName) {
      errors.push('Thiếu tên khách hàng');
    } else if (row.customerName.length > 100) {
      errors.push('Tên khách hàng không được quá 100 ký tự');
    }

    if (row.phone && !PHONE_REGEX.test(row.phone)) {
      errors.push('Số điện thoại không hợp lệ (9-11 chữ số)');
    }

    if (row.address && row.address.length > 255) {
      errors.push('Địa chỉ không được quá 255 ký tự');
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: row.rowNumber, data: row, errors });
    } else {
      validRows.push({ ...row });
    }
  }

  return { validRows, invalidRows };
}
