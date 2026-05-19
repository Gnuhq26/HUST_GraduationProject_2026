import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import { CurrentStore } from '../../common/decorators';
import { CheckPermission } from '../../common/decorators';
import { parsePagination } from '../../common/pagination';

@ApiTags('Đơn hàng')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @CheckPermission('create', 'Order')
  @ApiOperation({
    summary: 'Tạo đơn hàng mới (Bán hàng)',
    description:
      'Tự động kiểm tra tồn kho, tính giá từ biên lợi nhuận, tạo đơn và trừ kho',
  })
  @ApiResponse({
    status: 201,
    description: 'Đơn hàng đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không đủ hàng trong kho hoặc chưa có giá bán',
  })
  @ApiResponse({ status: 404, description: 'Sản phẩm hoặc khách hàng không tồn tại' })
  create(
    @CurrentStore() storeId: number,
    @Req() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const userId = req.user.UserID;
    return this.ordersService.createOrder(storeId, userId, createOrderDto);
  }

  @Get()
  @CheckPermission('read', 'Order')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đơn hàng của cửa hàng',
  })
  findAll(
    @CurrentStore() storeId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(storeId, parsePagination(page, limit, 1000), status);
  }

  @Get(':id')
  @CheckPermission('read', 'Order')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết đơn hàng',
  })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(storeId, id);
  }

  @Patch(':id/fulfill')
  @CheckPermission('update', 'Order')
  @ApiOperation({
    summary: 'Hoàn tất đơn đặt trước',
    description:
      'Chuyển đơn Reserved từ Pending → Completed. Giảm ReservedQty, trừ Quantity (xuất kho thực), ghi InventoryLog.',
  })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', type: Number })
  @ApiResponse({ status: 200, description: 'Đơn hàng đã hoàn tất' })
  @ApiResponse({ status: 400, description: 'Đơn hàng không ở trạng thái Pending hoặc không đủ kho' })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  fulfill(
    @CurrentStore() storeId: number,
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.fulfillOrder(storeId, req.user.UserID, id);
  }

  @Patch(':id/cancel')
  @CheckPermission('update', 'Order')
  @ApiOperation({
    summary: 'Hủy đơn hàng',
    description:
      'Chuyển đơn Pending → Cancelled. Hoàn trả ReservedQty, ghi InventoryLog.',
  })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', type: Number })
  @ApiResponse({ status: 200, description: 'Đơn hàng đã bị hủy' })
  @ApiResponse({ status: 400, description: 'Đơn hàng không ở trạng thái Pending' })
  @ApiResponse({ status: 404, description: 'Đơn hàng không tồn tại' })
  cancel(
    @CurrentStore() storeId: number,
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.cancelOrder(storeId, req.user.UserID, id);
  }
}
