import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ArrowRightLeft, Menu, X, ClipboardList, Calendar, Scale, Settings } from 'lucide-react';

import Inventario from './Inventario';
import Movimientos from './Movimientos';
import Dashboard from './Dashboard';
import Personal from './Personal';
import Requerimientos from './Requerimientos';
import Calendario from './Calendario';
import Ajustes from './Ajustes';
import EntregaMasiva from './EntregaMasiva';
import Configuracion from './Configuracion';


function SidebarItem({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-medium ${
        isActive ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} /> {children}
    </Link>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-800 font-outfit overflow-hidden">
        
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg lg:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-6 py-6 flex items-center justify-between lg:justify-center">
            <img src="/logo.png" alt="Petroaseo Logo" className="h-20 w-full object-contain" />
            <button onClick={closeSidebar} className="lg:hidden text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto">
            <SidebarItem to="/" icon={LayoutDashboard} onClick={closeSidebar}>Dashboard</SidebarItem>
            <SidebarItem to="/personal" icon={Users} onClick={closeSidebar}>Personal</SidebarItem>
            <SidebarItem to="/inventario" icon={Package} onClick={closeSidebar}>Inventario</SidebarItem>
            <SidebarItem to="/movimientos" icon={ArrowRightLeft} onClick={closeSidebar}>Movimientos</SidebarItem>
            <SidebarItem to="/entrega-masiva" icon={Users} onClick={closeSidebar}>Entrega Masiva</SidebarItem>
            <SidebarItem to="/requerimientos" icon={ClipboardList} onClick={closeSidebar}>Requerimientos</SidebarItem>
            <SidebarItem to="/calendario" icon={Calendar} onClick={closeSidebar}>Calendario</SidebarItem>
            <SidebarItem to="/ajustes" icon={Scale} onClick={closeSidebar}>Ajustes</SidebarItem>
            <div className="my-4 border-t border-gray-700/50"></div>
            <SidebarItem to="/configuracion" icon={Settings} onClick={closeSidebar}>Configuración</SidebarItem>
          </nav>
          
          <div className="p-4 border-t border-gray-100 text-center text-gray-400 text-sm">
            <p>Sistema de Almacén</p>
            <p>Petroaseo &copy; 2026</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
          <header className="h-16 lg:h-20 border-b border-gray-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-sm z-10">
             <div className="flex items-center gap-4">
               <button onClick={toggleSidebar} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 lg:hidden">
                 <Menu size={24} />
               </button>
               <h2 className="text-lg lg:text-xl font-semibold text-gray-700">Almacén Central</h2>
             </div>
             
             {/* Optional: User profile or extra actions can go here */}
          </header>
          
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/personal" element={<Personal />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/movimientos" element={<Movimientos />} />
                <Route path="/entrega-masiva" element={<EntregaMasiva />} />
                <Route path="/requerimientos" element={<Requerimientos />} />
              <Route path="/calendario" element={<Calendario />} />
                <Route path="/ajustes" element={<Ajustes />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Routes>
            </div>
          </div>
        </main>

      </div>
    </Router>
  );
}

export default App;
