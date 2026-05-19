import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateOrderDto } from './dto';
import { Prisma } from '@prisma/client';
import { PaginatedResult, PaginationParams, paginateResult } from '../../common/pagination';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đơn hàng mới với transaction
   * Quy trình:
   * 1. Validate customer & từng item (stock, price, cost)
   * 2. Cập nhật tồn kho theo DeliveryMethod (Immediate / Reserved)
   * 3. Tạo Order + OrderDetail
   * 4. Ghi InventoryLog với OrderID chính xác
   */
  async createOrder(
    storeId: number,
    userId: number,
    createOrderDto: CreateOrderDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Lock: đọc tồn kho trước, tránh race condition giữa các đơn đồng thời
      // (Serializable isolation đảm bảo không có phantom read)
      // 1. Kiểm tra Customer nếu có
      if (createOrderDto.CustomerID) {
        const customer = await tx.customer.findFirst({
          where: {
            CustomerID: createOrderDto.CustomerID,
            StoreID: storeId,
          },
        });

        if (!customer) {
          throw new NotFoundException(
            `Khách hàng với ID ${createOrderDto.CustomerID} không tồn tại`,
          );
        }
      }

      const deliveryMethod = createOrderDto.DeliveryMethod ?? 'Immediate';

      // 2. Batch load products + units + prices để tránh N+1
      const itemProductIds = createOrderDto.items.map((i) => i.ProductID);
      const productsMap = new Map(
        (await tx.product.findMany({
          where: {
            ProductID: { in: itemProductIds },
            StoreID: storeId,
            IsActive: true,
          },
          include: {
            units: true,
          },
        })).map((p) => [p.ProductID, p]),
      );

      // Xử lý từng item trong đơn hàng
      const orderDetails: Array<{
        ProductID: number;
        UnitName: string;
        Quantity: Prisma.Decimal;
        UnitPrice: Prisma.Decimal;
        CostPrice: Prisma.Decimal;
      }> = [];

      // Lưu thông tin log để ghi sau khi có OrderID
      const pendingLogs: Array<{
        productId: number;
        quantityType: string;
        oldQty: Prisma.Decimal;
        changeQty: Prisma.Decimal;
        newQty: Prisma.Decimal;
      }> = [];

      let totalAmount = new Prisma.Decimal(0);

      for (const item of createOrderDto.items) {
        // 2.1. Lấy thông tin sản phẩm từ batch
        const product = productsMap.get(item.ProductID);

        if (!product) {
          throw new NotFoundException(
            `Sản phẩm với ID ${item.ProductID} không tồn tại hoặc không hoạt động`,
          );
        }

        // 2.2. Tìm ExchangeValue của đơn vị bán
        let exchangeValue = new Prisma.Decimal(1);

        if (item.UnitName !== product.BaseUnit) {
          const unit = product.units.find((u) => u.UnitName === item.UnitName);
          if (!unit) {
            throw new BadRequestException(
              `Đơn vị "${item.UnitName}" không tồn tại cho sản phẩm ${product.ProductName}`,
            );
          }
          exchangeValue = unit.ExchangeValue;
        }

        // 2.3. Tính số lượng cần trừ trong kho (quy về BaseUnit)
        const quantityInBaseUnit = new Prisma.Decimal(item.Quantity).mul(exchangeValue);

        // 2.4. Kiểm tra tồn kho
        const inventory = await tx.inventory.findFirst({
          where: {
            StoreID: storeId,
            ProductID: item.ProductID,
          },
        });

        if (!inventory) {
          throw new BadRequestException(
            `Sản phẩm ${product.ProductName} chưa có trong kho`,
          );
        }

        const availableQty = inventory.Quantity
          .add(inventory.InTransitQty)
          .sub(inventory.ReservedQty);

        if (availableQty.lt(quantityInBaseUnit)) {
          throw new BadRequestException(
            `Sản phẩm ${product.ProductName} không đủ tồn kho. ` +
            `Khả dụng: ${availableQty.toString()} ${product.BaseUnit}, ` +
            `cần: ${quantityInBaseUnit.toString()} ${product.BaseUnit}`,
          );
        }

        // Kiểm tra thêm: nếu xuất Immediate, physical qty phải đủ
        if ((createOrderDto.DeliveryMethod ?? 'Immediate') === 'Immediate') {
          if (inventory.Quantity.lt(quantityInBaseUnit)) {
            throw new BadRequestException(
              `Sản phẩm ${product.ProductName} không đủ tồn kho thực tế để xuất ngay. ` +
              `Tồn thực: ${inventory.Quantity.toString()} ${product.BaseUnit}, ` +
              `cần: ${quantityInBaseUnit.toString()} ${product.BaseUnit}`,
            );
          }
        }

        // 2.5. Xác định giá vốn và đơn giá bán
        const latestReceiptDetail = await tx.stockReceiptDetail.findFirst({
          where: {
            ProductID: item.ProductID,
            receipt: { StoreID: storeId, Status: 'Received' },
          },
          orderBy: { receipt: { ImportDate: 'desc' } },
        });

        let costPrice = new Prisma.Decimal(0);

        if (latestReceiptDetail) {
          let receiptExchangeValue = new Prisma.Decimal(1);
          if (latestReceiptDetail.UnitName !== product.BaseUnit) {
            const receiptUnit = product.units.find(
              (u) => u.UnitName === latestReceiptDetail.UnitName,
            );
            if (receiptUnit) {
              receiptExchangeValue = receiptUnit.ExchangeValue;
            }
          }
          const costPerBase = new Prisma.Decimal(latestReceiptDetail.CostPrice).div(
            receiptExchangeValue,
          );
          costPrice = costPerBase.mul(exchangeValue);
        }

        // Đơn giá: từ client nếu có, ngược lại tính từ MarginRate
        let unitPrice: Prisma.Decimal;
        if (item.UnitPrice != null && item.UnitPrice > 0) {
          unitPrice = new Prisma.Decimal(item.UnitPrice);
        } else {
          unitPrice = costPrice.mul(
            new Prisma.Decimal(1).add(product.MarginRate),
          );
        }

        // 2.7. Tính thành tiền
        const itemTotal = new Prisma.Decimal(item.Quantity).mul(unitPrice);
        totalAmount = totalAmount.add(itemTotal);

        // 2.8. Thêm vào danh sách OrderDetail
        orderDetails.push({
          ProductID: item.ProductID,
          UnitName: item.UnitName,
          Quantity: new Prisma.Decimal(item.Quantity),
          UnitPrice: unitPrice,
          CostPrice: costPrice,
        });

        // 2.9. Cập nhật tồn kho theo DeliveryMethod
        if (deliveryMethod === 'Reserved') {
          // Khách đặt cọc/gửi kho: khóa số lượng, chưa xuất thực tế
          await tx.inventory.update({
            where: { InventoryID: inventory.InventoryID },
            data: { ReservedQty: { increment: quantityInBaseUnit } },
          });
          pendingLogs.push({
            productId: item.ProductID,
            quantityType: 'Reserved',
            oldQty: inventory.ReservedQty,
            changeQty: quantityInBaseUnit,
            newQty: inventory.ReservedQty.add(quantityInBaseUnit),
          });
        } else {
          // Immediate: xuất kho ngay
          await tx.inventory.update({
            where: { InventoryID: inventory.InventoryID },
            data: { Quantity: { decrement: quantityInBaseUnit } },
          });
          pendingLogs.push({
            productId: item.ProductID,
            quantityType: 'Physical',
            oldQty: inventory.Quantity,
            changeQty: quantityInBaseUnit.negated(),
            newQty: inventory.Quantity.sub(quantityInBaseUnit),
          });
        }
      }

      // 3. Tạo Order (sau khi validate xong toàn bộ, để có OrderID cho log)
      // PaidAmount: Immediate → tự động bằng TotalAmount; Reserved → dùng tiền cọc từ client (mặc định 0)
      const paidAmount =
        deliveryMethod === 'Immediate'
          ? totalAmount
          : new Prisma.Decimal(createOrderDto.PaidAmount ?? 0);

      const orderCode = await this.generateOrderCode(tx);
      const order = await tx.order.create({
        data: {
          store: {
            connect: { StoreID: storeId },
          },
          customer: createOrderDto.CustomerID
            ? { connect: { CustomerID: createOrderDto.CustomerID } }
            : undefined,
          user: {
            connect: { UserID: userId },
          },
          OrderCode: orderCode,
          TotalAmount: totalAmount,
          PaidAmount: paidAmount,
          Status: deliveryMethod === 'Reserved' ? 'Pending' : 'Completed',
          DeliveryMethod: deliveryMethod,
          Note: createOrderDto.Note || null,
          details: {
            create: orderDetails,
          },
        },
        include: {
          details: {
            include: {
              product: {
                select: {
                  ProductName: true,
                  SKU: true,
                  BaseUnit: true,
                },
              },
            },
          },
          customer: {
            select: {
              CustomerName: true,
              Phone: true,
            },
          },
          user: {
            select: {
              FullName: true,
              Email: true,
            },
          },
        },
      });

      // 4. Ghi InventoryLog với ReferenceID = OrderID chính xác
      for (const log of pendingLogs) {
        await tx.inventoryLog.create({
          data: {
            StoreID: storeId,
            ProductID: log.productId,
            ChangeType: 'OUT',
            QuantityType: log.quantityType,
            ReferenceType: 'Order',
            ReferenceID: order.OrderID,
            OldQuantity: log.oldQty,
            ChangeQuantity: log.changeQty,
            NewQuantity: log.newQty,
            CreatedBy: userId,
          },
        });
      }

      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Lấy danh sách đơn hàng có phân trang
   */
  async findAll(storeId: number, pagination: PaginationParams, status?: string): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: { StoreID: number; Status?: string } = { StoreID: storeId };
    if (status) where.Status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              CustomerName: true,
              Phone: true,
            },
          },
          user: {
            select: {
              FullName: true,
              Email: true,
            },
          },
          _count: {
            select: {
              details: true,
            },
          },
        },
        orderBy: { OrderDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginateResult(data, total, pagination);
  }

  /**
   * Lấy chi tiết đơn hàng
   */
  async findOne(storeId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        OrderID: id,
        StoreID: storeId,
      },
      include: {
        details: {
          include: {
            product: {
              select: {
                ProductName: true,
                SKU: true,
                BaseUnit: true,
              },
            },
          },
        },
        customer: {
          select: {
            CustomerName: true,
            Phone: true,
            Address: true,
          },
        },
        user: {
          select: {
            FullName: true,
            Email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${id} không tồn tại`);
    }

    return order;
  }

  /**
   * Hoàn tất đơn đặt trước (Reserved → Completed)
   * Quy trình:
   * 1. Kiểm tra đơn hàng Pending + Reserved
   * 2. Với mỗi item: giảm ReservedQty, trừ Quantity (xuất kho thực)
   * 3. Cập nhật Status → Completed
   * 4. Ghi InventoryLog
   */
  async fulfillOrder(storeId: number, userId: number, orderId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OrderID: orderId, StoreID: storeId },
        include: {
          details: {
            include: {
              product: {
                select: { ProductName: true, BaseUnit: true, units: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
      }

      if (order.Status !== 'Pending') {
        throw new BadRequestException(
          `Chỉ có thể hoàn tất đơn hàng ở trạng thái "Chờ xử lý". Trạng thái hiện tại: ${order.Status}`,
        );
      }

      if (order.DeliveryMethod !== 'Reserved') {
        throw new BadRequestException(
          `Chỉ đơn hàng đặt trước (Reserved) mới cần hoàn tất`,
        );
      }

      // Xử lý từng item: giảm Reserved, trừ kho thực
      for (const detail of order.details) {
        // Tính lại quantity in base unit
        let exchangeValue = new Prisma.Decimal(1);
        if (detail.UnitName !== detail.product.BaseUnit) {
          const unit = detail.product.units.find(
            (u) => u.UnitName === detail.UnitName,
          );
          if (unit) exchangeValue = unit.ExchangeValue;
        }
        const quantityInBaseUnit = detail.Quantity.mul(exchangeValue);

        const inventory = await tx.inventory.findFirst({
          where: { StoreID: storeId, ProductID: detail.ProductID },
        });

        if (!inventory) {
          throw new BadRequestException(
            `Sản phẩm ${detail.product.ProductName} không tồn tại trong kho`,
          );
        }

        // Kiểm tra kho thực đủ để xuất
        if (inventory.Quantity.lt(quantityInBaseUnit)) {
          throw new BadRequestException(
            `Sản phẩm ${detail.product.ProductName} không đủ tồn kho thực tế. ` +
            `Tồn thực: ${inventory.Quantity.toString()} ${detail.product.BaseUnit}, ` +
            `cần: ${quantityInBaseUnit.toString()} ${detail.product.BaseUnit}`,
          );
        }

        // Giảm ReservedQty (bỏ khóa) + trừ Quantity (xuất kho thực)
        await tx.inventory.update({
          where: { InventoryID: inventory.InventoryID },
          data: {
            ReservedQty: { decrement: quantityInBaseUnit },
            Quantity: { decrement: quantityInBaseUnit },
          },
        });

        // Ghi log: giảm Reserved
        await tx.inventoryLog.create({
          data: {
            StoreID: storeId,
            ProductID: detail.ProductID,
            ChangeType: 'OUT',
            QuantityType: 'Reserved',
            ReferenceType: 'Order',
            ReferenceID: orderId,
            OldQuantity: inventory.ReservedQty,
            ChangeQuantity: quantityInBaseUnit.negated(),
            NewQuantity: inventory.ReservedQty.sub(quantityInBaseUnit),
            Note: 'Hoàn tất đơn đặt trước - giải phóng Reserved',
            CreatedBy: userId,
          },
        });

        // Ghi log: xuất kho thực
        await tx.inventoryLog.create({
          data: {
            StoreID: storeId,
            ProductID: detail.ProductID,
            ChangeType: 'OUT',
            QuantityType: 'Physical',
            ReferenceType: 'Order',
            ReferenceID: orderId,
            OldQuantity: inventory.Quantity,
            ChangeQuantity: quantityInBaseUnit.negated(),
            NewQuantity: inventory.Quantity.sub(quantityInBaseUnit),
            Note: 'Hoàn tất đơn đặt trước - xuất kho thực',
            CreatedBy: userId,
          },
        });
      }

      // Cập nhật Status → Completed
      const updatedOrder = await tx.order.update({
        where: { OrderID: orderId },
        data: { Status: 'Completed' },
        include: {
          details: {
            include: {
              product: {
                select: { ProductName: true, SKU: true, BaseUnit: true },
              },
            },
          },
          customer: { select: { CustomerName: true, Phone: true } },
          user: { select: { FullName: true, Email: true } },
        },
      });

      return updatedOrder;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Hủy đơn hàng (Pending → Cancelled)
   * Quy trình:
   * 1. Kiểm tra đơn hàng Pending
   * 2. Hoàn trả tồn kho:
   *    - Reserved: giảm ReservedQty
   *    - Immediate (nếu có): tăng Quantity
   * 3. Cập nhật Status → Cancelled
   * 4. Ghi InventoryLog
   */
  async cancelOrder(storeId: number, userId: number, orderId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OrderID: orderId, StoreID: storeId },
        include: {
          details: {
            include: {
              product: {
                select: { ProductName: true, BaseUnit: true, units: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
      }

      if (order.Status !== 'Pending') {
        throw new BadRequestException(
          `Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý". Trạng thái hiện tại: ${order.Status}`,
        );
      }

      // Hoàn trả tồn kho cho từng item
      for (const detail of order.details) {
        let exchangeValue = new Prisma.Decimal(1);
        if (detail.UnitName !== detail.product.BaseUnit) {
          const unit = detail.product.units.find(
            (u) => u.UnitName === detail.UnitName,
          );
          if (unit) exchangeValue = unit.ExchangeValue;
        }
        const quantityInBaseUnit = detail.Quantity.mul(exchangeValue);

        const inventory = await tx.inventory.findFirst({
          where: { StoreID: storeId, ProductID: detail.ProductID },
        });

        if (!inventory) continue;

        if (order.DeliveryMethod === 'Reserved') {
          // Hoàn ReservedQty
          await tx.inventory.update({
            where: { InventoryID: inventory.InventoryID },
            data: { ReservedQty: { decrement: quantityInBaseUnit } },
          });

          await tx.inventoryLog.create({
            data: {
              StoreID: storeId,
              ProductID: detail.ProductID,
              ChangeType: 'RETURN',
              QuantityType: 'Reserved',
              ReferenceType: 'Order',
              ReferenceID: orderId,
              OldQuantity: inventory.ReservedQty,
              ChangeQuantity: quantityInBaseUnit.negated(),
              NewQuantity: inventory.ReservedQty.sub(quantityInBaseUnit),
              Note: 'Hủy đơn đặt trước - hoàn trả Reserved',
              CreatedBy: userId,
            },
          });
        }
      }

      // Ghi nhận số tiền cọc cần hoàn trả
      const refundAmount = order.PaidAmount;

      // Cập nhật Status → Cancelled, reset PaidAmount về 0
      const updatedOrder = await tx.order.update({
        where: { OrderID: orderId },
        data: {
          Status: 'Cancelled',
          PaidAmount: 0,
        },
        include: {
          details: {
            include: {
              product: {
                select: { ProductName: true, SKU: true, BaseUnit: true },
              },
            },
          },
          customer: { select: { CustomerName: true, Phone: true } },
          user: { select: { FullName: true, Email: true } },
        },
      });

      return {
        ...updatedOrder,
        refundAmount,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Tạo mã đơn hàng tự động: HD-YYYYMMDD-NNN
   * Nhận tham số tx để hoạt động trong transaction
   */
  private async generateOrderCode(tx: Pick<PrismaService, 'order'>): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `HD-${dateStr}-`;
    const last = await tx.order.findFirst({
      where: { OrderCode: { startsWith: prefix } },
      orderBy: { OrderCode: 'desc' },
    });
    const nextNum = last ? parseInt(last.OrderCode!.slice(-3)) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }
}

