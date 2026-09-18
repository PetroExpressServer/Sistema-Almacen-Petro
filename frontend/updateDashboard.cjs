const fs = require('fs');

let content = fs.readFileSync('src/Dashboard.tsx', 'utf8');

// 1. Import AlertTriangle
content = content.replace(
  `import { Package, Users, ArrowRightLeft, PieChart } from 'lucide-react';`,
  `import { Package, Users, ArrowRightLeft, PieChart, AlertTriangle } from 'lucide-react';`
);

// 2. Add alertasStock to the state type
content = content.replace(
  `consumosPorCategoria: {} as Record<string, number>`,
  `consumosPorCategoria: {} as Record<string, number>,
    alertasStock: [] as any[]`
);

// 3. Add the Alerts section right below the top cards
const alertsHtml = `
      {/* Alertas Críticas */}
      {stats.alertasStock && stats.alertasStock.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-red-800 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Atención: Artículos con Stock Crítico
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.alertasStock.map((alerta: any) => (
              <div key={alerta.id} className="bg-white rounded-lg p-4 border border-red-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{alerta.nombre}</p>
                  <p className="text-xs text-gray-500">{alerta.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{alerta.stock_actual}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Min: {alerta.stock_minimo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
`;

content = content.replace(
  `      {/* Sección de Categorías */}`,
  alertsHtml + '\n      {/* Sección de Categorías */}'
);

fs.writeFileSync('src/Dashboard.tsx', content);
