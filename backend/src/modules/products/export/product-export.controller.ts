import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { CheckPermission } from '../../../common/decorators/check-permission.decorator';
import { CurrentStore } from '../../../common/decorators/current-store.decorator';
import { ProductExportService } from './product-export.service';

@ApiTags('Products - Export')
@ApiBearerAuth('JWT-auth')
@Controller('products/export')
export class ProductExportController {
  constructor(private readonly exportService: ProductExportService) {}

  /**
   * GET /products/export
   * Xuất danh sách sản phẩm ra file Excel
   */
  @Get()
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Xuất danh sách sản phẩm ra file Excel' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'File .xlsx' })
  async exportProducts(
    @CurrentStore() storeId: number,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `products-export-${timestamp}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    await this.exportService.exportToExcel(res, storeId, {
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    res.end();
  }
}
