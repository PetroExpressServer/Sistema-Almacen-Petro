const fs = require('fs');

let content = fs.readFileSync('src/index.ts', 'utf8');

const newStatsRoute = `
app.get('/api/stats', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter: any = {};
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    dateFilter = { fecha: { gte: start, lte: end } };
  }

  const totalProductos = await prisma.producto.count({ where: { activo: true }});
  const totalPersonal = await prisma.personal.count({ where: { estado: 'Activo' } });
  
  const movimientosDelPeriodo = await prisma.movimiento.findMany({
    where: dateFilter,
    include: { producto: true }
  });

  const totalMovimientos = movimientosDelPeriodo.length;
  
  let totalEntradas = 0;
  let totalSalidas = 0;
  let totalDevoluciones = 0;
  let mermas = 0;
  let sobrantes = 0;
  
  const consumosPorCategoria: Record<string, number> = {};
  const salidasPorProducto: Record<string, { nombre: string, cantidad: number }> = {};

  movimientosDelPeriodo.forEach(m => {
    if (m.tipo === 'Ingreso') totalEntradas += m.cantidad;
    if (m.tipo === 'Salida') {
      totalSalidas += m.cantidad;
      
      const cat = m.producto?.categoria || 'Consumible';
      consumosPorCategoria[cat] = (consumosPorCategoria[cat] || 0) + m.cantidad;

      if (m.producto) {
        if (!salidasPorProducto[m.producto.id]) {
          salidasPorProducto[m.producto.id] = { nombre: m.producto.nombre, cantidad: 0 };
        }
        salidasPorProducto[m.producto.id].cantidad += m.cantidad;
      }
    }
    if (m.tipo === 'Devolucion' || m.tipo === 'Devolución' || m.tipo === 'Devolución (Cese)') totalDevoluciones += m.cantidad;
    if (m.tipo === 'Ajuste Negativo') mermas += m.cantidad;
    if (m.tipo === 'Ajuste Positivo') sobrantes += m.cantidad;
  });

  const topConsumidos = Object.values(salidasPorProducto)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const productosActivos = await prisma.producto.findMany({ where: { activo: true } });
  const alertasStock = productosActivos
    .filter(p => p.stock_minimo !== null && p.stock_actual <= p.stock_minimo)
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      stock_actual: p.stock_actual,
      stock_minimo: p.stock_minimo,
      categoria: p.categoria
    }));

  const eventosProximos = await prisma.eventoCalendario.findMany({
    where: { estado: 'Pendiente' },
    orderBy: { fecha: 'asc' },
    take: 5
  });

  res.json({
    totalProductos,
    totalPersonal,
    totalMovimientos,
    totalEntradas,
    totalSalidas,
    totalDevoluciones,
    mermas,
    sobrantes,
    consumosPorCategoria,
    topConsumidos,
    alertasStock,
    eventosProximos
  });
});
`;

const startIndex = content.indexOf(`app.get('/api/stats', async (req, res) => {`);
const endIndex = content.lastIndexOf(`app.listen(port, () => {`);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newStatsRoute + '\n' + content.substring(endIndex);
  fs.writeFileSync('src/index.ts', content);
} else {
  console.log("Could not find boundaries");
}
