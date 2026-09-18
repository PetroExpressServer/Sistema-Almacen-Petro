import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `http://localhost:3001/uploads/${req.file.filename}` });
});

// --- Personal ---
app.get('/api/personal', async (req, res) => {
  const personal = await prisma.personal.findMany();
  res.json(personal);
});

app.post('/api/personal', async (req, res) => {
  const { nombres, apellidos, dni, cargo, epps } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.personal.create({
        data: { nombres, apellidos, dni, cargo, estado: 'Activo', fecha_ingreso: new Date() },
      });

      if (epps && Array.isArray(epps)) {
        for (const epp of epps) {
          if (epp.cantidad > 0) {
            await tx.movimiento.create({
              data: {
                tipo: 'Salida',
                cantidad: epp.cantidad,
                observaciones: 'Entrega inicial EPPs/Herramientas',
                producto_id: epp.producto_id,
                personal_id: nuevo.id,
              },
            });
            await tx.producto.update({
              where: { id: epp.producto_id },
              data: { stock_actual: { decrement: epp.cantidad } },
            });
          }
        }
      }
      return nuevo;
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Error al registrar personal' });
  }
});

app.get('/api/personal/:id/equipamiento', async (req, res) => {
  const { id } = req.params;
  const movimientos = await prisma.movimiento.findMany({
    where: { personal_id: Number(id) },
    include: { producto: true },
  });

  const balances: Record<number, any> = {};
  movimientos.forEach(m => {
    if (!balances[m.producto_id]) {
      balances[m.producto_id] = { producto: m.producto, cantidad: 0 };
    }
    if (m.tipo === 'Salida') {
      balances[m.producto_id].cantidad += m.cantidad;
    } else if (m.tipo === 'Ingreso') {
      balances[m.producto_id].cantidad -= m.cantidad;
    }
  });

  // Filtramos solo los que tienen cantidad > 0 (que an no ha devuelto por completo)
  const result = Object.values(balances).filter((b: any) => b.cantidad > 0);
  res.json(result);
});

app.put('/api/personal/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, dni, cargo } = req.body;
  try {
    const actualizado = await prisma.personal.update({
      where: { id: Number(id) },
      data: { nombres, apellidos, dni, cargo },
    });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar personal' });
  }
});

app.put('/api/personal/:id/cesar', async (req, res) => {
  const { id } = req.params;
  const { devoluciones } = req.body; // [{ producto_id, cantidad }]
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (devoluciones && Array.isArray(devoluciones)) {
        for (const dev of devoluciones) {
          if (dev.cantidad > 0) {
            await tx.movimiento.create({
              data: {
                tipo: 'Ingreso',
                cantidad: dev.cantidad,
                observaciones: 'Devolucin por Cese de Personal',
                producto_id: dev.producto_id,
                personal_id: Number(id),
              },
            });
            await tx.producto.update({
              where: { id: dev.producto_id },
              data: { stock_actual: { increment: dev.cantidad } },
            });
          }
        }
      }

      const actualizado = await tx.personal.update({
        where: { id: Number(id) },
        data: { estado: 'Cesado', fecha_cese: new Date() },
      });
      return actualizado;
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Error al cesar personal' });
  }
});

app.put('/api/personal/:id/reactivar', async (req, res) => {
  const { id } = req.params;
  const actualizado = await prisma.personal.update({
    where: { id: Number(id) },
    data: { estado: 'Activo', fecha_cese: null },
  });
  res.json(actualizado);
});

// --- Productos ---
app.get('/api/productos', async (req, res) => {
  const productos = await prisma.producto.findMany({
    where: { activo: true }
  });
  res.json(productos);
});

app.post('/api/productos', async (req, res) => {
  let { codigo, nombre, descripcion, unidad_medida, observaciones, pagina, medidas, foto, stock_minimo, categoria } = req.body;
  if (!codigo) codigo = 'PROD-' + Date.now();
  if (!categoria) categoria = 'Consumible';
  
  const nuevo = await prisma.producto.create({
    data: { 
      codigo, nombre, descripcion, unidad_medida, observaciones, pagina, medidas, foto, categoria,
      stock_minimo: stock_minimo ? Number(stock_minimo) : null
    },
  });
  res.json(nuevo);
});

app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, unidad_medida, observaciones, pagina, medidas, foto, stock_minimo, categoria } = req.body;
  
  try {
    const actualizado = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        nombre, descripcion, unidad_medida, observaciones, pagina, medidas,
        stock_minimo: stock_minimo ? Number(stock_minimo) : null,
        ...(categoria && { categoria }),
        ...(foto !== undefined && { foto })
      }
    });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.producto.update({
      where: { id: Number(id) },
      data: { activo: false }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar producto' });
  }
});


// --- Calendario ---
app.get('/api/calendario', async (req, res) => {
  const eventos = await prisma.eventoCalendario.findMany({
    orderBy: { fecha: 'asc' }
  });
  res.json(eventos);
});

app.post('/api/calendario', async (req, res) => {
  const { titulo, descripcion, fecha } = req.body;
  const evento = await prisma.eventoCalendario.create({
    data: {
      titulo,
      descripcion,
      fecha: new Date(fecha)
    }
  });
  res.json(evento);
});

app.put('/api/calendario/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const evento = await prisma.eventoCalendario.update({
    where: { id: Number(id) },
    data: { estado }
  });
  res.json(evento);
});

app.delete('/api/calendario/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.eventoCalendario.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});


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
              observaciones: observaciones || `Ajuste de inventario (Teórico: ${prod.stock_actual}, Físico: ${adj.stock_fisico})`
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

// --- Movimientos ---
app.get('/api/movimientos', async (req, res) => {
  const { personal_id } = req.query;
  const whereClause = personal_id ? { personal_id: Number(personal_id) } : {};
  const movimientos = await prisma.movimiento.findMany({
    where: whereClause,
    include: { producto: true, personal: true },
    orderBy: { fecha: 'desc' },
  });
  res.json(movimientos);
});


// --- Movimientos en Lote (Batch) ---

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
        if (!prod) throw new Error(`Producto ${item.producto_id} no encontrado`);
        
        const cantidadTotalNecesaria = item.cantidad * numPersonas;
        let nuevoStock = prod.stock_actual;
        
        if (tipo === 'Ingreso' || tipo === 'Devolucion' || tipo === 'Devolución' || tipo === 'Ajuste Positivo') {
          nuevoStock += cantidadTotalNecesaria;
        } else if (tipo === 'Salida' || tipo === 'Ajuste Negativo') {
          if (nuevoStock < cantidadTotalNecesaria) {
            throw new Error(`Stock insuficiente para: ${prod.nombre}. Se requieren ${cantidadTotalNecesaria} unidades (para ${numPersonas} personas), pero solo hay ${nuevoStock} disponibles.`);
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
        if (!prod) throw new Error(`Producto ${item.producto_id} no encontrado`);
        
        let nuevoStock = prod.stock_actual;
        
        if (tipo === 'Ingreso' || tipo === 'Devolucion' || tipo === 'Devolución' || tipo === 'Ajuste Positivo') {
          nuevoStock += item.cantidad;
        } else if (tipo === 'Salida' || tipo === 'Ajuste Negativo') {
          if (nuevoStock < item.cantidad) {
            throw new Error(`Stock insuficiente para: ${prod.nombre}. Disponible: ${nuevoStock}`);
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

app.post('/api/movimientos', async (req, res) => {
  const { producto_id, personal_id, tipo, cantidad, observaciones } = req.body;
  
  // Create transaction to update stock and register movement
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate stock if it's a Salida
      if (tipo === 'Salida') {
        const prod = await tx.producto.findUnique({ where: { id: producto_id } });
        if (!prod || prod.stock_actual < cantidad) {
          throw new Error(`Stock insuficiente. Solo hay ${prod?.stock_actual || 0} disponibles.`);
        }
      }

      const movimiento = await tx.movimiento.create({
        data: {
          producto_id,
          personal_id: personal_id || null,
          tipo,
          cantidad,
          observaciones,
        },
      });

      const incremento = tipo === 'Ingreso' ? cantidad : -cantidad;

      await tx.producto.update({
        where: { id: producto_id },
        data: { stock_actual: { increment: incremento } },
      });

      return movimiento;
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al procesar el movimiento' });
  }
});

// --- Requerimientos ---
app.get('/api/requerimientos', async (req, res) => {
  try {
    const requerimientos = await prisma.requerimiento.findMany({
      include: {
        detalles: {
          include: { producto: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
    res.json(requerimientos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching requerimientos' });
  }
});

app.post('/api/requerimientos', async (req, res) => {
  const { observaciones, detalles } = req.body;
  // detalles: [{ producto_id?, producto_nombre?, cantidad }]
  try {
    const nuevo = await prisma.requerimiento.create({
      data: {
        observaciones,
        detalles: {
          create: detalles.map((d: any) => ({
            producto_id: d.producto_id || null,
            producto_nombre: d.producto_nombre || null,
            cantidad: d.cantidad
          }))
        }
      },
      include: { detalles: true }
    });
    res.json(nuevo);
  } catch (error) {
    res.status(400).json({ error: 'Error creando requerimiento' });
  }
});

app.put('/api/requerimientos/:id/atender', async (req, res) => {
  const { id } = req.params;
  const { detalles } = req.body;

  try {
    let allFullyAttended = true;

    const reqActual = await prisma.requerimiento.findUnique({
      where: { id: Number(id) },
      include: { detalles: true }
    });

    if (!reqActual) return res.status(404).json({ error: 'No encontrado' });

    for (const d of reqActual.detalles) {
      const input = detalles.find((x: any) => x.id === d.id);
      const recibiendo_ahora = input ? Number(input.recibiendo_ahora) : 0;

      if (recibiendo_ahora > 0) {
        await prisma.requerimientoDetalle.update({
          where: { id: d.id },
          data: { cantidad_recibida: { increment: recibiendo_ahora } }
        });

        if (d.producto_id) {
          await prisma.producto.update({
            where: { id: d.producto_id },
            data: { stock_actual: { increment: recibiendo_ahora } }
          });

          await prisma.movimiento.create({
            data: {
              producto_id: d.producto_id,
              tipo: 'Ingreso',
              cantidad: recibiendo_ahora,
              observaciones: `Recepción parcial/completa de Requerimiento Nº ${id}`
            }
          });
        }
      }

      const nuevo_total = d.cantidad_recibida + recibiendo_ahora;
      if (nuevo_total < d.cantidad) {
        allFullyAttended = false;
      }
    }

    const estadoFinal = allFullyAttended ? 'Atendido' : 'Parcialmente Atendido';

    const actualizado = await prisma.requerimiento.update({
      where: { id: Number(id) },
      data: { estado: estadoFinal }
    });
    
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error al actualizar requerimiento' });
  }
});


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
          dni: p.dni ? String(p.dni) : '00000000',
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
          codigo: p.codigo ? String(p.codigo) : 'S/N',
          categoria: p.categoria || 'Consumible',
          unidad_medida: p.unidad_medida || 'Unidad',
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


// --- Dashboard Stats ---

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

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
  });
}

module.exports = app;

