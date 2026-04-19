import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SupplierImportService } from './import/supplier-import.service';
import { SupplierImportController } from './import/supplier-import.controller';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [SuppliersController, SupplierImportController],
  providers: [SuppliersService, SupplierImportService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
