// procesador de analisis de PDFs para el módulo PdfReportAnalyzer.jsx
import * as XLSX from 'xlsx';

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
};

export const processFolderPdfs = async (files, onProgress) => {
  const pdfFiles = Array.from(files).filter(
    (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );

  const totalFiles = pdfFiles.length;
  let processedCount = 0;

  // Contadores independientes
  let cAlturas = 0;
  let cProteccionCaidas = 0;
  let cListaAlturas = 0;
  let cEscaleras = 0;
  let cPt = 0;
  let cAts = 0;
  let cHerramientas = 0;
  let cElevador = 0;
  let cElectrico = 0;
  let cOtros = 0;

  const detallesArchivos = [];

  for (const file of pdfFiles) {
    const relativePath = file.webkitRelativePath || file.name;
    const fileName = normalizeText(relativePath);

    let esAts = false;
    let esAlturas = false;
    let esProteccionCaidas = false;
    let esListaAlturas = false;
    let esEscalera = false;
    let esElevador = false;
    let esHerramienta = false;
    let esElectrico = false;
    let esPt = false;

    // 1. ATS (Detecta estrictamente si el nombre incluye ATS o ANALISIS DE TRABAJO SEGURO)
    if (fileName.includes('ATS') || fileName.includes('ANALISIS DE TRABAJO SEGURO')) {
      esAts = true;
    }

    // 2. Elevadores de Personas / Manlift
    if (fileName.includes('ELEVADOR') || fileName.includes('MANLIFT') || fileName.includes('GENIE') || fileName.includes('AWP')) {
      esElevador = true;
    }

    // 3. Inspección de Escaleras
    if (fileName.includes('ESCALERA')) {
      esEscalera = true;
    }

    // 4. Listas de Verificación de Alturas (Checklists)
    if (fileName.includes('LISTA') || (fileName.includes('CHECK') && fileName.includes('ALTURA'))) {
      esListaAlturas = true;
    }

    // 5. Permiso de Trabajo en Alturas (Solo permisos/trabajo en alturas, excluyendo checklists)
    if (fileName.includes('ALTURA') && !fileName.includes('LISTA') && !fileName.includes('CHECK')) {
      esAlturas = true;
    }

    // 6. Protección contra Caídas / Arnés (Métrica independiente)
    if (
      fileName.includes('ARNES') || 
      fileName.includes('CAIDA') || 
      fileName.includes('PROTECCION') ||
      fileName.includes('EQUIPOS DE PROTECCION')
    ) {
      esProteccionCaidas = true;
    }

    // 7. Herramientas Menores
    if (fileName.includes('HERRAMIENTA')) {
      esHerramienta = true;
    }

    // 8. Eléctrico / LOTO
    if (fileName.includes('ELECTRICO') || fileName.includes('LOTO')) {
      esElectrico = true;
    }

    // 9. Permiso de Trabajo General (PT)
    if (fileName.includes('PERMISO') || fileName.includes('PT')) {
      esPt = true;
    }

    // Incrementos de contadores
    if (esAts) cAts++;
    if (esAlturas) cAlturas++;
    if (esProteccionCaidas) cProteccionCaidas++;
    if (esListaAlturas) cListaAlturas++;
    if (esEscalera) cEscaleras++;
    if (esElevador) cElevador++;
    if (esHerramienta) cHerramientas++;
    if (esElectrico) cElectrico++;
    if (esPt) cPt++;

    if (!esAts && !esAlturas && !esProteccionCaidas && !esListaAlturas && !esEscalera && !esElevador && !esHerramienta && !esElectrico && !esPt) {
      cOtros++;
    }

    // Construcción de la lista para la tabla desplegable
    const tiposEncontrados = [];
    if (esAts) tiposEncontrados.push('ATS');
    if (esAlturas) tiposEncontrados.push('Permiso Alturas');
    if (esProteccionCaidas) tiposEncontrados.push('Protección Caídas / Arnés');
    if (esListaAlturas) tiposEncontrados.push('Lista Alturas');
    if (esEscalera) tiposEncontrados.push('Escalera');
    if (esElevador) tiposEncontrados.push('Elevador');
    if (esHerramienta) tiposEncontrados.push('Herramientas');
    if (esElectrico) tiposEncontrados.push('Eléctrico');
    if (esPt) tiposEncontrados.push('PT');

    detallesArchivos.push({
      nombreArchivo: file.name,
      rutaRelativa: file.webkitRelativePath || file.name,
      tipoPermiso: tiposEncontrados.length > 0 ? tiposEncontrados.join(' + ') : 'Otro / No Clasificado',
      tamanoKB: (file.size / 1024).toFixed(1)
    });

    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount / totalFiles) * 100));
    }
  }

  return {
    totalPdfs: totalFiles,
    ats: cAts,
    permisoAlturas: cAlturas,
    proteccionCaidas: cProteccionCaidas,
    listaVerificacionAlturas: cListaAlturas,
    inspeccionEscalera: cEscaleras,
    elevadorPersonas: cElevador,
    permisoTrabajoPT: cPt,
    inspeccionHerramientas: cHerramientas,
    permisoElectrico: cElectrico,
    otros: cOtros,
    detallesArchivos: detallesArchivos
  };
};

export const exportToExcel = (data, folderName = 'Consolidado_Mensual_Permisos') => {
  const summaryData = [
    { 'Tipo de Permiso / Documento': 'Total PDFs Analizados', Cantidad: data.totalPdfs },
    { 'Tipo de Permiso / Documento': 'Análisis de Trabajo Seguro (ATS)', Cantidad: data.ats },
    { 'Tipo de Permiso / Documento': 'Permisos de Trabajo en Alturas', Cantidad: data.permisoAlturas },
    { 'Tipo de Permiso / Documento': 'Inspección Protección contra Caídas / Arnés', Cantidad: data.proteccionCaidas },
    { 'Tipo de Permiso / Documento': 'Listas de Verificación de Alturas', Cantidad: data.listaVerificacionAlturas },
    { 'Tipo de Permiso / Documento': 'Inspección de Escaleras', Cantidad: data.inspeccionEscalera },
    { 'Tipo de Permiso / Documento': 'Elevador de Personas / Manlift', Cantidad: data.elevadorPersonas },
    { 'Tipo de Permiso / Documento': 'Permisos de Trabajo General (PT)', Cantidad: data.permisoTrabajoPT },
    { 'Tipo de Permiso / Documento': 'Inspección de Herramientas', Cantidad: data.inspeccionHerramientas },
    { 'Tipo de Permiso / Documento': 'Permisos Eléctricos / LOTO', Cantidad: data.permisoElectrico },
    { 'Tipo de Permiso / Documento': 'Otros / No Clasificados', Cantidad: data.otros }
  ];

  const detailData = data.detallesArchivos.map((item) => ({
    'Ruta / Nombre del Archivo PDF': item.rutaRelativa,
    'Tipos Detectados': item.tipoPermiso,
    'Tamaño (KB)': item.tamanoKB
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsDetail = XLSX.utils.json_to_sheet(detailData);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Totales del Mes');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle por PDF');

  const fileName = `${folderName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};