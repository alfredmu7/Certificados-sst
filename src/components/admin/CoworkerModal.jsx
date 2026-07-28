//Formulario / Modal para Crear y Editar Coworkers

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Upload } from 'lucide-react';
import '../../styles/CoworkerModal.css';

export default function CoworkerModal({ isOpen, onClose, onSave, coworkerToEdit }) {
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    cargo: '',
    credencial: '',
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
        pdfUrl: '',
        pdfFile: null,
        documentos: [
          { id: Date.now(), tipo: 'Seguridad Social / ARL', nombre: '', fechaVencimiento: '' }
        ]
      });
    }
  }, [coworkerToEdit, isOpen]);

  if (!isOpen) return null;

  // Manejar cambios en campos simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar carga de PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, pdfFile: file }));
    }
  };

  // Manejar dinámica de documentos dentro del PDF
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
          <h3>{coworkerToEdit ? 'Editar Colaborador' : 'Nuevo Colaborador / Coworker'}</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                placeholder="Ej. Juan Pérez" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Cédula / Documento *</label>
              <input 
                type="text" 
                name="cedula" 
                value={formData.cedula} 
                onChange={handleChange} 
                placeholder="Ej. 1018456789" 
                required 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Cargo / Especialidad</label>
              <input 
                type="text" 
                name="cargo" 
                value={formData.cargo} 
                onChange={handleChange} 
                placeholder="Ej. Técnico de Mantenimiento HVAC" 
              />
            </div>

            <div className="form-group">
              <label>Credencial de Acceso Personal *</label>
              <input 
                type="password" 
                name="credencial" 
                value={formData.credencial} 
                onChange={handleChange} 
                placeholder="Clave para consulta pública" 
                required 
              />
            </div>
          </div>

          {/* Adjunto del archivo PDF consolidado */}
          <div className="form-group file-upload-box">
            <label><FileText size={16} /> Documento PDF Consolidado (ARL, Exámenes, Cursos)</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            {formData.pdfUrl && !formData.pdfFile && (
              <span className="file-status">PDF actual cargado previamente.</span>
            )}
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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Colaborador</button>
          </div>
        </form>
      </div>
    </div>
  );
}