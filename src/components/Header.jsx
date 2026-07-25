import React from 'react';
import { Search, ShieldCheck, FlaskConical, Lock, Unlock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

export default function Header({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory,
  onOpenLogin
}) {
  const { esSST, logoutSST } = useAuth();

  return (
    <header className="main-header">
      <div className="header-top">
        <div className="brand">
          <ShieldCheck className="brand-icon" size={36} />
          <div>
            <h1>Portal de Certificaciones SST | Johnson Controls</h1>
            <p>Control de Inspecciones de Escaleras y Hoja de vida para productos químicos</p>
          </div>
        </div>

        {/* Botón de Acceso SST Sutil */}
        <div className="sst-access-wrapper">
          {esSST ? (
            <button 
              className="btn-sst-subtle active" 
              onClick={logoutSST}
              title="Cerrar Modo SST"
            >
              <Unlock size={14} />
              <span>Modo SST Activo</span>
            </button>
          ) : (
            <button 
              className="btn-sst-subtle" 
              onClick={onOpenLogin}
            >
              <Lock size={14} />
              <span>Acceso SST</span>
            </button>
          )}
        </div>
      </div>

      {/* Sección de Búsqueda y Filtros */}
      <div className="header-controls">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar por serial, nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botones de filtro por Categoría */}
        <div className="category-filters">
          <button 
            className={`filter-btn ${selectedCategory === 'todos' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('todos')}
          >
            Todos
          </button>

          <button 
            className={`filter-btn ${selectedCategory === 'escaleras' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('escaleras')}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 3v18M5 3v18M5 7h14M5 12h14M5 17h14"/>
            </svg> 
            Escaleras
          </button>

          {/* NUEVA CATEGORÍA: Equipos EPCC */}
          <button 
            className={`filter-btn ${selectedCategory === 'epcc' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('epcc')}
          >
            <Shield size={16} /> Equipos EPCC
          </button>

          <button 
            className={`filter-btn ${selectedCategory === 'quimicos' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('quimicos')}
          >
            <FlaskConical size={16} /> Químicos
          </button>
        </div>
      </div>
    </header>
  );
}