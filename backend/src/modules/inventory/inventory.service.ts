import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { CreateStockReceiptDto } from './dto';
import { DirectShipDto } from './dto/direct-ship.dto';
import { PaginatedResult, PaginationParams, paginateResult } from '../../common/pagination';

// Type definitions for transaction processing
interface ValidatedItem {
  product: {
    ProductID: number;
    StoreID: number;
    CategoryID: number;
    ProductName: string;
    SKU: string | null;
    BaseUnit: string;
    Description: string | null;
    IsActive: boolean;
    CreatedAt: Date;
    UpdatedAt: Date;
  };
  item: {
    productId: number;
    unitName: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;
  };
  exchangeValue: number;
  quantityInBaseUnit: number;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * API Nhập kho với Transaction
   * Logic:
   * 1. Tạo StockReceipt và StockReceiptDetail
   * 2. Với mỗi item, tìm ExchangeValue từ ProductUnit
   * 3. Quy đổi số lượng về BaseUnit
   * 4. Cập nhật Inventory (increment)
   * 5. Nếu bất kỳ bước nào lỗi, rollback toàn bộ
   */
  async createStockReceipt(storeId: number, dto: CreateStockReceiptDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Supplier có tồn tại và thuộc store này không
      const supplier = await tx.supplier.findFirst({
        where: {
          SupplierID: dto.supplierId,
          StoreID: storeId,
        },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found in this store');
      }

      // 2. Batch load products + units để tránh N+1
      const productIds = dto.items.map((i) => i.productId);
      const [products, productUnits] = await Promise.all([
        tx.product.findMany({
          where: { ProductID: { in: productIds }, StoreID: storeId },
        }),
        tx.productUnit.findMany({
          where: { ProductID: { in: productIds } },
        }),
      ]);

      const productMap = new Map(products.map((p) => [p.ProductID, p]));
      const unitMap = new Map(
        productUnits.map((u) => [`${u.ProductID}_${u.UnitName}`, u]),
      );

      // 3. Validate tất cả items
      let totalAmount = 0;
      const validatedItems: ValidatedItem[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Product ID ${item.productId} not found in this store`,
          );
        }

        let exchangeValue = 1;

        if (item.unitName !== product.BaseUnit) {
          const productUnit = unitMap.get(`${item.productId}_${item.unitName}`);
          if (!productUnit) {
            throw new BadRequestException(
              `Unit "${item.unitName}" not found for product "${product.ProductName}". Available units: ${product.BaseUnit}`,
            );
          }
          exchangeValue = Number(productUnit.ExchangeValue);
        }

        const quantityInBaseUnit = item.quantity * exchangeValue;
        const discountedUnitPrice = item.unitPrice * (1 - (item.discountRate ?? 0));
        const itemTotal = item.quantity * discountedUnitPrice;
        totalAmount += itemTotal;

        validatedItems.push({
          product,
          item,
          exchangeValue,
          quantityInBaseUnit,
        });
      }

      // 3. Tạo StockReceipt
      const receiptCode = await this.generateReceiptCode(tx);
      const receipt = await tx.stockReceipt.create({
        data: {
          StoreID: storeId,
          SupplierID: dto.supplierId,
          ReceiptCode: receiptCode,
          TotalAmount: totalAmount,
          Status: dto.status ?? 'Pending',
          Note: dto.note,
        },
      });

      // 4. Tạo StockReceiptDetail và cập nhật Inventory
      const details: any[] = [];

      for (const validated of validatedItems) {
        // Tạo chi tiết phiếu nhập
        const costPrice = validated.item.unitPrice * (1 - (validated.item.discountRate ?? 0));
        const detail = await tx.stockReceiptDetail.create({
          data: {
            ReceiptID: receipt.ReceiptID,
            ProductID: validated.item.productId,
            UnitName: validated.item.unitName,
            Quantity: validated.item.quantity,
            UnitPrice: validated.item.unitPrice,
            DiscountRate: validated.item.discountRate ?? 0,
            CostPrice: costPrice,
            ExchangeValue: validated.exchangeValue,
          },
          include: {
            product: {
              select: {
                ProductID: true,
                ProductName: true,
                SKU: true,
                BaseUnit: true,
              },
            },
          },
        });

        // Đảm bảo Inventory tồn tại
        const inventory = await tx.inventory.findUnique({
          where: {
            StoreID_ProductID: {
              StoreID: storeId,
              ProductID: validated.item.productId,
            },
          },
        });

        // Phân nhánh theo status
        const isPending = (dto.status ?? 'Pending') === 'Pending';
        const oldPhysical = inventory ? Number(inventory.Quantity) : 0;
        const oldInTransit = inventory ? Number(inventory.InTransitQty) : 0;

        if (!inventory) {
          // Tạo mới nếu chưa có
          await tx.inventory.create({
            data: {
              StoreID: storeId,
              ProductID: validated.item.productId,
              Quantity: isPending ? 0 : validated.quantityInBaseUnit,
              InTransitQty: isPending ? validated.quantityInBaseUnit : 0,
            },
          });
        } else {
          // Cập nhật số lượng (increment)
          await tx.inventory.update({
            where: {
              StoreID_ProductID: {
                StoreID: storeId,
                ProductID: validated.item.productId,
              },
            },
            data: isPending
              ? { InTransitQty: { increment: validated.quantityInBaseUnit } }
              : { Quantity:     { increment: validated.quantityInBaseUnit } },
          });
        }

        // Ghi InventoryLog
        const logOldQty = isPending ? oldInTransit : oldPhysical;
        await tx.inventoryLog.create({
          data: {
            StoreID: storeId,
            ProductID: validated.item.productId,
            ChangeType: 'IN',
            QuantityType: isPending ? 'InTransit' : 'Physical',
            ReferenceType: 'StockReceipt',
            ReferenceID: receipt.ReceiptID,
            OldQuantity: logOldQty,
            ChangeQuantity: validated.quantityInBaseUnit,
            NewQuantity: logOldQty + validated.quantityInBaseUnit,
          },
        });

        details.push({
          ...detail,
          quantityInBaseUnit: validated.quantityInBaseUnit,
          exchangeValue: validated.exchangeValue,
        });
      }

      // 5. Trả về kết quả
      return {
        receipt: {
          ReceiptID: receipt.ReceiptID,
          ReceiptCode: receipt.ReceiptCode,
          SupplierID: receipt.SupplierID,
          ImportDate: receipt.ImportDate,
          TotalAmount: receipt.TotalAmount,
          Status: receipt.Status,
          Note: receipt.Note,
          supplier: {
            SupplierID: supplier.SupplierID,
            SupplierName: supplier.SupplierName,
          },
        },
        details,
        message: `Stock receipt created successfully. ${details.length} product(s) added to inventory.`,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Lấy danh sách tồn kho với filtering có phân trang
   */
  async getInventory(
    storeId: number,
    search?: string,
    lowStockThreshold?: number,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination ?? { page: 1, limit: 20 };
    const skip = (page - 1) * limit;

    const where = {
      StoreID: storeId,
      ...(search && {
        product: {
          OR: [
            { ProductName: { contains: search } },
            { SKU: { contains: search } },
          ],
        },
      }),
    };

    const [inventories, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              ProductID: true,
              ProductName: true,
              SKU: true,
              BaseUnit: true,
              IsActive: true,
              category: {
                select: {
                  CategoryID: true,
                  CategoryName: true,
                },
              },
            },
          },
        },
        orderBy: {
          LastUpdated: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    const data = inventories.map((inv) => {
      const physical   = Number(inv.Quantity);
      const reserved   = Number(inv.ReservedQty);
      const inTransit  = Number(inv.InTransitQty);
      const available  = physical + inTransit - reserved;

      return {
        InventoryID: inv.InventoryID,
        ProductID: inv.ProductID,
        ProductName: inv.product.ProductName,
        SKU: inv.product.SKU,
        BaseUnit: inv.product.BaseUnit,
        Quantity: physical,
        ReservedQty: reserved,
        InTransitQty: inTransit,
        AvailableQty: available,
        LastUpdated: inv.LastUpdated,
        IsActive: inv.product.IsActive,
        Category: inv.product.category,
        IsLowStock: lowStockThreshold ? available <= lowStockThreshold : false,
      };
    });

    return paginateResult(data, total, { page, limit });
  }

  /**
   * Lấy lịch sử nhập hàng của một sản phẩm
   */
  async getProductStockHistory(storeId: number, productId: number) {
    // Kiểm tra product có thuộc store này không
    const product = await this.prisma.product.findFirst({
      where: {
        ProductID: productId,
        StoreID: storeId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this store');
    }

    const history = await this.prisma.stockReceiptDetail.findMany({
      where: {
        ProductID: productId,
        receipt: {
          StoreID: storeId,
        },
      },
      include: {
        receipt: {
          select: {
            ReceiptID: true,
            ReceiptCode: true,
            ImportDate: true,
            TotalAmount: true,
            Note: true,
            supplier: {
              select: {
                SupplierID: true,
                SupplierName: true,
              },
            },
          },
        },
      },
      orderBy: {
        receipt: {
          ImportDate: 'desc',
        },
      },
    });

    return {
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        SKU: product.SKU,
        BaseUnit: product.BaseUnit,
      },
      history: history.map((item) => ({
        DetailID: item.DetailID,
        ReceiptID: item.ReceiptID,
        ReceiptCode: item.receipt.ReceiptCode,
        ImportDate: item.receipt.ImportDate,
        Supplier: item.receipt.supplier,
        UnitName: item.UnitName,
        Quantity: item.Quantity,
        UnitPrice: item.UnitPrice,
        DiscountRate: item.DiscountRate,
        CostPrice: item.CostPrice,
        TotalPrice: Number(item.Quantity) * Number(item.CostPrice),
        Note: item.receipt.Note,
      })),
    };
  }

  /**
   * Lấy danh sách phiếu nhập kho có phân trang
   */
  async getStockReceipts(storeId: number, supplierId?: number, pagination?: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination ?? { page: 1, limit: 20 };
    const skip = (page - 1) * limit;

    const where = {
      StoreID: storeId,
      ...(supplierId && { SupplierID: supplierId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockReceipt.findMany({
        where,
        include: {
          supplier: {
            select: {
              SupplierID: true,
              SupplierName: true,
            },
          },
          _count: {
            select: {
              details: true,
            },
          },
        },
        orderBy: {
          ImportDate: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.stockReceipt.count({ where }),
    ]);

    return paginateResult(data, total, { page, limit });
  }

  /**
   * Lấy chi tiết phiếu nhập kho
   */
  async getStockReceiptDetail(storeId: number, receiptId: number) {
    const receipt = await this.prisma.stockReceipt.findFirst({
      where: {
        ReceiptID: receiptId,
        StoreID: storeId,
      },
      include: {
        supplier: true,
        details: {
          include: {
            product: {
              select: {
                ProductID: true,
                ProductName: true,
                SKU: true,
                BaseUnit: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Stock receipt not found in this store');
    }

    return receipt;
  }

  /**
   * Thực hiện giao dịch trực tiếp (Direct Ship)
   */
  async directShipTransaction(storeId: number, userId: number, dto: DirectShipDto) {
    return await this.prisma.$transaction(async (tx) => {
      if (dto.totalQty <= 0 || dto.deliverQty < 0) {
        throw new BadRequestException('Số lượng không hợp lệ');
      }

      if (dto.deliverQty > dto.totalQty) {
        throw new BadRequestException('deliverQty không được lớn hơn totalQty');
      }

      // 1. Tìm ExchangeValue
      const product = await tx.product.findFirst({
        where: { ProductID: dto.productId, StoreID: storeId },
      });
      if (!product) throw new NotFoundException('Product not found');

      let exchangeValue = 1;
      if (dto.unitName !== product.BaseUnit) {
        const productUnit = await tx.productUnit.findFirst({
          where: { ProductID: dto.productId, UnitName: dto.unitName },
        });
        if (!productUnit) throw new BadRequestException('Unit not found');
        exchangeValue = Number(productUnit.ExchangeValue);
      }

      const totalInBase   = dto.totalQty   * exchangeValue;
      const deliverInBase = dto.deliverQty * exchangeValue;
      const stockInBase   = totalInBase - deliverInBase; // phần thực vào kho

      // 2. Tạo StockReceipt (toàn bộ hàng, status Received)
      const receiptCode = await this.generateReceiptCode(tx);
      const receipt = await tx.stockReceipt.create({
        data: {
          StoreID: storeId,
          SupplierID: dto.supplierId,
          Status: 'Received',
          ReceiptCode: receiptCode,
          TotalAmount: dto.totalQty * dto.importUnitPrice * (1 - Number(dto.importDiscountRate ?? 0)),
          PaidAmount: 0,
          Note: dto.note,
          details: {
            create: {
              ProductID: dto.productId,
              UnitName: dto.unitName,
              Quantity: dto.totalQty,
              UnitPrice: dto.importUnitPrice,
              DiscountRate: Number(dto.importDiscountRate ?? 0),
              CostPrice: dto.importUnitPrice * (1 - Number(dto.importDiscountRate ?? 0)),
              ExchangeValue: exchangeValue,
            },
          },
        },
      });

      // 3. Tạo Order (phần giao thẳng)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderCodePrefix = `HD-${dateStr}-`;
      const lastOrder = await tx.order.findFirst({
        where: { OrderCode: { startsWith: orderCodePrefix } },
        orderBy: { OrderCode: 'desc' },
      });
      const nextNum = lastOrder ? parseInt(lastOrder.OrderCode!.slice(-3)) + 1 : 1;
      const orderCode = `${orderCodePrefix}${String(nextNum).padStart(3, '0')}`;

      const order = await tx.order.create({
        data: {
          StoreID: storeId,
          UserID: userId,
          CustomerID: dto.customerId ?? null,
          OrderCode: orderCode,
          DeliveryMethod: 'DirectShip',
          LinkedReceiptID: receipt.ReceiptID,
          TotalAmount: dto.deliverQty * dto.saleUnitPrice,
          PaidAmount: 0,
          Status: 'Completed',
          Note: dto.note,
          details: {
            create: {
              ProductID: dto.productId,
              UnitName: dto.unitName,
              Quantity: dto.deliverQty,
              UnitPrice: dto.saleUnitPrice,
              CostPrice: dto.importUnitPrice * (1 - (dto.importDiscountRate ?? 0)),
              ExchangeValue: exchangeValue,
            },
          },
        },
      });

      // 4. Chỉ cộng phần dư vào kho (stockInBase, không phải totalInBase)
      const inventory = await tx.inventory.findUnique({
        where: { StoreID_ProductID: { StoreID: storeId, ProductID: dto.productId } },
      });

      const updated = await tx.inventory.upsert({
        where: { StoreID_ProductID: { StoreID: storeId, ProductID: dto.productId } },
        create: { StoreID: storeId, ProductID: dto.productId, Quantity: stockInBase },
        update: { Quantity: { increment: stockInBase } },
      });

      // 5. Ghi InventoryLog
      await tx.inventoryLog.create({
        data: {
          StoreID: storeId,
          ProductID: dto.productId,
          QuantityType: 'Physical',
          ChangeType: 'IN',
          ReferenceType: 'DirectShip',
          ReferenceID: receipt.ReceiptID,
          OldQuantity: inventory?.Quantity ?? 0,
          ChangeQuantity: stockInBase,
          NewQuantity: updated.Quantity,
          Note: `Giao thẳng ${dto.deliverQty} ${dto.unitName} cho khách, nhập kho ${dto.totalQty - dto.deliverQty} ${dto.unitName}`,
          CreatedBy: userId,
        },
      });

      return { receipt, order, stockAdded: stockInBase };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Xác nhận nhập kho: chuyển StockReceipt từ Pending → Received
   * Logic:
   * 1. Kiểm tra phiếu thuộc store, đang Pending
   * 2. Với từng item: giảm InTransitQty, tăng Quantity (trong một update)
   * 3. Ghi InventoryLog x2 cho mỗi item (InTransit ↓ và Physical ↑)
   * 4. Cập nhật Status = Received
   */
  async fulfillReceipt(storeId: number, receiptId: number, userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Tìm phiếu nhập, kiểm tra thuộc store và đang Pending
      const receipt = await tx.stockReceipt.findFirst({
        where: { ReceiptID: receiptId, StoreID: storeId },
        include: { details: true, supplier: true },
      });

      if (!receipt) {
        throw new NotFoundException('Phiếu nhập không tồn tại trong cửa hàng này');
      }

      if (receipt.Status !== 'Pending') {
        throw new BadRequestException(
          `Phiếu nhập đang ở trạng thái "${receipt.Status}", chỉ có thể xác nhận phiếu Pending`,
        );
      }

      // 2. Xử lý từng item: chuyển InTransit → Physical
      // Dùng hệ số quy đổi đã chốt tại thời điểm tạo phiếu (snapshot) để khớp
      // đúng lượng InTransit đã cộng lúc tạo phiếu, tránh sai lệch nếu đơn vị bị sửa.
      for (const detail of receipt.details) {
        const exchangeValue = Number(detail.ExchangeValue);
        const quantityInBase = Number(detail.Quantity) * exchangeValue;

        const inventory = await tx.inventory.findUnique({
          where: { StoreID_ProductID: { StoreID: storeId, ProductID: detail.ProductID } },
        });

        // Nếu chưa có inventory record, tạo mới rồi chuyển
        if (!inventory) {
          await tx.inventory.create({
            data: {
              StoreID: storeId,
              ProductID: detail.ProductID,
              Quantity: quantityInBase,
              InTransitQty: 0,
            },
          });

          await tx.inventoryLog.create({
            data: {
              StoreID: storeId,
              ProductID: detail.ProductID,
              ChangeType: 'IN',
              QuantityType: 'Physical',
              ReferenceType: 'StockReceipt',
              ReferenceID: receiptId,
              OldQuantity: 0,
              ChangeQuantity: quantityInBase,
              NewQuantity: quantityInBase,
              CreatedBy: userId,
            },
          });
          continue;
        }

        const oldInTransit = Number(inventory.InTransitQty);
        const oldPhysical = Number(inventory.Quantity);

        if (oldInTransit < quantityInBase) {
          throw new BadRequestException(
            `Sản phẩm ${detail.ProductID}: InTransitQty (${oldInTransit}) không đủ để xác nhận nhập ${quantityInBase}`,
          );
        }

        await tx.inventory.update({
          where: { StoreID_ProductID: { StoreID: storeId, ProductID: detail.ProductID } },
          data: {
            InTransitQty: { decrement: quantityInBase },
            Quantity: { increment: quantityInBase },
          },
        });

        // Ghi log x2: giảm InTransit và tăng Physical
        await tx.inventoryLog.createMany({
          data: [
            {
              StoreID: storeId,
              ProductID: detail.ProductID,
              ChangeType: 'IN',
              QuantityType: 'InTransit',
              ReferenceType: 'StockReceipt',
              ReferenceID: receiptId,
              OldQuantity: oldInTransit,
              ChangeQuantity: -quantityInBase,
              NewQuantity: oldInTransit - quantityInBase,
              CreatedBy: userId,
            },
            {
              StoreID: storeId,
              ProductID: detail.ProductID,
              ChangeType: 'IN',
              QuantityType: 'Physical',
              ReferenceType: 'StockReceipt',
              ReferenceID: receiptId,
              OldQuantity: oldPhysical,
              ChangeQuantity: quantityInBase,
              NewQuantity: oldPhysical + quantityInBase,
              CreatedBy: userId,
            },
          ],
        });
      }

      // 3. Cập nhật trạng thái phiếu nhập
      return await tx.stockReceipt.update({
        where: { ReceiptID: receiptId },
        data: { Status: 'Received' },
        include: {
          supplier: { select: { SupplierID: true, SupplierName: true } },
          details: true,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Sổ cái biến động kho (InventoryLog) — truy vết mọi thay đổi tồn kho.
   */
  async getInventoryLogs(
    storeId: number,
    options: {
      productId?: number;
      changeType?: string;
      pagination: PaginationParams;
    },
  ) {
    const { productId, changeType, pagination } = options;
    const where: Prisma.InventoryLogWhereInput = { StoreID: storeId };
    if (productId) where.ProductID = productId;
    if (changeType) where.ChangeType = changeType;

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          product: {
            select: {
              ProductID: true,
              ProductName: true,
              SKU: true,
              BaseUnit: true,
            },
          },
        },
        orderBy: { CreatedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    const orderIds = [
      ...new Set(
        logs
          .filter((l) => l.ReferenceType === 'Order' && l.ReferenceID != null)
          .map((l) => l.ReferenceID as number),
      ),
    ];
    // DirectShip cũng trỏ ReferenceID = StockReceipt.ReceiptID
    const receiptIds = [
      ...new Set(
        logs
          .filter(
            (l) =>
              (l.ReferenceType === 'StockReceipt' || l.ReferenceType === 'DirectShip') &&
              l.ReferenceID != null,
          )
          .map((l) => l.ReferenceID as number),
      ),
    ];

    const [orders, receipts, linkedOrders] = await Promise.all([
      orderIds.length
        ? this.prisma.order.findMany({
            where: { OrderID: { in: orderIds }, StoreID: storeId },
            select: { OrderID: true, OrderCode: true },
          })
        : [],
      receiptIds.length
        ? this.prisma.stockReceipt.findMany({
            where: { ReceiptID: { in: receiptIds }, StoreID: storeId },
            select: { ReceiptID: true, ReceiptCode: true },
          })
        : [],
      // Đơn giao thẳng gắn với phiếu nhập (LinkedReceiptID)
      receiptIds.length
        ? this.prisma.order.findMany({
            where: {
              StoreID: storeId,
              DeliveryMethod: 'DirectShip',
              LinkedReceiptID: { in: receiptIds },
            },
            select: { LinkedReceiptID: true, OrderCode: true },
          })
        : [],
    ]);

    const orderCodeMap = new Map<number, string | null>(
      orders.map((o) => [o.OrderID, o.OrderCode] as [number, string | null]),
    );
    const receiptCodeMap = new Map<number, string | null>(
      receipts.map((r) => [r.ReceiptID, r.ReceiptCode] as [number, string | null]),
    );
    const directShipOrderCodeMap = new Map<number, string | null>();
    for (const o of linkedOrders) {
      if (o.LinkedReceiptID != null) {
        directShipOrderCodeMap.set(o.LinkedReceiptID, o.OrderCode);
      }
    }

    const data = logs.map((log) => ({
      LogID: log.LogID,
      ProductID: log.ProductID,
      ChangeType: log.ChangeType,
      QuantityType: log.QuantityType,
      ReferenceType: log.ReferenceType,
      ReferenceID: log.ReferenceID,
      ReferenceCode:
        log.ReferenceType === 'Order' && log.ReferenceID != null
          ? (orderCodeMap.get(log.ReferenceID) ?? null)
          : log.ReferenceType === 'StockReceipt' && log.ReferenceID != null
            ? (receiptCodeMap.get(log.ReferenceID) ?? null)
            : log.ReferenceType === 'DirectShip' && log.ReferenceID != null
              ? (() => {
                  const pn = receiptCodeMap.get(log.ReferenceID) ?? `#${log.ReferenceID}`;
                  const hd = directShipOrderCodeMap.get(log.ReferenceID);
                  return hd ? `${pn} · ${hd}` : pn;
                })()
              : null,
      OldQuantity: log.OldQuantity,
      ChangeQuantity: log.ChangeQuantity,
      NewQuantity: log.NewQuantity,
      Note: log.Note,
      CreatedAt: log.CreatedAt,
      product: log.product,
    }));

    return paginateResult(data, total, pagination);
  }

  /**
   * Tạo mã phiếu nhập kho tự động: PN-YYYYMMDD-NNN
   * Nhận tham số tx để hoạt động trong transaction hoặc dùng this.prisma bình thường
   */
  private async generateReceiptCode(tx: Pick<PrismaService, 'stockReceipt'>): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PN-${dateStr}-`;
    const last = await tx.stockReceipt.findFirst({
      where: { ReceiptCode: { startsWith: prefix } },
      orderBy: { ReceiptCode: 'desc' },
    });
    const nextNum = last ? parseInt(last.ReceiptCode!.slice(-3)) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }
}
