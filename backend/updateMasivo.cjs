const fs = require('fs');

let content = fs.readFileSync('src/index.ts', 'utf8');

const masivoEndpoint = `
// --- Movimientos Masivos (Varios trabajadores) ---
app.post('/api/movimientos/masivo', async (req, res) => {
  const { tipo, personal_ids, observaciones, items } = req.body;
  
  if (!items || !items.length) return res.status(400).json({ error: 'La lista de artículos está vacía' });
  if (!personal_ids || !personal_ids.length) return res.status(400).json({ error: 'No ha seleccionado a ningún trabajador' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const movimientosGenerados = [];
      const numPersonas = personal_ids.length;

      // 1. Verificar stock y actualizar
      for (const item of items) {
        const prod = await tx.producto.findUnique({ where: { id: item.producto_id } });
        if (!prod) throw new Error(\`Producto \${item.producto_id} no encontrado\`);
        
        const cantidadTotalNecesaria = item.cantidad * numPersonas;
        let nuevoStock = prod.stock_actual;
        
        if (tipo === 'Ingreso' || tipo === 'Devolucion' || tipo === 'Devolución' || tipo === 'Ajuste Positivo') {
          nuevoStock += cantidadTotalNecesaria;
        } else if (tipo === 'Salida' || tipo === 'Ajuste Negativo') {
          if (nuevoStock < cantidadTotalNecesaria) {
            throw new Error(\`Stock insuficiente para: \${prod.nombre}. Se requieren \${cantidadTotalNecesaria} unidades (para \${numPersonas} personas), pero solo hay \${nuevoStock} disponibles.\`);
          }
          nuevoStock -= cantidadTotalNecesaria;
        }

        await tx.producto.update({
          where: { id: item.producto_id },
          data: { stock_actual: nuevoStock }
        });

        // 2. Generar el movimiento para CADA trabajador
        for (const pId of personal_ids) {
          const mov = await tx.movimiento.create({
            data: {
              producto_id: item.producto_id,
              tipo,
              cantidad: item.cantidad, // La cantidad es por persona
              personal_id: pId,
              observaciones
            }
          });
          movimientosGenerados.push(mov);
        }
      }
      return movimientosGenerados;
    });

    res.json({ success: true, movimientos: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al procesar la entrega masiva' });
  }
});
`;

content = content.replace(
  `app.post('/api/movimientos/batch', async (req, res) => {`,
  masivoEndpoint + `\napp.post('/api/movimientos/batch', async (req, res) => {`
);

fs.writeFileSync('src/index.ts', content);
