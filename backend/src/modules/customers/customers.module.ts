import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerImportService } from './import/customer-import.service';
import { CustomerImportController } from './import/customer-import.controller';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController, CustomerImportController],
  providers: [CustomersService, CustomerImportService],
  exports: [CustomersService],
})
export class CustomersModule {}
