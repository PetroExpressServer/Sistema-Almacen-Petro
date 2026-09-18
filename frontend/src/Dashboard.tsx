import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Users, ArrowRightLeft, PieChart, AlertTriangle, Calendar, Clock, TrendingDown, TrendingUp, BarChart3, Filter, ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({ 
    totalProductos: 0, 
    totalPersonal: 0, 
    totalMovimientos: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    totalDevoluciones: 0,
    mermas: 0,
    sobrantes: 0,
    consumosPorCategoria: {},
    topConsumidos: [],
    alertasStock: [],
    eventosProximos: []
  });

  const [dateFilter, setDateFilter] = useState('Mes');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      let url = '/api/stats';
      
      const today = new Date();
      let startDate = '';
      let endDate = today.toISOString();

      if (dateFilter === 'Hoy') {
        startDate = today.toISOString();
      } else if (dateFilter === 'Semana') {
        const d = new Date();
        d.setDate(today.getDate() - 7);
        startDate = d.toISOString();
      } else if (dateFilter === 'Mes') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = d.toISOString();
      }

      if (startDate) {
        url += '?startDate=' + startDate + '&endDate=' + endDate;
      }

      try {
        const res = await axios.get(url);
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [dateFilter, customStartDate, customEndDate]);

  const totalConsumido = Object.values(stats.consumosPorCategoria || {}).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Control (BI)</h1>
          <p className="text-gray-500 mt-1">Métricas y alertas en tiempo real de tu almacén</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {dateFilter === 'Personalizado' && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
              <input 
                type="date" 
                className="p-1.5 text-sm border-none focus:outline-none text-gray-600 bg-transparent" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <span className="text-gray-400 text-sm">a</span>
              <input 
                type="date" 
                className="p-1.5 text-sm border-none focus:outline-none text-gray-600 bg-transparent" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          )}
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <Filter size={18} className="text-gray-400 ml-2" />
            <select 
              className="p-2 bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 cursor-pointer"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="Hoy">Hoy</option>
              <option value="Semana">Última Semana</option>
              <option value="Mes">Este Mes</option>
              <option value="Historico">Todo el Histórico</option>
              <option value="Personalizado">Rango Específico...</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 4 Cards Principales (Estáticas - No dependen de fecha tanto, excepto movimientos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Artículos</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalProductos}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Activo</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalPersonal}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg shrink-0">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flujo (Periodo)</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalMovimientos}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ajustes Físicos</p>
          <div className="flex justify-between items-center mt-auto">
            <div>
              <p className="text-xs text-red-500 font-bold flex items-center gap-1"><TrendingDown size={14} /> Mermas</p>
              <p className="text-xl font-bold text-gray-900">{stats.mermas || 0}</p>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div>
              <p className="text-xs text-green-500 font-bold flex items-center gap-1"><TrendingUp size={14} /> Sobrantes</p>
              <p className="text-xl font-bold text-gray-900">{stats.sobrantes || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Críticas (Siempre en tiempo real) */}
      {stats.alertasStock && stats.alertasStock.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-red-800 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            ¡Atención! Artículos con Stock Crítico
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stats.alertasStock.map((alerta: any) => (
              <div key={alerta.id} className="bg-white rounded-lg p-3 border border-red-100 shadow-sm flex justify-between items-center">
                <div className="min-w-0 pr-3">
                  <p className="font-bold text-gray-800 text-sm truncate" title={alerta.nombre}>{alerta.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{alerta.categoria}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-red-600 leading-none">{alerta.stock_actual}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Min: {alerta.stock_minimo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas Renovaciones (Siempre en tiempo real) */}
      {stats.eventosProximos && stats.eventosProximos.length > 0 && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Próximas Renovaciones y Eventos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.eventosProximos.map((evento: any) => {
              const f = new Date(evento.fecha);
              const hoy = new Date();
              const diffTime = f.getTime() - hoy.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let statusText = "";
              let statusColor = "";
              if (diffDays < 0) {
                statusText = 'Vencido hace ' + Math.abs(diffDays) + ' días';
                statusColor = "text-red-600 bg-red-100 px-2 py-0.5 rounded";
              } else if (diffDays === 0) {
                statusText = "Hoy";
                statusColor = "text-orange-700 bg-orange-100 px-2 py-0.5 rounded font-bold";
              } else if (diffDays <= 3) {
                statusText = 'En ' + diffDays + ' días';
                statusColor = "text-orange-600 font-bold";
              } else {
                statusText = 'Faltan ' + diffDays + ' días';
                statusColor = "text-blue-600";
              }

              return (
                <div key={evento.id} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <p className="font-bold text-gray-800 text-sm line-clamp-2" title={evento.titulo}>{evento.titulo}</p>
                      <span className={'text-xs ' + statusColor + ' whitespace-nowrap shrink-0'}>{statusText}</span>
                    </div>
                    {evento.descripcion && <p className="text-xs text-gray-500 line-clamp-1 mb-2">{evento.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-2 pt-2 border-t border-gray-50">
                    <Clock size={12} />
                    {f.toLocaleDateString()} a las {f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de KPIs Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Desglose de Entradas y Salidas */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-gray-500" />
            Flujo Operativo
            <span className="text-xs font-normal text-gray-400 ml-auto bg-gray-100 px-2 py-1 rounded">({dateFilter})</span>
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
              <ArrowDownToLine size={24} className="text-indigo-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-800">{stats.totalEntradas || 0}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Entradas</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
              <ArrowUpFromLine size={24} className="text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-800">{stats.totalSalidas || 0}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Salidas</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
              <RefreshCcw size={24} className="text-teal-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-800">{stats.totalDevoluciones || 0}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Devoluciones</p>
            </div>
          </div>
          
          <h3 className="text-sm font-bold text-gray-700 mb-3 border-t border-gray-100 pt-4">Consumo por Categoría</h3>
          {totalConsumido === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-lg">No hay consumos en este periodo.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.consumosPorCategoria || {}).map(([categoria, cantidad]) => {
                const numCant = cantidad as number;
                const porcentaje = Math.round((numCant / totalConsumido) * 100) || 0;
                let bgColor = 'bg-gray-500';
                let barColor = 'bg-gray-200';
                if (categoria === 'EPP') { bgColor = 'bg-blue-500'; barColor = 'bg-blue-100'; }
                if (categoria === 'Herramienta de Trabajo') { bgColor = 'bg-orange-500'; barColor = 'bg-orange-100'; }
                if (categoria === 'Útiles') { bgColor = 'bg-purple-500'; barColor = 'bg-purple-100'; }
                if (categoria === 'Consumible') { bgColor = 'bg-red-500'; barColor = 'bg-red-100'; }

                return (
                  <div key={categoria}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-bold text-gray-700 text-sm">{categoria}</span>
                      <span className="text-xs font-bold text-gray-500">{numCant} unid. ({porcentaje}%)</span>
                    </div>
                    <div className={'w-full h-2.5 rounded-full ' + barColor + ' overflow-hidden flex'}>
                      <div 
                        className={'h-full ' + bgColor + ' rounded-full transition-all duration-1000'} 
                        style={{ width: porcentaje + '%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 Artículos */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
            <PieChart size={20} className="text-gray-500" />
            Top 5 Artículos Más Consumidos
            <span className="text-xs font-normal text-gray-400 ml-auto bg-gray-100 px-2 py-1 rounded">({dateFilter})</span>
          </h2>
          
          {stats.topConsumidos && stats.topConsumidos.length > 0 ? (
            <div className="flex-1 flex flex-col gap-3">
              {stats.topConsumidos.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ' + (index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600')}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate" title={item.nombre}>{item.nombre}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-gray-900 leading-none">{item.cantidad}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Unidades</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              <PieChart size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500">No hay datos suficientes</p>
              <p className="text-xs text-gray-400 mt-1">Registra salidas en este periodo para ver el ranking.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
