//Gestión de Colaboradores, ARL, Exámenes, Cursosimport React from 'react';

// Gestión de Colaboradores, ARL, Exámenes, Cursos
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, FileText, Edit, Trash2, CreditCard } from 'lucide-react';
import CoworkerModal from './CoworkerModal';
import { supabase } from '../../supabaseClient';
import '../../styles/AdminCoworkers.css';

export default function AdminCoworkers({ onSelectPdf }) {
  const [coworkers, setCoworkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coworkerToEdit, setCoworkerToEdit] = useState(null);

  // Cargar lista de colaboradores desde Supabase
  const fetchCoworkers = async () => {
    try {
      const { data, error } = await supabase
        .from('coworkers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setCoworkers(data);
    } catch (err) {
      console.error("Error al cargar colaboradores:", err.message);
    }
  };

  useEffect(() => {
    fetchCoworkers();
  }, []);

  const handleOpenCreate = () => {
    setCoworkerToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coworker) => {
    setCoworkerToEdit(coworker);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro de eliminar este colaborador?")) {
      try {
        const { error } = await supabase.from('coworkers').delete().eq('id', id);
        if (error) throw error;
        setCoworkers(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };

  const handleSaveCoworker = async (formData) => {
    const guardarEnBd = async (pdfUrlFinal) => {
      try {
        const payload = {
          nombre: formData.nombre,
          cedula: formData.cedula,
          cargo: formData.cargo,
          credencial: formData.credencial,
          fecha_carnet: formData.fecha_carnet || null, // <-- REGISTRO DE FECHA CARNET
          pdf_url: pdfUrlFinal || formData.pdfUrl,
          documentos: formData.documentos
        };

        if (formData.id) {
          const { error } = await supabase.from('coworkers').update(payload).eq('id', formData.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('coworkers').insert([payload]);
          if (error) throw error;
        }

        fetchCoworkers();
        setIsModalOpen(false);
      } catch (err) {
        alert("Error guardando colaborador: " + err.message);
      }
    };

    if (formData.pdfFile) {
      const reader = new FileReader();
      reader.onloadend = () => guardarEnBd(reader.result);
      reader.readAsDataURL(formData.pdfFile);
    } else {
      guardarEnBd(formData.pdfUrl);
    }
  };

  const filteredCoworkers = coworkers.filter(c => 
    (c.nombre && c.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.cedula && c.cedula.includes(searchTerm)) ||
    (c.cargo && c.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-coworkers">
      <div className="admin-section-header">
        <div>
          <h2>Gestión de Personal / Coworkers</h2>
          <p>Administra registros de trabajadores y documentación correspondiente.</p>
        </div>
        <button className="btn-primary-add" onClick={handleOpenCreate}>
          <UserPlus size={18} />
          <span>Nuevo Coworker</span>
        </button>
      </div>

      <div className="admin-filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o cédula..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Tarjetas / Tabla de Coworkers */}
      <div className="coworkers-grid">
        {filteredCoworkers.map((c) => (
          <div key={c.id} className="coworker-card">
            <div className="cw-card-header">
              <div>
                <h3>{c.nombre}</h3>
                <span className="cw-cargo">{c.cargo}</span>
              </div>
              <span className="cw-cedula">CC: {c.cedula}</span>
            </div>

            {/* MOSTRAR CARNET DE ACCESO SOLO SI TIENE FECHA AGREGADA */}
            {c.fecha_carnet && (
              <div className="cw-carnet-info" style={{ margin: '10px 0', padding: '6px 10px', backgroundColor: '#e0f2fe', borderRadius: '6px', color: '#0369a1', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} />
                <span><strong>Carnet Acceso:</strong> Vence {c.fecha_carnet}</span>
              </div>
            )}

            <div className="cw-docs-list">
              <h4>Documentos en PDF ({c.documentos?.length || 0}):</h4>
              <ul>
                {c.documentos?.map((doc, i) => (
                  <li key={i}>
                    <span>{doc.nombre} ({doc.tipo})</span>
                    <strong className="venc-tag">Vence: {doc.fechaVencimiento}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cw-card-actions">
              {c.pdf_url && (
                <button 
                  className="btn-view-pdf" 
                  onClick={() => {
                    if (typeof onSelectPdf === 'function') {
                      onSelectPdf({ 
                        pdfUrl: c.pdf_url, 
                        nombre: `Documentación - ${c.nombre}` 
                      });
                    } else {
                      alert('No se pudo abrir el visor de PDF.');
                    }
                  }}
                >
                  <FileText size={16} /> Ver documentación
                </button>
              )}
              <div className="action-btns-right">
                <button className="btn-icon edit" onClick={() => handleOpenEdit(c)}><Edit size={16} /></button>
                <button className="btn-icon delete" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CoworkerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveCoworker} 
        coworkerToEdit={coworkerToEdit} 
      />
    </div>
  );
}