import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ItemCard from '../ItemCard';
import '../../styles/AdminEquipos.css';

export default function AdminEquipos({
  items,
  obtenerCalculosItem,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteItem,
  onSelectPdf
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'todos' || item.categoria === selectedCategory;
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      item.serial.toLowerCase().includes(searchLower) ||
      item.nombre.toLowerCase().includes(searchLower) ||
      item.ubicacion.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="admin-equipos">
      <div className="admin-section-header">
        <div>
          <h2>Gestión de Equipos e Inspecciones</h2>
          <p>Administra tarjetas, crea nuevos registros y gestiona bajas o ediciones.</p>
        </div>
        <button className="btn-primary-add" onClick={onOpenCreateModal}>
          <Plus size={18} />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Filtros locales dentro del panel */}
      <div className="admin-filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por serial, nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-buttons">
          {['todos', 'escaleras', 'epcc', 'quimicos'].map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid con las tarjetas administrables */}
      <div className="items-grid">
        {filteredItems.map((item) => {
          const calculos = obtenerCalculosItem(item.fechaCertificacion, item.categoria);
          return (
            <ItemCard
              key={item.id}
              item={item}
              estado={calculos.estado}
              badgeInfo={calculos.badgeInfo}
              fechaVencimiento={calculos.fechaVencimiento}
              diasRestantes={calculos.diasRestantes}
              onSelectPdf={onSelectPdf}
              onEdit={onOpenEditModal}
              onDelete={onDeleteItem}
            />
          );
        })}
      </div>
    </div>
  );
}