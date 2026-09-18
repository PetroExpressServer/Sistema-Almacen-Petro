const fs = require('fs');
let content = fs.readFileSync('src/Dashboard.tsx', 'utf8');

// Imports
content = content.replace(
  `import { Package, Users, ArrowRightLeft, PieChart, AlertTriangle, Calendar, Clock } from 'lucide-react';`,
  `import { Package, Users, ArrowRightLeft, PieChart, AlertTriangle, Calendar, Clock, TrendingDown, TrendingUp } from 'lucide-react';`
);

// State
content = content.replace(
  `eventosProximos: [] as any[]`,
  `eventosProximos: [] as any[],
    mermas: 0,
    sobrantes: 0`
);

// KPIs Block
const kpisBlock = `
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <Scale size={16} /> Ajustes de Inventario
          </p>
          <div className="flex justify-between mt-auto">
            <div>
              <p className="text-xs text-red-500 font-bold flex items-center gap-1"><TrendingDown size={14} /> Mermas</p>
              <p className="text-xl font-bold text-gray-900">{stats.mermas || 0}</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <p className="text-xs text-green-500 font-bold flex items-center gap-1"><TrendingUp size={14} /> Sobrantes</p>
              <p className="text-xl font-bold text-gray-900">{stats.sobrantes || 0}</p>
            </div>
          </div>
        </div>
`;

// Oh wait, `Scale` is not imported. I need to add `Scale` to imports.
content = content.replace(
  `TrendingDown, TrendingUp } from 'lucide-react';`,
  `TrendingDown, TrendingUp, Scale } from 'lucide-react';`
);

// We need to inject this new card in the top grid. The top grid has 3 columns:
// <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
// Let's change it to 4 columns:
content = content.replace(
  `grid-cols-1 md:grid-cols-3`,
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
);

// And inject the kpisBlock at the end of that grid.
// Find the closing div of the Movimientos card:
//            <p className="text-2xl font-bold text-gray-900">{stats.totalMovimientos}</p>
//          </div>
//        </div>
content = content.replace(
  `            <p className="text-2xl font-bold text-gray-900">{stats.totalMovimientos}</p>\n          </div>\n        </div>`,
  `            <p className="text-2xl font-bold text-gray-900">{stats.totalMovimientos}</p>\n          </div>\n        </div>\n` + kpisBlock
);

fs.writeFileSync('src/Dashboard.tsx', content);
