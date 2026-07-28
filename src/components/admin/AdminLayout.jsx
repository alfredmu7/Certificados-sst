import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminEquipos from './AdminEquipos';
import AdminCoworkers from './AdminCoworkers';
import AdminReports from './AdminReports';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminLayout.css';

export default function AdminLayout({
  items,
  obtenerCalculosItem,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteItem,
  onSelectPdf
}) {
  const { logoutSST } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="admin-layout-container">
      {/* Sidebar Fijo a la Izquierda */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logoutSST} 
      />

      {/* Área donde se carga la pestaña activa */}
      <main className="admin-content-area">
        {activeTab === 'dashboard' && (
          <AdminDashboard items={items} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'equipos' && (
          <AdminEquipos
            items={items}
            obtenerCalculosItem={obtenerCalculosItem}
            onOpenCreateModal={onOpenCreateModal}
            onOpenEditModal={onOpenEditModal}
            onDeleteItem={onDeleteItem}
            onSelectPdf={onSelectPdf}
          />
        )}

        {activeTab === 'coworkers' && (
          <AdminCoworkers onSelectPdf={onSelectPdf} />
        )}

        {activeTab === 'reportes' && (
          <AdminReports items={items} />
        )}

        {activeTab === 'alertas' && (
          <div className="tab-placeholder">
            <h2>Alertas y Notificaciones por Correo</h2>
            <p>Módulo para la automatización de avisos a vencimientos de certificados y ARL.</p>
          </div>
        )}
      </main>
    </div>
  );
}