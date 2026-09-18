const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading Excel file...');
  const wb = xlsx.readFile('../Reporte_de_almacen.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} items. Inserting into database...`);

  let count = 0;
  for (const row of data) {
    const nombre = row['DESCRIPCIÓN ARTÍCULO'];
    if (!nombre) continue;

    const cantidad = row['CANTIDAD'] ? parseInt(row['CANTIDAD'], 10) : 0;
    
    // Generate code
    count++;
    const codigo = `PROD-${count.toString().padStart(4, '0')}`;

    const observaciones = row['OBSERVACIONES'] || '';
    const pagina = row['PÁGINA'] ? row['PÁGINA'].toString() : '';

    await prisma.producto.upsert({
      where: { codigo },
      update: {
        observaciones,
        pagina,
        stock_actual: isNaN(cantidad) ? 0 : cantidad,
      },
      create: {
        codigo,
        nombre,
        stock_actual: isNaN(cantidad) ? 0 : cantidad,
        unidad_medida: 'Unidad',
        observaciones,
        pagina,
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
