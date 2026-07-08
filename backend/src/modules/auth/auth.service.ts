import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto';

export interface JwtPayload {
  sub: number;
  email: string;
  stores: Array<{
    storeId: number;
    storeName: string;
    subdomain: string;
    roleId: number;
    roleName: string;
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phone, address } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { Email: email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        Email: email,
        PasswordHash: hashedPassword,
        FullName: fullName,
        Phone: phone,
        Address: address,
        Provider: 'LOCAL',
      },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        Provider: true,
        CreatedAt: true,
      },
    });

    // Get user stores and roles
    const stores = await this.getUserStores(user.UserID);

    // Generate JWT token
    const token = this.generateToken(user.UserID, user.Email, stores);

    return {
      user,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);

    // Get user stores and roles
    const stores = await this.getUserStores(user.UserID);

    // Generate JWT token
    const token = this.generateToken(user.UserID, user.Email, stores);

    return {
      user: {
        UserID: user.UserID,
        Email: user.Email,
        FullName: user.FullName,
        Phone: user.Phone,
        Address: user.Address,
        Provider: user.Provider,
        CreatedAt: user.CreatedAt,
      },
      stores,
      access_token: token,
    };
  }

  /**
   * Validate user credentials (email and password)
   * @param email User email
   * @param password User password (plain text)
   * @returns User object if valid
   * @throws UnauthorizedException if invalid
   */
  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { Email: email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Guard: block social login users from using email/password login
    if (user.Provider !== 'LOCAL' || !user.PasswordHash) {
      throw new UnauthorizedException(
        'Tài khoản đã đăng ký bằng phương thức khác. Vui lòng đăng nhập bằng Google.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Get all stores that user belongs to with their roles
   * @param userId User ID
   * @returns Array of stores with role information
   */
  private async getUserStores(userId: number) {
    const storeUsers = await this.prisma.storeUser.findMany({
      where: { UserID: userId },
      include: {
        store: {
          select: {
            StoreID: true,
            StoreName: true,
            Subdomain: true,
            DisplayId: true,
            SlugName: true,
          },
        },
        role: {
          select: {
            RoleID: true,
            RoleName: true,
          },
        },
      },
    });

    return storeUsers.map((su) => ({
      storeId: su.store.StoreID,
      storeName: su.store.StoreName,
      subdomain: su.store.Subdomain,
      displayId: su.store.DisplayId,
      slugName: su.store.SlugName,
      roleId: su.role.RoleID,
      roleName: su.role.RoleName,
    }));
  }

  /**
   * Generate JWT token with user info and stores
   */
  private generateToken(
    userId: number,
    email: string,
    stores: Array<{
      storeId: number;
      storeName: string;
      subdomain: string;
      roleId: number;
      roleName: string;
    }>,
  ): string {
    const payload: JwtPayload = { sub: userId, email, stores };
    return this.jwtService.sign(payload);
  }

  /**
   * Get user by ID with store information
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        Provider: true,
        CreatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const stores = await this.getUserStores(userId);
    return { ...user, stores };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { UserID: userId },
      select: { UserID: true, PasswordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const updateData: { FullName?: string; Phone?: string; PasswordHash?: string } = {};

    if (dto.fullName !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updateData.FullName = dto.fullName;
    }

    if (dto.phone !== undefined) {
      updateData.Phone = dto.phone;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu');
      }
      // Guard: social login users don't have a password
      if (!user.PasswordHash) {
        throw new BadRequestException(
          'Tài khoản này không có mật khẩu. Vui lòng đăng nhập bằng Google.',
        );
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.PasswordHash);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      }
      updateData.PasswordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    return await this.prisma.user.update({
      where: { UserID: userId },
      data: updateData,
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        Provider: true,
        CreatedAt: true,
      },
    });
  }

  /**
   * Handle social login (Google, Facebook).
   * Creates a new user if not found, or logs in existing social user.
   * Returns { error: 'ACCOUNT_EXISTS_LOCAL' } if email is already registered with email/password.
   */
  async socialLogin(profile: {
    email: string;
    fullName: string;
    providerID: string;
    provider: 'GOOGLE' | 'FACEBOOK';
  }) {
    const { email, fullName, providerID, provider } = profile;

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { Email: email },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        Provider: true,
        ProviderID: true,
        CreatedAt: true,
      },
    });

    if (existingUser) {
      // Email registered with email/password — block to prevent account confusion
      if (existingUser.Provider === 'LOCAL') {
        return { error: 'ACCOUNT_EXISTS_LOCAL' as const };
      }

      // Existing social user — issue token
      const stores = await this.getUserStores(existingUser.UserID);
      const token = this.generateToken(existingUser.UserID, existingUser.Email, stores);
      return {
        access_token: token,
        user: {
          UserID: existingUser.UserID,
          Email: existingUser.Email,
          FullName: existingUser.FullName,
          Phone: existingUser.Phone,
          Address: existingUser.Address,
          Provider: existingUser.Provider,
          CreatedAt: existingUser.CreatedAt,
        },
        stores,
      };
    }

    // New user — register with social provider
    const newUser = await this.prisma.user.create({
      data: {
        Email: email,
        FullName: fullName,
        Provider: provider,
        ProviderID: providerID,
      },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        Provider: true,
        CreatedAt: true,
      },
    });

    const stores = await this.getUserStores(newUser.UserID);
    const token = this.generateToken(newUser.UserID, newUser.Email, stores);
    return {
      access_token: token,
      user: newUser,
      stores,
    };
  }

  /**
   * Get effective permissions of a role in current store context.
   */
  async getRolePermissions(roleId: number) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { RoleID: roleId },
      include: {
        permission: {
          select: {
            PermissionID: true,
            Action: true,
            Subject: true,
          },
        },
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

}
