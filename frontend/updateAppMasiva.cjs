const fs = require('fs');
let txt = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add UsersIcon/Package etc... 
txt = txt.replace(
  "import Ajustes from './Ajustes';",
  "import Ajustes from './Ajustes';\nimport EntregaMasiva from './EntregaMasiva';"
);

// 2. Add to Sidebar
txt = txt.replace(
  "<SidebarItem to=\"/movimientos\" icon={ArrowRightLeft} onClick={closeSidebar}>Movimientos</SidebarItem>",
  "<SidebarItem to=\"/movimientos\" icon={ArrowRightLeft} onClick={closeSidebar}>Movimientos</SidebarItem>\n            <SidebarItem to=\"/entrega-masiva\" icon={Users} onClick={closeSidebar}>Entrega Masiva</SidebarItem>"
);

// 3. Add to Routes
txt = txt.replace(
  "<Route path=\"/movimientos\" element={<Movimientos />} />",
  "<Route path=\"/movimientos\" element={<Movimientos />} />\n                <Route path=\"/entrega-masiva\" element={<EntregaMasiva />} />"
);

fs.writeFileSync('src/App.tsx', txt);
