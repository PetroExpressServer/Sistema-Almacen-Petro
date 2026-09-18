const fs = require('fs');

let content = fs.readFileSync('src/Inventario.tsx', 'utf8');

// 1. Imports
content = content.replace(
  `import { Search, Plus, X, Image as ImageIcon, Edit, Trash2, AlertTriangle } from 'lucide-react';`,
  `import { Search, Plus, X, Image as ImageIcon, Edit, Trash2, AlertTriangle, Download } from 'lucide-react';\nimport * as XLSX from 'xlsx';`
);

// 2. Add Export function right before `const filtered = ...` or similar. Let's find a good spot.
// Searching for `const filtered = productos.filter`
const exportFunc = `
  const handleExportExcel = () => {
    // Preparar los datos para Excel
    const dataToExport = productos.map((p) => ({
      'Código Interno': p.codigo || p.id,
      'Categoría': p.categoria || 'Consumible',
      'Nombre del Artículo': p.nombre,
      'Unidad de Medida': p.unidad_medida,
      'Stock Actual': p.stock_actual,
      'Stock Mínimo': p.stock_minimo || 'N/A',
      'Medidas': p.medidas || '-',
      'Página': p.pagina || '-',
      'Observaciones': p.observaciones || '-'
    }));

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Ajustar el ancho de las columnas para que se vea "bien realizado"
    const columnWidths = [
      { wch: 15 }, // Codigo
      { wch: 20 }, // Categoria
      { wch: 40 }, // Nombre
      { wch: 15 }, // Unidad
      { wch: 15 }, // Stock
      { wch: 15 }, // Stock Min
      { wch: 20 }, // Medidas
      { wch: 10 }, // Pagina
      { wch: 40 }  // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    // Crear el libro de trabajo y añadir la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Actual');

    // Generar archivo y descargar
    XLSX.writeFile(workbook, 'Inventario_Petroaseo.xlsx');
  };
`;

content = content.replace(
  `  const filtered = productos.filter(p => `,
  exportFunc + `\n  const filtered = productos.filter(p => `
);

// 3. Add button in UI
const uiBtn = `
            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button 
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={20} />
`;

content = content.replace(
  /<button \s*onClick=\{openCreateModal\}\s*className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"\s*>\s*<Plus size=\{20\} \/>/g,
  uiBtn
);

fs.writeFileSync('src/Inventario.tsx', content);
