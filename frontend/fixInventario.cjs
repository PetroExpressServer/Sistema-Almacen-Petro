const fs = require('fs');

let content = fs.readFileSync('src/Inventario.tsx', 'utf8');

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

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

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

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Actual');

    XLSX.writeFile(workbook, 'Inventario_Petroaseo.xlsx');
  };
`;

content = content.replace(
  `  const filteredProductos = productos.filter(p => `,
  exportFunc + `\n  const filteredProductos = productos.filter((p: any) => `
);

fs.writeFileSync('src/Inventario.tsx', content);
