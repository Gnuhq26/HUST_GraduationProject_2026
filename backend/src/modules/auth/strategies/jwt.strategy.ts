import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { UserID: payload.sub },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        CreatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Query DB for latest stores list (not from JWT payload)
    const storeUsers = await this.prisma.storeUser.findMany({
      where: { UserID: user.UserID },
      include: {
        store: {
          select: {
            StoreID: true,
            StoreName: true,
            Subdomain: true,
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

    const stores = storeUsers.map((su) => ({
      storeId: su.store.StoreID,
      storeName: su.store.StoreName,
      subdomain: su.store.Subdomain,
      roleId: su.role.RoleID,
      roleName: su.role.RoleName,
    }));

    // Return user with fresh stores information from DB
    return {
      ...user,
      stores,
    };
  }
}
