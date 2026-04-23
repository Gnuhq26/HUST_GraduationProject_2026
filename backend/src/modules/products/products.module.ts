import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductImportService } from './import/product-import.service';
import { ProductImportController } from './import/product-import.controller';
import { ProductExportService } from './export/product-export.service';
import { ProductExportController } from './export/product-export.controller';

@Module({
  controllers: [ProductExportController, ProductImportController, ProductsController],
  providers: [ProductsService, ProductImportService, ProductExportService],
  exports: [ProductsService],
})
export class ProductsModule {}
