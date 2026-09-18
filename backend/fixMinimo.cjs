const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const res = await prisma.producto.updateMany({
    where: { stock_minimo: 0 },
    data: { stock_minimo: null }
  });
  console.log('Updated', res.count, 'items to null stock_minimo');
}
fix().finally(() => prisma.$disconnect());
