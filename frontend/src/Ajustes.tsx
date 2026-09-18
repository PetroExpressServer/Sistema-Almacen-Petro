import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scale, Save, Search, AlertCircle, RefreshCw } from 'lucide-react';

export default function Ajustes() {
  const [productos, setProductos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [ajustes, setAjustes] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await axios.get('/api/productos');
      setProductos(res.data);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  };

  const handleAjusteChange = (id: number, value: string) => {
    const num = parseInt(value, 10);
    setAjustes(prev => ({
      ...prev,
      [id]: isNaN(num) ? '' : num
    }));
  };

  const handleSubmit = async () => {
    const payload = Object.entries(ajustes)
      .map(([id, stock_fisico]) => ({
        producto_id: Number(id),
        stock_fisico: Number(stock_fisico)
      }))
      .filter(item => {
        const prod = productos.find(p => p.id === item.producto_id);
        return prod && item.stock_fisico !== '' && item.stock_fisico !== prod.stock_actual;
      });

    if (payload.length === 0) {
      alert('No hay ajustes reales que aplicar. Todos los conteos coinciden con el stock teórico o están vacíos.');
      return;
    }

    if (!confirm('¿Estás seguro de aplicar ' + payload.length + ' ajuste(s)? Esto generará movimientos de almacén permanentes.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/ajustes', {
        ajustes: payload,
        observaciones
      });
      alert('Ajustes aplicados correctamente.');
      setAjustes({});
      setObservaciones('');
      fetchProductos();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al aplicar ajustes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = productos.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const numCambios = Object.entries(ajustes).filter(([id, val]) => {
    const prod = productos.find(p => p.id === Number(id));
    return prod && val !== '' && val !== prod.stock_actual;
  }).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Scale className="text-purple-600" size={32} />
            Ajustes de Inventario (Físico)
          </h1>
          <p className="text-gray-500 mt-1">Ingresa el conteo físico real. El sistema calculará mermas y sobrantes.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={numCambios === 0 || isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
          Aplicar {numCambios} Ajuste(s)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center bg-gray-50">
          <div className="relative w-full sm:w-96">
            <input 
              type="text" 
              placeholder="Buscar artículo o categoría..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <div className="w-full sm:flex-1">
            <input 
              type="text" 
              placeholder="Observación general para este conteo (Opcional)" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                <th className="p-4 font-semibold">Artículo</th>
                <th className="p-4 font-semibold text-center w-32">Stock Teórico</th>
                <th className="p-4 font-semibold text-center w-40 bg-purple-50">Conteo Físico</th>
                <th className="p-4 font-semibold text-center w-32">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const inputVal = ajustes[p.id];
                const hasInput = inputVal !== undefined && inputVal !== '';
                const diff = hasInput ? (inputVal - p.stock_actual) : 0;
                const isChanged = diff !== 0;

                return (
                  <tr key={p.id} className={'hover:bg-gray-50 transition-colors ' + (isChanged ? 'bg-purple-50/30' : '')}>
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.categoria}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-lg">
                        {p.stock_actual}
                      </span>
                    </td>
                    <td className="p-4 text-center bg-purple-50/20">
                      <input 
                        type="number"
                        min="0"
                        placeholder="--"
                        className={'w-24 p-2 text-center text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ' + (isChanged ? 'border-purple-500 bg-white text-purple-700' : 'border-gray-300 bg-white')}
                        value={inputVal !== undefined ? inputVal : ''}
                        onChange={(e) => handleAjusteChange(p.id, e.target.value)}
                      />
                    </td>
                    <td className="p-4 text-center">
                      {isChanged ? (
                        <div className={'flex items-center justify-center gap-1 font-bold ' + (diff > 0 ? 'text-green-600' : 'text-red-600')}>
                          {diff > 0 ? '+' : ''}{diff}
                          {diff < 0 && <AlertCircle size={14} className="ml-1" />}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No se encontraron artículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
