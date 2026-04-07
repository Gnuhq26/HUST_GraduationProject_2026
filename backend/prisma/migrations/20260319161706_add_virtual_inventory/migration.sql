/*
  Warnings:

  - Added the required column `QuantityType` to the `InventoryLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Inventory` ADD COLUMN `InTransitQty` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `ReservedQty` DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `InventoryLog` ADD COLUMN `QuantityType` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `DeliveryMethod` VARCHAR(50) NOT NULL DEFAULT 'Immediate',
    ADD COLUMN `LinkedReceiptID` INTEGER NULL;

-- AlterTable
ALTER TABLE `StockReceipt` ADD COLUMN `Status` VARCHAR(50) NOT NULL DEFAULT 'Received';

-- RedefineIndex (MySQL 8: create new index, drop FK, re-add FK — implicit index auto-drops)
CREATE INDEX `StockReceipt_SupplierID_idx` ON `StockReceipt`(`SupplierID`);
ALTER TABLE `StockReceipt` DROP FOREIGN KEY `StockReceipt_SupplierID_fkey`;
ALTER TABLE `StockReceipt` ADD CONSTRAINT `StockReceipt_SupplierID_fkey` FOREIGN KEY (`SupplierID`) REFERENCES `Supplier`(`SupplierID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RedefineIndex (MySQL 8 compatible)
CREATE INDEX `StockReceiptDetail_ProductID_idx` ON `StockReceiptDetail`(`ProductID`);
ALTER TABLE `StockReceiptDetail` DROP FOREIGN KEY `StockReceiptDetail_ProductID_fkey`;
ALTER TABLE `StockReceiptDetail` ADD CONSTRAINT `StockReceiptDetail_ProductID_fkey` FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RedefineIndex (MySQL 8 compatible)
CREATE INDEX `StockReceiptDetail_ReceiptID_idx` ON `StockReceiptDetail`(`ReceiptID`);
ALTER TABLE `StockReceiptDetail` DROP FOREIGN KEY `StockReceiptDetail_ReceiptID_fkey`;
ALTER TABLE `StockReceiptDetail` ADD CONSTRAINT `StockReceiptDetail_ReceiptID_fkey` FOREIGN KEY (`ReceiptID`) REFERENCES `StockReceipt`(`ReceiptID`) ON DELETE CASCADE ON UPDATE CASCADE;
