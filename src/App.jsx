import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ItemCard from './components/ItemCard';
import PdfModal from './components/PdfModal';
import ItemModal from './components/ItemModal';
import LoginModal from './components/LoginModal';
import LoadingState from './components/LoadingState';
import AdminLayout from './components/admin/AdminLayout'; // 👈 Contenedor modular de Admin SST
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import CoworkerLookup from './components/CoworkerLookup';
import './styles/App.css';

export default function App() {
  const [items, setItems] = useState([]);
  const [coworkers, setCoworkers] = useState([]); // 👈 1. Estado para almacenar coworkers
  const [loading, setLoading] = useState(true);

  // Cargar datos desde Supabase
  const fetchItems = async () => {
    try {
      setLoading(true);

      // Carga simultánea de certificados/equipos y colaboradores
      const [certificadosRes, coworkersRes] = await Promise.all([
        supabase.from('certificados').select('*'),
        supabase.from('coworkers').select('*') // 👈 2. Carga de la tabla de colaboradores
      ]);

      if (certificadosRes.error) throw certificadosRes.error;
      if (certificadosRes.data) setItems(certificadosRes.data);

      if (coworkersRes.data) {
        setCoworkers(coworkersRes.data);
      }
    } catch (error) {
      console.error('Error al cargar datos de Supabase:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const { esSST } = useAuth();

  // Estados de Búsqueda, Filtros y Modales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Funciones de gestión SST
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

  // Cálculo de vencimientos
  const obtenerCalculosItem = (fechaCertificacionStr, categoria) => {
    if (!fechaCertificacionStr) return { estado: 'indefinido', badgeInfo: { texto: 'Sin Fecha', clase: '' }, diasRestantes: 0, fechaVencimiento: '' };

    const [year, month, day] = fechaCertificacionStr.split('-').map(Number);
    const fechaCert = new Date(year, month - 1, day);
    const fechaVenc = new Date(fechaCert);

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

    return {
      estado,
      badgeInfo,
      diasRestantes,
      fechaVencimiento: `${yyyy}-${mm}-${dd}`
    };
  };

  // Filtrado para la vista pública
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
      {/* MODO SST ACTIVO: Carga la vista completa con Sidebar pasándole Equipos y Coworkers */}
      {esSST ? (
        <AdminLayout
          items={items}
          coworkers={coworkers} // 👈 3. Pasamos coworkers a AdminLayout
          obtenerCalculosItem={obtenerCalculosItem}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenEditModal={handleOpenEditModal}
          onDeleteItem={handleDeleteItem}
          onSelectPdf={(selected) => setSelectedItem(selected)}
        />
      ) : (
        /* MODO PÚBLICO: Vista tradicional de consulta */
        <>
          <Header
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onOpenLogin={() => setIsLoginOpen(true)}
          />

          <main className="content-area">
            {/* Si la categoría seleccionada es 'coworkers', mostramos el formulario con PIN */}
            {selectedCategory === 'coworkers' ? (
              <CoworkerLookup onSelectPdf={(selected) => setSelectedItem(selected)} />
            ) : (
              /* De lo contrario, mostramos la grilla habitual de equipos/certificados */
              <>
                <div className="admin-bar-wrapper">
                  <div className="results-summary">
                    <span>
                      Mostrando <strong>{filteredItems.length}</strong> elementos encontrados
                    </span>
                  </div>
                </div>

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
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-results">
                    <p>
                      🔍 No se encontraron elementos con la búsqueda "<strong>{searchTerm}</strong>"
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      {/* Modales globales */}
      <PdfModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}