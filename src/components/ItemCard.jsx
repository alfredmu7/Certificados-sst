import React from 'react';
import { Tag, MapPin, Calendar, CheckCircle2, AlertTriangle, Pencil, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/ItemCard.css';

export default function ItemCard({
  item,
  estado,
  badgeInfo,
  fechaVencimiento,
  diasRestantes,
  onSelectPdf,
  onEdit,
  onDelete
}) {
  const { esSST } = useAuth();

  // Helper para detectar si el elemento es un producto químico / FDS
  const cat = (item.categoria || '').toLowerCase().trim();
  const esQuimico = cat === 'quimicos' || cat === 'quimico' || cat.includes('quimico') || cat.includes('fds');

  return (
    <div className={`item-card ${estado}`}>
      {/* Cabecera: Tag de Serial a la izquierda | Badge y Acciones a la derecha */}
      <div className="card-top">
        <div className="card-serial">
          <Tag size={14} />
          <span>{item.serial}</span>
        </div>

        <div className="card-top-right">
          <span className={`badge ${badgeInfo.clase}`}>
            {badgeInfo.texto}
          </span>

          {/* Botones de acción SST */}
          {esSST && (
            <div className="card-actions-sst">
              <button
                type="button"
                className="btn-action-icon edit"
                onClick={() => onEdit(item)}
                title="Editar registro"
                aria-label="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="btn-action-icon delete"
                onClick={() => onDelete(item.id)}
                title="Eliminar registro"
                aria-label="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Título del Elemento */}
      <h3 className="item-title">{item.nombre}</h3>

      {/* Detalles de Ubicación y Fechas */}
      <div className="item-details">
        <p className="detail-line">
          <MapPin size={15} className="detail-icon" />
          <span><strong>Ubicación:</strong> {item.ubicacion}</span>
        </p>

        <p className="detail-line">
          <Calendar size={15} className="detail-icon" />
          <span>
            <strong>{esQuimico ? 'Última Revisión:' : 'Última Certificación:'}</strong> {item.fechaCertificacion}
          </span>
        </p>

        <p className="detail-line">
          <Calendar size={15} className="detail-icon" />
          <span><strong>Próxima Renovación:</strong> {fechaVencimiento}</span>
        </p>
      </div>

      {/* Estado del Certificado (Texto adaptado según categoría) */}
      <div className={`status-summary ${estado}`}>
        {diasRestantes < 0 ? (
          <>
            <AlertTriangle size={15} />
            <span>
              {esQuimico ? 'Hoja de vida vencida' : 'Certificación vencida'} (hace {Math.abs(diasRestantes)} días)
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            <span>
              {esQuimico
                ? `Hoja de vida al día (${diasRestantes} días restantes)`
                : `Certificación anual al día (${diasRestantes} días restantes)`}
            </span>
          </>
        )}
      </div>

      {/* Botón Inferior Ver Certificado */}
      <div className="card-footer">
        <button
          type="button"
          className="btn-view-pdf"
          onClick={() => onSelectPdf(item)}
        >
          <FileText size={16} />
          <span>{esQuimico ? 'Ver Hoja de Vida' : 'Ver Certificado'}</span>
        </button>
      </div>
    </div>
  );
}