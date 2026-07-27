import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ItemCard from './components/ItemCard';
import PdfModal from './components/PdfModal';
import ItemModal from './components/ItemModal';
import LoginModal from './components/LoginModal';
import LoadingState from './components/LoadingState'; // 1. Importación del Loader Dinámico
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import { Plus } from 'lucide-react';

import './styles/App.css';

export default function App() {
  // 1. Estado para almacenar los items desde Supabase y el estado de carga
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Estado inicial en true

  // Cargar datos desde Supabase al iniciar el componente
  const fetchItems = async () => {
    try {
      setLoading(true); // Activa el loader al iniciar la consulta
      const { data, error } = await supabase.from('certificados').select('*');
      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Error al cargar datos de Supabase:', error.message);
    } finally {
      setLoading(false); // Desactiva el loader cuando termina (éxito o error)
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Sesión y permisos SST
  const { esSST } = useAuth();

  // Estados de Búsqueda, Filtros y Selección
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados para Modales de SST
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Funciones de gestión SST (Crear, Editar, Eliminar)
  const handleOpenCreateModal = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de SST?')) {
      try {
        const { error } = await supabase.from('certificados').delete().eq('id', id);
        if (error) throw error;
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        alert('Error al eliminar el registro: ' + error.message);
      }
    }
  };

  const handleSaveItem = (formData) => {
    const guardarRegistro = async (pdfUrlFinal) => {
      try {
        if (formData.id) {
          // Editar existente en Supabase
          const { error } = await supabase
            .from('certificados')
            .update({
              serial: formData.serial,
              nombre: formData.nombre,
              categoria: formData.categoria,
              ubicacion: formData.ubicacion,
              fechaCertificacion: formData.fechaCertificacion,
              pdfUrl: pdfUrlFinal || formData.pdfUrl
            })
            .eq('id', formData.id);

          if (error) throw error;
        } else {
          // Crear nuevo en Supabase
          const nuevoRegistro = {
            id: Date.now().toString(),
            serial: formData.serial,
            nombre: formData.nombre,
            categoria: formData.categoria,
            ubicacion: formData.ubicacion,
            fechaCertificacion: formData.fechaCertificacion,
            pdfUrl: pdfUrlFinal || '/pdfs/sample.pdf'
          };

          const { error } = await supabase.from('certificados').insert([nuevoRegistro]);
          if (error) throw error;
        }

        // Recargar los datos centralizados
        fetchItems();
        setIsItemModalOpen(false);
      } catch (error) {
        alert('Error al guardar en la base de datos: ' + error.message);
      }
    };

    if (formData.pdfFile) {
      const reader = new FileReader();
      reader.onloadend = () => guardarRegistro(reader.result);
      reader.readAsDataURL(formData.pdfFile);
    } else {
      guardarRegistro(formData.pdfUrl);
    }
  };

  // Función auxiliar para calcular estados de vencimiento (5 años para químicos, 1 para los demás)
  const obtenerCalculosItem = (fechaCertificacionStr, categoria) => {
    if (!fechaCertificacionStr) return { estado: 'indefinido', badgeInfo: { texto: 'Sin Fecha', clase: '' }, diasRestantes: 0, fechaVencimiento: '' };

    // Evitar desajustes de zona horaria parseando YYYY-MM-DD directamente
    const [year, month, day] = fechaCertificacionStr.split('-').map(Number);
    const fechaCert = new Date(year, month - 1, day);
    
    const fechaVenc = new Date(fechaCert);

    // Evaluar si es químico (5 años) o cualquier otro equipo (1 año)
    const cat = (categoria || '').toLowerCase().trim();
    const esQuimico = cat === 'quimicos' || cat === 'quimico' || cat.includes('quimico') || cat.includes('fds');
    const añosASumar = esQuimico ? 5 : 1;

    fechaVenc.setFullYear(fechaVenc.getFullYear() + añosASumar);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVenc.setHours(0, 0, 0, 0);

    const diferenciaMs = fechaVenc - hoy;
    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    let estado = 'vigente';
    let badgeInfo = { texto: 'Vigente', clase: 'badge-vigente' };

    if (diasRestantes < 0) {
      estado = 'vencido';
      badgeInfo = { texto: 'Vencido', clase: 'badge-vencido' };
    } else if (diasRestantes <= 30) {
      estado = 'por-vencer';
      badgeInfo = { texto: 'Por Vencer', clase: 'badge-por-vencer' };
    }

    const yyyy = fechaVenc.getFullYear();
    const mm = String(fechaVenc.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaVenc.getDate()).padStart(2, '0');
    const fechaVencimientoFormateada = `${yyyy}-${mm}-${dd}`;

    return {
      estado,
      badgeInfo,
      diasRestantes,
      fechaVencimiento: fechaVencimientoFormateada
    };
  };

  // Lógica de Búsqueda y Filtrado
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
    <div className="app-container">
      {/* Encabezado Principal */}
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="content-area">
        {/* Barra superior con resumen de conteo y botón de Crear alineado a la derecha */}
        <div className="admin-bar-wrapper">
          <div className="results-summary">
            <span>Mostrando <strong>{filteredItems.length}</strong> elementos encontrados</span>
          </div>

          <div className="admin-actions">
            {esSST && (
              <button className="btn-primary-add" onClick={handleOpenCreateModal}>
                <Plus size={18} />
                <span>Nuevo Registro</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Evaluación del Estado de Carga con LoadingState */}
        {loading ? (
          <LoadingState />
        ) : filteredItems.length > 0 ? (
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
                  onSelectPdf={(selected) => setSelectedItem(selected)}
                  onEdit={(itemEditar) => handleOpenEditModal(itemEditar)}
                  onDelete={(idEliminar) => handleDeleteItem(idEliminar)}
                />
              );
            })}
          </div>
        ) : (
          <div className="no-results">
            <p>🔍 No se encontraron elementos con la búsqueda "<strong>{searchTerm}</strong>"</p>
          </div>
        )}
      </main>

      {/* Visor de PDF */}
      <PdfModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Modal de Inicio de Sesión SST */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Modal Formulario para Agregar / Editar */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}