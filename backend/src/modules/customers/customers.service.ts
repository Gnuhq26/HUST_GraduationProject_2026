import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { PaginatedResult, PaginationParams, paginateResult } from '../../common/pagination';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo khách hàng mới
   */
  async create(storeId: number, createCustomerDto: CreateCustomerDto) {
    return this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({
        where: { StoreID: storeId },
      });

      if (!store) {
        throw new NotFoundException(`Cửa hàng với ID ${storeId} không tồn tại`);
      }

      const customerCode = await this.generateCustomerCode(tx);

      return tx.customer.create({
        data: {
          StoreID: storeId,
          CustomerCode: customerCode,
          ...createCustomerDto,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Tạo mã khách hàng tự động: KH-YYYYMMDD-NNN
   */
  private async generateCustomerCode(tx: Pick<PrismaService, 'customer'>): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `KH-${dateStr}-`;
    const last = await tx.customer.findFirst({
      where: { CustomerCode: { startsWith: prefix } },
      orderBy: { CustomerCode: 'desc' },
    });
    const nextNum = last ? parseInt(last.CustomerCode!.slice(-3)) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Lấy danh sách khách hàng của cửa hàng có phân trang
   */
  async findAll(storeId: number, pagination: PaginationParams): Promise<PaginatedResult<any>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = { StoreID: storeId };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { CreatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginateResult(data, total, pagination);
  }

  /**
   * Lấy thông tin chi tiết khách hàng
   */
  async findOne(storeId: number, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        CustomerID: id,
        StoreID: storeId,
      },
      include: {
        orders: {
          orderBy: { OrderDate: 'desc' },
          take: 10, // Chỉ lấy 10 đơn hàng gần nhất
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID ${id} không tồn tại`);
    }

    return customer;
  }

  /**
   * Cập nhật thông tin khách hàng
   */
  async update(
    storeId: number,
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    // Kiểm tra khách hàng có tồn tại và thuộc về cửa hàng không
    const customer = await this.prisma.customer.findFirst({
      where: {
        CustomerID: id,
        StoreID: storeId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID ${id} không tồn tại`);
    }

    // Cập nhật thông tin
    return this.prisma.customer.update({
      where: { CustomerID: id },
      data: updateCustomerDto,
    });
  }

  /**
   * Xóa khách hàng
   */
  async remove(storeId: number, id: number) {
    // Kiểm tra khách hàng có tồn tại và thuộc về cửa hàng không
    const customer = await this.prisma.customer.findFirst({
      where: {
        CustomerID: id,
        StoreID: storeId,
      },
      include: {
        orders: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Khách hàng với ID ${id} không tồn tại`);
    }

    // Kiểm tra xem khách hàng có đơn hàng không
    if (customer.orders && customer.orders.length > 0) {
      throw new BadRequestException(
        `Không thể xóa khách hàng đã có ${customer.orders.length} đơn hàng`,
      );
    }

    // Xóa khách hàng
    await this.prisma.customer.delete({
      where: { CustomerID: id },
    });

    return { message: 'Xóa khách hàng thành công' };
  }
}
