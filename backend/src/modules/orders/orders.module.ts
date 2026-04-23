import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderExportController } from './export/order-export.controller';
import { OrderExportService } from './export/order-export.service';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [OrderExportController, OrdersController],
  providers: [OrdersService, OrderExportService],
  exports: [OrdersService],
})
export class OrdersModule {}
