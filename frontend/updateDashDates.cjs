const fs = require('fs');

let content = fs.readFileSync('src/Dashboard.tsx', 'utf8');

// 1. Add Custom State
content = content.replace(
  `const [dateFilter, setDateFilter] = useState('Mes'); // Hoy, Semana, Mes, Historico`,
  `const [dateFilter, setDateFilter] = useState('Mes');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');`
);

// 2. Add Personalizado logic in useEffect
content = content.replace(
  `} else if (dateFilter === 'Mes') {`,
  `} else if (dateFilter === 'Mes') {`
);

content = content.replace(
  `        }

        if (startDate) {`,
  `        } else if (dateFilter === 'Personalizado') {
          if (!customStartDate || !customEndDate) return; // No fetch until both are set
          startDate = new Date(customStartDate).toISOString();
          endDate = new Date(customEndDate).toISOString();
        }

        if (startDate) {`
);

// 3. Update useEffect dependencies
content = content.replace(
  `  }, [dateFilter]);`,
  `  }, [dateFilter, customStartDate, customEndDate]);`
);

// 4. Update UI in Header
const newFilterUI = `
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {dateFilter === 'Personalizado' && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
              <input 
                type="date" 
                className="p-1.5 text-sm border-none focus:outline-none text-gray-600 bg-transparent" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <span className="text-gray-400 text-sm">a</span>
              <input 
                type="date" 
                className="p-1.5 text-sm border-none focus:outline-none text-gray-600 bg-transparent" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          )}
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <Filter size={18} className="text-gray-400 ml-2" />
            <select 
              className="p-2 bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 cursor-pointer"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="Hoy">Hoy</option>
              <option value="Semana">Última Semana</option>
              <option value="Mes">Este Mes</option>
              <option value="Historico">Todo el Histórico</option>
              <option value="Personalizado">Rango Específico...</option>
            </select>
          </div>
        </div>
`;

content = content.replace(
  /<div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* 4 Cards/g,
  newFilterUI.trim() + '\n      </div>\n      \n      {/* 4 Cards'
);

fs.writeFileSync('src/Dashboard.tsx', content);
