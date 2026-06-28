import type { PrismaClient } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { SYSTEM_PERMISSIONS } from './permissions.data';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function syncPermissions(prisma: PrismaClient): Promise<void> {
  for (const { Action, Subject } of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { Action_Subject: { Action, Subject } },
      update: {},
      create: { Action, Subject },
    });
  }
}

export async function syncRolePermissions(
  prisma: PrismaClient,
  roleId: number,
  pairs: Array<[string, string]>,
): Promise<void> {
  await prisma.rolePermission.deleteMany({ where: { RoleID: roleId } });
  for (const [Action, Subject] of pairs) {
    const permission = await prisma.permission.findUnique({
      where: { Action_Subject: { Action, Subject } },
    });
    if (!permission) {
      throw new Error(`Missing permission: ${Action}:${Subject}. Run prisma:sync-permissions first.`);
    }
    await prisma.rolePermission.create({
      data: {
        RoleID: roleId,
        PermissionID: permission.PermissionID,
      },
    });
  }
}

export function parseSubdomainArg(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith('--subdomain='));
  if (flag) {
    return flag.slice('--subdomain='.length).trim();
  }
  return process.env.SEED_STORE_SUBDOMAIN?.trim() || 'test';
}
