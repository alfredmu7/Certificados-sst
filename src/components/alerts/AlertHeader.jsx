//Este componente analiza el inventario unificado de documentos e identifica únicamente los estados críticos para captar la atención inmediata del usuario.
//Tarjetas/Banderas dinámicas superiores que solo se muestran si hay elementos Por Vencer (Amarillo) o Vencidos (Rojo). Si todo está al día, el encabezado se oculta automáticamente.

import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import '../../styles/AlertHeader.css';

export default function AlertHeader({ expiredCount, warningCount }) {
  // Si no hay vencidos ni por vencer, no se muestra nada (o muestra bandera verde)
  if (expiredCount === 0 && warningCount === 0) {
    return null;
  }

  return (
    <div className="alert-header-container">
      {expiredCount > 0 && (
        <div className="alert-banner banner-danger">
          <div className="banner-icon">
            <AlertCircle size={24} />
          </div>
          <div className="banner-info">
            <h4>{expiredCount} Documento(s) Vencido(s)</h4>
            <p>Atención inmediata requerida. Hay documentación operativamente inhabilitada.</p>
          </div>
        </div>
      )}

      {warningCount > 0 && (
        <div className="alert-banner banner-warning">
          <div className="banner-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="banner-info">
            <h4>{warningCount} Próximo(s) a Vencer (30 días)</h4>
            <p>Acción preventiva recomendada para evitar la interrupción de actividades.</p>
          </div>
        </div>
      )}
    </div>
  );
}