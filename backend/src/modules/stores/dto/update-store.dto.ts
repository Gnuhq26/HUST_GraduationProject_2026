import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Cửa hàng ABC' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storeName?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '79 Cầu Giấy, Hà Nội' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
