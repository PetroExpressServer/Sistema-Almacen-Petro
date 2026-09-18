const fs = require('fs');

let content = fs.readFileSync('src/Personal.tsx', 'utf8');

// 1. Add state for History modal
content = content.replace(
  '  const [isCeseModalOpen, setIsCeseModalOpen] = useState(false);',
  `  const [isCeseModalOpen, setIsCeseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPersonal, setHistoryPersonal] = useState(null);
  const [historyMovimientos, setHistoryMovimientos] = useState([]);`
);

// 2. Add openHistoryModal function
const historyFunc = `
  const openHistoryModal = async (p) => {
    setHistoryPersonal(p);
    try {
      const res = await axios.get(\`http://localhost:3001/api/movimientos?personal_id=\${p.id}\`);
      setHistoryMovimientos(res.data);
      setIsHistoryModalOpen(true);
    } catch (error) {
      alert('Error cargando el historial');
    }
  };
`;

content = content.replace(
  '  const openCeseModal = async (p) => {',
  historyFunc + '\n  const openCeseModal = async (p) => {'
);

// 3. Add History button to table (Next to Cesar)
const btnRegex = /<button\s+onClick=\{\(\) => openCeseModal\(p\)\}\s+className="p-1\.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"\s+title="Cesar Personal"\s*>\s*<UserMinus size=\{16\} \/>\s*<\/button>/;

content = content.replace(
  btnRegex,
  `<button 
                            onClick={() => openCeseModal(p)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                            title="Cesar Personal"
                          >
                            <UserMinus size={16} />
                          </button>
                          <button 
                            onClick={() => openHistoryModal(p)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-200"
                            title="Ver Entregas"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          </button>`
);

// 4. Add the History Modal at the very end of the file, right before the last closing </div>
const historyModal = `
      {/* Modal de Historial de Entregas */}
      {isHistoryModalOpen && historyPersonal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                Historial de Entregas - {historyPersonal.apellidos !== '-' ? historyPersonal.apellidos : historyPersonal.nombres}
              </h2>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                    <th className="p-4 font-medium">Fecha</th>
                    <th className="p-4 font-medium">Tipo</th>
                    <th className="p-4 font-medium">Articulo</th>
                    <th className="p-4 font-medium">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{new Date(m.fecha).toLocaleString()}</td>
                      <td className="p-4 text-sm">
                        <span className={\`px-2 py-1 rounded-full text-xs font-semibold \${m.tipo === 'Ingreso' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}\`}>
                          {m.tipo === 'Salida' ? 'Entrega' : 'Devolución'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-900">{m.producto?.nombre}</td>
                      <td className="p-4 text-sm font-semibold">{m.cantidad}</td>
                    </tr>
                  ))}
                  {historyMovimientos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No hay registros de entregas para este trabajador.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  '    </div>\n  );\n}',
  historyModal + '    </div>\n  );\n}'
);

fs.writeFileSync('src/Personal.tsx', content);
