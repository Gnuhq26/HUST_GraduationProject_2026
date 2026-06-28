import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  SALES_STAFF_DEMO_USER,
  SALES_STAFF_PERMISSIONS,
  SALES_STAFF_ROLE_DESCRIPTION,
  SALES_STAFF_ROLE_NAME,
} from './sales-staff.data';
import { hashPassword, syncPermissions, syncRolePermissions } from './seed-helpers';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const permissionsOnly = process.argv.includes('--permissions-only');

  console.log('Seeding permissions...');
  await syncPermissions(prisma);

  if (permissionsOnly) {
    console.log('Permissions synced (--permissions-only). Skipping demo users/stores/roles.');
    return;
  }

  // Tạo User Admin mẫu
  console.log('Seeding Admin User...');
  const adminPassword = await hashPassword('123456');
  const adminUser = await prisma.user.upsert({
    where: { Email: 'admin@app.com' },
    update: {},
    create: {
      Email: 'admin@app.com',
      FullName: 'Admin User',
      PasswordHash: adminPassword,
    },
  });

  // Tạo Cửa hàng mẫu
  console.log('Seeding Test Store...');
  const testStore = await prisma.store.upsert({
    where: { Subdomain: 'test' },
    update: {},
    create: {
      StoreName: 'Cửa hàng A',
      Subdomain: 'test',
      Address: '79 Cầu Giấy, Hà Nội',
      Phone: '0123456789',
    },
  });

  // Tạo vai trò mặc định (khớp stores.service.ts khi tạo cửa hàng mới)
  console.log('Seeding Roles...');
  const ownerRole = await prisma.role.upsert({
    where: {
      StoreID_RoleName: {
        StoreID: testStore.StoreID,
        RoleName: 'Chủ cửa hàng',
      },
    },
    update: {},
    create: {
      StoreID: testStore.StoreID,
      RoleName: 'Chủ cửa hàng',
      Description: 'Toàn quyền quản lý cửa hàng',
    },
  });
  await syncRolePermissions(prisma, ownerRole.RoleID, [['manage', 'all']]);

  const defaultRoleNames = [
    { RoleName: 'Quản lý', Description: 'Quản lý cửa hàng, xem báo cáo' },
    { RoleName: 'Thủ kho', Description: 'Quản lý kho hàng, nhập xuất' },
  ] as const;

  for (const role of defaultRoleNames) {
    await prisma.role.upsert({
      where: {
        StoreID_RoleName: { StoreID: testStore.StoreID, RoleName: role.RoleName },
      },
      update: {},
      create: {
        StoreID: testStore.StoreID,
        RoleName: role.RoleName,
        Description: role.Description,
      },
    });
  }

  const salesStaffRole = await prisma.role.upsert({
    where: {
      StoreID_RoleName: {
        StoreID: testStore.StoreID,
        RoleName: SALES_STAFF_ROLE_NAME,
      },
    },
    update: { Description: SALES_STAFF_ROLE_DESCRIPTION },
    create: {
      StoreID: testStore.StoreID,
      RoleName: SALES_STAFF_ROLE_NAME,
      Description: SALES_STAFF_ROLE_DESCRIPTION,
    },
  });
  await syncRolePermissions(prisma, salesStaffRole.RoleID, SALES_STAFF_PERMISSIONS);

  const salesPassword = await hashPassword(SALES_STAFF_DEMO_USER.Password);
  const salesUser = await prisma.user.upsert({
    where: { Email: SALES_STAFF_DEMO_USER.Email },
    update: { FullName: SALES_STAFF_DEMO_USER.FullName },
    create: {
      Email: SALES_STAFF_DEMO_USER.Email,
      FullName: SALES_STAFF_DEMO_USER.FullName,
      PasswordHash: salesPassword,
    },
  });

  // Liên kết Admin User với Cửa hàng Mẫu (với vai trò Chủ cửa hàng)
  console.log('Linking Admin User to Store...');
  await prisma.storeUser.upsert({
    where: {
      StoreID_UserID: { StoreID: testStore.StoreID, UserID: adminUser.UserID },
    },
    update: {},
    create: {
      StoreID: testStore.StoreID,
      UserID: adminUser.UserID,
      RoleID: ownerRole.RoleID,
    },
  });

  console.log('Linking Sales Staff User to Store...');
  await prisma.storeUser.upsert({
    where: {
      StoreID_UserID: { StoreID: testStore.StoreID, UserID: salesUser.UserID },
    },
    update: { RoleID: salesStaffRole.RoleID },
    create: {
      StoreID: testStore.StoreID,
      UserID: salesUser.UserID,
      RoleID: salesStaffRole.RoleID,
    },
  });

  console.log('Seeding finished.');
  console.log(`  Admin : admin@app.com / 123456`);
  console.log(`  Staff : ${SALES_STAFF_DEMO_USER.Email} / ${SALES_STAFF_DEMO_USER.Password}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    if (e instanceof Error) {
      console.error('Seeding error:', e.message);
    } else {
      console.error('Seeding error with unknown error:', String(e));
    }

    await prisma.$disconnect();
    process.exit(1);
  });
