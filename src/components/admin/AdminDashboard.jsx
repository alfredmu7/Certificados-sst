import React, { useState, useEffect, useMemo } from 'react';
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
import NotificationToast from '../NotificationToast';
import '../../styles/AdminDashboard.css';

/**
 * Evalúa el estado de la fecha de un documento de coworker
 */
const evaluarFechaDocCoworker = (fechaStr) => {
  if (!fechaStr) return 'alerta';
  
  const dateOnly = String(fechaStr).split('T')[0].trim();
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return 'alerta';

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'alerta';

  const fechaDoc = new Date(year, month, day, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const difMs = fechaDoc.getTime() - hoy.getTime();
  const difDias = Math.floor(difMs / (1000 * 60 * 60 * 24));

  if (difDias <= 30) {
    return 'alerta'; // Agrupa por vencer y vencido
  }

  return 'vigente';
};

export default function AdminDashboard({ items = [], obtenerCalculosItem, setActiveTab, onOpenModal }) {
  const [coworkersData, setCoworkersData] = useState([]);
  const [loadingCoworkers, setLoadingCoworkers] = useState(true);
  const [showToast, setShowToast] = useState(true);

  // --- CONSULTA COWORKERS ---
  useEffect(() => {
    let isMounted = true;

    const fetchCoworkersData = async () => {
      try {
        const { data, error } = await supabase
          .from('coworkers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setCoworkersData(data || []);
      } catch (err) {
        console.error('Error al cargar métricas de coworkers:', err.message);
      } finally {
        if (isMounted) setLoadingCoworkers(false);
      }
    };

    fetchCoworkersData();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- MÉTRICAS Y CÁLCULOS DE EQUIPOS (3 ESTADOS CONSERVADOS) ---
  const equiposMetrics = useMemo(() => {
    const totalEquipos = items.length;
    let escalerasCount = 0;
    let epccCount = 0;
    let quimicosCount = 0;
    let equipVigentes = 0;
    let equipPorVencer = 0;
    let equipVencidos = 0;

    items.forEach(item => {
      const cat = (item.categoria || '').toLowerCase();
      if (cat === 'escaleras') escalerasCount++;
      else if (cat === 'epcc') epccCount++;
      else if (cat === 'quimicos') quimicosCount++;

      if (obtenerCalculosItem) {
        const { estado } = obtenerCalculosItem(item.fechaCertificacion, item.categoria);
        if (estado === 'vigente') equipVigentes++;
        else if (estado === 'por-vencer') equipPorVencer++;
        else if (estado === 'vencido') equipVencidos++;
      }
    });

    const pEscaleras = totalEquipos > 0 ? (escalerasCount / totalEquipos) * 100 : 0;
    const pEpcc = totalEquipos > 0 ? (epccCount / totalEquipos) * 100 : 0;
    const pQuimicos = totalEquipos > 0 ? (quimicosCount / totalEquipos) * 100 : 0;

    const ordenados = [...items].sort((a, b) => {
      const rawA = a.created_at || a.fechaCreacion;
      const rawB = b.created_at || b.fechaCreacion;
      const fechaA = rawA ? new Date(rawA).getTime() : 0;
      const fechaB = rawB ? new Date(rawB).getTime() : 0;
      return fechaB - fechaA;
    });

    return {
      totalEquipos,
      escalerasCount,
      epccCount,
      quimicosCount,
      equipVigentes,
      equipPorVencer,
      equipVencidos,
      pEscaleras,
      pEpcc,
      pQuimicos,
      equiposOrdenados: ordenados
    };
  }, [items, obtenerCalculosItem]);

  // --- MÉTRICAS DE COWORKERS (VIGENTES / POR VENCER | VENCIDO) ---
  const coworkersMetrics = useMemo(() => {
    let coworkersVigentes = 0;
    let coworkersAlerta = 0; // "Por vencer | Vencido"
    let carnetsPorVencer = 0;

    coworkersData.forEach(cw => {
      const fechaCarnet = cw.fecha_carnet || cw.vencimiento_carnet;
      const fechaArl = cw.fecha_arl || cw.vencimiento_arl;

      const estCarnet = evaluarFechaDocCoworker(fechaCarnet);
      const estArl = evaluarFechaDocCoworker(fechaArl);

      if (estCarnet === 'alerta') {
        carnetsPorVencer++;
      }

      if (estCarnet === 'alerta' || estArl === 'alerta') {
        coworkersAlerta++;
      } else {
        coworkersVigentes++;
      }
    });

    const totalCoworkers = coworkersData.length;
    const pctVigentes = totalCoworkers > 0 ? Math.round((coworkersVigentes / totalCoworkers) * 100) : 0;
    const pctAlerta = totalCoworkers > 0 ? Math.round((coworkersAlerta / totalCoworkers) * 100) : 0;

    return {
      totalCoworkers,
      coworkersVigentes,
      coworkersAlerta,
      carnetsPorVencer,
      pctVigentes,
      pctAlerta
    };
  }, [coworkersData]);

  const {
    totalEquipos, escalerasCount, epccCount, quimicosCount,
    equipVigentes, equipPorVencer, equipVencidos,
    pEscaleras, pEpcc, pQuimicos, equiposOrdenados
  } = equiposMetrics;

  const {
    totalCoworkers, coworkersVigentes, coworkersAlerta,
    carnetsPorVencer, pctVigentes, pctAlerta
  } = coworkersMetrics;

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
        <div className="kpi-card" onClick={() => setActiveTab?.('equipos')}>
          <div className="kpi-info">
            <span className="kpi-value">{totalEquipos}</span>
            <span className="kpi-label">Total Equipos</span>
          </div>
          <div className="kpi-icon blue">
            <HardHat size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab?.('equipos')}>
          <div className="kpi-info">
            <span className="kpi-value">{equipVigentes}</span>
            <span className="kpi-label">Equipos Vigentes</span>
          </div>
          <div className="kpi-icon green">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab?.('equipos')}>
          <div className="kpi-info">
            <span className="kpi-value">{equipPorVencer + equipVencidos}</span>
            <span className="kpi-label">Equipos en Alerta</span>
          </div>
          <div className="kpi-icon red">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab?.('coworkers')}>
          <div className="kpi-info">
            <span className="kpi-value">{loadingCoworkers ? '...' : totalCoworkers}</span>
            <span className="kpi-label">Técnicos Registrados</span>
          </div>
          <div className="kpi-icon purple">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab?.('coworkers')}>
          <div className="kpi-info">
            <span className="kpi-value">{coworkersVigentes}</span>
            <span className="kpi-label">Personal Habilitado</span>
          </div>
          <div className="kpi-icon green">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab?.('coworkers')}>
          <div className="kpi-info">
            <span className="kpi-value">{carnetsPorVencer}</span>
            <span className="kpi-label">Carnets Alerta</span>
          </div>
          <div className="kpi-icon amber">
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="quick-actions-section">
        <h3 className="quick-actions-title">Accesos Rápidos</h3>
        <div className="quick-actions-grid">
          <button 
            type="button"
            className="quick-action-card"
            onClick={() => {
              setActiveTab?.('equipos');
              onOpenModal?.('equipo');
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
              setActiveTab?.('coworkers');
              onOpenModal?.('coworker');
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
            onClick={() => setActiveTab?.('equipos')}
          >
            <div className="quick-action-icon green">
              <FileText size={20} />
            </div>
            <div className="quick-action-text">
              <span className="quick-action-label">Ver Inspecciones</span>
              <span className="quick-action-desc">Gestionar estado e inspecciones</span>
            </div>
          </button>

          <button 
            type="button"
            className="quick-action-card"
            onClick={() => setActiveTab?.('alertas')}
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

      {/* Grilla de Gráficas */}
      <div className="charts-grid">
        {/* GRÁFICA 1: Donut SVG */}
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
                {pEscaleras > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.8"
                    strokeDasharray={`${pEscaleras}, 100`}
                    strokeDashoffset="0"
                  />
                )}
                {pEpcc > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="3.8"
                    strokeDasharray={`${pEpcc}, 100`}
                    strokeDashoffset={`-${pEscaleras}`}
                  />
                )}
                {pQuimicos > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="3.8"
                    strokeDasharray={`${pQuimicos}, 100`}
                    strokeDashoffset={`-${pEscaleras + pEpcc}`}
                  />
                )}
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

        {/* GRÁFICA 2: Estado Vencimiento Equipos (Original con 3 barras) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Vencimiento de Equipos</h3>
            <p>Salud e inspección técnica</p>
          </div>

          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#16a34a' }}>Vigentes</span>
                <span>{equipVigentes} ({totalEquipos > 0 ? Math.round((equipVigentes / totalEquipos) * 100) : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalEquipos > 0 ? (equipVigentes / totalEquipos) * 100 : 0}%`, 
                    backgroundColor: '#22c55e' 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#d97706' }}>Por Vencer</span>
                <span>{equipPorVencer} ({totalEquipos > 0 ? Math.round((equipPorVencer / totalEquipos) * 100) : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalEquipos > 0 ? (equipPorVencer / totalEquipos) * 100 : 0}%`, 
                    backgroundColor: '#f59e0b' 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#dc2626' }}>Vencidos</span>
                <span>{equipVencidos} ({totalEquipos > 0 ? Math.round((equipVencidos / totalEquipos) * 100) : 0}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${totalEquipos > 0 ? (equipVencidos / totalEquipos) * 100 : 0}%`, 
                    backgroundColor: '#ef4444' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICA 3: Estado del Personal (Agrupado) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Estado del Personal</h3>
            <p>Carnet de Acceso y documentación</p>
          </div>

          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#16a34a' }}>Vigentes</span>
                <span>{coworkersVigentes} ({pctVigentes}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${pctVigentes}%`, 
                    backgroundColor: '#22c55e' 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span style={{ color: '#dc2626' }}>por vencer | vencido</span>
                <span>{coworkersAlerta} ({pctAlerta}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${pctAlerta}%`, 
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
              type="button"
              onClick={() => setActiveTab?.('equipos')}
              className="btn-view-all"
            >
              Ver Todos <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="recent-activity-list">
            {equiposOrdenados.slice(0, 4).map((item, idx) => (
              <div key={item.id || item.serial || idx} className="activity-item">
                <div className="activity-info">
                  <span className="activity-title">{item.nombre || item.serial || 'Equipo Sin Nombre'}</span>
                  <span className="activity-subtitle">Serial: {item.serial || 'N/A'} | Ubicación: {item.ubicacion || 'N/A'}</span>
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

      {/* Notification Toast */}
      <NotificationToast
        coworkers={coworkersData}
        items={items}
        obtenerCalculosItem={obtenerCalculosItem}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        onNavigateToAlerts={() => setActiveTab?.('alertas')}
      />
    </div>
  );
}