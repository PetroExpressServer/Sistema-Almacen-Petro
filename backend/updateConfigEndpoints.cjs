const fs = require('fs');

let content = fs.readFileSync('src/index.ts', 'utf8');

const newEndpoints = `
// --- Configuración e Importación ---

app.post('/api/personal/batch', async (req, res) => {
  const { personal } = req.body;
  if (!personal || !Array.isArray(personal)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }

  try {
    const creados = await prisma.$transaction(
      personal.map((p: any) => prisma.personal.create({
        data: {
          nombres: p.nombres || 'Sin Nombre',
          apellidos: p.apellidos || '',
          cargo: p.cargo || 'Operario',
          estado: 'Activo'
        }
      }))
    );
    res.json({ success: true, count: creados.length });
  } catch (error: any) {
    res.status(400).json({ error: 'Error al importar personal. Revisa el formato.' });
  }
});

app.post('/api/productos/batch', async (req, res) => {
  const { productos } = req.body;
  if (!productos || !Array.isArray(productos)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }

  try {
    const creados = await prisma.$transaction(
      productos.map((p: any) => prisma.producto.create({
        data: {
          nombre: p.nombre || 'Artículo sin nombre',
          categoria: p.categoria || 'Consumible',
          stock_actual: Number(p.stock_actual) || 0,
          stock_minimo: Number(p.stock_minimo) || 0,
          activo: true
        }
      }))
    );
    res.json({ success: true, count: creados.length });
  } catch (error: any) {
    res.status(400).json({ error: 'Error al importar inventario. Revisa el formato.' });
  }
});

app.post('/api/database/reset', async (req, res) => {
  try {
    // EL ORDEN IMPORTA (por las llaves foráneas)
    await prisma.movimiento.deleteMany({});
    await prisma.eventoCalendario.deleteMany({});
    await prisma.producto.deleteMany({});
    await prisma.personal.deleteMany({});
    
    res.json({ success: true, message: 'Base de datos reseteada con éxito' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al intentar limpiar la base de datos' });
  }
});

`;

content = content.replace(
  `// --- Dashboard Stats ---`,
  newEndpoints + `\n// --- Dashboard Stats ---`
);

fs.writeFileSync('src/index.ts', content);
