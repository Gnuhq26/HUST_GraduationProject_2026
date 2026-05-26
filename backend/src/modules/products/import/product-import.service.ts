import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../../../common/prisma';
import { parseExcel } from './product-import.parser';
import { validateRows, ValidatedRow } from './product-import.validator';
import { ensureInventoryExists } from '../../../utils';
import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class ProductImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Phase 1 — Preview: Parse + Validate, trả kết quả phân tích.
   * KHÔNG ghi DB.
   */
  async previewImport(buffer: Buffer, storeId: number) {
    const rows = await parseExcel(buffer);

    if (rows.length === 0) {
      throw new BadRequestException('File Excel không có dữ liệu (chỉ có header)');
    }

    const { validRows, invalidRows } = await validateRows(
      rows,
      storeId,
      this.prisma,
    );

    // Gom nhóm validRows theo SKU để thống kê create/update
    const skuSet = new Set(validRows.map((r) => r.sku.toLowerCase()));
    const existingProducts = await this.prisma.product.findMany({
      where: {
        StoreID: storeId,
        SKU: { in: Array.from(skuSet) },
      },
      select: { SKU: true },
    });
    const existingSkuSet = new Set(
      existingProducts.map((p) => p.SKU!.toLowerCase()),
    );

    const toCreate = validRows.filter(
      (r) => !existingSkuSet.has(r.sku.toLowerCase()),
    );
    const toUpdate = validRows.filter((r) =>
      existingSkuSet.has(r.sku.toLowerCase()),
    );

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      createCount: new Set(toCreate.map((r) => r.sku.toLowerCase())).size,
      updateCount: new Set(toUpdate.map((r) => r.sku.toLowerCase())).size,
      validRows: validRows.map((r, idx) => ({
        rowNumber: r.rowNumber,
        sku: r.sku,
        productName: r.productName,
        categoryName: r.categoryName,
        baseUnit: r.baseUnit,
        unitName: r.unitName || null,
        exchangeValue: r.exchangeValue ?? null,
        marginRate: r.marginRate,
        action: existingSkuSet.has(r.sku.toLowerCase()) ? 'UPDATE' : 'CREATE',
        isContinuation:
          idx > 0 &&
          validRows[idx - 1].sku.toLowerCase() === r.sku.toLowerCase(),
      })),
      invalidRows: invalidRows.map((r) => ({
        rowNumber: r.rowNumber,
        sku: r.data.sku,
        productName: r.data.productName,
        errors: r.errors,
      })),
    };
  }

  /**
   * Phase 2 — Commit: Parse + Validate lại + Upsert vào DB.
   * Dùng Prisma Transaction để đảm bảo atomicity.
   */
  async commitImport(buffer: Buffer, storeId: number) {
    const rows = await parseExcel(buffer);

    if (rows.length === 0) {
      throw new BadRequestException('File Excel không có dữ liệu');
    }

    const { validRows, invalidRows } = await validateRows(
      rows,
      storeId,
      this.prisma,
    );

    if (validRows.length === 0) {
      throw new BadRequestException(
        'Không có dòng nào hợp lệ để import. Vui lòng kiểm tra lại file.',
      );
    }

    // Gom nhóm theo SKU: 1 product có thể có nhiều dòng (nhiều unit/price)
    const productMap = this.groupBySku(validRows);

    const results = await this.prisma.$transaction(
      async (tx) => {
        const upserted: Array<{ sku: string; action: string; productName: string }> = [];

        for (const [sku, group] of productMap.entries()) {
          const primary = group[0]; // Dòng đầu tiên chứa thông tin chính

          // Gom units (bỏ trùng, bỏ dòng không có unitName)
          const units = this.collectUnits(group);

          // Xóa units cũ trước khi upsert (replace all strategy)
          const existing = await tx.product.findUnique({
            where: { StoreID_SKU: { StoreID: storeId, SKU: sku } },
            select: { ProductID: true },
          });

          if (existing) {
            await tx.productUnit.deleteMany({
              where: { ProductID: existing.ProductID },
            });
          }

          const product = await tx.product.upsert({
            where: { StoreID_SKU: { StoreID: storeId, SKU: sku } },
            update: {
              ProductName: primary.productName,
              CategoryID: primary.categoryId,
              BaseUnit: primary.baseUnit,
              Description: primary.description || null,
              IsActive: true,
              MarginRate: primary.marginRate ?? 0.10,
              units: units.length > 0
                ? { create: units }
                : undefined,
            },
            create: {
              StoreID: storeId,
              CategoryID: primary.categoryId,
              ProductName: primary.productName,
              SKU: sku,
              BaseUnit: primary.baseUnit,
              Description: primary.description || null,
              IsActive: true,
              MarginRate: primary.marginRate ?? 0.10,
              units: units.length > 0
                ? { create: units }
                : undefined,
            },
          });

          // Đảm bảo Inventory record tồn tại
          await ensureInventoryExists(tx as any, storeId, product.ProductID);

          upserted.push({
            sku,
            productName: primary.productName,
            action: existing ? 'UPDATED' : 'CREATED',
          });
        }

        return upserted;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return {
      success: true,
      importedCount: results.length,
      skippedCount: invalidRows.length,
      results,
    };
  }

  /**
   * Tạo file Excel template mẫu
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gnuh Buildify';
    const sheet = workbook.addWorksheet('Import Sản phẩm');

    // Header row
    const headers = [
      { header: 'Mã SKU (*)', key: 'sku', width: 18 },
      { header: 'Tên sản phẩm (*)', key: 'productName', width: 35 },
      { header: 'Tên danh mục (*)', key: 'categoryName', width: 20 },
      { header: 'Đơn vị gốc (*)', key: 'baseUnit', width: 14 },
      { header: 'Mô tả', key: 'description', width: 30 },
      { header: 'Biên LN (0.15=15%)', key: 'marginRate', width: 20 },
      { header: 'Đơn vị quy đổi', key: 'unitName', width: 16 },
      { header: 'Hệ số quy đổi', key: 'exchangeValue', width: 16 },
    ];

    sheet.columns = headers;

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 24;

    // Dòng mẫu — SP 1 dòng 1: đơn vị Bao (base unit)
    sheet.addRow({
      sku: 'XM-HT-PCB40',
      productName: 'Xi măng Hoàng Thạch PCB40',
      categoryName: 'Xi măng',
      baseUnit: 'Bao',
      description: 'Xi măng Portland hỗn hợp',
      marginRate: 0.15,
      unitName: 'Tấn',
      exchangeValue: 20,
    });
    // Dòng mẫu — SP 1 dòng 2: cùng SKU, đơn vị thứ 2 (miêu tả thêm đv quy đổi)
    const continuationRow = sheet.addRow({
      sku: 'XM-HT-PCB40',
      productName: '',
      categoryName: '',
      baseUnit: '',
      description: '',
      marginRate: '',
      unitName: 'Xe',
      exchangeValue: 300,
    });
    continuationRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };
    // Dòng mẫu — SP 2
    sheet.addRow({
      sku: 'GACH-TL-200',
      productName: 'Gạch tuynel 200',
      categoryName: 'Gạch',
      baseUnit: 'Viên',
      description: '',
      marginRate: 0.12,
      unitName: 'Pallet',
      exchangeValue: 500,
    });

    // Ghi chú hướng dẫn: dòng cùng SKU = thêm đơn vị quy đổi
    const noteRow = sheet.addRow([
      '\u2139 Hướng dẫn: Để thêm nhiều đơn vị quy đổi cho 1 sản phẩm, hãy thêm nhiều dòng với cùng mã SKU (chỉ điền SKU và ĐV quy đổi).',
    ]);
    noteRow.font = { italic: true, color: { argb: 'FF7F6000' } };
    noteRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' },
    };
    noteRow.getCell(1).alignment = { wrapText: true };
    sheet.mergeCells(`A${noteRow.number}:H${noteRow.number}`);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── Private helpers ─────────────────────────────────────

  private groupBySku(rows: ValidatedRow[]): Map<string, ValidatedRow[]> {
    const map = new Map<string, ValidatedRow[]>();
    for (const row of rows) {
      const key = row.sku;
      const group = map.get(key) || [];
      group.push(row);
      map.set(key, group);
    }
    return map;
  }

  private collectUnits(
    group: ValidatedRow[],
  ): Array<{ UnitName: string; ExchangeValue: number; IsDefault: boolean }> {
    const seen = new Set<string>();
    const units: Array<{
      UnitName: string;
      ExchangeValue: number;
      IsDefault: boolean;
    }> = [];

    for (const row of group) {
      if (!row.unitName || seen.has(row.unitName)) continue;
      seen.add(row.unitName);
      units.push({
        UnitName: row.unitName,
        ExchangeValue: row.exchangeValue!,
        IsDefault: false,
      });
    }
    return units;
  }
}