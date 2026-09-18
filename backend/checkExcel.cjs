const XLSX = require('xlsx');

const workbook = XLSX.readFile('Reporte_de_almacen (2).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("First 5 rows of Inventario:");
console.log(json.slice(0, 5));
