// src/components/alerts/AlertsManager.jsx
import React, { useState, useMemo } from 'react';
import { Search, Calendar, ShieldAlert, CheckCircle, Clock, FileText } from 'lucide-react';
import AlertHeader from './AlertHeader';
import PdfModal from '../PdfModal'; // Se importa el modal previamente corregido
import '../../styles/AlertsManager.css';

// Transforma textos a Capital Case
const formatCapitalCase = (str = '') => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Función auxiliar para parsear fechas "YYYY-MM-DD" en hora local (evita desfases de Timezone)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return new Date(dateStr);
  return new Date(year, month - 1, day);
};

const calculateStatus = (item) => {
  let daysLeft = item.diasRestantes;
  const expirationDateStr = item.fechaVencimiento;

  if ((daysLeft === undefined || daysLeft === null) && expirationDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = parseLocalDate(expirationDateStr);
    if (expDate) {
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - today;
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  if (daysLeft === null || daysLeft === undefined || isNaN(daysLeft)) {
    return { status: 'UNKNOWN', daysLeft: 0, badgeClass: 'badge-unknown' };
  }

  if (daysLeft < 0) {
    return { status: 'VENCIDO', daysLeft, badgeClass: 'badge-danger' };
  } else if (daysLeft <= 30) {
    return { status: 'POR_VENCER', daysLeft, badgeClass: 'badge-warning' };
  } else {
    return { status: 'VIGENTE', daysLeft, badgeClass: 'badge-success' };
  }
};

export default function AlertsManager({ items = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // State para controlar el Modal del PDF
  const [selectedPdfItem, setSelectedPdfItem] = useState(null);

  const processedItems = useMemo(() => {
    return items.map((item, index) => {
      const calc = calculateStatus(item);
      const categoryFormatted = formatCapitalCase(item.tipoCategoria || 'General');

      return {
        ...item,
        uniqueKey: item.id || `alert-item-${index}`,
        displayCategory: categoryFormatted,
        status: item.estado ? item.estado.toUpperCase().replace('-', '_') : calc.status,
        daysLeft: calc.daysLeft,
        badgeClass: calc.badgeClass
      };
    });
  }, [items]);

  const categoriesList = useMemo(() => {
    const categoriesSet = new Set();
    categoriesSet.add('Coworker');

    processedItems.forEach((i) => {
      if (i.displayCategory) {
        categoriesSet.add(i.displayCategory);
      }
    });

    return Array.from(categoriesSet);
  }, [processedItems]);

  const expiredCount = useMemo(() => processedItems.filter((i) => i.status === 'VENCIDO').length, [processedItems]);
  const warningCount = useMemo(() => processedItems.filter((i) => i.status === 'POR_VENCER').length, [processedItems]);
  const validCount = useMemo(() => processedItems.filter((i) => i.status === 'VIGENTE').length, [processedItems]);

  const filteredItems = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return processedItems.filter((item) => {
      const matchesSearch =
        item.entidadNombre?.toLowerCase().includes(searchLower) ||
        item.identificador?.toLowerCase().includes(searchLower) ||
        item.nombreDocumento?.toLowerCase().includes(searchLower) ||
        item.displayCategory?.toLowerCase().includes(searchLower);

      const matchesCategory =
        categoryFilter === 'ALL' ||
        item.displayCategory.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      let matchesDate = true;
      if (item.fechaVencimiento) {
        const itemDate = parseLocalDate(item.fechaVencimiento);
        if (itemDate) {
          itemDate.setHours(0, 0, 0, 0);

          if (dateFrom) {
            const fromDate = parseLocalDate(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && itemDate >= fromDate;
          }

          if (dateTo) {
            const toDate = parseLocalDate(dateTo);
            toDate.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && itemDate <= toDate;
          }
        }
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [processedItems, searchTerm, categoryFilter, statusFilter, dateFrom, dateTo]);

  // Handler para abrir el modal transformando las propiedades para el PdfModal
  const handleOpenPdf = (item) => {
    setSelectedPdfItem({
      nombre: item.nombreDocumento || item.entidadNombre || 'Documento',
      serial: item.identificador || 'N/A',
      ubicacion: item.displayCategory || 'General',
      pdfUrl: item.pdfUrl || item.url || item.documentoUrl
    });
  };

  // Handler para cerrar el modal
  const handleClosePdf = () => {
    setSelectedPdfItem(null);
  };

  return (
    <div className="alerts-manager-container">
      <AlertHeader expiredCount={expiredCount} warningCount={warningCount} />

      <div className="alerts-kpi-grid">
        <div className="kpi-card kpi-total">
          <span className="kpi-title">Total Registros</span>
          <span className="kpi-value">{processedItems.length}</span>
        </div>
        <div className="kpi-card kpi-danger">
          <span className="kpi-title">Vencidos</span>
          <span className="kpi-value">{expiredCount}</span>
        </div>
        <div className="kpi-card kpi-warning">
          <span className="kpi-title">Por Vencer</span>
          <span className="kpi-value">{warningCount}</span>
        </div>
        <div className="kpi-card kpi-success">
          <span className="kpi-title">Vigentes</span>
          <span className="kpi-value">{validCount}</span>
        </div>
      </div>

      <div className="alerts-filter-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por colaborador, equipo, cédula o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="ALL">Todas las Categorías</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Coworker' ? 'Coworkers' : cat}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Todos los Estados</option>
            <option value="VENCIDO">🔴 Vencidos</option>
            <option value="POR_VENCER">🟡 Por Vencer</option>
            <option value="VIGENTE">🟢 Vigentes</option>
          </select>

          <div className="date-range-group">
            <Calendar size={16} />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Desde" />
            <span>a</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Hasta" />
          </div>
        </div>
      </div>

      <div className="alerts-table-wrapper">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Entidad / Titular</th>
              <th>Categoría</th>
              <th>Documento</th>
              <th>Fecha Vencimiento</th>
              <th>Días Restantes</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const pdfAvailable = Boolean(item.pdfUrl || item.url || item.documentoUrl);

                return (
                  <tr key={item.uniqueKey} className={`row-status-${item.status.toLowerCase()}`}>
                    <td>
                      <span className={`status-badge ${item.badgeClass}`}>
                        {item.status === 'VENCIDO' && <ShieldAlert size={14} />}
                        {item.status === 'POR_VENCER' && <Clock size={14} />}
                        {item.status === 'VIGENTE' && <CheckCircle size={14} />}
                        {item.status === 'POR_VENCER' ? 'Por Vencer' : item.status}
                      </span>
                    </td>
                    <td>
                      <div className="entity-cell">
                        <span className="entity-name">{item.entidadNombre}</span>
                        <span className="entity-id">ID: {item.identificador}</span>
                      </div>
                    </td>
                    <td>
                      <span className="type-tag">
                        {item.displayCategory === 'Coworker' ? 'Coworker' : item.displayCategory}
                      </span>
                    </td>
                    <td>
                      {item.displayCategory === 'Coworker' ? (
                        <span className="doc-type-badge">{item.nombreDocumento || 'Certificado'}</span>
                      ) : (
                        <span className="doc-type-generic">—</span>
                      )}
                    </td>
                    <td className="date-cell">{item.fechaVencimiento || 'Sin Fecha'}</td>
                    <td>
                      <span
                        className={`days-tag ${
                          item.daysLeft < 0
                            ? 'days-negative'
                            : item.daysLeft <= 30
                            ? 'days-warning'
                            : 'days-positive'
                        }`}
                      >
                        {item.daysLeft < 0
                          ? `Hace ${Math.abs(item.daysLeft)} días`
                          : `${item.daysLeft} días`}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-view-pdf-ver"
                        onClick={() => handleOpenPdf(item)}
                        disabled={!pdfAvailable}
                        title={pdfAvailable ? "Ver PDF" : "Sin PDF disponible"}
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="empty-table-msg">
                  No se encontraron registros que coincidan con los criterios de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para visualizar el PDF */}
      <PdfModal item={selectedPdfItem} onClose={handleClosePdf} />
    </div>
  );
}