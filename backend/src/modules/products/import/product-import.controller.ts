import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Multer } from 'multer';
import { CheckPermission } from '../../../common/decorators/check-permission.decorator';
import { CurrentStore } from '../../../common/decorators/current-store.decorator';
import { ProductImportService } from './product-import.service';

@ApiTags('Products - Import')
@ApiBearerAuth('JWT-auth')
@Controller('products/import')
export class ProductImportController {
  constructor(private readonly importService: ProductImportService) {}

  /**
   * GET /products/import/template
   * Tải file Excel mẫu để import sản phẩm
   */
  @Get('template')
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Tải file Excel template import sản phẩm' })
  @ApiResponse({ status: 200, description: 'File .xlsx' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateTemplate();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="product-import-template.xlsx"',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  /**
   * POST /products/import/preview
   * Upload file Excel → Parse → Validate → Trả kết quả phân tích (KHÔNG lưu DB)
   */
  @Post('preview')
  @CheckPermission('create', 'Product')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (
          !file.originalname.match(/\.(xlsx|xls)$/i)
        ) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file Excel (.xlsx, .xls)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Preview import sản phẩm (chỉ validate, không lưu)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả phân tích file' })
  async preview(
    @CurrentStore() storeId: number,
    @UploadedFile() file: Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Thiếu file upload');
    }
    return this.importService.previewImport(file.buffer, storeId);
  }

  /**
   * POST /products/import/commit
   * Upload lại file Excel → Validate → Ghi dòng hợp lệ vào DB
   */
  @Post('commit')
  @CheckPermission('create', 'Product')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file Excel (.xlsx, .xls)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Commit import sản phẩm (ghi vào DB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Import thành công' })
  async commit(
    @CurrentStore() storeId: number,
    @UploadedFile() file: Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Thiếu file upload');
    }
    return this.importService.commitImport(file.buffer, storeId);
  }
}