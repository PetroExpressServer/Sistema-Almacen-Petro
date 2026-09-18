const fs = require('fs');
let txt = fs.readFileSync('src/App.tsx', 'utf8');

// Icons 
txt = txt.replace(
  "Calendar, Scale } from 'lucide-react';",
  "Calendar, Scale, Settings } from 'lucide-react';"
);

// Imports
txt = txt.replace(
  "import EntregaMasiva from './EntregaMasiva';",
  "import EntregaMasiva from './EntregaMasiva';\nimport Configuracion from './Configuracion';"
);

// Sidebar
txt = txt.replace(
  "<SidebarItem to=\"/ajustes\" icon={Scale} onClick={closeSidebar}>Ajustes</SidebarItem>",
  "<SidebarItem to=\"/ajustes\" icon={Scale} onClick={closeSidebar}>Ajustes</SidebarItem>\n            <div className=\"my-4 border-t border-gray-700/50\"></div>\n            <SidebarItem to=\"/configuracion\" icon={Settings} onClick={closeSidebar}>Configuración</SidebarItem>"
);

// Routes
txt = txt.replace(
  "<Route path=\"/ajustes\" element={<Ajustes />} />",
  "<Route path=\"/ajustes\" element={<Ajustes />} />\n                <Route path=\"/configuracion\" element={<Configuracion />} />"
);

fs.writeFileSync('src/App.tsx', txt);
