import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { CheckPermission } from '../../../common/decorators/check-permission.decorator';
import { CurrentStore } from '../../../common/decorators/current-store.decorator';
import { SupplierExportService } from './supplier-export.service';

@ApiTags('Suppliers - Export')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers/export')
export class SupplierExportController {
  constructor(private readonly exportService: SupplierExportService) {}

  @Get()
  @CheckPermission('read', 'Supplier')
  @ApiOperation({ summary: 'Xuất danh sách nhà cung cấp ra file Excel' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'File .xlsx' })
  async exportSuppliers(
    @CurrentStore() storeId: number,
    @Res() res: Response,
    @Query('search') search?: string,
  ) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `suppliers-export-${timestamp}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    await this.exportService.exportToExcel(res, storeId, { search });

    res.end();
  }
}
