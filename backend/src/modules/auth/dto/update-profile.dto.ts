import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyễn Văn A',
    description: 'Họ tên mới',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @ApiPropertyOptional({
    example: '0912345678',
    description: 'Số điện thoại mới',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'oldPassword123',
    description: 'Mật khẩu hiện tại (bắt buộc khi muốn đổi mật khẩu)',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({
    example: 'newPassword123',
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
