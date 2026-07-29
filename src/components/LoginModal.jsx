// src/components/LoginModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, KeyRound } from 'lucide-react';
import '../styles/LoginModal.css';

export default function LoginModal({ isOpen, onClose }) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { loginSST } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const resultado = loginSST(password);

    if (resultado.exito) {
      setPassword('');
      onClose();
    } else {
      setErrorMsg(resultado.mensaje || 'Contraseña incorrecta');
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Lock size={20} className="modal-icon" />
            <h2>Acceso Administrador SST</h2>
          </div>
          <button className="btn-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="login-description">
            Ingresa la contraseña de seguridad para habilitar la edición y gestión de certificados SST.
          </p>

          <div className="form-group">
            <label htmlFor="password">Contraseña de Acceso:</label>
            <div className="input-icon-wrapper">
              {/* El icono solo se muestra cuando password está vacío */}
              {!password && <KeyRound size={18} className="input-icon" />}
              
              <input
                id="password"
                type="password"
                placeholder="        Ingresa la clave..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={password ? 'has-text' : ''}
                autoFocus
                required
              />
            </div>
          </div>

          {errorMsg && <div className="error-badge">{errorMsg}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}