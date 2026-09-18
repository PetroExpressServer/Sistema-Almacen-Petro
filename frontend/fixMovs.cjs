const fs = require('fs');

let txt = fs.readFileSync('src/Movimientos.tsx', 'utf8');

txt = txt.replace(
  "alert(\\`No puedes añadir \\${newQty} unidades de \\${prod.nombre}. Stock disponible: \\${prod.stock_actual}\\`);",
  "alert('No puedes añadir ' + newQty + ' unidades de ' + prod.nombre + '. Stock disponible: ' + prod.stock_actual);"
);

txt = txt.replace(
  "if (!confirm(\\`¿Registrar \\${formData.tipo} de \\${cart.length} artículos?\\`)) return;",
  "if (!confirm('¿Registrar ' + formData.tipo + ' de ' + cart.length + ' artículos?')) return;"
);

txt = txt.replace(
  "label: \\`\\${p.nombre} (Stock: \\${p.stock_actual})\\`",
  "label: p.nombre + ' (Stock: ' + p.stock_actual + ')'"
);

txt = txt.replace(
  "label: \\`\\${p.nombres} \\${p.apellidos} - \\${p.cargo}\\`",
  "label: p.nombres + ' ' + p.apellidos + ' - ' + p.cargo"
);

txt = txt.replace(
  "className={\\`px-2 py-1 rounded text-xs font-bold \\${tipoStyle}\\`}",
  "className={'px-2 py-1 rounded text-xs font-bold ' + tipoStyle}"
);

// also lines: 139, 143, 144
txt = txt.replace(
  "p ? \\`\\\"\\${p.nombre}\\\"\\` : 'N/A',",
  "p ? '\\\"' + p.nombre + '\\\"' : 'N/A',"
);

txt = txt.replace(
  "pers ? \\`\\\"\\${pers.nombres} \\${pers.apellidos}\\\"\\` : 'N/A',",
  "pers ? '\\\"' + pers.nombres + ' ' + pers.apellidos + '\\\"' : 'N/A',"
);

txt = txt.replace(
  "\\`\\\"\\${m.observaciones || ''}\\\"\\`",
  "'\\\"' + (m.observaciones || '') + '\\\"'"
);

txt = txt.replace(
  "const peName = pe ? \\`\\${pe.nombres} \\${pe.apellidos}\\`.toLowerCase() : '';",
  "const peName = pe ? (pe.nombres + ' ' + pe.apellidos).toLowerCase() : '';"
);

fs.writeFileSync('src/Movimientos.tsx', txt);
