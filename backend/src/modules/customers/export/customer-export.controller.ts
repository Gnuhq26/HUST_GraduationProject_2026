import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { CheckPermission } from '../../../common/decorators/check-permission.decorator';
import { CurrentStore } from '../../../common/decorators/current-store.decorator';
import { CustomerExportService } from './customer-export.service';

@ApiTags('Customers - Export')
@ApiBearerAuth('JWT-auth')
@Controller('customers/export')
export class CustomerExportController {
  constructor(private readonly exportService: CustomerExportService) {}

  @Get()
  @CheckPermission('read', 'Customer')
  @ApiOperation({ summary: 'Xuất danh sách khách hàng ra file Excel' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'File .xlsx' })
  async exportCustomers(
    @CurrentStore() storeId: number,
    @Res() res: Response,
    @Query('search') search?: string,
  ) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `customers-export-${timestamp}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    await this.exportService.exportToExcel(res, storeId, { search });

    res.end();
  }
}
