-- AlterTable
ALTER TABLE `StockReceiptDetail` ADD COLUMN `ExchangeValue` DECIMAL(18, 3) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `OrderDetail` ADD COLUMN `ExchangeValue` DECIMAL(18, 3) NOT NULL DEFAULT 1;
