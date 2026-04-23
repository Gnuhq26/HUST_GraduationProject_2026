import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrderExportService } from './order-export.service';
import { CheckPermission, CurrentStore } from '../../../common/decorators';

@ApiTags('Đơn hàng')
@ApiBearerAuth('JWT-auth')
@Controller('orders/export')
export class OrderExportController {
  constructor(private readonly orderExportService: OrderExportService) {}

  @Get()
  @CheckPermission('read', 'Order')
  @ApiOperation({ summary: 'Export đơn hàng ra Excel (cần quyền read:Order)' })
  async exportOrders(
    @CurrentStore() storeId: number,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    await this.orderExportService.exportToExcel(res, storeId, {
      search,
      status,
      dateFrom,
      dateTo,
    });
  }
}
