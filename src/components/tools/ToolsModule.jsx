//Panel contenedor (Tarjetas de herramientas)

// src/components/tools/ToolsModule.jsx
import React, { useState } from 'react';
import { FileSearch, Calculator, Wrench, ArrowRight } from 'lucide-react';
import PdfReportAnalyzer from './PdfReportAnalyzer';

export default function ToolsModule() {
  const [activeTool, setActiveTool] = useState(null);

  // Lista de herramientas disponibles en el sistema
  const toolsList = [
    {
      id: 'pdf-analyzer',
      title: 'Analizador de Permisos ',
      description: 'Analiza carpetas completas de informes mensuales (FADS, SACS, CCTV) para cuantificar tipos de permisos, uso de arnés, escaleras y más.',
      icon: FileSearch,
      badge: 'Optimización de Tiempo',
      enabled: true
    },
  
  ];

  if (activeTool === 'pdf-analyzer') {
    return <PdfReportAnalyzer onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="tools-module-container">
      <div className="tools-header">
        <h2>Centro de Herramientas & Utilidades</h2>
        <p>Módulos de procesamiento directo para agilizar tareas operativas cotidianas.</p>
      </div>

      <div className="tools-cards-grid">
        {toolsList.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className={`tool-card ${!tool.enabled ? 'tool-disabled' : ''}`}
              onClick={() => tool.enabled && setActiveTool(tool.id)}
            >
              <div className="tool-card-top">
                <div className="tool-icon-wrapper">
                  <Icon size={24} />
                </div>
                <span className="tool-badge">{tool.badge}</span>
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              {tool.enabled && (
                <div className="tool-card-footer">
                  <span>Abrir Herramienta</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}