import React, { useState } from 'react';
import { Search, ShieldCheck, FlaskConical, Lock, Unlock, Shield, Menu, X } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para seleccionar categoría y cerrar el menú desplegable en celular
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setIsMenuOpen(false);
  };

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
          {/* Botón "Todos" siempre visible */}
          <button 
            className={`filter-btn ${selectedCategory === 'todos' ? 'active' : ''}`}
            onClick={() => handleSelectCategory('todos')}
          >
            Todos
          </button>

          {/* VISTA DESKTOP / TABLET: Botones individuales directos */}
          <div className="desktop-categories">
            <button 
              className={`filter-btn ${selectedCategory === 'escaleras' ? 'active' : ''}`}
              onClick={() => handleSelectCategory('escaleras')}
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

            <button 
              className={`filter-btn ${selectedCategory === 'epcc' ? 'active' : ''}`}
              onClick={() => handleSelectCategory('epcc')}
            >
              <Shield size={16} /> Equipos EPCC
            </button>

            <button 
              className={`filter-btn ${selectedCategory === 'quimicos' ? 'active' : ''}`}
              onClick={() => handleSelectCategory('quimicos')}
            >
              <FlaskConical size={16} /> Químicos
            </button>
          </div>

          {/* VISTA CELULAR: Botón Hamburguesa con Desplegable */}
          <div className="mobile-dropdown-wrapper">
            <button 
              className={`filter-btn hamburger-trigger ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú de categorías"
            >
              {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
              <span>Categorías</span>
            </button>

            {isMenuOpen && (
              <div className="mobile-dropdown-menu">
                <button 
                  className={`dropdown-item ${selectedCategory === 'escaleras' ? 'active' : ''}`}
                  onClick={() => handleSelectCategory('escaleras')}
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

                <button 
                  className={`dropdown-item ${selectedCategory === 'epcc' ? 'active' : ''}`}
                  onClick={() => handleSelectCategory('epcc')}
                >
                  <Shield size={16} /> Equipos EPCC
                </button>

                <button 
                  className={`dropdown-item ${selectedCategory === 'quimicos' ? 'active' : ''}`}
                  onClick={() => handleSelectCategory('quimicos')}
                >
                  <FlaskConical size={16} /> Químicos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}