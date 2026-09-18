import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Download, Upload, AlertTriangle, Users, Package, Trash2, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Configuracion() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetCode, setResetCode] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);

  // --- PLANTILLAS ---
  const handleDownloadPersonal = () => {
    const ws = XLSX.utils.json_to_sheet([
      { dni: '12345678', nombres: 'Juan Perez', apellidos: 'Garcia', cargo: 'Operario' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personal');
    XLSX.writeFile(wb, 'Plantilla_Personal.xlsx');
  };

  const handleDownloadInventario = () => {
    const ws = XLSX.utils.json_to_sheet([
      { codigo: 'ART-001', nombre: 'Casco de Seguridad', categoria: 'EPP', unidad_medida: 'Unidad', stock_actual: 50, stock_minimo: 10 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, 'Plantilla_Inventario.xlsx');
  };

  // --- IMPORTACIONES ---
  const readExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUploadPersonal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const data = await readExcel(file);
      if (data.length === 0) throw new Error('El archivo está vacío');
      
      const res = await axios.post('/api/personal/batch', { personal: data });
      alert('Éxito: Se importaron ' + res.data.count + ' trabajadores.');
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Error al importar personal');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // clear input
    }
  };

  const handleUploadInventario = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const data = await readExcel(file);
      if (data.length === 0) throw new Error('El archivo está vacío');
      
      const res = await axios.post('/api/productos/batch', { productos: data });
      alert('Éxito: Se importaron ' + res.data.count + ' artículos.');
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Error al importar inventario');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // clear input
    }
  };

  // --- RESET DB ---
  const handleResetDatabase = async () => {
    if (resetCode !== 'ELIMINAR') {
      alert('Debes escribir la palabra ELIMINAR en mayúsculas para confirmar.');
      return;
    }

    if (!confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción no se puede deshacer.')) return;

    setIsResetting(true);
    try {
      await axios.post('/api/database/reset');
      alert('La base de datos ha sido borrada exitosamente. El sistema está limpio.');
      setResetCode('');
      // Force reload to clean up all app state
      window.location.href = '/';
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reiniciar la base de datos');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Settings className="text-gray-600" size={32} />
          Configuración del Sistema
        </h1>
        <p className="text-gray-500 mt-1">Carga inicial de datos y utilidades de administración avanzada.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Importar Personal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Importar Personal</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">Sube tu lista de trabajadores desde un archivo Excel.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleDownloadPersonal}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> 1. Descargar Plantilla
            </button>
            <label className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-center">
              {isImporting ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />} 
              {isImporting ? 'Importando...' : '2. Subir Archivo'}
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleUploadPersonal} disabled={isImporting} />
            </label>
          </div>
        </div>

        {/* Importar Inventario */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Package size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Importar Inventario</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">Carga todo tu catálogo de artículos y stocks iniciales.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleDownloadInventario}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> 1. Descargar Plantilla
            </button>
            <label className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-center">
              {isImporting ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />} 
              {isImporting ? 'Importando...' : '2. Subir Archivo'}
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleUploadInventario} disabled={isImporting} />
            </label>
          </div>
        </div>
      </div>

      {/* Zona de Peligro */}
      <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-800">Zona de Peligro: Formatear Sistema</h2>
            <p className="text-sm text-red-600 mt-1">Borra toda la información y deja el sistema como nuevo.</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-red-100 flex flex-col md:flex-row gap-4 items-end mt-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-1">Para confirmar, escribe: ELIMINAR</label>
            <input 
              type="text" 
              placeholder="Escribe aquí..." 
              className="w-full p-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 bg-red-50/30"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
            />
          </div>
          <button 
            onClick={handleResetDatabase}
            disabled={resetCode !== 'ELIMINAR' || isResetting}
            className="w-full md:w-auto py-2 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 h-[42px]"
          >
            {isResetting ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} />}
            Borrar Todo
          </button>
        </div>
      </div>

    </div>
  );
}
