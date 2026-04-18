import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductImportService } from './import/product-import.service';
import { ProductImportController } from './import/product-import.controller';

@Module({
  controllers: [ProductsController, ProductImportController],
  providers: [ProductsService, ProductImportService],
  exports: [ProductsService],
})
export class ProductsModule {}
