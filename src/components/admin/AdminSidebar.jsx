// Menú vertical lateral (Sidebar)

import React from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  FileSpreadsheet, 
  Bell, 
  LogOut 
} from 'lucide-react';
import '../../styles/AdminSidebar.css';

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipos', label: 'Equipos e Inspecciones', icon: ShieldAlert },
    { id: 'coworkers', label: 'Personal / Coworkers', icon: Users },
    { id: 'reportes', label: 'Reportes e Informes', icon: FileSpreadsheet },
    { id: 'alertas', label: 'Alertas y Notificaciones', icon: Bell },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h3>Panel Administrador | SST</h3>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout-sidebar" onClick={onLogout}>
          <LogOut size={18} />
          <span>Salir del Modo SST</span>
        </button>
      </div>
    </aside>
  );
}