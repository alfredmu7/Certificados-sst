import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import '../styles/PdfModal.css';

// PdfModal recibe:
// - item: la escalera/químico seleccionado actualmente
// - onClose: función para cerrar el modal
export default function PdfModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* e.stopPropagation() evita que el modal se cierre al hacer clic adentro */}
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera del Modal */}
        <div className="modal-header">
          <div>
            <h2>{item.nombre}</h2>
            <p className="modal-subtitle">Serial: {item.serial} | Ubicación: {item.ubicacion}</p>
          </div>
          <div className="modal-actions">
            <a 
              href={item.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="icon-btn"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={20} />
            </a>
            <button className="icon-btn close-btn" onClick={onClose} title="Cerrar">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Visor de PDF incorporado */}
        <div className="modal-body">
          <iframe
            src={item.pdfUrl}
            title={`Certificado-${item.serial}`}
            className="pdf-viewer"
          />
        </div>
      </div>
    </div>
  );
}