const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Icons
content = content.replace(
  `import { LayoutDashboard, Users, Package, ArrowRightLeft, Menu, X, ClipboardList, Calendar } from 'lucide-react';`,
  `import { LayoutDashboard, Users, Package, ArrowRightLeft, Menu, X, ClipboardList, Calendar, Scale } from 'lucide-react';`
);

// Component
content = content.replace(
  `import Calendario from './Calendario';`,
  `import Calendario from './Calendario';\nimport Ajustes from './Ajustes';`
);

// Sidebar
content = content.replace(
  `<SidebarItem to="/calendario" icon={Calendar} onClick={closeSidebar}>Calendario</SidebarItem>`,
  `<SidebarItem to="/calendario" icon={Calendar} onClick={closeSidebar}>Calendario</SidebarItem>\n            <SidebarItem to="/ajustes" icon={Scale} onClick={closeSidebar}>Ajustes</SidebarItem>`
);

// Routes
content = content.replace(
  `<Route path="/calendario" element={<Calendario />} />`,
  `<Route path="/calendario" element={<Calendario />} />\n                <Route path="/ajustes" element={<Ajustes />} />`
);

fs.writeFileSync('src/App.tsx', content);
