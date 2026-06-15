import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const RESERVED_SLUG_WORDS = [
  'api', 'login', 'register', 'admin', 'assets', 'static',
  'profile', 'select-store', 'create-store', 'dashboard',
  'auth', 'health', 'favicon.ico', 'swagger',
];

function IsNotReservedSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotReservedSlug',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true;
          return !RESERVED_SLUG_WORDS.includes(value.toLowerCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `"${args.value}" is a reserved word and cannot be used as a slug`;
        },
      },
    });
  };
}

export class CreateStoreDto {
  @ApiProperty({
    example: 'Cửa hàng ABC',
    description: 'Store name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeName!: string;

  @ApiProperty({
    example: 'abc-store',
    description: 'Subdomain for the store (lowercase, no spaces, alphanumeric and hyphens only)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain must be lowercase, alphanumeric and hyphens only',
  })
  subdomain!: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Store phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    example: '79 Cầu Giấy, Hà Nội',
    description: 'Store address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    example: 'hung-phat',
    description: 'Custom slug for Premium URL (lowercase, alphanumeric and hyphens, 3-63 chars). Cannot use reserved words.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/, {
    message: 'slugName must be 3-63 chars, lowercase alphanumeric and hyphens, and must start/end with a letter or number',
  })
  @IsNotReservedSlug()
  slugName?: string;
}
