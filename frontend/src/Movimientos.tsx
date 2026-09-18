import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle, Save, Download } from 'lucide-react';
import Select from 'react-select';

export default function Movimientos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // General Form State
  const [formData, setFormData] = useState({
    tipo: 'Salida',
    personal_id: '',
    observaciones: ''
  });

  // Cart State
  const [cart, setCart] = useState<{producto_id: number, producto_nombre: string, cantidad: number, max: number}[]>([]);
  const [currentItem, setCurrentItem] = useState({ producto_id: '', cantidad: 1 });

  const [lastDelivery, setLastDelivery] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, movRes, persRes] = await Promise.all([
        axios.get('/api/productos'),
        axios.get('/api/movimientos'),
        axios.get('/api/personal')
      ]);
      setProductos(prodRes.data.filter((p: any) => p.activo));
      setMovimientos(movRes.data);
      setPersonal(persRes.data.filter((p: any) => p.estado === 'Activo'));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Check last delivery for the selected worker and item
  useEffect(() => {
    if (formData.tipo === 'Salida' && formData.personal_id && currentItem.producto_id) {
      const pId = Number(currentItem.producto_id);
      const wId = Number(formData.personal_id);
      const salidas = movimientos.filter(m => m.tipo === 'Salida' && m.producto_id === pId && m.personal_id === wId);
      if (salidas.length > 0) {
        salidas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setLastDelivery(salidas[0]);
      } else {
        setLastDelivery(null);
      }
    } else {
      setLastDelivery(null);
    }
  }, [currentItem.producto_id, formData.personal_id, formData.tipo, movimientos]);

  const handleAddToCart = () => {
    if (!currentItem.producto_id || currentItem.cantidad <= 0) return;
    
    const prod = productos.find(p => p.id === Number(currentItem.producto_id));
    if (!prod) return;

    // Check if already in cart
    const existing = cart.find(c => c.producto_id === prod.id);
    let newQty = currentItem.cantidad;
    if (existing) {
      newQty += existing.cantidad;
    }

    // Validation for outputs
    if (formData.tipo === 'Salida' && newQty > prod.stock_actual) {
      alert('No puedes añadir ' + newQty + ' unidades de ' + prod.nombre + '. Stock disponible: ' + prod.stock_actual);
      return;
    }

    if (existing) {
      setCart(cart.map(c => c.producto_id === prod.id ? { ...c, cantidad: newQty } : c));
    } else {
      setCart([...cart, {
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        cantidad: currentItem.cantidad,
        max: prod.stock_actual
      }]);
    }

    setCurrentItem({ producto_id: '', cantidad: 1 });
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(cart.filter(c => c.producto_id !== id));
  };

  const handleSubmitBatch = async () => {
    if (cart.length === 0) {
      alert('La lista de artículos está vacía.');
      return;
    }
    if (isSubmitting) return;

    if (!confirm('¿Registrar ' + formData.tipo + ' de ' + cart.length + ' artículos?')) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tipo: formData.tipo,
        personal_id: formData.personal_id ? Number(formData.personal_id) : null,
        observaciones: formData.observaciones,
        items: cart.map(c => ({
          producto_id: c.producto_id,
          cantidad: c.cantidad
        }))
      };

      await axios.post('/api/movimientos/batch', payload);
      
      // Reset form
      setCart([]);
      setFormData({ ...formData, observaciones: '', personal_id: '' });
      setCurrentItem({ producto_id: '', cantidad: 1 });
      setLastDelivery(null);
      fetchData(); // Refresh data
      alert('Movimientos registrados con éxito');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar el lote de movimientos');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare select options
  const prodOptions = productos.map(p => ({
    value: p.id.toString(),
    label: p.nombre + ' (Stock: ' + p.stock_actual + ')'
  }));

  const persOptions = personal.map(p => ({
    value: p.id.toString(),
    label: p.nombres + ' ' + p.apellidos + ' - ' + p.cargo
  }));

  // Download CSV
  const handleDownloadCSV = () => {
    const headers = ['ID', 'FECHA', 'TIPO', 'ARTÍCULO', 'CANTIDAD', 'ENTREGADO_A', 'OBSERVACIONES'];
    const rows = movimientos.map(m => {
      const p = productos.find(prod => prod.id === m.producto_id);
      const pers = personal.find(pe => pe.id === m.personal_id);
      return [
        m.id,
        new Date(m.fecha).toLocaleString(),
        m.tipo,
        p ? '"' + p.nombre + '"' : 'N/A',
        m.cantidad,
        pers ? '"' + pers.nombres + ' ' + pers.apellidos + '"' : 'N/A',
        '"' + (m.observaciones || '') + '"'
      ].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'historial_movimientos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and paginate table
  const filteredMovs = movimientos.filter(m => {
    const p = productos.find(prod => prod.id === m.producto_id);
    const pName = p ? p.nombre.toLowerCase() : '';
    const pe = personal.find(pers => pers.id === m.personal_id);
    const peName = pe ? (pe.nombres + ' ' + pe.apellidos).toLowerCase() : '';
    const s = search.toLowerCase();
    
    return pName.includes(s) || peName.includes(s) || m.tipo.toLowerCase().includes(s);
  });

  const totalPages = Math.ceil(filteredMovs.length / pageSize) || 1;
  const paginatedMovs = filteredMovs.slice((page - 1) * pageSize, page * pageSize);

  // Auto-cap max stock
  const handleCantidadChange = (val: string) => {
    if (val === '') {
      setCurrentItem({ ...currentItem, cantidad: '' as any });
      return;
    }
    let cant = parseInt(val, 10);
    if (isNaN(cant) || cant < 0) cant = 0;
    
    if (formData.tipo === 'Salida' && currentItem.producto_id) {
      const prod = productos.find(p => p.id === Number(currentItem.producto_id));
      if (prod && cant > prod.stock_actual) {
        cant = prod.stock_actual;
      }
    }
    setCurrentItem({ ...currentItem, cantidad: cant });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Formulario (Carrito) */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-4">
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">1. Datos Generales</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operación</label>
              <select 
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                value={formData.tipo}
                onChange={(e) => {
                  setFormData({...formData, tipo: e.target.value});
                  setCart([]); // Clear cart on type change to prevent logic errors
                }}
              >
                <option value="Salida">Salida (Entrega)</option>
                <option value="Ingreso">Ingreso (Recepción)</option>
                <option value="Devolucion">Devolución (Reingreso)</option>
              </select>
            </div>

            {formData.tipo !== 'Ingreso' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.tipo === 'Salida' ? 'Entregar a (Personal)' : 'Devuelto por (Personal)'}
                </label>
                <Select
                  options={persOptions}
                  isClearable
                  placeholder="Seleccione personal..."
                  value={persOptions.find(o => o.value === formData.personal_id) || null}
                  onChange={(selected) => setFormData({...formData, personal_id: selected ? selected.value : ''})}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea 
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                rows={2}
                placeholder="Motivo del movimiento, # de guía..."
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">2. Añadir Artículos</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artículo</label>
              <Select
                options={prodOptions}
                isClearable
                placeholder="Buscar artículo..."
                value={prodOptions.find(o => o.value === currentItem.producto_id) || null}
                onChange={(selected) => setCurrentItem({...currentItem, producto_id: selected ? selected.value : '', cantidad: 1})}
              />
              {lastDelivery && (
                <div className="mt-2 text-[11px] font-medium text-blue-800 bg-blue-50 px-2 py-1.5 rounded flex items-center gap-1.5 border border-blue-100">
                  <AlertCircle size={12} className="shrink-0" />
                  Última entrega: {new Date(lastDelivery.fecha).toLocaleDateString()} ({lastDelivery.cantidad} unid.)
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                  value={currentItem.cantidad}
                  onChange={(e) => handleCantidadChange(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleAddToCart}
                  disabled={!currentItem.producto_id || currentItem.cantidad < 1}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-bold rounded-lg transition-colors flex items-center gap-2 h-[42px]"
                >
                  <Plus size={18} /> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista / Carrito */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center justify-between">
            3. Lista a procesar
            <span className="bg-red-100 text-red-700 py-0.5 px-2.5 rounded-full text-sm">{cart.length}</span>
          </h2>
          
          <div className="border border-gray-100 rounded-lg max-h-[250px] overflow-y-auto bg-gray-50/50">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No hay artículos en la lista.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cart.map(c => (
                  <li key={c.producto_id} className="p-3 flex justify-between items-center bg-white">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-bold text-gray-800 truncate" title={c.producto_nombre}>{c.producto_nombre}</p>
                      <p className="text-xs text-gray-500 font-medium">{c.cantidad} unidades</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(c.producto_id)}
                      className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button 
            onClick={handleSubmitBatch}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? 'Registrando Lote...' : (
              <>
                <Save size={20} />
                Confirmar {formData.tipo}
              </>
            )}
          </button>
        </div>

      </div>

      {/* Historial Panel */}
      <div className="flex-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-120px)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Historial Reciente</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Buscar (artículo, persona, tipo)..." 
              className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 text-sm flex-1 sm:w-64"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button 
              onClick={handleDownloadCSV}
              className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shrink-0"
              title="Descargar CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Descargar</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1 border border-gray-100 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Artículo</th>
                <th className="p-4 font-semibold">Entregado A</th>
                <th className="p-4 font-semibold text-center">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedMovs.map(m => {
                const p = productos.find(prod => prod.id === m.producto_id);
                const pe = personal.find(pers => pers.id === m.personal_id);
                
                let tipoStyle = 'bg-gray-100 text-gray-800';
                if (m.tipo === 'Ingreso') tipoStyle = 'bg-blue-100 text-blue-800';
                if (m.tipo === 'Salida') tipoStyle = 'bg-orange-100 text-orange-800';
                if (m.tipo.includes('Ajuste')) tipoStyle = 'bg-purple-100 text-purple-800';
                if (m.tipo.includes('Devolución') || m.tipo.includes('Devolucion')) tipoStyle = 'bg-teal-100 text-teal-800';

                return (
                  <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4 whitespace-nowrap text-gray-600">
                      {new Date(m.fecha).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={'px-2 py-1 rounded text-xs font-bold ' + tipoStyle}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{p ? p.nombre : 'Desconocido'}</td>
                    <td className="p-4 text-gray-600 text-xs">
                      {pe ? pe.nombres + ' ' + pe.apellidos : <span className="text-gray-400 italic">No asignado</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-gray-900">{m.cantidad}</td>
                  </tr>
                );
              })}
              {paginatedMovs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No se encontraron movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Mostrando página <span className="font-bold">{page}</span> de <span className="font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
