import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../../../common/prisma';
import { parseSupplierExcel } from './supplier-import.parser';
import { validateSupplierRows } from './supplier-import.validator';

@Injectable()
export class SupplierImportService {
  constructor(private prisma: PrismaService) {}

  async previewImport(buffer: Buffer, storeId: number) {
    const rows = await parseSupplierExcel(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('File Excel không có dữ liệu');
    }

    const { validRows, invalidRows } = validateSupplierRows(rows);

    // Kiểm tra trùng tên NCC trong store
    const existingSuppliers = await this.prisma.supplier.findMany({
      where: { StoreID: storeId },
      select: { SupplierName: true },
    });
    const existingNameSet = new Set(
      existingSuppliers.map((s) => s.SupplierName.toLowerCase()),
    );

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows: validRows.map((r) => ({
        rowNumber: r.rowNumber,
        supplierName: r.supplierName,
        phone: r.phone,
        address: r.address,
        action: existingNameSet.has(r.supplierName.toLowerCase())
          ? 'UPDATE'
          : 'CREATE',
      })),
      invalidRows: invalidRows.map((r) => ({
        rowNumber: r.rowNumber,
        supplierName: r.data.supplierName,
        errors: r.errors,
      })),
    };
  }

  async commitImport(buffer: Buffer, storeId: number) {
    const rows = await parseSupplierExcel(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('File Excel không có dữ liệu');
    }

    const { validRows, invalidRows } = validateSupplierRows(rows);
    if (validRows.length === 0) {
      throw new BadRequestException('Không có dòng nào hợp lệ để import');
    }

    let created = 0;
    let updated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        // Supplier có @@unique([StoreID, SupplierName]) → dùng upsert
        const existing = await tx.supplier.findUnique({
          where: {
            StoreID_SupplierName: {
              StoreID: storeId,
              SupplierName: row.supplierName,
            },
          },
        });

        if (existing) {
          await tx.supplier.update({
            where: { SupplierID: existing.SupplierID },
            data: {
              Phone: row.phone || null,
              Address: row.address || null,
            },
          });
          updated++;
        } else {
          await tx.supplier.create({
            data: {
              StoreID: storeId,
              SupplierName: row.supplierName,
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
    const sheet = workbook.addWorksheet('Import Nhà cung cấp');

    sheet.columns = [
      { header: 'Tên nhà cung cấp (*)', key: 'supplierName', width: 30 },
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
      supplierName: 'Công ty TNHH Vật liệu ABC',
      phone: '0912345678',
      address: '123 Đường ABC, Quận 1, TP.HCM',
    });
    sheet.addRow({
      supplierName: 'NCC Hoàng Phát',
      phone: '0287654321',
      address: '456 Quốc lộ 1A, Bình Chánh',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
