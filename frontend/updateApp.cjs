const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
content = content.replace(
  `import { LayoutDashboard, Users, Package, ArrowRightLeft, Menu, X, ClipboardList } from 'lucide-react';`,
  `import { LayoutDashboard, Users, Package, ArrowRightLeft, Menu, X, ClipboardList, Calendar } from 'lucide-react';`
);

content = content.replace(
  `import Requerimientos from './Requerimientos';`,
  `import Requerimientos from './Requerimientos';\nimport Calendario from './Calendario';`
);

// Sidebar link
content = content.replace(
  `            <SidebarItem to="/requerimientos" icon={ClipboardList} onClick={() => setSidebarOpen(false)}>Requerimientos</SidebarItem>`,
  `            <SidebarItem to="/requerimientos" icon={ClipboardList} onClick={() => setSidebarOpen(false)}>Requerimientos</SidebarItem>\n            <SidebarItem to="/calendario" icon={Calendar} onClick={() => setSidebarOpen(false)}>Calendario</SidebarItem>`
);

// Route
content = content.replace(
  `              <Route path="/requerimientos" element={<Requerimientos />} />`,
  `              <Route path="/requerimientos" element={<Requerimientos />} />\n              <Route path="/calendario" element={<Calendario />} />`
);

fs.writeFileSync('src/App.tsx', content);
