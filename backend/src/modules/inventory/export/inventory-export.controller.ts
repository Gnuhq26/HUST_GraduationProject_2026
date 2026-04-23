import { Controller, Get, Query, Res, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { InventoryExportService } from './inventory-export.service';
import { CheckPermission, CurrentStore } from '../../../common/decorators';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory/export')
export class InventoryExportController {
  constructor(private readonly inventoryExportService: InventoryExportService) {}

  @Get()
  @CheckPermission('read', 'Inventory')
  @ApiOperation({ summary: 'Export tồn kho ra Excel (cần quyền read:Inventory)' })
  async exportInventory(
    @CurrentStore() storeId: number,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('lowStockThreshold', new ParseIntPipe({ optional: true }))
    lowStockThreshold?: number,
  ) {
    await this.inventoryExportService.exportToExcel(res, storeId, {
      search,
      lowStockThreshold,
    });
  }
}
