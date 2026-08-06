import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Clock, AlertCircle, FileSpreadsheet, 
  RotateCcw, ArrowLeft, ShieldCheck, Loader2, UserPlus, Trash2, X,
  User, CreditCard, LayoutDashboard, Shield, UserCheck, AlertTriangle, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabaseClient';
import '../../styles/AttendanceControl.css'; 
import '../../styles/AttendanceDashboard.css';

const FESTIVOS_COLOMBIA_2026 = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-07-20',
  '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16',
  '2026-12-08', '2026-12-25'
];

const CODIGOS_ASISTENCIA = {
  DC: { label: 'Día Completo (8.5h)', horas: 8.5, color: '#22c55e', bg: '#dcfce7' },
  D:  { label: 'Disponibilidad (Variable)', horas: 8.5, esVariable: true, color: '#16a34a', bg: '#dcfce7' },
  MD: { label: 'Medio Día (4.25h)', horas: 4.25, color: '#eab308', bg: '#fef9c3' },
  CL: { label: 'Checklist (4.0h)', horas: 4.0, color: '#f97316', bg: '#ffedd5' },
  I:  { label: 'Incapacidad (8.5h)', horas: 8.5, esIncapacidad: true, color: '#ef4444', bg: '#fee2e2' },
  V:  { label: 'Vacaciones (0h)', horas: 0, color: '#3b82f6', bg: '#dbeafe' },
};

// --- COMPONENTE INTERNO DASHBOARD SST ---
function InternalAttendanceDashboard({ trabajadores, asistencia, daysInMonth, selectedMonth }) {
  const metrics = useMemo(() => {
    let totalHHT = 0;
    let totalHHTHombres = 0;
    let totalHHTMujeres = 0;
    let totalIncapacidades = 0;
    let totalDiasTrabajadosProyectos = 0;

    const conteoGeneros = {
      M: trabajadores.filter(t => t.genero === 'M' || !t.genero).length,
      F: trabajadores.filter(t => t.genero === 'F').length,
    };

    const resumenCodigos = { DC: 0, D: 0, MD: 0, CL: 0, I: 0, V: 0 };

    trabajadores.forEach((t) => {
      daysInMonth.forEach((d) => {
        const item = asistencia[`${t.id}_${d.dateStr}`];
        if (item && item.codigo) {
          const code = item.codigo;
          const config = CODIGOS_ASISTENCIA[code];
          
          let horas = item.horas !== undefined && item.horas !== null 
            ? Number(item.horas) 
            : (config?.horas || 0);

          if (resumenCodigos[code] !== undefined) {
            resumenCodigos[code]++;
          }

          totalHHT += horas;
          if (t.genero === 'F') {
            totalHHTMujeres += horas;
          } else {
            totalHHTHombres += horas;
          }

          if (horas > 0) totalDiasTrabajadosProyectos++;
          if (config?.esIncapacidad) totalIncapacidades++;
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
        <h3>📊 Métricas SST ({selectedMonth})</h3>
      </div>

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
          <div className="kpi-data" style={{ width: '100%' }}>
            <span className="kpi-title" style={{ marginBottom: '8px', display: 'block' }}>HHT por Género</span>
            <div className="gender-hht-grid">
              <div className="gender-box">
                <span className="gender-label">👨 Masculino</span>
                <h3 className="gender-value">{metrics.totalHHTHombres} <small>hrs</small></h3>
              </div>
              <div className="gender-divider"></div>
              <div className="gender-box">
                <span className="gender-label">👩 Femenino</span>
                <h3 className="gender-value">{metrics.totalHHTMujeres} <small>hrs</small></h3>
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-icon"><AlertTriangle size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-title">Incapacidades</span>
            <h2 className="kpi-value">{metrics.totalIncapacidades}</h2>
            <span className="kpi-subtitle">Eventos registrados</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections-grid">
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
              <span>🔴 Incapacidad (I)</span>
              <strong>{metrics.resumenCodigos.I} registros</strong>
            </div>
            <div className="breakdown-item">
              <span>🔵 Vacaciones (V)</span>
              <strong>{metrics.resumenCodigos.V} registros</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h4>Indicadores SST</h4>
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

// --- COMPONENTE PRINCIPAL ---
export default function AttendanceControl({ onBack }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [trabajadores, setTrabajadores] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [observacionesGenerales, setObservacionesGenerales] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal Agregar Trabajador
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCedula, setNuevaCedula] = useState('');
  const [nuevoGenero, setNuevoGenero] = useState('M');
  const [savingWorker, setSavingWorker] = useState(false);

  // Toggle Dashboard
  const [showDashboard, setShowDashboard] = useState(true);

  // Días del Mes
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const daysArr = [];

    for (let day = 1; day <= totalDays; day++) {
      const dayString = String(day).padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayString}`;
      const currDate = new Date(year, month - 1, day);
      const dayOfWeek = currDate.getDay();

      daysArr.push({
        dayNumber: day,
        dateStr,
        dayName: currDate.toLocaleDateString('es-CO', { weekday: 'narrow' }).toUpperCase(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: FESTIVOS_COLOMBIA_2026.includes(dateStr)
      });
    }
    return daysArr;
  }, [selectedMonth]);

  // Carga de Datos desde Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const [resTrab, resAsist] = await Promise.all([
        supabase.from('trabajadores').select('*').order('nombre_completo', { ascending: true }),
        supabase.from('asistencia_diaria').select('*').gte('fecha', startDate).lte('fecha', endDate)
      ]);

      if (resTrab.error) throw resTrab.error;
      if (resAsist.error) throw resAsist.error;

      setTrabajadores(resTrab.data || []);

      const mappedAsistencia = {};
      const mappedObs = {};
      resAsist.data?.forEach((item) => {
        const key = `${item.trabajador_id}_${item.fecha}`;
        mappedAsistencia[key] = { 
          codigo: item.codigo_estado, 
          horas: item.horas !== undefined && item.horas !== null ? item.horas : undefined,
          observacion: item.observacion || '' 
        };
        if (item.observacion) mappedObs[item.trabajador_id] = item.observacion;
      });

      setAsistencia(mappedAsistencia);
      setObservacionesGenerales(mappedObs);
    } catch (err) {
      console.error('Error al cargar Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Guardar Marca y Horas en Supabase
  const handleCellChange = async (trabajadorId, dateStr, codigo, customHours) => {
    const key = `${trabajadorId}_${dateStr}`;
    const defaultHours = CODIGOS_ASISTENCIA[codigo]?.horas || 0;
    const finalHours = customHours !== undefined && customHours !== null && customHours !== ''
      ? Number(customHours) 
      : defaultHours;

    // 1. Actualización en estado local de React
    setAsistencia(prev => {
      const copy = { ...prev };
      if (!codigo) {
        delete copy[key];
      } else {
        copy[key] = { 
          codigo, 
          horas: finalHours, 
          observacion: prev[key]?.observacion || '' 
        };
      }
      return copy;
    });

    // 2. Persistencia en Supabase
    try {
      if (!codigo) {
        const { error } = await supabase
          .from('asistencia_diaria')
          .delete()
          .eq('trabajador_id', trabajadorId)
          .eq('fecha', dateStr);

        if (error) {
          console.error('Error al borrar en Supabase:', error);
          alert(`Error al eliminar: ${error.message}`);
        }
      } else {
        const { error } = await supabase
          .from('asistencia_diaria')
          .upsert(
            { 
              trabajador_id: trabajadorId, 
              fecha: dateStr, 
              codigo_estado: codigo,
              horas: finalHours,
              observacion: observacionesGenerales[trabajadorId] || '' 
            },
            { onConflict: 'trabajador_id, fecha' }
          );

        if (error) {
          console.error('Error al hacer upsert en Supabase:', error);
          alert(`Error al guardar asistencia: ${error.message}`);
        }
      }
    } catch (err) {
      console.error('Error inesperado de red o código:', err);
    }
  };

  // Crear Trabajador
  const handleAddTrabajador = async (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevaCedula) return alert('Por favor llena los campos requeridos');

    try {
      setSavingWorker(true);
      const { error } = await supabase.from('trabajadores').insert([
        { nombre_completo: nuevoNombre, cedula: nuevaCedula, genero: nuevoGenero, activo: true }
      ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('La cédula ingresada ya pertenece a un trabajador registrado.');
        }
        throw error;
      }

      setNuevoNombre('');
      setNuevaCedula('');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error al guardar trabajador: ' + err.message);
    } finally {
      setSavingWorker(false);
    }
  };

  // Eliminar Trabajador
  const handleDeleteTrabajador = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar definitivamente a ${nombre}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trabajadores')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No se pudo borrar en la base de datos. Revisa las políticas RLS de la tabla "trabajadores".');
        return;
      }

      setTrabajadores(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error al borrar trabajador:', err);
      alert(`Error eliminando a ${nombre}: ` + err.message);
    }
  };

  // Métricas para la Tabla
  const metrics = useMemo(() => {
    let totalHHT = 0;
    let totalHHTMujeres = 0;
    let totalIncapacidades = 0;
    const workerTotals = {};

    trabajadores.forEach((t) => {
      let diasTrabajados = 0;
      let horasTrabajador = 0;
      let incapacidadesCount = 0;

      daysInMonth.forEach((d) => {
        const item = asistencia[`${t.id}_${d.dateStr}`];
        if (item && item.codigo) {
          const config = CODIGOS_ASISTENCIA[item.codigo];
          const hrs = item.horas !== undefined ? Number(item.horas) : (config?.horas || 0);

          horasTrabajador += hrs;
          if (hrs > 0) diasTrabajados++;
          if (config?.esIncapacidad) incapacidadesCount++;
        }
      });

      totalHHT += horasTrabajador;
      if (t.genero === 'F') totalHHTMujeres += horasTrabajador;
      totalIncapacidades += incapacidadesCount;

      workerTotals[t.id] = { 
        diasTrabajados, 
        horasTrabajador: Number(horasTrabajador.toFixed(1)), 
        incapacidadesCount 
      };
    });

    return { 
      totalHHT: Number(totalHHT.toFixed(1)), 
      totalHHTMujeres: Number(totalHHTMujeres.toFixed(1)), 
      totalIncapacidades, 
      workerTotals 
    };
  }, [trabajadores, daysInMonth, asistencia]);

  // Exportar Excel
  const handleExportExcel = () => {
    if (trabajadores.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const dataToExport = trabajadores.map((t, idx) => {
      const stats = metrics.workerTotals[t.id] || { diasTrabajados: 0, horasTrabajador: 0 };
      
      const row = {
        '#': idx + 1,
        'Nombre Completo': t.nombre_completo,
        'Cédula': t.cedula,
        'Género': t.genero || 'M'
      };

      daysInMonth.forEach((d) => {
        const item = asistencia[`${t.id}_${d.dateStr}`];
        let val = '-';
        if (item?.codigo) {
          const hrs = item.horas ?? CODIGOS_ASISTENCIA[item.codigo]?.horas ?? 0;
          val = `${item.codigo} (${hrs}h)`;
        }
        row[`Día ${d.dayNumber}`] = val;
      });

      row['Días Trabajados'] = stats.diasTrabajados;
      row['Total HHT'] = stats.horasTrabajador;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia SST');
    XLSX.writeFile(workbook, `Control_Asistencia_${selectedMonth}.xlsx`);
  };

  return (
    <div className="attendance-container">
      {/* BANNER PRINCIPAL */}
      <div className="attendance-banner">
        <div>
          {onBack && (
            <button type="button" className="btn-back" onClick={onBack}>
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          <h2>Control de Asistencia SST</h2>
          <p>Lleva el registro de asistencia diario por trabajador</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-month"
          />

          <button 
            type="button" 
            className="btn-add-worker" 
            onClick={() => setShowDashboard(!showDashboard)}
            style={{ backgroundColor: '#4f46e5' }}
          >
            <LayoutDashboard size={16} /> {showDashboard ? 'Ocultar Dashboard' : 'Ver Dashboard'}
          </button>

          <button 
            type="button" 
            className="btn-add-worker" 
            onClick={handleExportExcel}
            style={{ backgroundColor: '#16a34a' }}
            title="Descargar reporte en formato Excel"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>

          <button type="button" className="btn-add-worker" onClick={() => setShowModal(true)}>
            <UserPlus size={16} /> Agregar Trabajador
          </button>
        </div>
      </div>

      {/* COMPONENTE DASHBOARD */}
      {showDashboard && (
        <InternalAttendanceDashboard 
          trabajadores={trabajadores}
          asistencia={asistencia}
          daysInMonth={daysInMonth}
          selectedMonth={selectedMonth}
        />
      )}

      {/* BARRA LEYENDA */}
      <div className="attendance-actions-bar">
        <div className="legend-pills">
          {Object.entries(CODIGOS_ASISTENCIA).map(([code, item]) => (
            <span key={code} className="legend-pill" style={{ backgroundColor: item.bg, color: item.color }}>
              <strong>{code}</strong>: {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* TABLA HORIZONTAL */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin-icon" size={24} /> 
          <span>Cargando matriz de asistencia...</span>
        </div>
      ) : (
        <div className="table-scroll-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="col-sticky col-num">#</th>
                <th className="col-sticky col-name">Nombre y Apellido</th>
                <th className="col-sticky col-cedula">Cédula</th>
                {daysInMonth.map((d) => (
                  <th key={d.dateStr} className={`col-day ${d.isWeekend ? 'is-weekend' : ''}`}>
                    <div className="day-name">{d.dayName}</div>
                    <div className="day-num">{d.dayNumber}</div>
                  </th>
                ))}
                <th>Días</th>
                <th>HHT</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {trabajadores.map((t, idx) => {
                const stats = metrics.workerTotals[t.id] || { diasTrabajados: 0, horasTrabajador: 0 };
                return (
                  <tr key={t.id}>
                    <td className="col-sticky col-num">{idx + 1}</td>
                    <td className="col-sticky col-name">{t.nombre_completo}</td>
                    <td className="col-sticky col-cedula">{t.cedula}</td>

                    {/* Días del mes */}
                    {daysInMonth.map((d) => {
                      const key = `${t.id}_${d.dateStr}`;
                      const currentItem = asistencia[key];
                      const currentCode = currentItem?.codigo || '';
                      const codeConfig = CODIGOS_ASISTENCIA[currentCode];
                      
                      const currentHours = currentItem?.horas !== undefined && currentItem?.horas !== null
                        ? currentItem.horas
                        : (codeConfig?.horas ?? 0);

                      return (
                        <td key={d.dateStr} className="cell-day">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            <select
                              value={currentCode}
                              onChange={(e) => handleCellChange(t.id, d.dateStr, e.target.value)}
                              style={{
                                backgroundColor: codeConfig ? codeConfig.bg : 'white',
                                color: codeConfig ? codeConfig.color : '#333'
                              }}
                            >
                              <option value="">-</option>
                              <option value="DC">DC</option>
                              <option value="D">D</option>
                              <option value="MD">MD</option>
                              <option value="CL">CL</option>
                              <option value="I">I</option>
                              <option value="V">V</option>
                            </select>

                            {/* Campo editable disponible para todas las opciones */}
                            {currentCode !== '' && (
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max="24"
                                value={currentHours}
                                onChange={(e) => handleCellChange(t.id, d.dateStr, currentCode, e.target.value)}
                                style={{
                                  width: '42px',
                                  fontSize: '0.7rem',
                                  textAlign: 'center',
                                  border: `1px solid ${codeConfig?.color || '#16a34a'}`,
                                  borderRadius: '4px',
                                  padding: '1px',
                                  background: '#fff'
                                }}
                                title="Editar horas de la jornada"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="stat-cell">{stats.diasTrabajados}d</td>
                    <td className="stat-cell">{stats.horasTrabajador}h</td>
                    <td>
                      <button 
                        type="button" 
                        className="btn-delete" 
                        onClick={() => handleDeleteTrabajador(t.id, t.nombre_completo)}
                        title="Eliminar integrante definitivamente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL AGREGAR TRABAJADOR */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Agregar Coworker</h3>
                <p>Registra un nuevo técnico para el control de asistencia interno de SST</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTrabajador} className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <User size={14} /> NOMBRE COMPLETO *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Fabian Bernal"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <CreditCard size={14} /> CÉDULA / ID *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 1018234567"
                    value={nuevaCedula}
                    onChange={(e) => setNuevaCedula(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Users size={14} /> GÉNERO
                  </label>
                  <select
                    className="form-control"
                    value={nuevoGenero}
                    onChange={(e) => setNuevoGenero(e.target.value)}
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingWorker}
                >
                  {savingWorker ? (
                    <>
                      <Loader2 size={16} className="spin-icon" /> Guardando...
                    </>
                  ) : (
                    'Guardar Coworker'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}