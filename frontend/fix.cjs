const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Check, Clock, X, Search, FileText } from 'lucide-react';
import Select from 'react-select';

export default function Requerimientos() {
  const [requerimientos, setRequerimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    observaciones: '',
    detalles: [{ producto_id: '', producto_nombre: '', cantidad: 1, isNuevo: false }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, prodRes] = await Promise.all([
        axios.get('http://localhost:3001/api/requerimientos'),
        axios.get('http://localhost:3001/api/productos')
      ]);
      setRequerimientos(reqRes.data);
      setProductos(prodRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addDetalle = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { producto_id: '', producto_nombre: '', cantidad: 1, isNuevo: false }]
    });
  };

  const removeDetalle = (index) => {
    const newDetalles = [...formData.detalles];
    newDetalles.splice(index, 1);
    setFormData({ ...formData, detalles: newDetalles });
  };

  const updateDetalle = (index, field, value) => {
    const newDetalles = [...formData.detalles];
    if (field === 'isNuevo') {
      newDetalles[index].isNuevo = value;
      newDetalles[index].producto_id = '';
      newDetalles[index].producto_nombre = '';
    } else {
      newDetalles[index][field] = value;
    }
    setFormData({ ...formData, detalles: newDetalles });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.detalles.length === 0) return alert('Debe agregar al menos un artículo');
    
    // Preparar payload
    const payload = {
      observaciones: formData.observaciones,
      detalles: formData.detalles.map(d => ({
        producto_id: d.isNuevo ? null : Number(d.producto_id),
        producto_nombre: d.isNuevo ? d.producto_nombre : null,
        cantidad: Number(d.cantidad)
      }))
    };

    try {
      await axios.post('http://localhost:3001/api/requerimientos', payload);
      setIsModalOpen(false);
      setFormData({ observaciones: '', detalles: [{ producto_id: '', producto_nombre: '', cantidad: 1, isNuevo: false }] });
      fetchData();
      alert('Requerimiento creado con éxito');
    } catch (error) {
      alert('Error al crear requerimiento');
    }
  };

  const handleAtender = async (id) => {
    if (confirm('¿Marcar este requerimiento como Atendido?')) {
      try {
        await axios.put(\`http://localhost:3001/api/requerimientos/\${id}/atender\`);
        fetchData();
      } catch (error) {
        alert('Error al actualizar estado');
      }
    }
  };

  const filtered = requerimientos.filter((r) => 
    r.id.toString().includes(search) || 
    (r.observaciones && r.observaciones.toLowerCase().includes(search.toLowerCase()))
  );

  const productoOptions = productos.map((p) => ({ value: p.id, label: p.nombre }));

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Requerimientos de Compra</h1>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar por Nº o texto..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Req.</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium w-24">Req #</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Motivo / Obs.</th>
                <th className="p-4 font-medium">Artículos Solicitados</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-gray-700">REQ-{r.id.toString().padStart(4, '0')}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(r.fecha_creacion).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{r.observaciones || '-'}</td>
                  <td className="p-4">
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {r.detalles.map((d) => (
                        <li key={d.id}>
                          {d.cantidad}x {d.producto ? d.producto.nombre : (d.producto_nombre || 'Artículo Nuevo')}
                          {!d.producto && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Nuevo</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4">
                    {r.estado === 'Pendiente' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={12} />
                        Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check size={12} />
                        Atendido
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {r.estado === 'Pendiente' && (
                      <button 
                        onClick={() => handleAtender(r.id)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition-colors border border-green-200"
                      >
                        Marcar Atendido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay requerimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Generar Nuevo Requerimiento</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 flex flex-col">
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observaciones (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Repuestos para el proyecto X"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  autoFocus
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-700">Artículos a Pedir</h3>
                  <button 
                    type="button" 
                    onClick={addDetalle}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    + Añadir Fila
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.detalles.map((det, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={\`nuevo-\${index}\`}
                          checked={det.isNuevo}
                          onChange={(e) => updateDetalle(index, 'isNuevo', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor={\`nuevo-\${index}\`} className="text-xs text-gray-600 font-medium whitespace-nowrap">¿Artículo Nuevo?</label>
                      </div>

                      <div className="flex-1 w-full" style={{minWidth: '200px'}}>
                        {det.isNuevo ? (
                          <input 
                            type="text" 
                            placeholder="Nombre del artículo nuevo..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                            value={det.producto_nombre}
                            onChange={(e) => updateDetalle(index, 'producto_nombre', e.target.value)}
                            required
                          />
                        ) : (
                          <Select
                            options={productoOptions}
                            value={productoOptions.find(opt => opt.value === Number(det.producto_id)) || null}
                            onChange={(selectedOption) => updateDetalle(index, 'producto_id', selectedOption ? selectedOption.value : '')}
                            placeholder="Escriba para buscar artículo..."
                            isClearable
                            isSearchable
                            required
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderColor: '#D1D5DB',
                                borderRadius: '0.5rem',
                                padding: '1px',
                                boxShadow: 'none',
                                '&:hover': {
                                  borderColor: '#EF4444'
                                }
                              })
                            }}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="number" 
                          min="1"
                          placeholder="Cant."
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                          value={det.cantidad}
                          onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => removeDetalle(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 mt-6 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Crear Requerimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/Requerimientos.tsx', content);
