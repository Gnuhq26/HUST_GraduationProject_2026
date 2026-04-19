import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerImportService } from './import/customer-import.service';
import { CustomerImportController } from './import/customer-import.controller';
import { CustomerExportService } from './export/customer-export.service';
import { CustomerExportController } from './export/customer-export.controller';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerExportController, CustomerImportController, CustomersController],
  providers: [CustomersService, CustomerImportService, CustomerExportService],
  exports: [CustomersService],
})
export class CustomersModule {}
