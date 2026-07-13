import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Get all available permissions in the system
   */
  async findAll() {
    return await this.prisma.permission.findMany({
      orderBy: [{ Subject: 'asc' }, { Action: 'asc' }],
    });
  }

  /**
   * Get grouped permissions (by Subject)
   */
  async findGrouped() {
    const permissions = await this.findAll();

    // Group by Subject
    const grouped = permissions.reduce(
      (acc, permission) => {
        const subject = permission.Subject;
        if (!acc[subject]) {
          acc[subject] = [];
        }
        acc[subject].push({
          PermissionID: permission.PermissionID,
          Action: permission.Action,
          Subject: permission.Subject,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return grouped;
  }

  /**
   * Get a specific permission by ID
   */
  async findOne(id: number) {
    return await this.prisma.permission.findUnique({
      where: { PermissionID: id },
    });
  }

  /**
   * Kiểm tra vai trò có quyền cụ thể (bao gồm manage:all).
   */
  async roleHasPermission(
    roleId: number,
    action: string,
    subject: string,
  ): Promise<boolean> {
    const superAdmin = await this.prisma.rolePermission.findFirst({
      where: {
        RoleID: roleId,
        permission: { Action: 'manage', Subject: 'all' },
      },
    });
    if (superAdmin) return true;

    const specific = await this.prisma.rolePermission.findFirst({
      where: {
        RoleID: roleId,
        permission: { Action: action, Subject: subject },
      },
    });
    return !!specific;
  }
}
