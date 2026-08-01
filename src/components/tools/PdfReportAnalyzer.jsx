import React, { useState } from 'react';
import { 
  FolderUp, 
  FileSpreadsheet, 
  RefreshCw, 
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { processFolderPdfs, exportToExcel } from '../../utils/pdfProcessor';
import '../../styles/PdfReportAnalyzer.css'; 

export default function PdfReportAnalyzer({ onBack }) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportData, setReportData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFolderSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const pathSample = files[0].webkitRelativePath || files[0].name;
    const detectedFolder = pathSample.includes('/') ? pathSample.split('/')[0] : 'Carpeta_Seleccionada';

    setFolderName(detectedFolder);
    setLoading(true);
    setProgress(0);
    setShowDetails(false);

    const results = await processFolderPdfs(files, (pct) => setProgress(pct));

    setReportData(results);
    setLoading(false);
  };

  const handleReset = () => {
    setReportData(null);
    setFolderName('');
    setProgress(0);
    setShowDetails(false);
  };

  return (
    <div className="admin-dashboard">
      {/* BANNER SUPERIOR CON ESTILO SST */}
      <div className="dashboard-banner">
        <div className="dashboard-banner-title">
          <button type="button" className="btn-back-link" onClick={onBack}>
            <ArrowLeft size={16} /> Volver al Menú
          </button>
          <h2>Analizador de Permisos (SST)</h2>
          <p>
            Consolidado mensual de permisos de trabajo, inspecciones y documentación técnica.
          </p>
        </div>

        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>{reportData ? `Carpeta: ${folderName}` : 'Listo para escanear'}</span>
        </div>
      </div>

      {/* ZONA DE CARGA INICIAL */}
      {!reportData && !loading && (
        <div className="chart-card folder-drop-zone">
          <FolderUp size={52} className="drop-icon" />
          <h3>Selecciona una carpeta con documentos PDF</h3>
          <p>Se cuantificarán automáticamente permisos de alturas, ATS, escaleras y más.</p>

          <label className="btn-primary-upload">
            Cargar Carpeta
            <input
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
              onChange={handleFolderSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* PANTALLA DE PROCESAMIENTO */}
      {loading && (
        <div className="chart-card processing-card">
          <RefreshCw size={36} className="spin-icon" />
          <h3>Analizando PDFs de "{folderName}"</h3>
          <p>Clasificando registros ({progress}%)</p>
          <div className="progress-track" style={{ width: '100%', marginTop: '1rem' }}>
            <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: '#2563eb' }}></div>
          </div>
        </div>
      )}

      {/* RESULTADOS - KPI GRID CENTRADAS Y DETALLES */}
      {reportData && !loading && (
        <>
          {/* BARRA DE ACCIONES SUPERIOR */}
          <div className="recent-activity-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                Resumen de Documentación Encontrada
              </h3>
            </div>
            <div className="action-buttons">
              <button type="button" className="btn-outline-reset" onClick={handleReset}>
                <RefreshCw size={15} /> Analizar otra carpeta
              </button>

              <button
                type="button"
                className="btn-excel-icon"
                onClick={() => exportToExcel(reportData, folderName)}
                title="Exportar reporte consolidado del mes a hoja de cálculo de Excel (.xlsx)"
                aria-label="Exportar reporte consolidado a Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
            </div>
          </div>

          {/* GRILLA DE MÉTRICAS (KPI CARDS SIN ICONOS Y CON TEXTO CENTRADO) */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.totalPdfs}</span>
                <span className="kpi-label">Total PDFs Analizados</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.ats}</span>
                <span className="kpi-label">Análisis Seguro (ATS)</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.permisoAlturas}</span>
                <span className="kpi-label">Permisos de Alturas</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.proteccionCaidas}</span>
                <span className="kpi-label">Protección Caídas / Arnés</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.listaVerificacionAlturas}</span>
                <span className="kpi-label">Listas Verif. Alturas</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.inspeccionEscalera}</span>
                <span className="kpi-label">Uso de Escalera</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.elevadorPersonas}</span>
                <span className="kpi-label">Elevadores / Manlift</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.permisoTrabajoPT}</span>
                <span className="kpi-label">Permisos Trabajo (PT)</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.inspeccionHerramientas}</span>
                <span className="kpi-label">Inspección Herramientas</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.permisoElectrico}</span>
                <span className="kpi-label">Eléctrico / LOTO</span>
              </div>
            </div>

            <div className="kpi-card kpi-card-centered">
              <div className="kpi-info">
                <span className="kpi-value">{reportData.otros}</span>
                <span className="kpi-label">Otros / No Clasificados</span>
              </div>
            </div>
          </div>

          {/* ACORDEÓN DE DETALLE POR ARCHIVO */}
          <div className="chart-card" style={{ marginTop: '0.5rem' }}>
            <div className="recent-activity-header" style={{ marginBottom: showDetails ? '1rem' : '0' }}>
              <button
                type="button"
                className="btn-toggle-details"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <span>{showDetails ? 'Ocultar' : 'Mostrar'} Detalle Individual por PDF</span>
                <span className="badge-count">
                  ({reportData.detallesArchivos?.length || 0} archivos)
                </span>
              </button>
            </div>

            {showDetails && (
              <div className="detail-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre del Archivo</th>
                      <th>Clasificación Detectada</th>
                      <th>Tamaño</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.detallesArchivos.map((file, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="file-name-cell">{file.nombreArchivo}</td>
                        <td className="file-type-cell">{file.tipoPermiso}</td>
                        <td className="file-size-cell">{file.tamanoKB} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}