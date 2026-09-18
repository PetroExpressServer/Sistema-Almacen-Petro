const fs = require('fs');
let text = fs.readFileSync('src/Movimientos.tsx', 'utf8');

// 1. Add state
text = text.replace(
  `const [lastDelivery, setLastDelivery] = useState<any>(null);`,
  `const [lastDelivery, setLastDelivery] = useState<any>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);`
);

// 2. Modify handleSubmit
text = text.replace(
  `  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {`,
  `  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {`
);

// 3. Add finally block
text = text.replace(
  `      alert(error.response?.data?.error || 'Error al registrar movimiento');
    }
  };`,
  `      alert(error.response?.data?.error || 'Error al registrar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };`
);

// 4. Disable submit button
text = text.replace(
  `<button type="submit" className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">`,
  `<button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors">`
);

text = text.replace(
  `Registrar {formData.tipo}`,
  `{isSubmitting ? 'Registrando...' : \`Registrar \${formData.tipo}\`}`
);

fs.writeFileSync('src/Movimientos.tsx', text);
