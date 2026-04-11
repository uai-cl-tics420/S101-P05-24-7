const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apartments = await prisma.apartment.findMany();
  console.log('--- Apartments ---');
  console.table(apartments);
  
  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: { select: { email: true, apartment: true } } }
  });
  console.log('--- Subscriptions ---');
  console.log(JSON.stringify(subscriptions, null, 2));
}

main();
