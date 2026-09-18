const XLSX = require('xlsx');

const workbook = XLSX.readFile('PERSONAL ACTIVO (CONSORCIO PETRO LIMPIO) AL 10.09.26 (1).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(json.slice(0, 7));
