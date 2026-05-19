import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

/**
 * Xóa toàn bộ dữ liệu demo (seed-demo.ts) khỏi DB.
 * Giữ nguyên: User, Store, Role, Permission, RolePermission, StoreUser.
 *
 * npx ts-node prisma/seeds/clean-demo.ts
 */
async function main() {
  const store = await prisma.store.findFirst({ where: { Subdomain: 'test' } });
  if (!store) {
    console.log('Không tìm thấy store "test". Không có gì để xóa.');
    return;
  }

  const StoreID = store.StoreID;
  console.log(`Cleaning demo data for Store "${store.StoreName}" (ID: ${StoreID})...`);

  // Xóa theo thứ tự phụ thuộc FK (con trước, cha sau)

  // 1. InventoryLog
  const logs = await prisma.inventoryLog.deleteMany({ where: { StoreID } });
  console.log(`  InventoryLog: ${logs.count} deleted`);

  // 2. OrderDetail (qua Order.StoreID)
  const orderIds = (await prisma.order.findMany({ where: { StoreID }, select: { OrderID: true } })).map(o => o.OrderID);
  const od = await prisma.orderDetail.deleteMany({ where: { OrderID: { in: orderIds } } });
  console.log(`  OrderDetail: ${od.count} deleted`);

  // 3. Order
  const orders = await prisma.order.deleteMany({ where: { StoreID } });
  console.log(`  Order: ${orders.count} deleted`);

  // 4. StockReceiptDetail (qua StockReceipt.StoreID)
  const receiptIds = (await prisma.stockReceipt.findMany({ where: { StoreID }, select: { ReceiptID: true } })).map(r => r.ReceiptID);
  const srd = await prisma.stockReceiptDetail.deleteMany({ where: { ReceiptID: { in: receiptIds } } });
  console.log(`  StockReceiptDetail: ${srd.count} deleted`);

  // 5. StockReceipt
  const receipts = await prisma.stockReceipt.deleteMany({ where: { StoreID } });
  console.log(`  StockReceipt: ${receipts.count} deleted`);

  // 6. Inventory
  const inv = await prisma.inventory.deleteMany({ where: { StoreID } });
  console.log(`  Inventory: ${inv.count} deleted`);

  // 7. ProductUnit
  const productIds = (await prisma.product.findMany({ where: { StoreID }, select: { ProductID: true } })).map(p => p.ProductID);
  const pu = await prisma.productUnit.deleteMany({ where: { ProductID: { in: productIds } } });
  console.log(`  ProductUnit: ${pu.count} deleted`);

  // 8. Product
  const products = await prisma.product.deleteMany({ where: { StoreID } });
  console.log(`  Product: ${products.count} deleted`);

  // 9. Customer
  const customers = await prisma.customer.deleteMany({ where: { StoreID } });
  console.log(`  Customer: ${customers.count} deleted`);

  // 10. Supplier
  const suppliers = await prisma.supplier.deleteMany({ where: { StoreID } });
  console.log(`  Supplier: ${suppliers.count} deleted`);

  // 11. Category
  const categories = await prisma.category.deleteMany({ where: { StoreID } });
  console.log(`  Category: ${categories.count} deleted`);

  console.log('\nDone! Demo data cleaned. Base data (User, Store, Role, Permission) preserved.');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('Clean error:', e instanceof Error ? e.message : String(e));
    await prisma.$disconnect();
    process.exit(1);
  });
