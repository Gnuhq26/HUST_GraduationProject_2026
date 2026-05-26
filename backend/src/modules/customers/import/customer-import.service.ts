import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../../../common/prisma';
import { parseCustomerExcel } from './customer-import.parser';
import { validateCustomerRows } from './customer-import.validator';

@Injectable()
export class CustomerImportService {
  constructor(private prisma: PrismaService) {}

  async previewImport(buffer: Buffer, storeId: number) {
    const rows = await parseCustomerExcel(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('File Excel không có dữ liệu');
    }

    const { validRows, invalidRows } = validateCustomerRows(rows);

    // Kiểm tra trùng tên trong store
    const existingCustomers = await this.prisma.customer.findMany({
      where: { StoreID: storeId },
      select: { CustomerName: true },
    });
    const existingNameSet = new Set(
      existingCustomers.map((c) => c.CustomerName.toLowerCase()),
    );

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows: validRows.map((r) => ({
        rowNumber: r.rowNumber,
        customerName: r.customerName,
        phone: r.phone,
        address: r.address,
        action: existingNameSet.has(r.customerName.toLowerCase())
          ? 'UPDATE'
          : 'CREATE',
      })),
      invalidRows: invalidRows.map((r) => ({
        rowNumber: r.rowNumber,
        customerName: r.data.customerName,
        errors: r.errors,
      })),
    };
  }

  async commitImport(buffer: Buffer, storeId: number) {
    const rows = await parseCustomerExcel(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('File Excel không có dữ liệu');
    }

    const { validRows, invalidRows } = validateCustomerRows(rows);
    if (validRows.length === 0) {
      throw new BadRequestException('Không có dòng nào hợp lệ để import');
    }

    // Lấy existing customers để xác định create/update
    const existingCustomers = await this.prisma.customer.findMany({
      where: { StoreID: storeId },
      select: { CustomerID: true, CustomerName: true },
    });
    const existingMap = new Map(
      existingCustomers.map((c) => [c.CustomerName.toLowerCase(), c.CustomerID]),
    );

    let created = 0;
    let updated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const existingId = existingMap.get(row.customerName.toLowerCase());

        if (existingId) {
          await tx.customer.update({
            where: { CustomerID: existingId },
            data: {
              Phone: row.phone || null,
              Address: row.address || null,
            },
          });
          updated++;
        } else {
          await tx.customer.create({
            data: {
              StoreID: storeId,
              CustomerName: row.customerName,
              Phone: row.phone || null,
              Address: row.address || null,
            },
          });
          created++;
        }
      }
    });

    return {
      success: true,
      created,
      updated,
      skipped: invalidRows.length,
    };
  }

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gnuh Buildify';
    const sheet = workbook.addWorksheet('Import Khách hàng');

    sheet.columns = [
      { header: 'Tên khách hàng (*)', key: 'customerName', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 18 },
      { header: 'Địa chỉ', key: 'address', width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 24;

    sheet.addRow({
      customerName: 'Nguyễn Văn A',
      phone: '0912345678',
      address: '123 Đường ABC, Quận 1, TP.HCM',
    });
    sheet.addRow({
      customerName: 'Công ty XD Hoàng Long',
      phone: '0287654321',
      address: '456 Quốc lộ 1A, Bình Chánh',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
