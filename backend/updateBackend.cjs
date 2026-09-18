const fs = require('fs');
let content = fs.readFileSync('src/index.ts', 'utf8');

const calendarioRoutes = `
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
`;

content = content.replace(
  '// --- Movimientos ---',
  calendarioRoutes + '\n// --- Movimientos ---'
);

// Update stats to include upcoming events
content = content.replace(
  '  res.json({',
  `  const eventosProximos = await prisma.eventoCalendario.findMany({
    where: { estado: 'Pendiente' },
    orderBy: { fecha: 'asc' },
    take: 5
  });

  res.json({`
);

content = content.replace(
  '    alertasStock',
  '    alertasStock,\n    eventosProximos'
);

fs.writeFileSync('src/index.ts', content);
