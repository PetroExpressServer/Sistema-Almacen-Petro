const fs = require('fs');

let content = fs.readFileSync('src/Movimientos.tsx', 'utf8');

// Add search state
content = content.replace(
  'const [personal, setPersonal] = useState([]);',
  `const [personal, setPersonal] = useState([]);\n  const [search, setSearch] = useState('');`
);

// Add download function and filtered list
const downloadFunc = `
  const downloadCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Articulo', 'Personal', 'Cantidad', 'Observaciones'];
    const rows = movimientos.map(m => [
      new Date(m.fecha).toLocaleString(),
      m.tipo,
      m.producto?.nombre || '',
      m.personal ? (m.personal.apellidos !== '-' ? m.personal.apellidos : m.personal.nombres) : '',
      m.cantidad,
      m.observaciones || ''
    ].map(field => \`"\${String(field).replace(/"/g, '""')}"\`));
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'historial_movimientos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = movimientos.filter(m => {
    const term = search.toLowerCase();
    const prod = m.producto?.nombre?.toLowerCase() || '';
    const pers = m.personal ? (m.personal.apellidos !== '-' ? m.personal.apellidos : m.personal.nombres).toLowerCase() : '';
    const obs = m.observaciones?.toLowerCase() || '';
    return prod.includes(term) || pers.includes(term) || obs.includes(term) || m.tipo.toLowerCase().includes(term);
  });
`;

content = content.replace(
  '  return (',
  downloadFunc + '\n  return ('
);

// Add UI: search bar and button
const uiReplace = `          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Historial Reciente</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Buscar (artículo, persona, tipo)..." 
                className="w-full sm:w-64 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button onClick={downloadCSV} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
                Descargar CSV
              </button>
            </div>
          </div>`;

content = content.replace(
  /<div className="p-4 border-b border-gray-100">\s*<h2 className="text-xl font-bold text-gray-800">Historial Reciente<\/h2>\s*<\/div>/g,
  uiReplace
);

// Use 'filtered' instead of 'movimientos' in the table map
content = content.replace(
  /\{movimientos\.map\(\(m\) => \(/g,
  '{filtered.map((m: any) => ('
);
// Also update the empty state check
content = content.replace(
  /\{movimientos\.length === 0 && \(/g,
  '{filtered.length === 0 && ('
);

fs.writeFileSync('src/Movimientos.tsx', content);
