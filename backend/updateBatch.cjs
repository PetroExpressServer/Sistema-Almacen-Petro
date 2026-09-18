const fs = require('fs');

let content = fs.readFileSync('src/index.ts', 'utf8');

const batchEndpoint = `
// --- Movimientos en Lote (Batch) ---
app.post('/api/movimientos/batch', async (req, res) => {
  const { tipo, personal_id, observaciones, items } = req.body;
  
  if (!items || !items.length) {
    return res.status(400).json({ error: 'La lista de artículos está vacía' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const movimientosGenerados = [];

      for (const item of items) {
        const prod = await tx.producto.findUnique({ where: { id: item.producto_id } });
        if (!prod) throw new Error(\`Producto \${item.producto_id} no encontrado\`);
        
        let nuevoStock = prod.stock_actual;
        
        if (tipo === 'Ingreso' || tipo === 'Devolucion' || tipo === 'Devolución' || tipo === 'Ajuste Positivo') {
          nuevoStock += item.cantidad;
        } else if (tipo === 'Salida' || tipo === 'Ajuste Negativo') {
          if (nuevoStock < item.cantidad) {
            throw new Error(\`Stock insuficiente para: \${prod.nombre}. Disponible: \${nuevoStock}\`);
          }
          nuevoStock -= item.cantidad;
        }

        await tx.producto.update({
          where: { id: item.producto_id },
          data: { stock_actual: nuevoStock }
        });

        const mov = await tx.movimiento.create({
          data: {
            producto_id: item.producto_id,
            tipo,
            cantidad: item.cantidad,
            personal_id: personal_id || null,
            observaciones
          }
        });
        movimientosGenerados.push(mov);
      }
      return movimientosGenerados;
    });

    res.json({ success: true, movimientos: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al procesar el lote de movimientos' });
  }
});
`;

content = content.replace(
  `app.post('/api/movimientos', async (req, res) => {`,
  batchEndpoint + `\napp.post('/api/movimientos', async (req, res) => {`
);

fs.writeFileSync('src/index.ts', content);
