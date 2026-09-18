const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading Personal Excel file...');
  const wb = xlsx.readFile('../PERSONAL ACTIVO (CONSORCIO PETRO LIMPIO) AL 10.09.26 (1).xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} personal entries. Inserting into database...`);

  const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    if (typeof excelDate === 'number') {
      return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    }
    // If it's a string, try parsing
    const parsed = new Date(excelDate);
    return isNaN(parsed) ? null : parsed;
  };

  for (const row of data) {
    const rawName = row['Apellidos y Nombres'] || '';
    if (!rawName) continue;
    
    const apellidos = rawName; 
    const nombres = '-';

    const dni = row['N° Doc'] ? row['N° Doc'].toString().trim() : '';
    if (!dni) continue;

    const cargo = row['Cargo'] || 'Sin Cargo';
    
    const fecha_ingreso = parseExcelDate(row['Fecha Ingreso']);
    const fecha_cese = parseExcelDate(row['Fecha Cese']);
    const estado = fecha_cese ? 'Cesado' : 'Activo';

    await prisma.personal.upsert({
      where: { dni },
      update: {
        cargo,
        estado,
        apellidos,
        nombres,
        fecha_ingreso,
        fecha_cese
      },
      create: {
        dni,
        nombres,
        apellidos,
        cargo,
        estado,
        fecha_ingreso,
        fecha_cese
      },
    });
  }

  console.log('Personal Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
