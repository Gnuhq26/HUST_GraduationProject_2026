import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

/**
 * Demo seed: Tạo dữ liệu nghiệp vụ để demo frontend.
 * Chạy SAU seed.ts gốc (cần có Store, User, Role).
 * Cách chạy:
 * npx ts-node prisma/seeds/seed-demo.ts
 */
async function main() {
  // ── Lấy dữ liệu gốc từ seed chính ────────────────────────
  const store = await prisma.store.findFirst({ where: { Subdomain: 'test' } });
  if (!store) throw new Error('Store "test" chưa tồn tại. Hãy chạy seed.ts trước.');

  const admin = await prisma.user.findFirst({ where: { Email: 'admin@app.com' } });
  if (!admin) throw new Error('Admin user chưa tồn tại. Hãy chạy seed.ts trước.');

  const StoreID = store.StoreID;
  const UserID = admin.UserID;

  console.log(`Seeding demo data for Store "${store.StoreName}" (ID: ${StoreID})...`);

  // ══════════════════════════════════════════════════════════
  // 1. DANH MỤC (Categories)
  // ══════════════════════════════════════════════════════════
  console.log('Creating categories...');
  const categoryData = [
    { CategoryName: 'Xi măng', Description: 'Các loại xi măng xây dựng' },
    { CategoryName: 'Sắt thép', Description: 'Thép thanh, thép cuộn, thép hình' },
    { CategoryName: 'Gạch', Description: 'Gạch xây, gạch ốp lát, gạch trang trí' },
    { CategoryName: 'Cát sỏi', Description: 'Cát xây dựng, sỏi, đá dăm' },
    { CategoryName: 'Sơn', Description: 'Sơn nội thất, ngoại thất, chống thấm' },
    { CategoryName: 'Ống nước', Description: 'Ống PVC, ống PPR, phụ kiện ống' },
    { CategoryName: 'Điện', Description: 'Dây điện, ổ cắm, công tắc, đèn' },
  ];

  const categories: Record<string, number> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { StoreID_CategoryName: { StoreID, CategoryName: cat.CategoryName } },
      update: {},
      create: { StoreID, ...cat },
    });
    categories[cat.CategoryName] = c.CategoryID;
  }

  // ══════════════════════════════════════════════════════════
  // 2. SẢN PHẨM (Products) + Đơn vị + Bảng giá
  // ══════════════════════════════════════════════════════════
  console.log('Creating products, units, prices...');

  interface ProductSeed {
    ProductName: string;
    CategoryName: string;
    SKU: string;
    BaseUnit: string;
    marginRate: number;
    units: { UnitName: string; ExchangeValue: number; IsDefault: boolean }[];
  }

  const productData: ProductSeed[] = [
    // ── Xi măng ──
    {
      ProductName: 'Xi măng Hoàng Thạch PCB40',
      CategoryName: 'Xi măng',
      SKU: 'XM-HT-PCB40',
      BaseUnit: 'Bao',
      marginRate: 0.12,
      units: [
        { UnitName: 'Bao', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Tấn', ExchangeValue: 20, IsDefault: false },
      ],
    },
    {
      ProductName: 'Xi măng Nghi Sơn PC50',
      CategoryName: 'Xi măng',
      SKU: 'XM-NS-PC50',
      BaseUnit: 'Bao',
      marginRate: 0.10,
      units: [{ UnitName: 'Bao', ExchangeValue: 1, IsDefault: true }],
    },
    // ── Sắt thép ──
    {
      ProductName: 'Thép thanh Hòa Phát D10',
      CategoryName: 'Sắt thép',
      SKU: 'TT-HP-D10',
      BaseUnit: 'Cây',
      marginRate: 0.12,
      units: [
        { UnitName: 'Cây', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Bó', ExchangeValue: 20, IsDefault: false },
      ],
    },
    {
      ProductName: 'Thép cuộn Pomina D6',
      CategoryName: 'Sắt thép',
      SKU: 'TC-PM-D6',
      BaseUnit: 'Kg',
      marginRate: 0.10,
      units: [
        { UnitName: 'Kg', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Cuộn', ExchangeValue: 500, IsDefault: false },
      ],
    },
    // ── Gạch ──
    {
      ProductName: 'Gạch ống 4 lỗ',
      CategoryName: 'Gạch',
      SKU: 'GO-4L',
      BaseUnit: 'Viên',
      marginRate: 0.15,
      units: [
        { UnitName: 'Viên', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Pallet', ExchangeValue: 500, IsDefault: false },
      ],
    },
    {
      ProductName: 'Gạch ceramic 30x30 Prime',
      CategoryName: 'Gạch',
      SKU: 'GC-30-PR',
      BaseUnit: 'Viên',
      marginRate: 0.20,
      units: [
        { UnitName: 'Viên', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Thùng', ExchangeValue: 12, IsDefault: false },
      ],
    },
    // ── Cát sỏi ──
    {
      ProductName: 'Cát vàng xây dựng',
      CategoryName: 'Cát sỏi',
      SKU: 'CV-XD',
      BaseUnit: 'Khối',
      marginRate: 0.15,
      units: [
        { UnitName: 'Khối', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Xe', ExchangeValue: 8, IsDefault: false },
      ],
    },
    {
      ProductName: 'Đá dăm 1x2',
      CategoryName: 'Cát sỏi',
      SKU: 'DD-1X2',
      BaseUnit: 'Khối',
      marginRate: 0.12,
      units: [{ UnitName: 'Khối', ExchangeValue: 1, IsDefault: true }],
    },
    // ── Sơn ──
    {
      ProductName: 'Sơn Dulux nội thất 5L',
      CategoryName: 'Sơn',
      SKU: 'SON-DLX-NT5',
      BaseUnit: 'Thùng',
      marginRate: 0.20,
      units: [{ UnitName: 'Thùng', ExchangeValue: 1, IsDefault: true }],
    },
    {
      ProductName: 'Sơn chống thấm Kova CT-11A',
      CategoryName: 'Sơn',
      SKU: 'SON-KV-CT11',
      BaseUnit: 'Thùng',
      marginRate: 0.18,
      units: [{ UnitName: 'Thùng', ExchangeValue: 1, IsDefault: true }],
    },
    // ── Ống nước ──
    {
      ProductName: 'Ống PVC Bình Minh D21',
      CategoryName: 'Ống nước',
      SKU: 'ONG-BM-D21',
      BaseUnit: 'Cây',
      marginRate: 0.15,
      units: [
        { UnitName: 'Cây', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Bó', ExchangeValue: 10, IsDefault: false },
      ],
    },
    // ── Điện ──
    {
      ProductName: 'Dây điện Cadivi 2.5mm²',
      CategoryName: 'Điện',
      SKU: 'DD-CDV-25',
      BaseUnit: 'Mét',
      marginRate: 0.15,
      units: [
        { UnitName: 'Mét', ExchangeValue: 1, IsDefault: true },
        { UnitName: 'Cuộn', ExchangeValue: 100, IsDefault: false },
      ],
    },
    {
      ProductName: 'Ổ cắm đôi Panasonic',
      CategoryName: 'Điện',
      SKU: 'OC-PNS-02',
      BaseUnit: 'Cái',
      marginRate: 0.25,
      units: [{ UnitName: 'Cái', ExchangeValue: 1, IsDefault: true }],
    },
  ];

  const products: Record<string, number> = {};

  for (const p of productData) {
    const existing = await prisma.product.findFirst({
      where: { StoreID, SKU: p.SKU },
    });

    let productId: number;

    if (existing) {
      productId = existing.ProductID;
    } else {
      const created = await prisma.product.create({
        data: {
          StoreID,
          CategoryID: categories[p.CategoryName],
          ProductName: p.ProductName,
          SKU: p.SKU,
          BaseUnit: p.BaseUnit,
          MarginRate: p.marginRate,
        },
      });
      productId = created.ProductID;

      // Units
      for (const u of p.units) {
        await prisma.productUnit.create({
          data: { ProductID: productId, ...u },
        });
      }
    }

    products[p.SKU] = productId;
  }

  // ══════════════════════════════════════════════════════════
  // 3. NHÀ CUNG CẤP (Suppliers)
  // ══════════════════════════════════════════════════════════
  console.log('Creating suppliers...');
  const supplierData = [
    { SupplierName: 'VLXD Hoàng Long', Phone: '0912345678', Address: 'Số 15, Đại Cồ Việt, Hai Bà Trưng, Hà Nội' },
    { SupplierName: 'Đại lý Thép Miền Bắc', Phone: '0987654321', Address: '122 Nguyễn Trãi, Thanh Xuân, Hà Nội' },
    { SupplierName: 'Sơn & Phụ kiện Thành Đạt', Phone: '0345678901', Address: '45 Lê Duẩn, Đống Đa, Hà Nội' },
    { SupplierName: 'Cát Sỏi Bắc Ninh', Phone: '0223456789', Address: 'KCN Quế Võ, Bắc Ninh' },
  ];

  const suppliers: Record<string, number> = {};
  for (const s of supplierData) {
    const sup = await prisma.supplier.upsert({
      where: { StoreID_SupplierName: { StoreID, SupplierName: s.SupplierName } },
      update: {},
      create: { StoreID, ...s },
    });
    suppliers[s.SupplierName] = sup.SupplierID;
  }

  // ══════════════════════════════════════════════════════════
  // 4. KHÁCH HÀNG (Customers)
  // ══════════════════════════════════════════════════════════
  console.log('Creating customers...');
  const customerData = [
    { CustomerName: 'Anh Tuấn - CT TNHH Xây Dựng Phú Thịnh', Phone: '0901234567', Address: '100 Trần Hưng Đạo, Hoàn Kiếm, HN' },
    { CustomerName: 'Chị Lan - Nhà thầu Lan Anh', Phone: '0918765432', Address: '78 Giải Phóng, Thanh Xuân, HN' },
    { CustomerName: 'Anh Hùng - Tổ thợ xây', Phone: '0356789012', Address: 'Thôn 3, Đông Anh, HN' },
    { CustomerName: 'Cô Mai - Xây nhà riêng', Phone: '0976543210', Address: '55 Kim Mã, Ba Đình, HN' },
    { CustomerName: 'Anh Đức - Đại lý Đức Phát', Phone: '0889012345', Address: '220 Nguyễn Văn Cừ, Long Biên, HN' },
    { CustomerName: 'Anh Long - CT CP Long Thành', Phone: '0932345678', Address: 'KĐT Ciputra, Tây Hồ, HN' },
  ];

  const customers: Record<string, number> = {};
  for (const c of customerData) {
    // Use findFirst + create since Customer doesn't have a unique constraint on name
    let cust = await prisma.customer.findFirst({
      where: { StoreID, CustomerName: c.CustomerName },
    });
    if (!cust) {
      cust = await prisma.customer.create({ data: { StoreID, ...c } });
    }
    customers[c.CustomerName] = cust.CustomerID;
  }

  // ══════════════════════════════════════════════════════════
  // 5. TỒN KHO (Inventory) — tạo bản ghi base
  // ══════════════════════════════════════════════════════════
  console.log('Creating inventory records...');
  const inventoryMap: {
    SKU: string;
    Quantity: number;
    ReservedQty: number;
    InTransitQty: number;
  }[] = [
    { SKU: 'XM-HT-PCB40', Quantity: 500, ReservedQty: 50, InTransitQty: 200 },
    { SKU: 'XM-NS-PC50', Quantity: 300, ReservedQty: 0, InTransitQty: 100 },
    { SKU: 'TT-HP-D10', Quantity: 1200, ReservedQty: 200, InTransitQty: 0 },
    { SKU: 'TC-PM-D6', Quantity: 5000, ReservedQty: 500, InTransitQty: 1000 },
    { SKU: 'GO-4L', Quantity: 25000, ReservedQty: 2000, InTransitQty: 5000 },
    { SKU: 'GC-30-PR', Quantity: 3000, ReservedQty: 0, InTransitQty: 0 },
    { SKU: 'CV-XD', Quantity: 80, ReservedQty: 16, InTransitQty: 24 },
    { SKU: 'DD-1X2', Quantity: 60, ReservedQty: 0, InTransitQty: 0 },
    { SKU: 'SON-DLX-NT5', Quantity: 45, ReservedQty: 5, InTransitQty: 20 },
    { SKU: 'SON-KV-CT11', Quantity: 30, ReservedQty: 0, InTransitQty: 10 },
    { SKU: 'ONG-BM-D21', Quantity: 200, ReservedQty: 30, InTransitQty: 0 },
    { SKU: 'DD-CDV-25', Quantity: 8000, ReservedQty: 0, InTransitQty: 0 },
    { SKU: 'OC-PNS-02', Quantity: 150, ReservedQty: 0, InTransitQty: 0 },
  ];

  for (const inv of inventoryMap) {
    await prisma.inventory.upsert({
      where: {
        StoreID_ProductID: { StoreID, ProductID: products[inv.SKU] },
      },
      update: {
        Quantity: inv.Quantity,
        ReservedQty: inv.ReservedQty,
        InTransitQty: inv.InTransitQty,
      },
      create: {
        StoreID,
        ProductID: products[inv.SKU],
        Quantity: inv.Quantity,
        ReservedQty: inv.ReservedQty,
        InTransitQty: inv.InTransitQty,
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // 6. PHIẾU NHẬP KHO (Stock Receipts 📦)
  //    - Mix trạng thái: Received / Pending
  //    - Mix công nợ: Paid full / Partially paid => supplier debt
  // ══════════════════════════════════════════════════════════
  console.log('Creating stock receipts...');

  // Helper để tạo phiếu nhập
  async function createReceipt(data: {
    SupplierName: string;
    Status: string;
    TotalAmount: number;
    PaidAmount: number;
    Note?: string;
    ImportDate?: Date;
    details: { SKU: string; UnitName: string; Quantity: number; UnitPrice: number; discountRate?: number }[];
  }) {
    const receipt = await prisma.stockReceipt.create({
      data: {
        StoreID,
        SupplierID: suppliers[data.SupplierName],
        Status: data.Status,
        TotalAmount: data.TotalAmount,
        PaidAmount: data.PaidAmount,
        Note: data.Note,
        ImportDate: data.ImportDate ?? new Date(),
        details: {
          create: data.details.map((d) => {
            const discountRate = d.discountRate ?? 0;
            return {
              ProductID: products[d.SKU],
              UnitName: d.UnitName,
              Quantity: d.Quantity,
              UnitPrice: d.UnitPrice,
              DiscountRate: discountRate,
              CostPrice: d.UnitPrice * (1 - discountRate),
            };
          }),
        },
      },
    });
    return receipt;
  }

  // Receipt 1: Nhập xi măng — ĐÃ NHẬN, THANH TOÁN ĐỦ
  await createReceipt({
    SupplierName: 'VLXD Hoàng Long',
    Status: 'Received',
    TotalAmount: 42500000,
    PaidAmount: 42500000,
    Note: 'Nhập xi măng tháng 3',
    ImportDate: new Date('2026-03-10'),
    details: [
      { SKU: 'XM-HT-PCB40', UnitName: 'Bao', Quantity: 300, UnitPrice: 85000 },
      { SKU: 'XM-NS-PC50', UnitName: 'Bao', Quantity: 100, UnitPrice: 95000 },
    ],
  });

  // Receipt 2: Nhập thép — ĐÃ NHẬN, CÒN NỢ (supplier debt demo)
  await createReceipt({
    SupplierName: 'Đại lý Thép Miền Bắc',
    Status: 'Received',
    TotalAmount: 115000000,
    PaidAmount: 60000000, // Nợ 55 triệu
    Note: 'Nhập thép đợt 1 - còn nợ 55 triệu',
    ImportDate: new Date('2026-03-15'),
    details: [
      { SKU: 'TT-HP-D10', UnitName: 'Cây', Quantity: 1000, UnitPrice: 68000 },
      { SKU: 'TC-PM-D6', UnitName: 'Kg', Quantity: 3000, UnitPrice: 15667 },
    ],
  });

  // Receipt 3: Nhập sơn — ĐANG PENDING (hàng đang về)
  await createReceipt({
    SupplierName: 'Sơn & Phụ kiện Thành Đạt',
    Status: 'Pending',
    TotalAmount: 22500000,
    PaidAmount: 10000000,
    Note: 'Nhập sơn tháng 4 - đang chờ nhận hàng',
    ImportDate: new Date('2026-04-01'),
    details: [
      { SKU: 'SON-DLX-NT5', UnitName: 'Thùng', Quantity: 20, UnitPrice: 750000 },
      { SKU: 'SON-KV-CT11', UnitName: 'Thùng', Quantity: 10, UnitPrice: 600000 },
    ],
  });

  // Receipt 4: Nhập gạch lớn — ĐÃ NHẬN, CÒN NỢ
  await createReceipt({
    SupplierName: 'VLXD Hoàng Long',
    Status: 'Received',
    TotalAmount: 45600000,
    PaidAmount: 20000000, // Nợ 25.6 triệu
    Note: 'Nhập gạch tháng 3',
    ImportDate: new Date('2026-03-20'),
    details: [
      { SKU: 'GO-4L', UnitName: 'Pallet', Quantity: 20, UnitPrice: 480000 },
      { SKU: 'GC-30-PR', UnitName: 'Thùng', Quantity: 200, UnitPrice: 180000 },
    ],
  });

  // Receipt 5: Nhập cát sỏi — PENDING (hàng chuyển về)
  await createReceipt({
    SupplierName: 'Cát Sỏi Bắc Ninh',
    Status: 'Pending',
    TotalAmount: 18400000,
    PaidAmount: 0,
    Note: 'Nhập cát sỏi - xe đang trên đường',
    ImportDate: new Date('2026-04-10'),
    details: [
      { SKU: 'CV-XD', UnitName: 'Xe', Quantity: 3, UnitPrice: 2300000 },
      { SKU: 'DD-1X2', UnitName: 'Khối', Quantity: 40, UnitPrice: 285000 },
    ],
  });

  // Receipt 6: Nhập thép đợt 2 — ĐÃ NHẬN, NỢ MỘT PHẦN
  await createReceipt({
    SupplierName: 'Đại lý Thép Miền Bắc',
    Status: 'Received',
    TotalAmount: 51000000,
    PaidAmount: 30000000, // Nợ 21 triệu
    Note: 'Nhập thép đợt 2',
    ImportDate: new Date('2026-04-20'),
    details: [
      { SKU: 'TT-HP-D10', UnitName: 'Cây', Quantity: 500, UnitPrice: 70000 },
      { SKU: 'TC-PM-D6', UnitName: 'Kg', Quantity: 1000, UnitPrice: 16000 },
    ],
  });

  // ══════════════════════════════════════════════════════════
  // 7. ĐƠN HÀNG (Orders 🧾)
  //    - Mix trạng thái: Completed / Pending / Cancelled
  //    - Mix DeliveryMethod: Immediate / Reserved
  //    - Mix công nợ: Paid full / Partially paid => customer debt
  // ══════════════════════════════════════════════════════════
  console.log('Creating orders...');

  async function createOrder(data: {
    CustomerName?: string;
    Status: string;
    DeliveryMethod: string;
    TotalAmount: number;
    PaidAmount: number;
    Note?: string;
    OrderDate?: Date;
    details: { SKU: string; UnitName: string; Quantity: number; UnitPrice: number; CostPrice: number }[];
  }) {
    const order = await prisma.order.create({
      data: {
        StoreID,
        CustomerID: data.CustomerName ? customers[data.CustomerName] : null,
        UserID,
        Status: data.Status,
        DeliveryMethod: data.DeliveryMethod,
        TotalAmount: data.TotalAmount,
        PaidAmount: data.PaidAmount,
        Note: data.Note,
        OrderDate: data.OrderDate ?? new Date(),
        details: {
          create: data.details.map((d) => ({
            ProductID: products[d.SKU],
            UnitName: d.UnitName,
            Quantity: d.Quantity,
            UnitPrice: d.UnitPrice,
            CostPrice: d.CostPrice,
          })),
        },
      },
    });
    return order;
  }

  // Order 1: Completed, Immediate, Full paid – Anh Tuấn mua xi măng + gạch
  await createOrder({
    CustomerName: 'Anh Tuấn - CT TNHH Xây Dựng Phú Thịnh',
    Status: 'Completed',
    DeliveryMethod: 'Immediate',
    TotalAmount: 21500000,
    PaidAmount: 21500000,
    Note: 'Đơn hàng xi măng gạch - thanh toán đủ',
    OrderDate: new Date('2026-03-12'),
    details: [
      { SKU: 'XM-HT-PCB40', UnitName: 'Bao', Quantity: 100, UnitPrice: 90000, CostPrice: 85000 },
      { SKU: 'GO-4L', UnitName: 'Pallet', Quantity: 25, UnitPrice: 500000, CostPrice: 480000 },
    ],
  });

  // Order 2: Completed, Immediate, PARTIALLY paid – Chị Lan NỢ (customer debt demo)
  await createOrder({
    CustomerName: 'Chị Lan - Nhà thầu Lan Anh',
    Status: 'Completed',
    DeliveryMethod: 'Immediate',
    TotalAmount: 37600000,
    PaidAmount: 20000000, // Nợ 17.6 triệu
    Note: 'Đơn hàng lớn - nợ 17.6 triệu',
    OrderDate: new Date('2026-03-18'),
    details: [
      { SKU: 'TT-HP-D10', UnitName: 'Cây', Quantity: 200, UnitPrice: 75000, CostPrice: 68000 },
      { SKU: 'XM-HT-PCB40', UnitName: 'Bao', Quantity: 150, UnitPrice: 88000, CostPrice: 85000 },
      { SKU: 'CV-XD', UnitName: 'Khối', Quantity: 10, UnitPrice: 350000, CostPrice: 300000 },
    ],
  });

  // Order 3: Reserved (giao hàng) — Anh Hùng, CÒN NỢ
  await createOrder({
    CustomerName: 'Anh Hùng - Tổ thợ xây',
    Status: 'Completed',
    DeliveryMethod: 'Reserved',
    TotalAmount: 12400000,
    PaidAmount: 5000000, // Nợ 7.4 triệu
    Note: 'Giao hàng công trình Đông Anh - nợ',
    OrderDate: new Date('2026-03-25'),
    details: [
      { SKU: 'XM-NS-PC50', UnitName: 'Bao', Quantity: 50, UnitPrice: 97000, CostPrice: 95000 },
      { SKU: 'CV-XD', UnitName: 'Khối', Quantity: 10, UnitPrice: 350000, CostPrice: 300000 },
      { SKU: 'DD-1X2', UnitName: 'Khối', Quantity: 10, UnitPrice: 320000, CostPrice: 285000 },
    ],
  });

  // Order 4: Completed, Immediate – Cô Mai, full paid
  await createOrder({
    CustomerName: 'Cô Mai - Xây nhà riêng',
    Status: 'Completed',
    DeliveryMethod: 'Immediate',
    TotalAmount: 8750000,
    PaidAmount: 8750000,
    Note: 'Mua sơn và ống nước - trả đủ',
    OrderDate: new Date('2026-04-05'),
    details: [
      { SKU: 'SON-DLX-NT5', UnitName: 'Thùng', Quantity: 5, UnitPrice: 850000, CostPrice: 750000 },
      { SKU: 'SON-KV-CT11', UnitName: 'Thùng', Quantity: 3, UnitPrice: 650000, CostPrice: 600000 },
      { SKU: 'ONG-BM-D21', UnitName: 'Cây', Quantity: 30, UnitPrice: 32000, CostPrice: 28000 },
    ],
  });

  // Order 5: Pending (chờ giao) — Reserved, Anh Đức
  await createOrder({
    CustomerName: 'Anh Đức - Đại lý Đức Phát',
    Status: 'Pending',
    DeliveryMethod: 'Reserved',
    TotalAmount: 71400000,
    PaidAmount: 30000000, // Đặt cọc 30 triệu
    Note: 'Đơn sỉ gạch + xi măng - đã cọc 30 triệu, chờ giao',
    OrderDate: new Date('2026-04-15'),
    details: [
      { SKU: 'GO-4L', UnitName: 'Pallet', Quantity: 40, UnitPrice: 500000, CostPrice: 480000 },
      { SKU: 'XM-HT-PCB40', UnitName: 'Bao', Quantity: 200, UnitPrice: 88000, CostPrice: 85000 },
      { SKU: 'GC-30-PR', UnitName: 'Thùng', Quantity: 100, UnitPrice: 300000, CostPrice: 180000 },
      { SKU: 'TT-HP-D10', UnitName: 'Cây', Quantity: 100, UnitPrice: 68000, CostPrice: 68000 },
    ],
  });

  // Order 6: Cancelled – khách vãng lai
  await createOrder({
    Status: 'Cancelled',
    DeliveryMethod: 'Immediate',
    TotalAmount: 3500000,
    PaidAmount: 0,
    Note: 'Khách vãng lai huỷ đơn',
    OrderDate: new Date('2026-04-01'),
    details: [
      { SKU: 'DD-CDV-25', UnitName: 'Cuộn', Quantity: 2, UnitPrice: 1050000, CostPrice: 950000 },
      { SKU: 'OC-PNS-02', UnitName: 'Cái', Quantity: 10, UnitPrice: 85000, CostPrice: 65000 },
    ],
  });

  // Order 7: Completed, Reserved – Anh Long – lớn, NỢ
  await createOrder({
    CustomerName: 'Anh Long - CT CP Long Thành',
    Status: 'Completed',
    DeliveryMethod: 'Reserved',
    TotalAmount: 89000000,
    PaidAmount: 50000000, // Nợ 39 triệu
    Note: 'Dự án KĐT Ciputra - công nợ lớn',
    OrderDate: new Date('2026-04-22'),
    details: [
      { SKU: 'XM-HT-PCB40', UnitName: 'Bao', Quantity: 300, UnitPrice: 88000, CostPrice: 85000 },
      { SKU: 'TT-HP-D10', UnitName: 'Cây', Quantity: 500, UnitPrice: 68000, CostPrice: 68000 },
      { SKU: 'GO-4L', UnitName: 'Pallet', Quantity: 20, UnitPrice: 500000, CostPrice: 480000 },
      { SKU: 'CV-XD', UnitName: 'Xe', Quantity: 5, UnitPrice: 2500000, CostPrice: 2300000 },
    ],
  });

  // Order 8: Completed, Immediate – Chị Lan mua thêm – full paid
  await createOrder({
    CustomerName: 'Chị Lan - Nhà thầu Lan Anh',
    Status: 'Completed',
    DeliveryMethod: 'Immediate',
    TotalAmount: 5700000,
    PaidAmount: 5700000,
    Note: 'Mua điện nước bổ sung - trả đủ',
    OrderDate: new Date('2026-05-03'),
    details: [
      { SKU: 'DD-CDV-25', UnitName: 'Cuộn', Quantity: 3, UnitPrice: 1050000, CostPrice: 950000 },
      { SKU: 'OC-PNS-02', UnitName: 'Cái', Quantity: 20, UnitPrice: 85000, CostPrice: 65000 },
      { SKU: 'ONG-BM-D21', UnitName: 'Cây', Quantity: 20, UnitPrice: 32000, CostPrice: 28000 },
    ],
  });

  // Order 9: Pending, Reserved – Anh Tuấn – đặt trước chờ giao
  await createOrder({
    CustomerName: 'Anh Tuấn - CT TNHH Xây Dựng Phú Thịnh',
    Status: 'Pending',
    DeliveryMethod: 'Reserved',
    TotalAmount: 15600000,
    PaidAmount: 10000000,
    Note: 'Đơn xi măng + sơn - đặt trước chờ giao',
    OrderDate: new Date('2026-05-08'),
    details: [
      { SKU: 'XM-HT-PCB40', UnitName: 'Bao', Quantity: 100, UnitPrice: 90000, CostPrice: 85000 },
      { SKU: 'SON-DLX-NT5', UnitName: 'Thùng', Quantity: 8, UnitPrice: 825000, CostPrice: 750000 },
    ],
  });

  // Order 10: Completed – khách vãng lai – full paid
  await createOrder({
    Status: 'Completed',
    DeliveryMethod: 'Immediate',
    TotalAmount: 1920000,
    PaidAmount: 1920000,
    Note: 'Khách vãng lai mua gạch lẻ',
    OrderDate: new Date('2026-05-12'),
    details: [
      { SKU: 'GC-30-PR', UnitName: 'Thùng', Quantity: 5, UnitPrice: 336000, CostPrice: 180000 },
      { SKU: 'OC-PNS-02', UnitName: 'Cái', Quantity: 2, UnitPrice: 85000, CostPrice: 65000 },
    ],
  });

  // ══════════════════════════════════════════════════════════
  // 8. LỊCH SỬ BIẾN ĐỘNG KHO (Inventory Logs 📊)
  // ══════════════════════════════════════════════════════════
  console.log('Creating inventory logs...');

  const logEntries: {
    SKU: string;
    ChangeType: string;
    QuantityType: string;
    ReferenceType: string;
    OldQuantity: number;
    ChangeQuantity: number;
    NewQuantity: number;
    Note: string;
  }[] = [
    // Nhập kho xi măng
    { SKU: 'XM-HT-PCB40', ChangeType: 'IN', QuantityType: 'Physical', ReferenceType: 'StockReceipt', OldQuantity: 200, ChangeQuantity: 300, NewQuantity: 500, Note: 'Nhập kho xi măng HT' },
    { SKU: 'XM-NS-PC50', ChangeType: 'IN', QuantityType: 'Physical', ReferenceType: 'StockReceipt', OldQuantity: 200, ChangeQuantity: 100, NewQuantity: 300, Note: 'Nhập kho xi măng NS' },
    // Xuất kho bán hàng
    { SKU: 'XM-HT-PCB40', ChangeType: 'OUT', QuantityType: 'Physical', ReferenceType: 'Order', OldQuantity: 600, ChangeQuantity: -100, NewQuantity: 500, Note: 'Xuất bán cho Anh Tuấn' },
    { SKU: 'TT-HP-D10', ChangeType: 'OUT', QuantityType: 'Physical', ReferenceType: 'Order', OldQuantity: 1400, ChangeQuantity: -200, NewQuantity: 1200, Note: 'Xuất bán cho Chị Lan' },
    // Đặt hàng Reserved -> ReservedQty
    { SKU: 'GO-4L', ChangeType: 'OUT', QuantityType: 'Reserved', ReferenceType: 'Order', OldQuantity: 0, ChangeQuantity: 2000, NewQuantity: 2000, Note: 'Đặt gạch cho Anh Đức' },
    { SKU: 'XM-HT-PCB40', ChangeType: 'OUT', QuantityType: 'Reserved', ReferenceType: 'Order', OldQuantity: 0, ChangeQuantity: 50, NewQuantity: 50, Note: 'Đặt xi măng Reserved' },
    // Hàng đang về InTransitQty
    { SKU: 'SON-DLX-NT5', ChangeType: 'IN', QuantityType: 'InTransit', ReferenceType: 'StockReceipt', OldQuantity: 0, ChangeQuantity: 20, NewQuantity: 20, Note: 'Sơn đang về từ NCC' },
    { SKU: 'CV-XD', ChangeType: 'IN', QuantityType: 'InTransit', ReferenceType: 'StockReceipt', OldQuantity: 0, ChangeQuantity: 24, NewQuantity: 24, Note: 'Cát đang chuyển về' },
    // Nhập thép
    { SKU: 'TT-HP-D10', ChangeType: 'IN', QuantityType: 'Physical', ReferenceType: 'StockReceipt', OldQuantity: 700, ChangeQuantity: 500, NewQuantity: 1200, Note: 'Nhập thép đợt 2' },
    { SKU: 'TC-PM-D6', ChangeType: 'IN', QuantityType: 'Physical', ReferenceType: 'StockReceipt', OldQuantity: 4000, ChangeQuantity: 1000, NewQuantity: 5000, Note: 'Nhập thép cuộn Pomina' },
  ];

  for (const log of logEntries) {
    await prisma.inventoryLog.create({
      data: {
        StoreID,
        ProductID: products[log.SKU],
        ChangeType: log.ChangeType,
        QuantityType: log.QuantityType,
        ReferenceType: log.ReferenceType,
        OldQuantity: log.OldQuantity,
        ChangeQuantity: log.ChangeQuantity,
        NewQuantity: log.NewQuantity,
        Note: log.Note,
        CreatedBy: UserID,
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // HOÀN TẤT
  // ══════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('✅ Demo data seeded successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Categories:      ${Object.keys(categories).length}`);
  console.log(`   Products:        ${Object.keys(products).length}`);
  console.log(`   Suppliers:       ${Object.keys(suppliers).length}`);
  console.log(`   Customers:       ${Object.keys(customers).length}`);
  console.log(`   Stock Receipts:  6 (2 Pending, 4 Received, 3 còn nợ NCC)`);
  console.log(`   Orders:          10 (7 Completed, 2 Pending, 1 Cancelled)`);
  console.log(`   Order dates:     03–05/2026 (hiển thị trong report)`);
  console.log(`   Inventory Logs:  ${logEntries.length}`);
  console.log('');
  console.log('📌 Tài khoản demo: admin@app.com / 123456');
  console.log('📌 Subdomain:      test');
  console.log('');
  console.log('💰 Công nợ khách hàng:');
  console.log('   - Chị Lan:   nợ 17.6 triệu');
  console.log('   - Anh Hùng:  nợ 7.4 triệu');
  console.log('   - Anh Long:  nợ 39 triệu');
  console.log('   - Anh Đức:   nợ 41.4 triệu (Pending)');
  console.log('   - Anh Tuấn:  nợ 5.6 triệu (Pending)');
  console.log('');
  console.log('💰 Công nợ nhà cung cấp:');
  console.log('   - Đại lý Thép Miền Bắc: nợ 76 triệu');
  console.log('   - VLXD Hoàng Long: nợ 25.6 triệu');
  console.log('   - Sơn & Phụ kiện Thành Đạt: nợ 12.5 triệu');
  console.log('   - Cát Sỏi Bắc Ninh: nợ 18.4 triệu');
  console.log('═══════════════════════════════════════════════');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    if (e instanceof Error) {
      console.error('❌ Demo seed error:', e.message);
    } else {
      console.error('❌ Demo seed error:', String(e));
    }
    await prisma.$disconnect();
    process.exit(1);
  });
