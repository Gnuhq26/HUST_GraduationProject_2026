import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryExportController } from './export/inventory-export.controller';
import { InventoryExportService } from './export/inventory-export.service';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryExportController, InventoryController],
  providers: [InventoryService, InventoryExportService],
  exports: [InventoryService],
})
export class InventoryModule {}
