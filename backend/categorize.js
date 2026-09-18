const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productos = await prisma.producto.findMany();
  
  let countEPP = 0;
  let countHerr = 0;
  let countConsum = 0;
  let countUtiles = 0;

  for (const p of productos) {
    const name = p.nombre.toUpperCase();
    let cat = 'Consumible'; // Default
    
    // EPP rules
    if (name.includes('CASCO') || name.includes('GUANTE') || name.includes('BOTA') || 
        name.includes('LENTE') || name.includes('RESPIRADOR') || name.includes('CHALECO') ||
        name.includes('MASCARILLA') || name.includes('TAPON') || name.includes('OREJERA') ||
        name.includes('LUMINOSA') || name.includes('TRAJE') || name.includes('ARNES') || name.includes('ZAPATO')) {
      cat = 'EPP';
      countEPP++;
    } 
    // Herramientas rules
    else if (name.includes('ALICATE') || name.includes('MARTILLO') || name.includes('LLAVE') || 
             name.includes('DESTORNILLADOR') || name.includes('SIERRA') || name.includes('TALADRO') ||
             name.includes('CINTA METRICA') || name.includes('WINCHA') || name.includes('ESMERIL') ||
             name.includes('SOLDADORA') || name.includes('DESARMADOR') || name.includes('TIJERA') ||
             name.includes('CUCHILLA') || name.includes('BROCA') || name.includes('NIVEL') ||
             name.includes('PALA') || name.includes('PICO') || name.includes('CARRETILLA') || name.includes('COMBA') ||
             name.includes('ARCO') || name.includes('PINZA') || name.includes('MACHETE') || name.includes('ESTILETE')) {
      cat = 'Herramienta de Trabajo';
      countHerr++;
    }
    // Utiles rules
    else if (name.includes('PAPEL') || name.includes('CUADERNO') || name.includes('LAPICERO') || 
             name.includes('BOLIGRAFO') || name.includes('ARCHIVADOR') || name.includes('CLIP') ||
             name.includes('FOLDER') || name.includes('TINTA') || name.includes('TONER') ||
             name.includes('GRAPAS') || name.includes('POST IT') || name.includes('RESALTADOR') ||
             name.includes('ESCOBA') || name.includes('RECOGEDOR') || name.includes('TRAPEADOR') ||
             name.includes('DETERGENTE') || name.includes('LEJIA') || name.includes('JABON') ||
             name.includes('LIMPIADOR') || name.includes('FRANELA')) {
      cat = 'Útiles';
      countUtiles++;
    } 
    else {
      countConsum++;
    }

    await prisma.producto.update({
      where: { id: p.id },
      data: { categoria: cat }
    });
  }

  console.log('Clasificacion completada!');
  console.log('EPP:', countEPP);
  console.log('Herramientas:', countHerr);
  console.log('Utiles:', countUtiles);
  console.log('Consumibles:', countConsum);
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
