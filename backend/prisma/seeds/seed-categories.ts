import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export const categoryData = [
  //Vật liệu kết cấu
  { CategoryName: 'Xi măng', Description: 'Xi măng Portland, xi măng hỗn hợp, xi măng trắng' },
  { CategoryName: 'Sắt thép', Description: 'Thép thanh, thép cuộn, thép hình, thép tấm' },
  { CategoryName: 'Dây thép & lưới thép', Description: 'Dây buộc, lưới thép hàn, lưới thép đổ bê tông' },
  { CategoryName: 'Cát sỏi', Description: 'Cát xây dựng, cát san lấp, sỏi, đá dăm' },
  { CategoryName: 'Đá xây dựng', Description: 'Đá granite, đá marble, đá bazan, đá cuội' },

  //Vật liệu xây tường & hoàn thiện bề mặt 
  { CategoryName: 'Gạch xây', Description: 'Gạch nung, gạch không nung, gạch AAC, gạch bê tông' },
  { CategoryName: 'Gạch men & gạch lát', Description: 'Gạch ceramic, gạch porcelain, gạch lát nền, gạch ốp tường' },
  { CategoryName: 'Đá ốp lát', Description: 'Đá tự nhiên, đá nhân tạo, đá marble ốp lát' },
  { CategoryName: 'Tấm thạch cao', Description: 'Tấm thạch cao thường, chịu ẩm, chịu lửa, khung xương' },
  { CategoryName: 'Vữa & phụ gia', Description: 'Vữa xây, vữa trát, vữa tile adhesive, chất phụ gia bê tông' },

  //Mái & sàn
  { CategoryName: 'Tấm lợp & mái', Description: 'Tôn lạnh, tôn màu, ngói xi măng, ngói đất nung, tấm bitum' },
  { CategoryName: 'Sàn gỗ', Description: 'Sàn gỗ tự nhiên, sàn gỗ công nghiệp, sàn gỗ tre' },
  { CategoryName: 'Sàn nhựa & thảm', Description: 'Sàn nhựa vinyl, sàn nhựa giả gỗ, thảm trải sàn' },
  { CategoryName: 'Trần & vật liệu trần', Description: 'Trần thạch cao, trần nhôm, trần PVC, phụ kiện trần' },

  //Cửa & kính
  { CategoryName: 'Cửa gỗ & khung cửa', Description: 'Cửa gỗ tự nhiên, cửa gỗ MDF, cửa HDF, cửa gỗ công nghiệp' },
  { CategoryName: 'Cửa nhôm & cửa sắt', Description: 'Cửa nhôm kính, cửa sắt, cổng sắt, cửa cuốn' },
  { CategoryName: 'Kính', Description: 'Kính cường lực, kính phản quang, kính dán an toàn, kính mờ' },
  { CategoryName: 'Nhôm định hình', Description: 'Thanh nhôm hộp, nhôm góc, nhôm tấm, phụ kiện nhôm' },
  { CategoryName: 'Inox', Description: 'Ống inox, tấm inox, phụ kiện inox, tay vịn inox' },

  //Hệ thống kỹ thuật
  { CategoryName: 'Ống nước & phụ kiện', Description: 'Ống PVC, ống PPR, ống HDPE, co, nối, van' },
  { CategoryName: 'Thiết bị vệ sinh', Description: 'Bồn cầu, lavabo, bồn tắm, vòi sen, bộ xả' },
  { CategoryName: 'Điện & chiếu sáng', Description: 'Dây điện, ổ cắm, công tắc, MCB, đèn LED, đèn ốp trần' },
  { CategoryName: 'Điều hòa & thông gió', Description: 'Điều hòa, quạt thông gió, ống gió, phụ kiện HVAC' },

  //Sơn & chống thấm
  { CategoryName: 'Sơn', Description: 'Sơn nội thất, sơn ngoại thất, sơn lót, sơn epoxy, sơn chịu nhiệt' },
  { CategoryName: 'Vật liệu chống thấm', Description: 'Màng chống thấm, bitum, sika, hóa chất chống thấm' },

  //Vật tư phụ & công cụ
  { CategoryName: 'Keo & chất kết dính', Description: 'Keo silicone, keo epoxy, keo dán gạch, foam bọt nở' },
  { CategoryName: 'Vít đinh & neo', Description: 'Đinh thép, đinh inox, vít gỗ, vít tường, tắc kê nở, bu lông' },
  { CategoryName: 'Dụng cụ cầm tay', Description: 'Búa, cưa, khoan, đục, bay, thước, dụng cụ đo' },
  { CategoryName: 'Thiết bị bảo hộ', Description: 'Mũ bảo hộ, găng tay, kính bảo hộ, giày bảo hộ, dây an toàn' },
];

/**
 * Upsert categories cho một store và trả về map { CategoryName → CategoryID }.
 * Có thể gọi từ seed khác hoặc chạy standalone.
 */
export async function seedCategories(
  prisma: PrismaClient,
  storeId: number,
): Promise<Record<string, number>> {
  const categories: Record<string, number> = {};

  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { StoreID_CategoryName: { StoreID: storeId, CategoryName: cat.CategoryName } },
      update: {},
      create: { StoreID: storeId, ...cat },
    });
    categories[cat.CategoryName] = c.CategoryID;
  }

  return categories;
}

// ── Chạy standalone ─────────────────────────────────────────
async function main() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    const store = await prisma.store.findFirst({ where: { Subdomain: 'test' } });
    if (!store) throw new Error('Store "test" chưa tồn tại. Hãy chạy seed.ts trước.');

    console.log(`Seeding categories for Store "${store.StoreName}"...`);
    const categories = await seedCategories(prisma, store.StoreID);

    console.log(`✅ Seeded ${Object.keys(categories).length} categories:`);
    for (const name of Object.keys(categories)) {
      console.log(`   - ${name} (ID: ${categories[name]})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Chỉ chạy standalone khi gọi trực tiếp file này — tránh side-effect khi import từ seed khác.
const isDirectRun =
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').endsWith('prisma/seeds/seed-categories.ts');

if (isDirectRun) {
  main().catch((e) => {
    console.error('❌ seed-categories error:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
