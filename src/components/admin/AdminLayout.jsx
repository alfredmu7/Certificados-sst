// src/components/AdminLayout.jsx
import React, { useState, useMemo } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminEquipos from './AdminEquipos';
import AdminCoworkers from './AdminCoworkers';
import AdminReports from './AdminReports';
import AlertsManager from '../alerts/AlertsManager';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminLayout.css';

const calcularEstadoVencimiento = (fechaStr) => {
  if (!fechaStr) return { dias: 0, estado: 'indefinido' };

  const [y, m, d] = fechaStr.split('-').map(Number);
  const fVenc = new Date(y, m - 1, d);
  const hoy = new Date();

  fVenc.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const dias = Math.ceil((fVenc - hoy) / (1000 * 60 * 60 * 24));

  let estado = 'vigente';
  if (dias < 0) estado = 'vencido';
  else if (dias <= 30) estado = 'por-vencer';

  return { dias, estado };
};

export default function AdminLayout({
  items = [],               // Certificados / Equipos / Escaleras / Químicos
  coworkers = [],           // Colaboradores
  obtenerCalculosItem,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteItem,
  onSelectPdf
}) {
  const { logoutSST } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const unifiedAlertItems = useMemo(() => {
    // 1. MAPEACIÓN DE EQUIPOS / CERTIFICADOS (Escaleras, Químicos, etc.)
    const mappedEquipos = items.map((eq, index) => {
      const calculos = obtenerCalculosItem 
        ? obtenerCalculosItem(eq.fechaCertificacion || eq.fecha_certificacion, eq.categoria)
        : null;

      const fechaVencimientoFinal = calculos?.fechaVencimiento || eq.fechaVencimiento || eq.vencimiento || '';
      
      let diasRestantesFinal = calculos?.diasRestantes;
      let estadoCalculado = calculos?.estado;

      if (diasRestantesFinal === undefined || diasRestantesFinal === null) {
        const res = calcularEstadoVencimiento(fechaVencimientoFinal);
        diasRestantesFinal = res.dias;
        if (!estadoCalculado) estadoCalculado = res.estado;
      }

      // Extraemos el PDF o documento asociado
      const pdfUrl = eq.pdfUrl || eq.pdf || eq.archivo || eq.documentoUrl || eq.certificadoUrl || null;

      return {
        id: `eq-${eq.id || index}`,
        entidadNombre: eq.nombre || eq.equipo || 'Equipo Sin Nombre',
        identificador: eq.serial || eq.codigo || 'S/N',
        tipoCategoria: eq.categoria || 'Equipo',
        nombreDocumento: 'Certificado de Inspección',
        fechaVencimiento: fechaVencimientoFinal,
        diasRestantes: diasRestantesFinal,
        estado: estadoCalculado || 'vigente',
        pdfUrl: pdfUrl // <--- Preservamos la URL del PDF
      };
    });

    // 2. MAPEACIÓN DE COWORKERS Y SUS DOCUMENTOS
    const mappedCoworkers = coworkers.flatMap((cw, index) => {
      const records = [];
      const nombreCoworker = cw.nombre || cw.nombreCompleto || cw.nombres || 'Colaborador';
      const idCoworker = cw.cedula || cw.documento || cw.pin || 'S/C';

      // Vencimiento ARL
      if (cw.fecha_arl || cw.vencimiento_arl) {
        const fecha = cw.fecha_arl || cw.vencimiento_arl;
        const calc = calcularEstadoVencimiento(fecha);
        records.push({
          id: `cw-arl-${cw.id || index}`,
          entidadNombre: nombreCoworker,
          identificador: idCoworker,
          tipoCategoria: 'Coworker',
          nombreDocumento: 'Afiliación / Planilla ARL',
          fechaVencimiento: fecha,
          diasRestantes: calc.dias,
          estado: calc.estado,
          pdfUrl: cw.pdf_arl || cw.arl_pdf || cw.pdfUrl || null
        });
      }

      // Vencimiento Carnet
      if (cw.fecha_carnet || cw.vencimiento_carnet) {
        const fecha = cw.fecha_carnet || cw.vencimiento_carnet;
        const calc = calcularEstadoVencimiento(fecha);
        records.push({
          id: `cw-carnet-${cw.id || index}`,
          entidadNombre: nombreCoworker,
          identificador: idCoworker,
          tipoCategoria: 'Coworker',
          nombreDocumento: 'Carnet de Acceso',
          fechaVencimiento: fecha,
          diasRestantes: calc.dias,
          estado: calc.estado,
          pdfUrl: cw.pdf_carnet || cw.carnet_pdf || cw.pdfUrl || null
        });
      }

      // Vencimientos en el array 'documentos' del Coworker
      if (Array.isArray(cw.documentos)) {
        cw.documentos.forEach((doc, docIdx) => {
          const fechaDoc = doc.fechaVencimiento || doc.vencimiento || doc.fecha_vencimiento;
          if (fechaDoc) {
            const calc = calcularEstadoVencimiento(fechaDoc);
            records.push({
              id: `cw-doc-${cw.id || index}-${docIdx}`,
              entidadNombre: nombreCoworker,
              identificador: idCoworker,
              tipoCategoria: 'Coworker',
              nombreDocumento: doc.nombre || doc.tipo || doc.nombreDocumento || 'Certificado / Examen SST',
              fechaVencimiento: fechaDoc,
              diasRestantes: calc.dias,
              estado: calc.estado,
              pdfUrl: doc.pdfUrl || doc.pdf || doc.archivo || null
            });
          }
        });
      }

      // Registro general si el coworker no tiene subdocumentos específicos
      if (records.length === 0) {
        const fechaGeneral = cw.fechaVencimiento || cw.vencimiento || '';
        const calc = calcularEstadoVencimiento(fechaGeneral);
        records.push({
          id: `cw-base-${cw.id || index}`,
          entidadNombre: nombreCoworker,
          identificador: idCoworker,
          tipoCategoria: 'Coworker',
          nombreDocumento: 'Documentación General',
          fechaVencimiento: fechaGeneral,
          diasRestantes: calc.dias,
          estado: fechaGeneral ? calc.estado : 'vigente',
          pdfUrl: cw.pdfUrl || cw.pdf || null
        });
      }

      return records;
    });

    return [...mappedEquipos, ...mappedCoworkers];
  }, [items, coworkers, obtenerCalculosItem]);

  return (
    <div className="admin-layout-container">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logoutSST} />

      <main className="admin-content-area">
        {activeTab === 'dashboard' && (
          <AdminDashboard 
            items={items} 
            obtenerCalculosItem={obtenerCalculosItem} 
            setActiveTab={setActiveTab}
            onSelectPdf={onSelectPdf}
          />
        )}
        {activeTab === 'equipos' && (
          <AdminEquipos
            items={items}
            obtenerCalculosItem={obtenerCalculosItem}
            onOpenCreateModal={onOpenCreateModal}
            onOpenEditModal={onOpenEditModal}
            onDeleteItem={onDeleteItem}
            onSelectPdf={onSelectPdf}
          />
        )}
        {activeTab === 'coworkers' && <AdminCoworkers onSelectPdf={onSelectPdf} />}
        {activeTab === 'reportes' && <AdminReports items={items} onSelectPdf={onSelectPdf} />}
        {activeTab === 'alertas' && (
          <AlertsManager 
            items={unifiedAlertItems} 
            onSelectPdf={onSelectPdf} // <--- Pasamos la función a Alertas
          />
        )}
      </main>
    </div>
  );
}