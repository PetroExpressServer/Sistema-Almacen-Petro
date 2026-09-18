const fs = require('fs');

let content = fs.readFileSync('src/index.ts', 'utf8');

// Replace the personal create data
content = content.replace(
  `nombres: p.nombres || 'Sin Nombre',
          apellidos: p.apellidos || '',
          cargo: p.cargo || 'Operario',
          estado: 'Activo'`,
  `nombres: p.nombres || 'Sin Nombre',
          apellidos: p.apellidos || '',
          dni: p.dni ? String(p.dni) : '00000000',
          cargo: p.cargo || 'Operario',
          estado: 'Activo'`
);

// Replace the producto create data
content = content.replace(
  `nombre: p.nombre || 'Artículo sin nombre',
          categoria: p.categoria || 'Consumible',
          stock_actual: Number(p.stock_actual) || 0,
          stock_minimo: Number(p.stock_minimo) || 0,
          activo: true`,
  `nombre: p.nombre || 'Artículo sin nombre',
          codigo: p.codigo ? String(p.codigo) : 'S/N',
          categoria: p.categoria || 'Consumible',
          unidad_medida: p.unidad_medida || 'Unidad',
          stock_actual: Number(p.stock_actual) || 0,
          stock_minimo: Number(p.stock_minimo) || 0,
          activo: true`
);

fs.writeFileSync('src/index.ts', content);
