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
import { SupplierImportService } from './supplier-import.service';

@ApiTags('Suppliers - Import')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers/import')
export class SupplierImportController {
  constructor(private readonly importService: SupplierImportService) {}

  @Get('template')
  @CheckPermission('read', 'Supplier')
  @ApiOperation({ summary: 'Tải file Excel template import nhà cung cấp' })
  @ApiResponse({ status: 200, description: 'File .xlsx' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="supplier-import-template.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('preview')
  @CheckPermission('manage', 'Supplier')
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
  @ApiOperation({ summary: 'Preview import nhà cung cấp' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async preview(
    @CurrentStore() storeId: number,
    @UploadedFile() file: Multer.File,
  ) {
    if (!file) throw new BadRequestException('Thiếu file upload');
    return this.importService.previewImport(file.buffer, storeId);
  }

  @Post('commit')
  @CheckPermission('manage', 'Supplier')
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
  @ApiOperation({ summary: 'Commit import nhà cung cấp' })
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
    if (!file) throw new BadRequestException('Thiếu file upload');
    return this.importService.commitImport(file.buffer, storeId);
  }
}
