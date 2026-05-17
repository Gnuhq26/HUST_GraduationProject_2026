import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentStore, StoreInfo, CurrentUser } from '../../common/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        user: {
          UserID: 1,
          Email: 'user@example.com',
          FullName: 'John Doe',
          Phone: '0123456789',
          Address: '123 Main St',
          CreatedAt: '2026-01-05T10:00:00.000Z',
        },
        stores: [],
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          UserID: 1,
          Email: 'admin@app.com',
          FullName: 'Admin User',
          Phone: null,
          Address: null,
          CreatedAt: '2026-01-01T00:00:00.000Z',
        },
        stores: [
          {
            storeId: 1,
            storeName: 'Cửa hàng A',
            subdomain: 'test',
            roleId: 1,
            roleName: 'Chủ cửa hàng',
          },
        ],
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        UserID: 1,
        Email: 'admin@app.com',
        FullName: 'Admin User',
        Phone: null,
        Address: null,
        CreatedAt: '2026-01-01T00:00:00.000Z',
        stores: [
          {
            storeId: 1,
            storeName: 'Cửa hàng A',
            subdomain: 'test',
            roleId: 1,
            roleName: 'Chủ cửa hàng',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getProfile(@CurrentUser() userId: number) {
    return await this.authService.getUserById(userId);
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    schema: {
      example: {
        UserID: 1,
        Email: 'admin@app.com',
        FullName: 'Admin User',
        Phone: '0912345678',
        Address: null,
        CreatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không đúng hoặc thiếu thông tin' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.authService.updateProfile(userId, dto);
  }

  @Get('permissions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user permissions in selected store' })
  @ApiResponse({
    status: 200,
    description: 'Current user permissions in current store context',
    schema: {
      example: [
        { PermissionID: 2, Action: 'read', Subject: 'Product' },
        { PermissionID: 3, Action: 'create', Subject: 'Product' },
      ],
    },
  })
  async getMyPermissions(@CurrentStore('full') currentStore: StoreInfo | null) {
    if (!currentStore?.roleId) {
      return [];
    }

    return await this.authService.getRolePermissions(currentStore.roleId);
  }

  //Google OAuth
  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google login page' })
  googleLogin() {
    // Passport redirects to Google — no body needed
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as
      | { error: 'ACCOUNT_EXISTS_LOCAL' }
      | { access_token: string };

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    if ('error' in user && user.error === 'ACCOUNT_EXISTS_LOCAL') {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=account_exists_local`,
      );
    }

    if ('access_token' in user) {
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${user.access_token}`,
      );
    }

    // Unexpected state
    return res.redirect(`${frontendUrl}/auth/callback?error=unknown`);
  }

}
