import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { generateUniqueDisplayId } from '../../src/common/utils/display-id.util';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

/**
 * Backfill DisplayId for stores created before path-based tenant routing.
 * Safe to re-run: only updates rows where DisplayId IS NULL.
 *
 * Usage: npm run prisma:backfill-display-id
 */
async function main(): Promise<void> {
  const stores = await prisma.store.findMany({
    where: { DisplayId: null },
    select: { StoreID: true, StoreName: true },
    orderBy: { StoreID: 'asc' },
  });

  if (stores.length === 0) {
    console.log('All stores already have a DisplayId. Nothing to do.');
    return;
  }

  console.log(`Backfilling DisplayId for ${stores.length} store(s)...`);

  for (const store of stores) {
    const displayId = await generateUniqueDisplayId(prisma.store);
    await prisma.store.update({
      where: { StoreID: store.StoreID },
      data: { DisplayId: displayId },
    });
    console.log(
      `  Store ${store.StoreID} "${store.StoreName}" → DisplayId=${displayId}`,
    );
  }

  console.log('Backfill complete.');
}

main()
  .catch((err: unknown) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
