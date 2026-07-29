import React, { useState, useEffect } from 'react';
import { 
  Users, 
  HardHat, 
  AlertTriangle, 
  ArrowUpRight,
  UserCheck,
  CreditCard,
  CheckCircle,
  PlusCircle,
  UserPlus,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard({ items = [], obtenerCalculosItem, setActiveTab, onOpenModal }) {
  const [coworkersData, setCoworkersData] = useState([]);
  const [loadingCoworkers, setLoadingCoworkers] = useState(true);

  // Consulta extendida de colaboradores desde Supabase
  useEffect(() => {
    const fetchCoworkersData = async () => {
      try {
        const { data, error } = await supabase
          .from('coworkers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCoworkersData(data || []);
      } catch (err) {
        console.error('Error al cargar métricas de coworkers:', err.message);
      } finally {
        setLoadingCoworkers(false);
      }
    };

    fetchCoworkersData();
  }, []);

  // --- CÁLCULOS TÉCNICOS / EQUIPOS ---
  const escalerasCount = items.filter(i => i.categoria === 'escaleras').length;
  const epccCount = items.filter(i => i.categoria === 'epcc').length;
  const quimicosCount = items.filter(i => i.categoria === 'quimicos').length;
  const totalEquipos = items.length;

  let equipVigentes = 0;
  let equipPorVencer = 0;
  let equipVencidos = 0;

  items.forEach(item => {
    if (obtenerCalculosItem) {
      const { estado } = obtenerCalculosItem(item.fechaCertificacion, item.categoria);
      if (estado === 'vigente') equipVigentes++;
      else if (estado === 'por-vencer') equipPorVencer++;
      else if (estado === 'vencido') equipVencidos++;
    }
  });

  // --- ORDENAR EQUIPOS PARA LA SECCIÓN "ÚLTIMOS REGISTRADOS" ---
  const equiposOrdenados = [...items].sort((a, b) => {
    const fechaA = new Date(a.created_at || a.fechaCreacion || a.id);
    const fechaB = new Date(b.created_at || b.fechaCreacion || b.id);
    return fechaB - fechaA;
  });

  // --- CÁLCULOS DOCUMENTACIÓN COWORKERS ---
  const hoy = new Date();
  
  const evaluarFechaDoc = (fechaStr) => {
    if (!fechaStr) return 'vencido';
    const fecha = new Date(fechaStr);
    const difDias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));

    if (difDias < 0) return 'vencido';
    if (difDias <= 30) return 'por-vencer';
    return 'vigente';
  };

  let coworkersAlDia = 0;
  let coworkersConAlertas = 0;
  let carnetsPorVencer = 0;

  coworkersData.forEach(cw => {
    const estCarnet = evaluarFechaDoc(cw.fecha_carnet || cw.vencimiento_carnet);
    
    if (estCarnet === 'por-vencer' || estCarnet === 'vencido') {
      carnetsPorVencer++;
    }

    const estArl = evaluarFechaDoc(cw.fecha_arl || cw.vencimiento_arl);
    
    if (estCarnet !== 'vigente' || estArl !== 'vigente') {
      coworkersConAlertas++;
    } else {
      coworkersAlDia++;
    }
  });

  const totalCoworkers = coworkersData.length;
  const pctCoworkersAlDia = totalCoworkers > 0 ? Math.round((coworkersAlDia / totalCoworkers) * 100) : 0;

  // Porcentajes para Donut SVG de Equipos
  const pEscaleras = totalEquipos > 0 ? (escalerasCount / totalEquipos) * 100 : 0;
  const pEpcc = totalEquipos > 0 ? (epccCount / totalEquipos) * 100 : 0;
  const pQuimicos = totalEquipos > 0 ? (quimicosCount / totalEquipos) * 100 : 0;

  return (
    <div className="admin-dashboard">
      {/* Banner Principal */}
      <div className="dashboard-banner">
        <div className="dashboard-banner-title">
          <h2>Panel Control SST | Johnson Controls</h2>
          <p>Gestión integral de equipos, certificaciones e ingresos de personal.</p>
        </div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setActiveTab && setActiveTab('equipos')}>
          <div className="kpi-info">
            <span className="kpi-value">{totalEquipos}</span>
            <span className="kpi-label">Total Equipos</span>
          </div>
          <div className="kpi-icon blue">
            <HardHat size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab && setActiveTab('equipos')}>
          <div className="kpi-info">
            <span className="kpi-value">{equipVigentes}</span>
            <span className="kpi-label">Equipos Vigentes</span>
          </div>
          <div className="kpi-icon green">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab && setActiveTab('equipos')}>
          <div className="kpi-info">
            <span className="kpi-value">{equipPorVencer + equipVencidos}</span>
            <span className="kpi-label">Equipos en Alerta</span>
          </div>
          <div className="kpi-icon red">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab && setActiveTab('coworkers')}>
          <div className="kpi-info">
            <span className="kpi-value">{loadingCoworkers ? '...' : totalCoworkers}</span>
            <span className="kpi-label">Técnicos Registrados</span>
          </div>
          <div className="kpi-icon purple">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab && setActiveTab('coworkers')}>
          <div className="kpi-info">
            <span className="kpi-value">{coworkersAlDia}</span>
            <span className="kpi-label">Personal Habilitado</span>
          </div>
          <div className="kpi-icon green">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab && setActiveTab('coworkers')}>
          <div className="kpi-info">
            <span className="kpi-value">{carnetsPorVencer}</span>
            <span className="kpi-label">Carnets por Vencer</span>
          </div>
          <div className="kpi-icon amber">
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* --- SECCIÓN ACCESOS RÁPIDOS --- */}
<div className="quick-actions-section">
  <h3 className="quick-actions-title">Accesos Rápidos</h3>
  <div className="quick-actions-grid">
    
    <button 
      type="button"
      className="quick-action-card"
      onClick={() => {
        if (setActiveTab) setActiveTab('equipos');
        if (onOpenModal) onOpenModal('equipo');
      }}
    >
      <div className="quick-action-icon blue">
        <PlusCircle size={20} />
      </div>
      <div className="quick-action-text">
        <span className="quick-action-label">Nuevo Equipo</span>
        <span className="quick-action-desc">Registrar escalera, EPCC o químico</span>
      </div>
    </button>

    <button 
      type="button"
      className="quick-action-card"
      onClick={() => {
        if (setActiveTab) setActiveTab('coworkers');
        if (onOpenModal) onOpenModal('coworker');
      }}
    >
      <div className="quick-action-icon purple">
        <UserPlus size={20} />
      </div>
      <div className="quick-action-text">
        <span className="quick-action-label">Nuevo Técnico</span>
        <span className="quick-action-desc">Agregar colaborador o contratista</span>
      </div>
    </button>

    <button 
      type="button"
      className="quick-action-card"
      onClick={() => setActiveTab && setActiveTab('equipos')}
    >
      <div className="quick-action-icon green">
        <FileText size={20} />
      </div>
      <div className="quick-action-text">
        <span className="quick-action-label">Ver Inspecciones</span>
        <span className="quick-action-desc">Gestionar estado e inspecciones</span>
      </div>
    </button>

    {/* BOTÓN ACTUALIZADO PARA ALERTAS SST */}
    <button 
      type="button"
      className="quick-action-card"
      onClick={() => setActiveTab && setActiveTab('alertas')}
    >
      <div className="quick-action-icon amber">
        <ShieldAlert size={20} />
      </div>
      <div className="quick-action-text">
        <span className="quick-action-label">Alertas SST</span>
        <span className="quick-action-desc">Revisar vencimientos y carnets</span>
      </div>
    </button>

  </div>
</div>

      {/* Grilla de las 3 Gráficas Principales */}
      <div className="charts-grid">
        
        {/* GRÁFICA 1: Donut SVG - Categorías de Equipos */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Distribución de Equipos</h3>
            <p>Porcentajes por línea SST</p>
          </div>

          <div className="donut-chart-container">
            <div className="donut-svg-wrapper">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.8"
                  strokeDasharray={`${pEscaleras}, 100`}
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="3.8"
                  strokeDasharray={`${pEpcc}, 100`}
                  strokeDashoffset={`-${pEscaleras}`}
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3.8"
                  strokeDasharray={`${pQuimicos}, 100`}
                  strokeDashoffset={`-${pEscaleras + pEpcc}`}
                />
              </svg>
              <div className="donut-total">
                <span className="donut-total-num">{totalEquipos}</span>
                <span className="donut-total-text">Total</span>
              </div>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-label">
                  <span className="legend-dot" style={{ background: '#2563eb' }}></span> Escaleras
                </span>
                <span className="legend-value">{escalerasCount}</span>
              </div>
              <div className="legend-item">
                <span className="legend-label">
                  <span className="legend-dot" style={{ background: '#9333ea' }}></span> EPCC
                </span>
                <span className="legend-value">{epccCount}</span>
              </div>
              <div className="legend-item">
                <span className="legend-label">
                  <span className="legend-dot" style={{ background: '#d97706' }}></span> Químicos
                </span>
                <span className="legend-value">{quimicosCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICA 2: Estado Vencimiento Equipos */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Vencimiento de Equipos</h3>
            <p>Salud e inspección técnica</p>
          </div>

          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#16a34a' }}>Vigentes</span>
                <span>{equipVigentes} ({totalEquipos > 0 ? Math.round((equipVigentes/totalEquipos)*100) : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalEquipos > 0 ? (equipVigentes/totalEquipos)*100 : 0}%`, 
                    backgroundColor: '#22c55e' 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#d97706' }}>Por Vencer (&lt; 30d)</span>
                <span>{equipPorVencer} ({totalEquipos > 0 ? Math.round((equipPorVencer/totalEquipos)*100) : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalEquipos > 0 ? (equipPorVencer/totalEquipos)*100 : 0}%`, 
                    backgroundColor: '#f59e0b' 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#dc2626' }}>Vencidos</span>
                <span>{equipVencidos} ({totalEquipos > 0 ? Math.round((equipVencidos/totalEquipos)*100) : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalEquipos > 0 ? (equipVencidos/totalEquipos)*100 : 0}%`, 
                    backgroundColor: '#ef4444' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICA 3: Documentación del Personal */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Estado del Personal</h3>
            <p>Carnet de Acceso y documentación</p>
          </div>

          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#16a34a' }}>Vigentes</span>
                <span>{coworkersAlDia} ({pctCoworkersAlDia}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${pctCoworkersAlDia}%`, 
                    backgroundColor: '#22c55e' 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#dc2626' }}>En Alerta / Vencidos</span>
                <span>{coworkersConAlertas} ({totalCoworkers > 0 ? 100 - pctCoworkersAlDia : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalCoworkers > 0 ? 100 - pctCoworkersAlDia : 0}%`, 
                    backgroundColor: '#ef4444' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Fila Inferior: Actividad Reciente */}
        <div className="chart-card full-width-card">
          <div className="recent-activity-header">
            <div>
              <h3>Últimos Equipos Registrados</h3>
              <p>Inspecciones e ingresos recientes en el sistema</p>
            </div>
            <button 
              onClick={() => setActiveTab && setActiveTab('equipos')}
              className="btn-view-all"
            >
              Ver Todos <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="recent-activity-list">
            {equiposOrdenados.slice(0, 4).map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-info">
                  <span className="activity-title">{item.nombre || item.serial}</span>
                  <span className="activity-subtitle">Serial: {item.serial} | Ubicación: {item.ubicacion || 'N/A'}</span>
                </div>
                <span className={`activity-tag ${item.categoria}`}>
                  {item.categoria}
                </span>
              </div>
            ))}
            {equiposOrdenados.length === 0 && (
              <p className="no-activity-text">
                No hay equipos ni certificados registrados aún.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}