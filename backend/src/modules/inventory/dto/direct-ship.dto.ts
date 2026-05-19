import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DirectShipDto {
  @ApiProperty({ example: 1, description: 'ID nhà cung cấp' })
  @IsInt()
  supplierId!: number;

  @ApiProperty({ example: 1, description: 'ID sản phẩm' })
  @IsInt()
  productId!: number;

  @ApiProperty({ example: 'Thùng', description: 'Đơn vị dùng để nhập/bán' })
  @IsString()
  unitName!: string;

  @ApiProperty({ example: 20, description: 'Tổng hàng trên xe' })
  @IsNumber()
  @Min(0.01)
  totalQty!: number;

  @ApiProperty({ example: 8, description: 'Phần giao thẳng cho khách (phải > 0 và <= totalQty)' })
  @IsNumber()
  @Min(0.01)
  deliverQty!: number;

  @ApiProperty({ example: 120000, description: 'Giá nhập theo đơn vị' })
  @IsNumber()
  @Min(0)
  importUnitPrice!: number;

  @ApiPropertyOptional({ example: 0.05, description: 'Chiết khấu NCC khi nhập (0.05 = 5%). Mặc định 0' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  importDiscountRate?: number;

  @ApiProperty({ example: 140000, description: 'Giá bán theo đơn vị' })
  @IsNumber()
  @Min(0)
  saleUnitPrice!: number;

  @ApiPropertyOptional({ example: 10, description: 'ID khách hàng (nếu có)' })
  @IsOptional()
  @IsInt()
  customerId?: number;

  @ApiPropertyOptional({ example: 'Giao nửa xe tại công trình A' })
  @IsOptional()
  @IsString()
  note?: string;
}