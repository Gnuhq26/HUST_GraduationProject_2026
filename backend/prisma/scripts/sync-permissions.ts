/**
 * Chỉ bổ sung / đảm bảo danh mục Permission trong DB.
 * An toàn với DB đang có dữ liệu: không xóa sản phẩm, đơn hàng, vai trò hay quyền đã gán.
 *
 * Usage: npm run prisma:sync-permissions
 */
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { SYSTEM_PERMISSIONS } from '../seeds/permissions.data';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  let created = 0;
  let existing = 0;

  for (const { Action, Subject } of SYSTEM_PERMISSIONS) {
    const before = await prisma.permission.findUnique({
      where: { Action_Subject: { Action, Subject } },
      select: { PermissionID: true },
    });

    await prisma.permission.upsert({
      where: { Action_Subject: { Action, Subject } },
      update: {},
      create: { Action, Subject },
    });

    if (before) {
      existing += 1;
    } else {
      created += 1;
      console.log(`+ ${Action}:${Subject}`);
    }
  }

  console.log(
    `Done. ${SYSTEM_PERMISSIONS.length} permissions checked — ${created} added, ${existing} unchanged.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('sync-permissions error:', e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
