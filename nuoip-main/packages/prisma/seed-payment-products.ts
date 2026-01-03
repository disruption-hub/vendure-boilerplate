// FILE: prisma/seed-payment-products.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PaymentProductSeedData {
  productCode: string;
  name: string;
  description: string;
  baseAmountCents: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

const matpassProducts: PaymentProductSeedData[] = [
  {
    productCode: '01',
    name: 'MATPASS 01',
    description: '1 session of 1 hour - Valid for 30 days',
    baseAmountCents: 6000, // S/ 60.00 * 100
    currency: 'PEN',
    metadata: {
      sessions: 1,
      durationHours: 1,
      validityDays: 30,
      type: 'matpass'
    }
  },
  {
    productCode: '04',
    name: 'MATPASS 04',
    description: '4 sessions of 1 hour each - Valid for 30 days',
    baseAmountCents: 19000, // S/ 190.00 * 100
    currency: 'PEN',
    metadata: {
      sessions: 4,
      durationHours: 1,
      validityDays: 30,
      type: 'matpass'
    }
  },
  {
    productCode: '08',
    name: 'MATPASS 08',
    description: '8 sessions of 1 hour each - Valid for 30 days',
    baseAmountCents: 35000, // S/ 350.00 * 100
    currency: 'PEN',
    metadata: {
      sessions: 8,
      durationHours: 1,
      validityDays: 30,
      type: 'matpass'
    }
  },
  {
    productCode: '12',
    name: 'MATPASS 12',
    description: '12 sessions of 1 hour each - Valid for 30 days',
    baseAmountCents: 42000, // S/ 420.00 * 100
    currency: 'PEN',
    metadata: {
      sessions: 12,
      durationHours: 1,
      validityDays: 30,
      type: 'matpass'
    }
  },
  {
    productCode: '24',
    name: 'MATPASS 24',
    description: '24 sessions of 1 hour each - Valid for 30 days',
    baseAmountCents: 55000, // S/ 550.00 * 100
    currency: 'PEN',
    metadata: {
      sessions: 24,
      durationHours: 1,
      validityDays: 30,
      type: 'matpass'
    }
  }
];

async function main() {
  console.log('🌱 Seeding MATPASS payment products...');

  for (const productData of matpassProducts) {
    try {
      // Check if product already exists
      const existingProduct = await prisma.paymentProduct.findUnique({
        where: { productCode: productData.productCode }
      });

      if (existingProduct) {
        console.log(`⚠️  Product ${productData.productCode} already exists, skipping...`);
        continue;
      }

      // Create the product
      const product = await prisma.paymentProduct.create({
        data: {
          productCode: productData.productCode,
          name: productData.name,
          description: productData.description,
          baseAmountCents: productData.baseAmountCents,
          amountCents: productData.baseAmountCents, // No tax for now
          taxAmountCents: 0,
          priceIncludesTax: true,
          currency: productData.currency,
          isActive: true,
          metadata: productData.metadata
        }
      });

      console.log(`✅ Created product: ${product.name} (${product.productCode}) - ${product.currency} ${(product.baseAmountCents / 100).toFixed(2)}`);
    } catch (error) {
      console.error(`❌ Error creating product ${productData.productCode}:`, error);
    }
  }

  console.log('\n🌱 MATPASS payment products seeding completed!');
  console.log('\n📋 Summary:');
  console.log('Products created: MATPASS 01, 04, 08, 12, 24');
  console.log('Currency: PEN (Peruvian Sol)');
  console.log('All products are active and ready for use');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
