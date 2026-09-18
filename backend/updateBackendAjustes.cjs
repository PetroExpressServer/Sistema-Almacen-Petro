const fs = require('fs');
let content = fs.readFileSync('src/index.ts', 'utf8');

const ajustesRoute = `
// --- Ajustes de Inventario ---
app.post('/api/ajustes', async (req, res) => {
  const { ajustes, observaciones } = req.body; 

  try {
    const result = await prisma.$transaction(async (tx) => {
      const movimientosGenerados = [];

      for (const adj of ajustes) {
        const prod = await tx.producto.findUnique({ where: { id: adj.producto_id } });
        if (!prod) continue;

        const delta = adj.stock_fisico - prod.stock_actual;
        
        if (delta !== 0) {
          const tipoAjuste = delta > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo';
          const cantidadAbsoluta = Math.abs(delta);

          const mov = await tx.movimiento.create({
            data: {
              producto_id: prod.id,
              tipo: tipoAjuste,
              cantidad: cantidadAbsoluta,
              observaciones: observaciones || \`Ajuste de inventario (Teórico: \${prod.stock_actual}, Físico: \${adj.stock_fisico})\`
            }
          });
          movimientosGenerados.push(mov);

          await tx.producto.update({
            where: { id: prod.id },
            data: { stock_actual: adj.stock_fisico }
          });
        }
      }
      return movimientosGenerados;
    });

    res.json({ success: true, movimientos: result });
  } catch (error) {
    res.status(400).json({ error: 'Error al procesar los ajustes' });
  }
});
`;

content = content.replace(
  '// --- Movimientos ---',
  ajustesRoute + '\n// --- Movimientos ---'
);

// Update stats
content = content.replace(
  '  res.json({',
  `  // KPIs de Ajustes
  const ajustes = await prisma.movimiento.findMany({
    where: { tipo: { in: ['Ajuste Positivo', 'Ajuste Negativo'] } }
  });
  
  let mermas = 0;
  let sobrantes = 0;
  ajustes.forEach(m => {
    if (m.tipo === 'Ajuste Negativo') mermas += m.cantidad;
    if (m.tipo === 'Ajuste Positivo') sobrantes += m.cantidad;
  });

  res.json({`
);

content = content.replace(
  '    eventosProximos',
  '    eventosProximos,\n    mermas,\n    sobrantes'
);

fs.writeFileSync('src/index.ts', content);
