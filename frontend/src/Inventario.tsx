import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, X, Image as ImageIcon, Edit, Trash2, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    unidad_medida: 'UND',
    medidas: '',
    observaciones: '',
    pagina: '',
    stock_minimo: '',
    categoria: 'Consumible'
  });

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

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nombre: '', unidad_medida: 'UND', medidas: '', observaciones: '', pagina: '', stock_minimo: '', categoria: 'Consumible' });
    setFotoFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingId(p.id);
    setFormData({
      nombre: p.nombre,
      unidad_medida: p.unidad_medida,
      medidas: p.medidas || '',
      observaciones: p.observaciones || '',
      pagina: p.pagina || '',
      stock_minimo: p.stock_minimo ? String(p.stock_minimo) : '',
      categoria: p.categoria || 'Consumible'
    });
    setFotoFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este artículo? Se ocultará del sistema.')) {
      try {
        await axios.delete(`/api/productos/${id}`);
        fetchProductos();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let fotoUrl = undefined; // undefined won't update the field in PUT
      if (fotoFile) {
        const fileData = new FormData();
        fileData.append('foto', fotoFile);
        const uploadRes = await axios.post('/api/upload', fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fotoUrl = uploadRes.data.url;
      }

      const payload = { ...formData, ...(fotoUrl && { foto: fotoUrl }) };

      if (editingId) {
        await axios.put(`/api/productos/${editingId}`, payload);
        alert('Artículo actualizado con éxito');
      } else {
        await axios.post('/api/productos', payload);
        alert('Artículo creado con éxito');
      }
      
      setIsModalOpen(false);
      fetchProductos();
    } catch (error) {
      alert('Error al guardar artículo');
    }
  };


  const handleExportExcel = () => {
    // Preparar los datos para Excel
    const dataToExport = productos.map((p) => ({
      'Código Interno': p.codigo || p.id,
      'Categoría': p.categoria || 'Consumible',
      'Nombre del Artículo': p.nombre,
      'Unidad de Medida': p.unidad_medida,
      'Stock Actual': p.stock_actual,
      'Stock Mínimo': p.stock_minimo || 'N/A',
      'Medidas': p.medidas || '-',
      'Página': p.pagina || '-',
      'Observaciones': p.observaciones || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    const columnWidths = [
      { wch: 15 }, // Codigo
      { wch: 20 }, // Categoria
      { wch: 40 }, // Nombre
      { wch: 15 }, // Unidad
      { wch: 15 }, // Stock
      { wch: 15 }, // Stock Min
      { wch: 20 }, // Medidas
      { wch: 10 }, // Pagina
      { wch: 40 }  // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Actual');

    XLSX.writeFile(workbook, 'Inventario_Petroaseo.xlsx');
  };

  const filteredProductos = productos.filter((p: any) => 
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Catálogo de Inventario</h1>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar artículo..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button 
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={20} />

            <span className="hidden sm:inline">Nuevo Artículo</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium w-16">Foto</th>
                <th className="p-4 font-medium">Descripción del Artículo</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Medidas</th>
                <th className="p-4 font-medium text-center">Stock Actual</th>
                <th className="p-4 font-medium">U.M.</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProductos.map((p: any) => {
                const isLowStock = p.stock_minimo !== null && p.stock_actual <= p.stock_minimo;
                return (
                  <tr key={p.id} className={`transition-colors ${isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                    <td className="p-4">
                      {p.foto ? (
                        <img 
                          src={p.foto} 
                          alt={p.nombre} 
                          className="w-10 h-10 object-cover rounded-md border border-gray-200 bg-white cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => setZoomedImage(p.foto)}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-medium">{p.nombre}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${p.categoria === 'EPP' ? 'bg-blue-100 text-blue-800' : 
                          p.categoria === 'Herramienta de Trabajo' ? 'bg-orange-100 text-orange-800' :
                          p.categoria === 'Útiles' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {p.categoria}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{p.medidas || '-'}</td>
                    <td className="p-4 text-sm font-semibold text-center flex justify-center items-center h-full">
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full ${isLowStock ? 'bg-red-200 text-red-800' : p.stock_actual > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {p.stock_actual}
                        </span>
                        {isLowStock && <AlertTriangle size={16} className="text-red-500" title={`Stock por debajo del mínimo (${p.stock_minimo})`} />}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{p.unidad_medida}</td>
                    <td className="p-4 text-sm text-center flex justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(p)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Artículo"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Artículo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProductos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No se encontraron artículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Artículo' : 'Registrar Nuevo Artículo'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                  {fotoFile ? (
                    <img src={URL.createObjectURL(fotoFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : formData.foto ? (
                    <img src={formData.foto} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-gray-400" size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Artículo (Opcional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setFotoFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Artículo</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Alicate de presión"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option value="Consumible">Consumible</option>
                    <option value="EPP">EPP</option>
                    <option value="Herramienta de Trabajo">Herramienta de Trabajo</option>
                    <option value="Útiles">Útiles</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medidas (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 10 pulgadas"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={formData.medidas}
                    onChange={(e) => setFormData({...formData, medidas: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: UND, PAR"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({...formData, unidad_medida: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo (Opcional)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Ej: 5"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Página</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={formData.pagina}
                    onChange={(e) => setFormData({...formData, pagina: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                />
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
                  {editingId ? 'Guardar Cambios' : 'Guardar Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom Imagen */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[60] flex justify-center items-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Zoom" 
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" 
          />
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
          >
            <X size={36} />
          </button>
        </div>
      )}
    </div>
  );
}
