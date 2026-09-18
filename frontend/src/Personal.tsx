import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserMinus, UserPlus, Plus, X, Download, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Personal() {
  const [personal, setPersonal] = useState([]);
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCeseModalOpen, setIsCeseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPersonal, setHistoryPersonal] = useState(null);
  const [historyMovimientos, setHistoryMovimientos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [equipamiento, setEquipamiento] = useState([]);
  const [formData, setFormData] = useState({
    dni: '',
    apellidos: '',
    nombres: '',
    cargo: '',
    epps: [] // { producto_id, cantidad, maxStock }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [persRes, prodRes] = await Promise.all([
        axios.get('/api/personal'),
        axios.get('/api/productos')
      ]);
      setPersonal(persRes.data);
      setProductos(prodRes.data.filter(p => p.stock_actual > 0));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRegisterOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/personal/${editingId}`, {
          dni: formData.dni,
          apellidos: formData.apellidos,
          nombres: formData.nombres,
          cargo: formData.cargo
        });
        alert('Personal actualizado con éxito');
      } else {
        await axios.post('/api/personal', formData);
        alert('Personal registrado con éxito');
      }
      closeRegisterModal();
      fetchData();
    } catch (error) {
      alert('Error al guardar personal');
    }
  };

  const openRegisterModal = () => {
    setEditingId(null);
    setFormData({ dni: '', apellidos: '', nombres: '', cargo: '', epps: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setFormData({
      dni: p.dni,
      apellidos: p.apellidos !== '-' ? p.apellidos : '',
      nombres: p.nombres !== '-' ? p.nombres : '',
      cargo: p.cargo,
      epps: [] // No editamos epps iniciales aquí
    });
    setIsModalOpen(true);
  };

  const closeRegisterModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ dni: '', apellidos: '', nombres: '', cargo: '', epps: [] });
  };

  const openCeseModal = async (persona) => {
    setSelectedPersonal(persona);
    try {
      const res = await axios.get(`/api/personal/${persona.id}/equipamiento`);
      // res.data is [{ producto: {...}, cantidad: N }]
      // Map it to add a return field
      setEquipamiento(res.data.map(e => ({ ...e, a_devolver: 0 })));
      setIsCeseModalOpen(true);
    } catch (error) {
      alert('Error obteniendo equipamiento');
    }
  };

  const handleConfirmCese = async (e) => {
    e.preventDefault();
    try {
      const devoluciones = equipamiento
        .filter(e => e.a_devolver > 0)
        .map(e => ({ producto_id: e.producto.id, cantidad: e.a_devolver }));

      await axios.put(`/api/personal/${selectedPersonal.id}/cesar`, { devoluciones });
      setIsCeseModalOpen(false);
      setSelectedPersonal(null);
      fetchData();
      alert('Trabajador cesado correctamente');
    } catch (error) {
      alert('Error al cesar trabajador');
    }
  };

  const handleReactivar = async (id: number) => {
    if (confirm('¿Está seguro de volver a incorporar a esta persona?')) {
      try {
        await axios.put(`/api/personal/${id}/reactivar`);
        fetchData();
      } catch (error) {
        alert('Error al actualizar estado');
      }
    }
  };

  const filteredPersonal = personal.filter(p => 
    p.apellidos.toLowerCase().includes(search.toLowerCase()) || 
    p.dni.includes(search) ||
    p.nombres.toLowerCase().includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    const dataToExport = filteredPersonal.map(p => ({
      "DNI": p.dni,
      "Apellidos y Nombres": p.apellidos !== '-' ? p.apellidos : p.nombres,
      "Cargo": p.cargo,
      "Estado": p.estado,
      "Fecha Ingreso": p.fecha_ingreso ? new Date(p.fecha_ingreso).toLocaleDateString() : '',
      "Fecha Cese": p.fecha_cese ? new Date(p.fecha_cese).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Personal");
    
    worksheet['!cols'] = [{wch: 12}, {wch: 35}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 15}];

    XLSX.writeFile(workbook, "Reporte_Personal.xlsx");
  };

  const addEppToForm = () => {
    setFormData({
      ...formData,
      epps: [...formData.epps, { producto_id: '', cantidad: 1 }]
    });
  };

  const updateEppForm = (index, field, value) => {
    const newEpps = [...formData.epps];
    newEpps[index][field] = value;
    setFormData({ ...formData, epps: newEpps });
  };

  const removeEppForm = (index) => {
    const newEpps = [...formData.epps];
    newEpps.splice(index, 1);
    setFormData({ ...formData, epps: newEpps });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Directorio de Personal</h1>
        
        <div className="flex flex-wrap w-full md:w-auto gap-3">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          <button 
            onClick={openRegisterModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Trabajador</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">N° Doc (DNI)</th>
                <th className="p-4 font-medium">Apellidos y Nombres</th>
                <th className="p-4 font-medium">Cargo</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPersonal.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600 font-medium">{p.dni}</td>
                  <td className="p-4 text-sm text-gray-900">
                    {p.apellidos !== '-' ? p.apellidos : p.nombres} {p.nombres !== '-' && p.apellidos !== '-' ? p.nombres : ''}
                  </td>
                  <td className="p-4 text-sm text-gray-500">{p.cargo}</td>
                  <td className="p-4 text-sm font-semibold">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-center flex justify-center gap-2">
                    <button 
                      onClick={() => openEditModal(p)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Personal"
                    >
                      <Edit size={18} />
                    </button>
                    {p.estado === 'Activo' ? (
                      <button 
                        onClick={() => openCeseModal(p)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Marcar como Cesado"
                      >
                        <UserMinus size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleReactivar(p.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Volver a Incorporar"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPersonal.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No se encontró personal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Trabajador' : 'Registrar Nuevo Trabajador'}</h2>
              <button 
                onClick={closeRegisterModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleRegisterOrUpdate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI / N° Doc</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.dni}
                  onChange={(e) => setFormData({...formData, dni: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.nombres}
                  onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                />
              </div>
              
              
              {!editingId && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Entrega de EPPs / Herramientas</label>
                    <button type="button" onClick={addEppToForm} className="text-sm text-red-600 hover:text-red-700 font-medium">
                      + Añadir Ítem
                    </button>
                  </div>
                  {formData.epps.map((epp, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                      <select
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                        value={epp.producto_id}
                        onChange={(e) => updateEppForm(index, 'producto_id', Number(e.target.value))}
                        required
                      >
                        <option value="">Seleccione artículo...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual})</option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        min="1"
                        className="w-20 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                        value={epp.cantidad}
                        onChange={(e) => updateEppForm(index, 'cantidad', Number(e.target.value))}
                        required
                      />
                      <button type="button" onClick={() => removeEppForm(index)} className="p-2 text-gray-400 hover:text-red-500">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 mt-6 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeRegisterModal}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cese / Devoluciones */}
      {isCeseModalOpen && selectedPersonal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Cesar Trabajador</h2>
              <button 
                onClick={() => setIsCeseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleConfirmCese} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Registrando el cese de <strong>{selectedPersonal.apellidos !== '-' ? selectedPersonal.apellidos : selectedPersonal.nombres}</strong>. 
                Por favor, indique las cantidades devueltas al almacén antes de continuar.
              </p>

              <div className="space-y-3">
                {equipamiento.length === 0 ? (
                  <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">No tiene artículos pendientes por devolver.</p>
                ) : (
                  equipamiento.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-gray-900 text-sm">{item.producto.nombre}</p>
                        <p className="text-xs text-gray-500">Cantidad en su poder: {item.cantidad}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Devuelve:</label>
                        <input 
                          type="number" 
                          min="0"
                          max={item.cantidad}
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-center"
                          value={item.a_devolver}
                          onChange={(e) => {
                            const newEq = [...equipamiento];
                            newEq[index].a_devolver = Number(e.target.value);
                            setEquipamiento(newEq);
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="pt-4 mt-6 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsCeseModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Confirmar Cese
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.tipo === 'Ingreso' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
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
    </div>
  );
}
