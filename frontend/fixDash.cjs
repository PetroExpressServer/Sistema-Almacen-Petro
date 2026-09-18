const fs = require('fs');

let txt = fs.readFileSync('src/Dashboard.tsx', 'utf8');

// The first issue is URL
txt = txt.replace(/url \+= \\\`\?startDate=\\\$\{startDate\}&endDate=\\\$\{endDate\}\\\`;/g, "url += '?startDate=' + startDate + '&endDate=' + endDate;");

// The statusTexts
txt = txt.replace(/statusText = \\\`Vencido hace \\\$\{Math\.abs\(diffDays\)\} días\\\`;/g, "statusText = 'Vencido hace ' + Math.abs(diffDays) + ' días';");
txt = txt.replace(/statusText = \\\`En \\\$\{diffDays\} días\\\`;/g, "statusText = 'En ' + diffDays + ' días';");
txt = txt.replace(/statusText = \\\`Faltan \\\$\{diffDays\} días\\\`;/g, "statusText = 'Faltan ' + diffDays + ' días';");

// React classNames and styles
txt = txt.replace(/className=\{\\\`text-xs \\\$\{statusColor\} whitespace-nowrap shrink-0\\\`\}/g, "className={'text-xs ' + statusColor + ' whitespace-nowrap shrink-0'}");

txt = txt.replace(/className=\{\\\`w-full h-2\.5 rounded-full \\\$\{barColor\} overflow-hidden flex\\\`\}/g, "className={'w-full h-2.5 rounded-full ' + barColor + ' overflow-hidden flex'}");

txt = txt.replace(/className=\{\\\`h-full \\\$\{bgColor\} rounded-full transition-all duration-1000\\\`\}/g, "className={'h-full ' + bgColor + ' rounded-full transition-all duration-1000'}");

txt = txt.replace(/style=\{\{ width: \\\`\\\$\{porcentaje\}%\\\` \}\}/g, "style={{ width: porcentaje + '%' }}");

// Top 5 className
txt = txt.replace(/className=\{\\\`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 \\\$\{\n                    index === 0 \? 'bg-yellow-100 text-yellow-700' :\n                    index === 1 \? 'bg-gray-200 text-gray-700' :\n                    index === 2 \? 'bg-orange-100 text-orange-700' :\n                    'bg-blue-50 text-blue-600'\n                  \}\\\`\}/g, "className={'w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ' + (index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600')}");

fs.writeFileSync('src/Dashboard.tsx', txt);
