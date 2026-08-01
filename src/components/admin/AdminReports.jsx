import React, { useState } from 'react';
import { FileSearch, Calculator } from 'lucide-react';
import PdfReportAnalyzer from '../tools/PdfReportAnalyzer';

export default function AdminReports() {
  const [activeTool, setActiveTool] = useState(null);

  // Lista de herramientas que se mostrarán como tarjetas
  const toolsList = [
    {
      id: 'pdf-analyzer',
      title: 'Cuantificador de Permisos (SST)',
      description: 'Analiza carpetas completas de informes mensuales (FADS, SACS, CCTV) para cuantificar tipos de permisos, uso de arnés, escaleras y más.',
      icon: FileSearch,
      badge: 'Optimización de Tiempo',
      enabled: true
    },
  
  ];

  // 2. Si el usuario selecciona la tarjeta, se muestra directamente tu componente PdfReportAnalyzer
  if (activeTool === 'pdf-analyzer') {
    return <PdfReportAnalyzer onBack={() => setActiveTool(null)} />;
  }

  // 3. Si no hay herramienta activa, muestra el panel de tarjetas
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
          Herramientas para Diligenciamiento de Informes
        </h2>
        <p style={{ color: '#64748b' }}>
          Selecciona una herramienta de optimización para procesar documentación de campo o generar matrices.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}
      >
        {toolsList.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => tool.enabled && setActiveTool(tool.id)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '20px',
                cursor: tool.enabled ? 'pointer' : 'not-allowed',
                opacity: tool.enabled ? 1 : 0.6,
                transition: 'all 0.2s ease',
                boxShadow: tool.enabled ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Icon size={24} />
                </div>
                <span
                  style={{
                    backgroundColor: tool.enabled ? '#dcfce7' : '#f1f5f9',
                    color: tool.enabled ? '#15803d' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {tool.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                {tool.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.4' }}>
                {tool.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}