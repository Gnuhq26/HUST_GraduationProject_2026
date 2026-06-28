/**
 * Seed demo Nhân viên bán hàng — an toàn chạy lại trên DB đang có dữ liệu.
 * Không xóa sản phẩm / đơn hàng; chỉ đảm bảo vai trò, quyền và tài khoản demo.
 *
 * Usage:
 *   npm run prisma:seed:sales-staff
 *   npm run prisma:seed:sales-staff -- --subdomain=cua-hang-cua-ban
 */
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  SALES_STAFF_DEMO_USER,
  SALES_STAFF_PERMISSIONS,
  SALES_STAFF_ROLE_DESCRIPTION,
  SALES_STAFF_ROLE_NAME,
} from './sales-staff.data';
import { hashPassword, parseSubdomainArg, syncPermissions, syncRolePermissions } from './seed-helpers';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const subdomain = parseSubdomainArg(process.argv.slice(2));
  console.log(`Seeding sales staff demo for store subdomain="${subdomain}"...`);

  await syncPermissions(prisma);

  const store = await prisma.store.findUnique({ where: { Subdomain: subdomain } });
  if (!store) {
    throw new Error(
      `Store subdomain "${subdomain}" not found. Use --subdomain=your-store or create the store first.`,
    );
  }

  const salesStaffRole = await prisma.role.upsert({
    where: {
      StoreID_RoleName: {
        StoreID: store.StoreID,
        RoleName: SALES_STAFF_ROLE_NAME,
      },
    },
    update: {
      Description: SALES_STAFF_ROLE_DESCRIPTION,
    },
    create: {
      StoreID: store.StoreID,
      RoleName: SALES_STAFF_ROLE_NAME,
      Description: SALES_STAFF_ROLE_DESCRIPTION,
    },
  });

  await syncRolePermissions(prisma, salesStaffRole.RoleID, SALES_STAFF_PERMISSIONS);
  console.log(`Role "${SALES_STAFF_ROLE_NAME}" synced (${SALES_STAFF_PERMISSIONS.length} permissions).`);

  const passwordHash = await hashPassword(SALES_STAFF_DEMO_USER.Password);
  const salesUser = await prisma.user.upsert({
    where: { Email: SALES_STAFF_DEMO_USER.Email },
    update: {
      FullName: SALES_STAFF_DEMO_USER.FullName,
    },
    create: {
      Email: SALES_STAFF_DEMO_USER.Email,
      FullName: SALES_STAFF_DEMO_USER.FullName,
      PasswordHash: passwordHash,
    },
  });

  // Chỉ set mật khẩu khi tạo mới; không ghi đè mật khẩu user đã đổi.
  if (!salesUser.PasswordHash) {
    await prisma.user.update({
      where: { UserID: salesUser.UserID },
      data: { PasswordHash: passwordHash },
    });
  }

  await prisma.storeUser.upsert({
    where: {
      StoreID_UserID: { StoreID: store.StoreID, UserID: salesUser.UserID },
    },
    update: {
      RoleID: salesStaffRole.RoleID,
    },
    create: {
      StoreID: store.StoreID,
      UserID: salesUser.UserID,
      RoleID: salesStaffRole.RoleID,
    },
  });

  console.log('Sales staff demo ready:');
  console.log(`  Store : ${store.StoreName} (${store.Subdomain})`);
  console.log(`  Email : ${SALES_STAFF_DEMO_USER.Email}`);
  console.log(`  Pass  : ${SALES_STAFF_DEMO_USER.Password} (only set on first create)`);
  console.log(`  Role  : ${SALES_STAFF_ROLE_NAME}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('seed-sales-staff error:', e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
