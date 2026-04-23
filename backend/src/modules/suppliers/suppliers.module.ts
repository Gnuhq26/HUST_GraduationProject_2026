import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SupplierImportService } from './import/supplier-import.service';
import { SupplierImportController } from './import/supplier-import.controller';
import { SupplierExportService } from './export/supplier-export.service';
import { SupplierExportController } from './export/supplier-export.controller';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierExportController, SupplierImportController, SuppliersController],
  providers: [SuppliersService, SupplierImportService, SupplierExportService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
