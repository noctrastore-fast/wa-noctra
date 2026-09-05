import { PrismaClient, ProductType, FulfillmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roblox = await prisma.category.upsert({
    where: { slug: 'roblox' },
    update: {},
    create: { name: 'Roblox', slug: 'roblox', emoji: '🎮', sortOrder: 1 },
  });

  const topup = await prisma.category.upsert({
    where: { slug: 'game-topup' },
    update: {},
    create: { name: 'Game Top Up', slug: 'game-topup', emoji: '💎', sortOrder: 2 },
  });

  await prisma.product.upsert({
    where: { sku: 'RBX-1000' },
    update: {},
    create: {
      sku: 'RBX-1000',
      name: 'Robux 1000',
      slug: 'robux-1000',
      description: 'Top up 1000 Robux untuk akun Roblox kamu. Proses cepat dan aman.',
      shortDescription: '1000 Robux',
      price: 150000,
      categoryId: roblox.id,
      stock: 999,
      productType: ProductType.TOPUP,
      fulfillmentType: FulfillmentType.MANUAL,
      isFeatured: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'ML-100' },
    update: {},
    create: {
      sku: 'ML-100',
      name: 'Mobile Legends 100 Diamonds',
      slug: 'ml-100-diamonds',
      description: 'Top up 100 Diamond Mobile Legends. Masuk otomatis ke akun kamu.',
      shortDescription: '100 Diamonds',
      price: 25000,
      categoryId: topup.id,
      stock: 999,
      productType: ProductType.TOPUP,
      fulfillmentType: FulfillmentType.MANUAL,
      isPopular: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
