import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Users, Save, RefreshCw, AlertCircle, Package } from 'lucide-react';
import Select from 'react-select';

export default function EntregaMasiva() {
  const [productos, setProductos] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  
  // Cart for items
  const [cart, setCart] = useState<{producto_id: number, producto_nombre: string, cantidad: number, max: number}[]>([]);
  const [currentItem, setCurrentItem] = useState({ producto_id: '', cantidad: 1 });

  // Selectors for target
  const [selectedPersonal, setSelectedPersonal] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, persRes] = await Promise.all([
        axios.get('/api/productos'),
        axios.get('/api/personal')
      ]);
      setProductos(prodRes.data.filter((p: any) => p.activo));
      setPersonal(persRes.data.filter((p: any) => p.estado === 'Activo'));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddToCart = () => {
    if (!currentItem.producto_id || currentItem.cantidad <= 0) return;
    
    const prod = productos.find(p => p.id === Number(currentItem.producto_id));
    if (!prod) return;

    const existing = cart.find(c => c.producto_id === prod.id);
    let newQty = currentItem.cantidad;
    if (existing) {
      newQty += existing.cantidad;
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

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('Debes agregar al menos un artículo a la lista.');
      return;
    }
    if (selectedPersonal.length === 0) {
      alert('Debes seleccionar al menos a un trabajador.');
      return;
    }

    // Client-side validation for total stock needed
    let hasError = false;
    for (const item of cart) {
      const totalNeeded = item.cantidad * selectedPersonal.length;
      if (totalNeeded > item.max) {
        alert('Stock insuficiente de ' + item.producto_nombre + '. Necesitas ' + totalNeeded + ' en total, pero solo hay ' + item.max + ' disponibles.');
        hasError = true;
        break;
      }
    }
    if (hasError) return;

    if (!confirm('¿Registrar la entrega masiva a ' + selectedPersonal.length + ' trabajadores?')) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tipo: 'Salida',
        personal_ids: selectedPersonal.map(p => p.value),
        observaciones: observaciones || 'Entrega masiva de artículos',
        items: cart.map(c => ({
          producto_id: c.producto_id,
          cantidad: c.cantidad
        }))
      };

      await axios.post('/api/movimientos/masivo', payload);
      
      alert('Entrega masiva registrada exitosamente.');
      setCart([]);
      setSelectedPersonal([]);
      setObservaciones('');
      setCurrentItem({ producto_id: '', cantidad: 1 });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al procesar la entrega masiva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prodOptions = productos.map(p => ({
    value: p.id,
    label: p.nombre + ' (Stock: ' + p.stock_actual + ')'
  }));

  const persOptions = personal.map(p => ({
    value: p.id,
    label: p.nombres + ' ' + p.apellidos + ' - ' + p.cargo
  }));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="text-purple-600" size={32} />
          Entrega Masiva de Dotación
        </h1>
        <p className="text-gray-500 mt-1">Arma un kit de artículos y repártelo a varios trabajadores a la vez.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Izquierdo: El Kit */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-gray-400" />
              1. ¿Qué vas a entregar? (Armar Kit)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artículo</label>
                <Select
                  options={prodOptions}
                  isClearable
                  placeholder="Buscar artículo..."
                  value={prodOptions.find(o => o.value === Number(currentItem.producto_id)) || null}
                  onChange={(selected) => setCurrentItem({...currentItem, producto_id: selected ? selected.value.toString() : '', cantidad: 1})}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad por Persona</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                    value={currentItem.cantidad}
                    onChange={(e) => setCurrentItem({...currentItem, cantidad: Math.max(1, parseInt(e.target.value) || 1)})}
                  />
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={!currentItem.producto_id || currentItem.cantidad < 1}
                  className="py-2 px-4 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 text-purple-700 font-bold rounded-lg transition-colors flex items-center gap-2 h-[42px]"
                >
                  <Plus size={18} /> Añadir
                </button>
              </div>
            </div>
            
            {/* Lista Kit */}
            <div className="mt-6 border border-gray-100 rounded-lg overflow-hidden bg-gray-50/50">
              <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 uppercase">
                Artículos en el Kit ({cart.length})
              </div>
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">Añade artículos al kit.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {cart.map(c => (
                    <li key={c.producto_id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{c.producto_nombre}</p>
                        <p className="text-xs text-gray-500 font-medium">{c.cantidad} unidades (por persona)</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromCart(c.producto_id)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Destinatarios y Resumen */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <Users size={20} className="text-gray-400" />
              2. ¿A quiénes? (Destinatarios)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trabajadores seleccionados ({selectedPersonal.length})</label>
                <Select
                  options={persOptions}
                  isMulti
                  closeMenuOnSelect={false}
                  placeholder="Buscar y añadir trabajadores..."
                  value={selectedPersonal}
                  onChange={(selected: any) => setSelectedPersonal(selected || [])}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Globales</label>
                <textarea 
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  rows={2}
                  placeholder="Ej: Renovación de EPP mensual..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Resumen Final */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">3. Confirmación de Entrega</h2>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <p className="text-sm text-orange-800 mb-2">Se entregarán los siguientes totales al descontar de almacén:</p>
              {cart.length === 0 || selectedPersonal.length === 0 ? (
                <p className="text-xs text-orange-600 italic">Termina de armar el kit y seleccionar personal para ver el total.</p>
              ) : (
                <ul className="space-y-1">
                  {cart.map(c => {
                    const req = c.cantidad * selectedPersonal.length;
                    const stockClass = req > c.max ? 'text-red-600 font-bold' : 'text-green-700 font-bold';
                    return (
                      <li key={c.producto_id} className="text-sm flex justify-between border-b border-orange-100/50 pb-1">
                        <span className="text-orange-900">{c.producto_nombre}</span>
                        <span>
                          <span className={stockClass}>{req}</span> <span className="text-orange-700 text-xs">/ {c.max} disp.</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={cart.length === 0 || selectedPersonal.length === 0 || isSubmitting}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
              Confirmar Entrega a {selectedPersonal.length} personas
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
