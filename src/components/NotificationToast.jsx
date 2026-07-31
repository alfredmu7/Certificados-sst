//Popup flotante de notificación de certificados vencidos o próximos a vencer

import React, { useMemo } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import '../styles/NotificationToast.css';

/**
 * Componente Toast de Notificación Flotante (Inferior Derecha)
 * 
 * @param {Array} coworkers - Lista completa de coworkers/técnicos con sus documentos
 * @param {Function} onNavigateToAlerts - Callback para redirigir a la sección de alertas
 * @param {boolean} isVisible - Estado para controlar la visibilidad manual del toast
 * @param {Function} onClose - Función para cerrar/ocultar el toast
 * @param {number} daysThreshold - Días de anticipación para considerar "próximo a vencer" (Default: 30)
 */
export default function NotificationToast({
  coworkers = [],
  onNavigateToAlerts,
  isVisible = true,
  onClose,
  daysThreshold = 30
}) {
  // 🔍 Calcular dinámicamente certificados vencidos y por vencer
  const stats = useMemo(() => {
    let expiredCount = 0;
    let warningCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    coworkers.forEach((coworker) => {
      let docs = coworker.documentos || [];
      if (typeof docs === 'string') {
        try { docs = JSON.parse(docs); } catch (e) { docs = []; }
      }

      if (Array.isArray(docs)) {
        docs.forEach((doc) => {
          const fechaStr = doc.fechaVencimiento || doc.fecha_vencimiento;
          if (!fechaStr) return;

          const vencimiento = new Date(fechaStr);
          vencimiento.setHours(0, 0, 0, 0);

          const diffTime = vencimiento.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            expiredCount++;
          } else if (diffDays <= daysThreshold) {
            warningCount++;
          }
        });
      }
    });

    return { expiredCount, warningCount, totalAlerts: expiredCount + warningCount };
  }, [coworkers, daysThreshold]);

  // Si no hay alertas o el usuario cerró el popup, no renderizar nada
  if (!isVisible || stats.totalAlerts === 0) return null;

  return (
    <div className="notification-toast-container">
      <div className="toast-card" onClick={onNavigateToAlerts}>
        {/* Ícono dinámico según gravedad */}
        <div className={`toast-icon-wrapper ${stats.expiredCount > 0 ? 'status-danger' : 'status-warning'}`}>
          <AlertTriangle size={22} />
        </div>

        {/* Contenido principal del mensaje */}
        <div className="toast-content">
          <div className="toast-header">
            <h4>Alerta de Certificados</h4>
            {onClose && (
              <button
                type="button"
                className="btn-toast-close"
                onClick={(e) => {
                  e.stopPropagation(); // Evita redirigir al dar clic en la X
                  onClose();
                }}
                title="Cerrar notificación"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <p className="toast-message">
            {stats.expiredCount > 0 && stats.warningCount > 0 ? (
              <>
                Hay <strong>{stats.expiredCount} vencido(s)</strong> y <strong>{stats.warningCount} por vencer</strong>.
              </>
            ) : stats.expiredCount > 0 ? (
              <>
                Existen <strong>{stats.expiredCount} certificado(s) vencido(s)</strong>.
              </>
            ) : (
              <>
                Existen <strong>{stats.warningCount} certificado(s) próximos a vencer</strong>.
              </>
            )}
          </p>

          <span className="toast-action-link">
            Revisar alertas <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}