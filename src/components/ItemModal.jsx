import React, { useState, useEffect } from 'react';
import { X, Save, FileText, AlertCircle } from 'lucide-react';
import '../styles/ItemModal.css';

const INITIAL_FORM_STATE = {
  serial: '',
  nombre: '',
  categoria: 'escaleras',
  ubicacion: '',
  fechaCertificacion: new Date().toISOString().split('T')[0],
  pdfFile: null,
  pdfName: '',
  pdfUrl: ''
};

export default function ItemModal({ isOpen, onClose, onSave, itemToEdit }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id,
        serial: itemToEdit.serial || '',
        nombre: itemToEdit.nombre || '',
        categoria: itemToEdit.categoria || 'escaleras',
        ubicacion: itemToEdit.ubicacion || '',
        fechaCertificacion: itemToEdit.fechaCertificacion || new Date().toISOString().split('T')[0],
        pdfFile: null,
        pdfName: itemToEdit.pdfName || 'Certificado_Adjunto.pdf',
        pdfUrl: itemToEdit.pdfUrl || itemToEdit.urlPdf || ''
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
    setError('');
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('El archivo adjunto debe estar en formato PDF.');
        return;
      }
      setError('');
      setFormData((prev) => ({
        ...prev,
        pdfFile: file,
        pdfName: file.name,
        pdfUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.serial.trim() || !formData.nombre.trim() || !formData.ubicacion.trim()) {
      setError('Por favor completa todos los campos requeridos (*).');
      return;
    }
    if (!itemToEdit && !formData.pdfFile && !formData.pdfUrl) {
      setError('Debes adjuntar el certificado en formato PDF.');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card form-modal">
        {/* Encabezado */}
        <div className="modal-header">
          <h2>{itemToEdit ? 'Editar Certificado SST' : 'Registrar Nuevo Equipo'}</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="form-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-grid">
            
            {/* Categoría */}
            <div className="form-group">
              <label htmlFor="categoria">Tipo de Elemento *</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
              >
                <option value="escaleras">Escaleras</option>
                <option value="epcc">Equipos EPCC</option>
                <option value="quimicos">Químicos</option>
              </select>
            </div>

            {/* Serial */}
            <div className="form-group">
              <label htmlFor="serial">Serial / Código Interno *</label>
              <input
                id="serial"
                type="text"
                name="serial"
                placeholder="Ej: ESC-2026-005"
                value={formData.serial}
                onChange={handleChange}
              />
            </div>

            {/* Nombre */}
            <div className="form-group full-width">
              <label htmlFor="nombre">Nombre o Descripción del Elemento *</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                placeholder="Ej: Escalera Dieléctrica Tipo Tijera 8 Pies"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            {/* Ubicación */}
            <div className="form-group">
              <label htmlFor="ubicacion">Ubicación / Área *</label>
              <input
                id="ubicacion"
                type="text"
                name="ubicacion"
                placeholder="Ej: Aeropuerto | JCI"
                value={formData.ubicacion}
                onChange={handleChange}
              />
            </div>

            {/* Fecha de Certificación */}
            <div className="form-group">
              <label htmlFor="fechaCertificacion">Fecha Inspección / Certificación *</label>
              <input
                id="fechaCertificacion"
                type="date"
                name="fechaCertificacion"
                value={formData.fechaCertificacion}
                onChange={handleChange}
              />
              <small className="help-text">El vencimiento se calculará a 1 año.</small>
            </div>

            {/* Subida del PDF */}
            <div className="form-group full-width">
              <label>Certificado o Ficha de Seguridad (PDF) *</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="pdfFile"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
                <label htmlFor="pdfFile" className="btn-file-upload">
                  <FileText size={18} />
                  <span>
                    {formData.pdfName 
                      ? `PDF: ${formData.pdfName}` 
                      : 'Seleccionar Archivo PDF'}
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Botones de Acción */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Save size={18} />
              <span>{itemToEdit ? 'Guardar Cambios' : 'Registrar Equipo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}