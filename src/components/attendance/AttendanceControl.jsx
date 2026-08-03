import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Clock, AlertCircle, FileSpreadsheet, 
  RotateCcw, ArrowLeft, ShieldCheck, Loader2, UserPlus, Trash2, X,
  User, CreditCard 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabaseClient';
import '../../styles/AttendanceControl.css'; 

const FESTIVOS_COLOMBIA_2026 = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-07-20',
  '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16',
  '2026-12-08', '2026-12-25'
];

const CODIGOS_ASISTENCIA = {
  DC: { label: 'Día Completo (8.4h)', horas: 8.4, color: '#22c55e', bg: '#dcfce7' },
  D:  { label: 'Disponibilidad (8.4h)', horas: 8.4, color: '#16a34a', bg: '#dcfce7' },
  MD: { label: 'Medio Día (4.2h)', horas: 4.2, color: '#eab308', bg: '#fef9c3' },
  CL: { label: 'Checklist (4.0h)', horas: 4.0, color: '#f97316', bg: '#ffedd5' },
  I:  { label: 'Incapacidad (0h)', horas: 0, esIncapacidad: true, color: '#ef4444', bg: '#fee2e2' },
  V:  { label: 'Vacaciones (0h)', horas: 0, color: '#3b82f6', bg: '#dbeafe' },
};

export default function AttendanceControl({ onBack }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [trabajadores, setTrabajadores] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [observacionesGenerales, setObservacionesGenerales] = useState({});
  const [loading, setLoading] = useState(true);

  // Estado del Modal de Agregar Trabajador
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCedula, setNuevaCedula] = useState('');
  const [nuevoGenero, setNuevoGenero] = useState('M');
  const [savingWorker, setSavingWorker] = useState(false);

  // Generación de Días del Mes
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

  // Consultar Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const [resTrab, resAsist] = await Promise.all([
        supabase.from('trabajadores').select('*').eq('activo', true).order('nombre_completo', { ascending: true }),
        supabase.from('asistencia_diaria').select('*').gte('fecha', startDate).lte('fecha', endDate)
      ]);

      if (resTrab.error) throw resTrab.error;
      if (resAsist.error) throw resAsist.error;

      setTrabajadores(resTrab.data || []);

      const mappedAsistencia = {};
      const mappedObs = {};
      resAsist.data?.forEach((item) => {
        const key = `${item.trabajador_id}_${item.fecha}`;
        mappedAsistencia[key] = { codigo: item.codigo_estado, observacion: item.observacion || '' };
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

  // Guardar Marca en Supabase y actualizar estado local
  const handleCellChange = async (trabajadorId, dateStr, codigo) => {
    const key = `${trabajadorId}_${dateStr}`;
    
    setAsistencia(prev => {
      const copy = { ...prev };
      if (!codigo) {
        delete copy[key];
      } else {
        copy[key] = { codigo, observacion: prev[key]?.observacion || '' };
      }
      return copy;
    });

    try {
      if (!codigo) {
        await supabase
          .from('asistencia_diaria')
          .delete()
          .eq('trabajador_id', trabajadorId)
          .eq('fecha', dateStr);
      } else {
        const { error } = await supabase.from('asistencia_diaria').upsert(
          { 
            trabajador_id: trabajadorId, 
            fecha: dateStr, 
            codigo_estado: codigo, 
            observacion: observacionesGenerales[trabajadorId] || '' 
          },
          { onConflict: 'trabajador_id, fecha' }
        );

        if (error) {
          console.error('Error al guardar en Supabase:', error);
          alert('No se pudo guardar la marca. Revisa las políticas o permisos de la tabla asistencia_diaria.');
        }
      }
    } catch (err) {
      console.error('Error guardando marca:', err);
    }
  };

  // Crear Nuevo Trabajador
  const handleAddTrabajador = async (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevaCedula) return alert('Por favor llena los campos requeridos');

    try {
      setSavingWorker(true);
      const { error } = await supabase.from('trabajadores').insert([
        { nombre_completo: nuevoNombre, cedula: nuevaCedula, genero: nuevoGenero, activo: true }
      ]);

      if (error) throw error;

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

  // Desactivar/Eliminar Trabajador
  const handleDeleteTrabajador = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) {
      try {
        await supabase.from('trabajadores').update({ activo: false }).eq('id', id);
        fetchData();
      } catch (err) {
        console.error('Error eliminando trabajador:', err);
      }
    }
  };

  // Cálculo Dinámico de Métricas (Días y Horas)
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
        const mark = asistencia[`${t.id}_${d.dateStr}`]?.codigo;
        if (mark && CODIGOS_ASISTENCIA[mark]) {
          const config = CODIGOS_ASISTENCIA[mark];
          horasTrabajador += config.horas;
          if (config.horas > 0) diasTrabajados++;
          if (config.esIncapacidad) incapacidadesCount++;
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

  // FUNCIÓN PARA EXPORTAR LA TABLA A EXCEL (.XLSX)
  const handleExportExcel = () => {
    if (trabajadores.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Construcción de la matriz de datos
    const dataToExport = trabajadores.map((t, idx) => {
      const stats = metrics.workerTotals[t.id] || { diasTrabajados: 0, horasTrabajador: 0 };
      
      // Datos fijos del trabajador
      const row = {
        '#': idx + 1,
        'Nombre Completo': t.nombre_completo,
        'Cédula': t.cedula,
        'Género': t.genero || 'M'
      };

      // Columnas dinámicas de días (1 al 30/31)
      daysInMonth.forEach((d) => {
        const mark = asistencia[`${t.id}_${d.dateStr}`]?.codigo || '-';
        row[`Día ${d.dayNumber}`] = mark;
      });

      // Totales
      row['Días Trabajados'] = stats.diasTrabajados;
      row['Total HHT'] = stats.horasTrabajador;

      return row;
    });

    // Crear libro de trabajo en XLSX
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia SST');

    // Descargar archivo
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
          <p>Sincronización en tiempo real con Supabase (Ley 42H)</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-month"
          />

          {/* BOTÓN EXPORTAR EXCEL */}
          <button 
            type="button" 
            className="btn-add-worker" 
            onClick={handleExportExcel}
            style={{ backgroundColor: '#16a34a' }} /* Color verde Excel */
            title="Descargar reporte en formato Excel"
          >
            <FileSpreadsheet size={16} /> Exportar Excel
          </button>

          <button type="button" className="btn-add-worker" onClick={() => setShowModal(true)}>
            <UserPlus size={16} /> Agregar Trabajador
          </button>
        </div>
      </div>

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
                      const currentCode = asistencia[key]?.codigo || '';
                      const codeConfig = CODIGOS_ASISTENCIA[currentCode];

                      return (
                        <td key={d.dateStr} className="cell-day">
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
                        title="Eliminar integrante"
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
                    'Guardar Trabajador'
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