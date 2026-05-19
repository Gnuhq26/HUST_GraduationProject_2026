import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsArray, ValidateNested, ArrayMinSize, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID khách hàng (null nếu khách vãng lai)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'CustomerID phải là số nguyên' })
  @Type(() => Number)
  CustomerID?: number;

  @ApiProperty({
    description: 'Ghi chú đơn hàng',
    example: 'Giao hàng trước 5h chiều',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Note phải là chuỗi' })
  Note?: string;

  @ApiProperty({
    description: 'Phương thức giao hàng. DirectShip chỉ áp dụng qua POST /inventory/direct-ship',
    example: 'Immediate',
    required: false,
    enum: ['Immediate', 'Reserved'],
  })
  @IsOptional()
  @IsString({ message: 'DeliveryMethod phải là chuỗi' })
  @IsIn(['Immediate', 'Reserved'], {
    message: 'DeliveryMethod chỉ được là Immediate hoặc Reserved. Để giao thẳng dùng POST /inventory/direct-ship',
  })
  DeliveryMethod?: 'Immediate' | 'Reserved';

  @ApiProperty({
    description:
      'Số tiền khách đã thanh toán. ' +
      'Với đơn Immediate tự động bằng TotalAmount nếu không truyền. ' +
      'Với đơn Reserved là tiền cọc (mặc định 0).',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'PaidAmount phải là số' })
  @Min(0, { message: 'PaidAmount không được âm' })
  @Type(() => Number)
  PaidAmount?: number;

  @ApiProperty({
    description: 'Danh sách sản phẩm trong đơn hàng',
    type: [CreateOrderItemDto],
    example: [
      { ProductID: 1, UnitName: 'Thùng', Quantity: 10 },
      { ProductID: 2, UnitName: 'Pallet', Quantity: 2 },
    ],
  })
  @IsArray({ message: 'Items phải là mảng' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
