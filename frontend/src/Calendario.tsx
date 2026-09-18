import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Plus, X, Check, Trash2, Clock } from 'lucide-react';

export default function Calendario() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: ''
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const res = await axios.get('/api/calendario');
      setEventos(res.data);
    } catch (error) {
      console.error('Error fetching eventos:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/calendario', formData);
      setIsModalOpen(false);
      setFormData({ titulo: '', descripcion: '', fecha: '' });
      fetchEventos();
    } catch (error) {
      alert('Error al crear evento');
    }
  };

  const handleToggleEstado = async (id: number, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'Pendiente' ? 'Completado' : 'Pendiente';
    try {
      await axios.put(`/api/calendario/${id}`, { estado: nuevoEstado });
      fetchEventos();
    } catch (error) {
      alert('Error al actualizar evento');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
      try {
        await axios.delete(`/api/calendario/${id}`);
        fetchEventos();
      } catch (error) {
        alert('Error al eliminar evento');
      }
    }
  };

  const formatFecha = (fechaStr: string) => {
    const d = new Date(fechaStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <CalendarIcon className="text-blue-600" size={32} />
          Calendario de Renovaciones
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nuevo Evento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {eventos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay eventos programados.</p>
            <p className="text-sm mt-1">Usa el botón superior para crear uno nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Fecha</th>
                  <th className="p-4 font-medium">Evento</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventos.map((e) => {
                  const isCompletado = e.estado === 'Completado';
                  return (
                    <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${isCompletado ? 'opacity-60' : ''}`}>
                      <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {formatFecha(e.fecha)}
                      </td>
                      <td className="p-4">
                        <p className={`font-semibold text-gray-900 ${isCompletado ? 'line-through text-gray-500' : ''}`}>
                          {e.titulo}
                        </p>
                        {e.descripcion && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{e.descripcion}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isCompletado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                          {isCompletado ? <Check size={12} /> : <Clock size={12} />}
                          {e.estado}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleToggleEstado(e.id, e.estado)}
                            className={`p-1.5 rounded-lg transition-colors border ${isCompletado ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'}`}
                            title={isCompletado ? "Marcar Pendiente" : "Marcar Completado"}
                          >
                            {isCompletado ? <Clock size={18} /> : <Check size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                            title="Eliminar Evento"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Nuevo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del Evento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Renovación de Cascos Cuadrilla 2"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
                <textarea 
                  rows={3}
                  placeholder="Personal involucrado, equipos a renovar..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                ></textarea>
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
