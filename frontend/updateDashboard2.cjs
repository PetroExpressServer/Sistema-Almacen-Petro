const fs = require('fs');
let content = fs.readFileSync('src/Dashboard.tsx', 'utf8');

// Import Calendar Icon
content = content.replace(
  `import { Package, Users, ArrowRightLeft, PieChart, AlertTriangle } from 'lucide-react';`,
  `import { Package, Users, ArrowRightLeft, PieChart, AlertTriangle, Calendar, Clock } from 'lucide-react';`
);

// Add eventosProximos to state
content = content.replace(
  `alertasStock: [] as any[]`,
  `alertasStock: [] as any[],
    eventosProximos: [] as any[]`
);

// The widget
const widget = `
      {/* Próximas Renovaciones */}
      {stats.eventosProximos && stats.eventosProximos.length > 0 && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            Próximas Renovaciones y Eventos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.eventosProximos.map((evento: any) => {
              const f = new Date(evento.fecha);
              const hoy = new Date();
              const diffTime = f.getTime() - hoy.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let statusText = "";
              let statusColor = "";
              if (diffDays < 0) {
                statusText = \`Vencido hace \${Math.abs(diffDays)} días\`;
                statusColor = "text-red-600";
              } else if (diffDays === 0) {
                statusText = "Hoy";
                statusColor = "text-orange-600 font-bold";
              } else if (diffDays <= 3) {
                statusText = \`En \${diffDays} días\`;
                statusColor = "text-orange-500 font-bold";
              } else {
                statusText = \`Faltan \${diffDays} días\`;
                statusColor = "text-blue-600";
              }

              return (
                <div key={evento.id} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-800 text-sm line-clamp-1" title={evento.titulo}>{evento.titulo}</p>
                      <span className={\`text-xs \${statusColor} whitespace-nowrap ml-2\`}>{statusText}</span>
                    </div>
                    {evento.descripcion && <p className="text-xs text-gray-500 line-clamp-1 mb-2">{evento.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-2 pt-2 border-t border-gray-50">
                    <Clock size={12} />
                    {f.toLocaleDateString()} a las {f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
`;

content = content.replace(
  `      {/* Sección de Categorías */}`,
  widget + '\n      {/* Sección de Categorías */}'
);

fs.writeFileSync('src/Dashboard.tsx', content);
