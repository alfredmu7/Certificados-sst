// Formulario / Modal para Crear y Editar Coworkers
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import '../../styles/CoworkerModal.css';

export default function CoworkerModal({ isOpen, onClose, onSave, coworkerToEdit }) {
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    cargo: '',
    credencial: '',
    fecha_carnet: '',
    pdfUrl: '',
    pdfFile: null,
    documentos: [
      { id: Date.now(), tipo: 'Seguridad Social / ARL', nombre: '', fechaVencimiento: '' }
    ]
  });

  useEffect(() => {
    if (coworkerToEdit) {
      setFormData({
        id: coworkerToEdit.id,
        nombre: coworkerToEdit.nombre || '',
        cedula: coworkerToEdit.cedula || '',
        cargo: coworkerToEdit.cargo || '',
        credencial: coworkerToEdit.credencial || '',
        fecha_carnet: coworkerToEdit.fecha_carnet || coworkerToEdit.vencimiento_carnet || '',
        pdfUrl: coworkerToEdit.pdf_url || coworkerToEdit.pdfUrl || '',
        pdfFile: null,
        documentos: coworkerToEdit.documentos?.length > 0 
          ? coworkerToEdit.documentos 
          : [{ id: Date.now(), tipo: 'Seguridad Social / ARL', nombre: '', fechaVencimiento: '' }]
      });
    } else {
      setFormData({
        nombre: '',
        cedula: '',
        cargo: '',
        credencial: '',
        fecha_carnet: '',
        pdfUrl: '',
        pdfFile: null,
        documentos: [
          { id: Date.now(), tipo: 'Seguridad Social / ARL', nombre: '', fechaVencimiento: '' }
        ]
      });
    }
  }, [coworkerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, pdfFile: file }));
    }
  };

  const handleDocChange = (index, field, value) => {
    const updatedDocs = [...formData.documentos];
    updatedDocs[index][field] = value;
    setFormData(prev => ({ ...prev, documentos: updatedDocs }));
  };

  const handleAddDoc = () => {
    setFormData(prev => ({
      ...prev,
      documentos: [
        ...prev.documentos,
        { id: Date.now(), tipo: 'Certificación / Curso', nombre: '', fechaVencimiento: '' }
      ]
    }));
  };

  const handleRemoveDoc = (index) => {
    if (formData.documentos.length === 1) {
      alert("Debe haber al menos un documento registrado.");
      return;
    }
    const updatedDocs = formData.documentos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, documentos: updatedDocs }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.cedula || !formData.credencial) {
      alert("Por favor completa Nombre, Cédula y Credencial personal.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container coworker-modal">
        <div className="modal-header">
          <h3>{coworkerToEdit ? 'Editar Colaborador' : 'Registrar Nuevo Coworker'}</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Fila 1: Nombre y Cédula */}
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo *</label>
              <input 
                id="nombre"
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                placeholder="Ej. Juan Pérez" 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="cedula">Cédula / Documento *</label>
              <input 
                id="cedula"
                type="text" 
                name="cedula" 
                value={formData.cedula} 
                onChange={handleChange} 
                placeholder="Ej. 1018456789" 
                required 
              />
            </div>
          </div>

          {/* Fila 2: Cargo y Credencial */}
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="cargo">Cargo / Especialidad</label>
              <input 
                id="cargo"
                type="text" 
                name="cargo" 
                value={formData.cargo} 
                onChange={handleChange} 
                placeholder="Ej. Técnico de Mantenimiento HVAC" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="credencial">Credencial de Acceso Personal *</label>
              <input 
                id="credencial"
                type="password" 
                name="credencial" 
                value={formData.credencial} 
                onChange={handleChange} 
                placeholder="Clave para consulta pública" 
                required 
              />
            </div>
          </div>

          {/* Fila 3: Vencimiento de Carnet de Acceso */}
          <div className="form-group">
            <label htmlFor="fecha_carnet">Vencimiento Carnet de Acceso</label>
            <input
              type="date"
              id="fecha_carnet"
              name="fecha_carnet"
              value={formData.fecha_carnet}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          {/* Adjunto del archivo PDF estilo área punteada */}
          <div className="form-group">
            <label className="pdf-upload-title">Documento PDF Consolidado *</label>
            <div className="file-dropzone-container">
              <input 
                type="file" 
                id="pdf-upload-input" 
                accept=".pdf" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <label htmlFor="pdf-upload-input" className="file-dropzone-label">
                <FileText size={20} className="pdf-icon" />
                <span>
                  {formData.pdfFile 
                    ? formData.pdfFile.name 
                    : formData.pdfUrl 
                      ? "PDF cargado previamente (Haz clic para cambiar)" 
                      : "Seleccionar Archivo PDF"}
                </span>
              </label>
            </div>
          </div>

          {/* Registro detallado de contenidos dentro del PDF */}
          <div className="docs-breakdown-section">
            <div className="docs-header">
              <h4>Desglose de Documentos Adjuntos en el PDF</h4>
              <button type="button" className="btn-add-doc" onClick={handleAddDoc}>
                <Plus size={14} /> Agregar Documento
              </button>
            </div>

            {formData.documentos.map((doc, index) => (
              <div key={doc.id || index} className="doc-row">
                <div className="doc-col">
                  <label>Tipo de Documento</label>
                  <select 
                    value={doc.tipo} 
                    onChange={(e) => handleDocChange(index, 'tipo', e.target.value)}
                    className="form-control"
                  >
                    <option value="Seguridad Social / ARL">Seguridad Social / ARL</option>
                    <option value="Examen Médico Ocupacional">Examen Médico Ocupacional</option>
                    <option value="Curso de Alturas">Curso de Alturas</option>
                    <option value="Certificación Técnica">Certificación Técnica</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="doc-col">
                  <label>Nombre / Detalle</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Certificado ARL 2026" 
                    value={doc.nombre} 
                    onChange={(e) => handleDocChange(index, 'nombre', e.target.value)} 
                    required 
                  />
                </div>

                <div className="doc-col date-col">
                  <label>Vencimiento</label>
                  <input 
                    type="date" 
                    value={doc.fechaVencimiento} 
                    onChange={(e) => handleDocChange(index, 'fechaVencimiento', e.target.value)} 
                    required 
                  />
                </div>

                <button 
                  type="button" 
                  className="btn-remove-doc" 
                  onClick={() => handleRemoveDoc(index)}
                  title="Eliminar fila"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Colaborador</button>
          </div>
        </form>
      </div>
    </div>
  );
}