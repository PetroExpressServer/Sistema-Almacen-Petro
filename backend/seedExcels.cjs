const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function importData() {
  console.log('--- CLEARING DATABASE ---');
  await prisma.movimiento.deleteMany({});
  await prisma.eventoCalendario.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.personal.deleteMany({});

  console.log('--- STARTING IMPORT ---');

  // 1. IMPORTAR INVENTARIO
  const invWorkbook = XLSX.readFile('../Reporte_de_almacen (2).xlsx');
  const invSheet = invWorkbook.Sheets[invWorkbook.SheetNames[0]];
  const invJson = XLSX.utils.sheet_to_json(invSheet);
  
  let invCount = 0;
  for (const row of invJson) {
    const nombre = row['DESCRIPCIÓN ARTÍCULO'] || 'Sin Nombre';
    const categoria = row['TIPO DE ITEM'] || 'Consumible';
    const cantidadStr = row['CANTIDAD'];
    
    let cantidad = 0;
    if (typeof cantidadStr === 'number') {
      cantidad = cantidadStr;
    } else if (typeof cantidadStr === 'string') {
      const parsed = parseInt(cantidadStr, 10);
      if (!isNaN(parsed)) cantidad = parsed;
    }

    try {
      await prisma.producto.create({
        data: {
          codigo: 'ART-' + (invCount + 1).toString().padStart(4, '0'),
          nombre: nombre,
          categoria: categoria,
          unidad_medida: 'Unidad',
          stock_actual: cantidad,
          stock_minimo: null, // As discussed before!
          activo: true
        }
      });
      invCount++;
    } catch (e) {
      console.error('Error importing product:', nombre, e.message);
    }
  }
  console.log("Inventario importado: " + invCount + " articulos.");

  // 2. IMPORTAR PERSONAL
  const perWorkbook = XLSX.readFile('../PERSONAL ACTIVO (CONSORCIO PETRO LIMPIO) AL 10.09.26 (1).xlsx');
  const perSheet = perWorkbook.Sheets[perWorkbook.SheetNames[0]];
  const perJson = XLSX.utils.sheet_to_json(perSheet);

  let perCount = 0;
  for (const row of perJson) {
    const nombresApellidos = row['Apellidos y Nombres'] || '';
    if (!nombresApellidos.trim()) continue;
    
    const parts = nombresApellidos.split(' ');
    let apellidos = '';
    let nombres = '';
    if (parts.length >= 3) {
      apellidos = parts[0] + ' ' + parts[1];
      nombres = parts.slice(2).join(' ');
    } else {
      nombres = nombresApellidos;
    }

    let dni = row['N° Doc'] ? String(row['N° Doc']) : '00000000';
    const existing = await prisma.personal.findUnique({ where: { dni } });
    if (existing) {
       dni = dni + '-' + perCount;
    }

    const cargo = row['Cargo'] || 'Operario';

    try {
      await prisma.personal.create({
        data: {
          dni: dni,
          nombres: nombres,
          apellidos: apellidos,
          cargo: cargo,
          estado: 'Activo'
        }
      });
      perCount++;
    } catch (e) {
      console.error('Error importing personnel:', nombresApellidos, e.message);
    }
  }
  console.log("Personal importado: " + perCount + " trabajadores.");

  console.log('--- IMPORT COMPLETED ---');
}

importData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
