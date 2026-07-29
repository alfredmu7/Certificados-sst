//Componente de Consulta Pública de Coworkers

import React, { useState } from 'react';
import { Search, Lock, UserCheck, FileText, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../supabaseClient';
import '../styles/CoworkerLookup.css';

export default function CoworkerLookup({ onSelectPdf }) {
  const [cedula, setCedula] = useState('');
  const [credencial, setCredencial] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [coworker, setCoworker] = useState(null);

  const handleConsultar = async (e) => {
    e.preventDefault();
    if (!cedula.trim() || !credencial.trim()) {
      setErrorMsg('Ingresa tu número de cédula y tu PIN / Credencial.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setCoworker(null);

    try {
      const { data, error } = await supabase
        .from('coworkers')
        .select('*')
        .eq('cedula', cedula.trim())
        .eq('credencial', credencial.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorMsg('Cédula o PIN incorrectos. Verifica con el área de SST.');
      } else {
        setCoworker(data);
      }
    } catch (err) {
      setErrorMsg('Error al consultar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setCedula('');
    setCredencial('');
    setCoworker(null);
    setErrorMsg('');
  };

  return (
    <div className="coworker-lookup-container">
      <div className="lookup-card">
        <div className="lookup-header">
          <div className="icon-badge">
            <Lock size={22} />
          </div>
          <h2>Consulta individual del coworker</h2>
        </div>

        {!coworker ? (
          <form onSubmit={handleConsultar} className="lookup-form">
            <div className="input-group">
              <label>Número de Cédula</label>
              <div className="input-field">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Ej. 1018456789"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>PIN </label>
              <div className="input-field">
                <KeyRound size={18} />
                <input
                  type="password"
                  placeholder="Ingresa tu clave"
                  value={credencial}
                  onChange={(e) => setCredencial(e.target.value)}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="lookup-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" className="btn-lookup-submit" disabled={loading}>
              {loading ? 'Validando...' : 'Consultar Mis Documentos'}
            </button>
          </form>
        ) : (
          <div className="lookup-result">
            <div className="user-profile-header">
              <div className="user-avatar">
                <UserCheck size={28} />
              </div>
              <div className="user-details">
                <h3>{coworker.nombre}</h3>
                <span className="user-cargo">{coworker.cargo}</span>
                <span className="user-cedula">CC: {coworker.cedula}</span>
              </div>
            </div>

            <div className="docs-summary">
              <h4>Documentos Asociados ({coworker.documentos?.length || 0}):</h4>
              <ul>
                {coworker.documentos?.map((doc, idx) => (
                  <li key={idx}>
                    <div className="doc-info">
                      <strong>{doc.nombre}</strong>
                      <small>{doc.tipo}</small>
                    </div>
                    <span className="doc-expiry">Vence: {doc.fechaVencimiento}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-actions">
              {coworker.pdf_url ? (
                <button
                  className="btn-open-my-pdf"
                  onClick={() =>
                    onSelectPdf({
                      pdfUrl: coworker.pdf_url,
                      nombre: `Documentación SST - ${coworker.nombre}`
                    })
                  }
                >
                  <FileText size={18} />
                  Ver Mi Documentación
                </button>
              ) : (
                <p className="no-pdf-notice">Aún no se ha adjuntado un archivo PDF a tu registro.</p>
              )}

              <button className="btn-lookup-exit" onClick={handleLimpiar}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}