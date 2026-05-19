import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, AddProductUnitDto, UpdateProductUnitDto } from './dto';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';
import { CurrentStore } from '../../common/decorators/current-store.decorator';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @CheckPermission('create', 'Product')
  @ApiOperation({ summary: 'Tạo sản phẩm mới (cần quyền create:Product)' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async create(
    @CurrentStore() storeId: number,
    @Body() createProductDto: CreateProductDto,
  ) {
    return await this.productsService.create(storeId, createProductDto);
  }

  @Get()
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm với filtering (cần quyền read:Product)' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  async findAll(
    @CurrentStore() storeId: number,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('search') search?: string,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
  ) {
    return await this.productsService.findAll(storeId, isActive, search, categoryId);
  }

  @Get(':id')
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm (cần quyền read:Product)' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async findOne(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.findOne(storeId, id);
  }

  @Patch(':id')
  @CheckPermission('update', 'Product')
  @ApiOperation({ summary: 'Cập nhật sản phẩm (cần quyền update:Product)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async update(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(storeId, id, updateProductDto);
  }

  @Delete(':id')
  @CheckPermission('delete', 'Product')
  @ApiOperation({ summary: 'Xóa sản phẩm - Soft delete (cần quyền delete:Product)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa (soft delete)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async remove(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.remove(storeId, id);
  }

  @Delete(':id/hard')
  @CheckPermission('delete', 'Product')
  @ApiOperation({ summary: 'Xóa vĩnh viễn sản phẩm (cần quyền delete:Product)' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa vĩnh viễn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async hardDelete(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.hardDelete(storeId, id);
  }

  @Post(':id/calculate')
  @CheckPermission('read', 'Product')
  @ApiOperation({
    summary: 'Tính toán số lượng theo đơn vị gốc',
    description:
      'Ví dụ: 10 Pallet x 500 Viên/Pallet = 5000 Viên',
  })
  @ApiResponse({
    status: 200,
    description: 'Số lượng theo đơn vị gốc',
    schema: {
      example: {
        productId: 1,
        unit: 'Pallet',
        quantity: 10,
        baseUnit: 'Viên',
        baseQuantity: 5000,
      },
    },
  })
  async calculateBaseUnit(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { unitName: string; quantity: number },
  ) {
    // Kiểm tra product thuộc store trước khi tính
    await this.productsService.findOne(storeId, id);
    const baseQuantity = await this.productsService.calculateBaseUnitQuantity(
      id,
      body.unitName,
      body.quantity,
    );

    return {
      productId: id,
      unit: body.unitName,
      quantity: body.quantity,
      baseQuantity,
    };
  }

  // ========== PRODUCT UNIT MANAGEMENT ==========

  @Post(':id/units')
  @CheckPermission('create', 'Product')
  @ApiOperation({ summary: 'Thêm đơn vị quy đổi mới cho sản phẩm (cần quyền create:Product)' })
  @ApiResponse({ status: 201, description: 'Đơn vị đã được thêm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  @ApiResponse({ status: 409, description: 'Đơn vị đã tồn tại' })
  async addUnit(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: AddProductUnitDto,
  ) {
    return await this.productsService.addProductUnit(
      storeId,
      productId,
      dto.unitName,
      dto.exchangeValue,
      dto.isDefault ?? false,
    );
  }

  @Patch(':id/units/:unitId')
  @CheckPermission('update', 'Product')
  @ApiOperation({ summary: 'Cập nhật đơn vị quy đổi (cần quyền update:Product)' })
  @ApiResponse({ status: 200, description: 'Đơn vị đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm hoặc đơn vị' })
  async updateUnit(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) productId: number,
    @Param('unitId', ParseIntPipe) unitId: number,
    @Body() dto: UpdateProductUnitDto,
  ) {
    return await this.productsService.updateProductUnit(
      storeId,
      productId,
      unitId,
      dto.unitName,
      dto.exchangeValue,
      dto.isDefault,
    );
  }

  @Delete(':id/units/:unitId')
  @CheckPermission('delete', 'Product')
  @ApiOperation({ summary: 'Xóa đơn vị quy đổi (cần quyền delete:Product)' })
  @ApiResponse({ status: 200, description: 'Đơn vị đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm hoặc đơn vị' })
  async deleteUnit(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) productId: number,
    @Param('unitId', ParseIntPipe) unitId: number,
  ) {
    return await this.productsService.deleteProductUnit(storeId, productId, unitId);
  }

  // ========== MARGIN-BASED PRICING ==========

  @Get(':id/suggested-price')
  @CheckPermission('read', 'Product')
  @ApiOperation({ summary: 'Lấy giá bán gợi ý theo biên lợi nhuận (cần quyền read:Product)' })
  @ApiResponse({ status: 200, description: 'Giá vốn và giá bán gợi ý' })
  async getSuggestedPrice(
    @CurrentStore() storeId: number,
    @Param('id', ParseIntPipe) productId: number,
    @Query('unitName') unitName?: string,
  ) {
    return await this.productsService.getSuggestedPrice(storeId, productId, unitName);
  }
}
