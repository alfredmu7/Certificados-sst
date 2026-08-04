import React, { useMemo } from 'react';
import { 
  Users, Clock, Calendar, AlertTriangle, 
  TrendingUp, Award, UserCheck, Shield 
} from 'lucide-react';
import '../../styles/AttendanceDashboard.css';

export default function AttendanceDashboard({ trabajadores, asistencia, daysInMonth, selectedMonth }) {
  // Cálculo General de KPIs para el Dashboard
  const metrics = useMemo(() => {
    let totalHHT = 0;
    let totalHHTHombres = 0;
    let totalHHTMujeres = 0;
    let totalIncapacidades = 0;
    let totalDiasTrabajadosProyectos = 0;

    const conteoGeneros = {
      M: trabajadores.filter(t => t.genero === 'M').length,
      F: trabajadores.filter(t => t.genero === 'F').length,
    };

    const resumenCodigos = {
      DC: 0, D: 0, MD: 0, CL: 0, I: 0, V: 0
    };

    trabajadores.forEach((t) => {
      daysInMonth.forEach((d) => {
        const item = asistencia[`${t.id}_${d.dateStr}`];
        if (item && item.codigo) {
          const code = item.codigo;
          const horas = item.horas !== undefined ? Number(item.horas) : (code === 'DC' || code === 'D' ? 8.4 : code === 'MD' ? 4.2 : code === 'CL' ? 4.0 : 0);

          if (resumenCodigos[code] !== undefined) {
            resumenCodigos[code]++;
          }

          totalHHT += horas;
          if (t.genero === 'F') totalHHTMujeres += horas;
          if (t.genero === 'M' || !t.genero) totalHHTHombres += horas;

          if (horas > 0) totalDiasTrabajadosProyectos++;
          if (code === 'I') totalIncapacidades++;
        }
      });
    });

    return {
      totalTrabajadores: trabajadores.length,
      conteoGeneros,
      totalHHT: Number(totalHHT.toFixed(1)),
      totalHHTHombres: Number(totalHHTHombres.toFixed(1)),
      totalHHTMujeres: Number(totalHHTMujeres.toFixed(1)),
      totalIncapacidades,
      resumenCodigos,
      totalDiasTrabajadosProyectos,
      promedioHorasPorTrabajador: trabajadores.length > 0 ? (totalHHT / trabajadores.length).toFixed(1) : 0
    };
  }, [trabajadores, asistencia, daysInMonth]);

  return (
    <div className="attendance-dashboard">
      <div className="dashboard-header">
        <h3>📊 Resumen Ejecutivo y Métricas SST ({selectedMonth})</h3>
      </div>

      {/* TARJETAS KPI PRINCIPALES */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon"><Clock size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-title">Total HHT Acumuladas</span>
            <h2 className="kpi-value">{metrics.totalHHT} <small>hrs</small></h2>
            <span className="kpi-subtitle">Horas Hombre Trabajadas</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-title">Personal Activo</span>
            <h2 className="kpi-value">{metrics.totalTrabajadores}</h2>
            <span className="kpi-subtitle">👨 {metrics.conteoGeneros.M} Hombres | 👩 {metrics.conteoGeneros.F} Mujeres</span>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon"><TrendingUp size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-title">HHT por Género</span>
            <h2 className="kpi-value">{metrics.totalHHTMujeres}h <small>Fem</small></h2>
            <span className="kpi-subtitle">Masculino: {metrics.totalHHTHombres}h</span>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-icon"><AlertTriangle size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-title">Incapacidades</span>
            <h2 className="kpi-value">{metrics.totalIncapacidades}</h2>
            <span className="kpi-subtitle">Eventos en el mes</span>
          </div>
        </div>
      </div>

      {/* DESGLOSE DETALLADO */}
      <div className="dashboard-sections-grid">
        {/* Distribución por Códigos de Asistencia */}
        <div className="dashboard-card">
          <h4>Distribución de Jornadas</h4>
          <div className="code-breakdown-list">
            <div className="breakdown-item">
              <span>🟢 Día Completo (DC)</span>
              <strong>{metrics.resumenCodigos.DC} registros</strong>
            </div>
            <div className="breakdown-item">
              <span>🟢 Disponibilidad (D)</span>
              <strong>{metrics.resumenCodigos.D} registros</strong>
            </div>
            <div className="breakdown-item">
              <span>🟡 Medio Día (MD)</span>
              <strong>{metrics.resumenCodigos.MD} registros</strong>
            </div>
            <div className="breakdown-item">
              <span>🟠 Checklist (CL)</span>
              <strong>{metrics.resumenCodigos.CL} registros</strong>
            </div>
            <div className="breakdown-item">
              <span>🔵 Vacaciones (V)</span>
              <strong>{metrics.resumenCodigos.V} registros</strong>
            </div>
          </div>
        </div>

        {/* Resumen SST */}
        <div className="dashboard-card">
          <h4>Indicadores SST (Ley 42H)</h4>
          <div className="sst-metrics-list">
            <div className="sst-metric">
              <Shield size={18} />
              <div>
                <span>Promedio HHT por Técnico:</span>
                <strong>{metrics.promedioHorasPorTrabajador} Horas/Mes</strong>
              </div>
            </div>
            <div className="sst-metric">
              <UserCheck size={18} />
              <div>
                <span>Total Jornadas Efectivas:</span>
                <strong>{metrics.totalDiasTrabajadosProyectos} Días Hombre</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}