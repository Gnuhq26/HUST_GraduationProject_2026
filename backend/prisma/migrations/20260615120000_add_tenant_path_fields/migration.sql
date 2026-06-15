-- Path-based multi-tenant: permanent DisplayId + optional premium SlugName
-- AlterTable
ALTER TABLE `Store` ADD COLUMN `DisplayId` VARCHAR(20) NULL,
    ADD COLUMN `SlugName` VARCHAR(100) NULL,
    ADD COLUMN `SlugNameExpiredAt` TIMESTAMP(0) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Store_DisplayId_key` ON `Store`(`DisplayId`);
CREATE UNIQUE INDEX `Store_SlugName_key` ON `Store`(`SlugName`);
