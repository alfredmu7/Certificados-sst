// Métricas, resúmenes y accesos rápidos

import React from 'react';
import { ShieldAlert, Users, FileCheck } from 'lucide-react';

export default function AdminDashboard({ items, setActiveTab }) {
  return (
    <div className="admin-dashboard">
      <div className="admin-section-header">
        <div>
          <h2>Dashboard SST</h2>
          <p>Resumen del estado general de equipos y colaboradores.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#2563eb', marginBottom: '0.5rem' }}>
            <ShieldAlert size={24} />
            <span style={{ fontWeight: 600 }}>Total Equipos</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{items?.length || 0}</h3>
        </div>

        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#16a34a', marginBottom: '0.5rem' }}>
            <Users size={24} />
            <span style={{ fontWeight: 600 }}>Coworkers</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>0</h3>
        </div>
      </div>
    </div>
  );
}