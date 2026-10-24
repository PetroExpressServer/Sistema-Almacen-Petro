import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, CheckCircle2, UserX, Edit3, X, Download, Save, Lock, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Casilleros() {
  const [personal, setPersonal] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'con' | 'sin'>('todos');
  
  // Modal for assigning / editing locker
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [lockerInput, setLockerInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/personal');
      setPersonal(res.data);
    } catch (error) {
      console.error('Error fetching personal:', error);
    }
  };

  const openAssignModal = (p: any) => {
    setSelectedPerson(p);
    setLockerInput(p.casillero || '');
    setIsModalOpen(true);
  };

  const handleSaveLocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    setIsSaving(true);
    try {
      await axios.put(`/api/personal/${selectedPerson.id}/casillero`, {
        casillero: lockerInput
      });
      setIsModalOpen(false);
      setSelectedPerson(null);
      fetchData();
    } catch (error) {
      alert('Error al guardar número de casillero');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLocker = async () => {
    if (!selectedPerson) return;
    if (!confirm(`¿Deseas desasignar el casillero de ${selectedPerson.apellidos !== '-' ? selectedPerson.apellidos : selectedPerson.nombres}?`)) return;
    setIsSaving(true);
    try {
      await axios.put(`/api/personal/${selectedPerson.id}/casillero`, {
        casillero: null
      });
      setIsModalOpen(false);
      setSelectedPerson(null);
      fetchData();
    } catch (error) {
      alert('Error al liberar casillero');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if current input conflicts with another worker
  const conflictingPerson = lockerInput.trim() !== '' && selectedPerson
    ? personal.find(p => p.id !== selectedPerson.id && p.casillero && p.casillero.toLowerCase() === lockerInput.trim().toLowerCase())
    : null;

  // Statistics
  const totalPersonal = personal.length;
  const conCasillero = personal.filter(p => p.casillero && p.casillero.trim() !== '').length;
  const sinCasillero = totalPersonal - conCasillero;

  // Filtered personal
  const filteredPersonal = personal.filter(p => {
    const hasLocker = Boolean(p.casillero && p.casillero.trim() !== '');
    if (filterType === 'con' && !hasLocker) return false;
    if (filterType === 'sin' && hasLocker) return false;

    const s = search.toLowerCase();
    const fullName = `${p.apellidos} ${p.nombres}`.toLowerCase();
    const dni = p.dni || '';
    const cargo = (p.cargo || '').toLowerCase();
    const cas = (p.casillero || '').toLowerCase();

    return fullName.includes(s) || dni.includes(s) || cargo.includes(s) || cas.includes(s);
  });

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredPersonal.map(p => ({
      'DNI': p.dni,
      'Apellidos y Nombres': p.apellidos !== '-' ? `${p.apellidos} ${p.nombres}` : p.nombres,
      'Cargo': p.cargo,
      'Estado': p.estado,
      'Casillero': p.casillero || 'Sin Asignar'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Casilleros');
    XLSX.writeFile(workbook, 'Reporte_Casilleros.xlsx');
  };

  return (
    <div className="p-2 sm:p-3 lg:p-4 w-full">
      
      {/* Title & Stats Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lock className="text-red-600" size={24} />
            Gestión de Casilleros
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Asignación y control de casilleros para el personal de operaciones</p>
        </div>

        <button 
          onClick={exportToExcel}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Download size={16} />
          <span>Exportar a Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div 
          onClick={() => setFilterType('todos')}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
            filterType === 'todos' ? 'bg-white border-red-500 shadow-sm ring-1 ring-red-500' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Personal</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalPersonal}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Personal registrado en almacén</p>
        </div>

        <div 
          onClick={() => setFilterType('con')}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
            filterType === 'con' ? 'bg-white border-green-500 shadow-sm ring-1 ring-green-500' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={14} /> Con Casillero
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
              {totalPersonal > 0 ? Math.round((conCasillero / totalPersonal) * 100) : 0}%
            </span>
          </div>
          <p className="text-2xl font-black text-green-600 mt-1">{conCasillero}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Operarios con casillero asignado</p>
        </div>

        <div 
          onClick={() => setFilterType('sin')}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
            filterType === 'sin' ? 'bg-white border-amber-500 shadow-sm ring-1 ring-amber-500' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <UserX size={14} /> Sin Casillero
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {sinCasillero} pendientes
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{sinCasillero}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Operarios pendientes de asignación</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-100 mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'todos' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({totalPersonal})
          </button>
          <button
            onClick={() => setFilterType('con')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              filterType === 'con' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <CheckCircle2 size={14} /> Con Casillero ({conCasillero})
          </button>
          <button
            onClick={() => setFilterType('sin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              filterType === 'sin' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <UserX size={14} /> Sin Casillero ({sinCasillero})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI, casillero..." 
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-2.5 top-2 sm:top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-3.5 py-2.5 font-semibold">N° Casillero</th>
                <th className="px-3.5 py-2.5 font-semibold">DNI</th>
                <th className="px-3.5 py-2.5 font-semibold">Apellidos y Nombres</th>
                <th className="px-3.5 py-2.5 font-semibold">Cargo</th>
                <th className="px-3.5 py-2.5 font-semibold">Estado</th>
                <th className="px-3.5 py-2.5 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {filteredPersonal.map((p) => {
                const hasLocker = Boolean(p.casillero && p.casillero.trim() !== '');
                return (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3.5 py-2.5">
                      {hasLocker ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-2xs">
                          <Lock size={12} className="text-indigo-500" />
                          Casillero {p.casillero}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          Sin Asignar
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-600 font-mono text-xs">{p.dni}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-gray-900">
                      {p.apellidos !== '-' ? `${p.apellidos} ${p.nombres}` : p.nombres}
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-500 text-xs">{p.cargo}</td>
                    <td className="px-3.5 py-2.5 font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${p.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button 
                        onClick={() => openAssignModal(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                          hasLocker 
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200' 
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        <Edit3 size={13} />
                        {hasLocker ? 'Cambiar' : 'Asignar Casillero'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPersonal.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">
                    No se encontraron trabajadores con los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Asignar / Cambiar Casillero */}
      {isModalOpen && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <Lock size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Asignar Casillero</h2>
                  <p className="text-[11px] text-gray-500">
                    {selectedPerson.apellidos !== '-' ? `${selectedPerson.apellidos} ${selectedPerson.nombres}` : selectedPerson.nombres}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLocker} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Número o Código de Casillero
                </label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej: 1, 15, C-04, Bloque A-12..."
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={lockerInput}
                  onChange={(e) => setLockerInput(e.target.value)}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Puedes escribir un número, serie o código libremente según tu numeración.
                </p>
              </div>

              {conflictingPerson && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                  <ShieldAlert size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Advertencia:</span> El casillero <span className="font-bold">{lockerInput}</span> ya figura asignado a:
                    <p className="font-semibold text-amber-900 mt-0.5">
                      {conflictingPerson.apellidos !== '-' ? `${conflictingPerson.apellidos} ${conflictingPerson.nombres}` : conflictingPerson.nombres} ({conflictingPerson.dni})
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {selectedPerson.casillero && (
                  <button 
                    type="button"
                    onClick={handleClearLocker}
                    disabled={isSaving}
                    className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Liberar / Quitar
                  </button>
                )}
                <div className="flex-1 flex gap-2 justify-end">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save size={14} />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
