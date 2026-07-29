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

export default function AdminLayout({
  items = [],               // Certificados / Equipos
  coworkers = [],           // Colaboradores
  obtenerCalculosItem,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteItem,
  onSelectPdf
}) {
  const { logoutSST } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Normalización y sincronización de fechas, categorías y días restantes
  const unifiedAlertItems = useMemo(() => {
    // 1. MAPEACIÓN DE EQUIPOS / CERTIFICADOS
    const mappedEquipos = items.map((eq, index) => {
      const calculos = obtenerCalculosItem 
        ? obtenerCalculosItem(eq.fechaCertificacion || eq.fecha_certificacion, eq.categoria)
        : null;

      const fechaVencimientoFinal = calculos?.fechaVencimiento || eq.fechaVencimiento || eq.vencimiento || '';
      
      let diasRestantesFinal = calculos?.diasRestantes;
      if (diasRestantesFinal === undefined || diasRestantesFinal === null) {
        if (fechaVencimientoFinal) {
          const [y, m, d] = fechaVencimientoFinal.split('-').map(Number);
          const fVenc = new Date(y, m - 1, d);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          fVenc.setHours(0, 0, 0, 0);
          diasRestantesFinal = Math.ceil((fVenc - hoy) / (1000 * 60 * 60 * 24));
        } else {
          diasRestantesFinal = 0;
        }
      }

      let estadoCalculado = 'vigente';
      if (diasRestantesFinal < 0) estadoCalculado = 'vencido';
      else if (diasRestantesFinal <= 30) estadoCalculado = 'por-vencer';

      return {
        id: `eq-${eq.id || index}`,
        entidadNombre: eq.nombre || eq.equipo || 'Equipo Sin Nombre',
        identificador: eq.serial || eq.codigo || 'S/N',
        tipoCategoria: eq.categoria || 'Equipo',
        nombreDocumento: 'Certificado de Inspección', // Genérico para equipos
        fechaVencimiento: fechaVencimientoFinal,
        diasRestantes: diasRestantesFinal,
        estado: calculos?.estado || estadoCalculado
      };
    });

    // 2. MAPEACIÓN DE COWORKERS Y SUS DOCUMENTOS / VENCIMIENTOS
    const mappedCoworkers = coworkers.flatMap((cw, index) => {
      const records = [];

      const calcularDias = (fechaStr) => {
        if (!fechaStr) return { dias: 0, estado: 'indefinido' };
        const [y, m, d] = fechaStr.split('-').map(Number);
        const fVenc = new Date(y, m - 1, d);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fVenc.setHours(0, 0, 0, 0);
        
        const dias = Math.ceil((fVenc - hoy) / (1000 * 60 * 60 * 24));
        let est = 'vigente';
        if (dias < 0) est = 'vencido';
        else if (dias <= 30) est = 'por-vencer';

        return { dias, estado: est };
      };

      const nombreCoworker = cw.nombre || cw.nombreCompleto || cw.nombres || 'Colaborador';
      const idCoworker = cw.cedula || cw.documento || cw.pin || 'S/C';

      // Vencimiento ARL
      if (cw.fecha_arl || cw.vencimiento_arl) {
        const fecha = cw.fecha_arl || cw.vencimiento_arl;
        const calc = calcularDias(fecha);
        records.push({
          id: `cw-arl-${cw.id || index}`,
          entidadNombre: nombreCoworker,
          identificador: idCoworker,
          tipoCategoria: 'Coworker',
          nombreDocumento: 'Afiliación / Planilla ARL',
          fechaVencimiento: fecha,
          diasRestantes: calc.dias,
          estado: calc.estado
        });
      }

      // Vencimiento Carnet
      if (cw.fecha_carnet || cw.vencimiento_carnet) {
        const fecha = cw.fecha_carnet || cw.vencimiento_carnet;
        const calc = calcularDias(fecha);
        records.push({
          id: `cw-carnet-${cw.id || index}`,
          entidadNombre: nombreCoworker,
          identificador: idCoworker,
          tipoCategoria: 'Coworker',
          nombreDocumento: 'Carnet de Acceso',
          fechaVencimiento: fecha,
          diasRestantes: calc.dias,
          estado: calc.estado
        });
      }

      // Vencimientos en la lista array 'documentos' del Coworker
      if (Array.isArray(cw.documentos)) {
        cw.documentos.forEach((doc, docIdx) => {
          const fechaDoc = doc.fechaVencimiento || doc.vencimiento || doc.fecha_vencimiento;
          if (fechaDoc) {
            const calc = calcularDias(fechaDoc);
            records.push({
              id: `cw-doc-${cw.id || index}-${docIdx}`,
              entidadNombre: nombreCoworker,
              identificador: idCoworker,
              tipoCategoria: 'Coworker',
              nombreDocumento: doc.nombre || doc.tipo || doc.nombreDocumento || 'Certificado / Examen SST',
              fechaVencimiento: fechaDoc,
              diasRestantes: calc.dias,
              estado: calc.estado
            });
          }
        });
      }

      // Registro general si el coworker no tiene aún documentos en sub-listas
      if (records.length === 0) {
        const fechaGeneral = cw.fechaVencimiento || cw.vencimiento || '';
        records.push({
          id: `cw-base-${cw.id || index}`,
          entidadNombre: nombreCoworker,
          identificador: idCoworker,
          tipoCategoria: 'Coworker',
          nombreDocumento: 'Documentación General',
          fechaVencimiento: fechaGeneral,
          diasRestantes: fechaGeneral ? calcularDias(fechaGeneral).dias : 0,
          estado: fechaGeneral ? calcularDias(fechaGeneral).estado : 'vigente'
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
          <AdminDashboard items={items} obtenerCalculosItem={obtenerCalculosItem} setActiveTab={setActiveTab} />
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
        {activeTab === 'reportes' && <AdminReports items={items} />}
        {activeTab === 'alertas' && <AlertsManager items={unifiedAlertItems} />}
      </main>
    </div>
  );
}