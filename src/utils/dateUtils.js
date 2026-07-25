// src/utils/dateUtils.js

export function obtenerEstadoAnual(fechaCertificacionStr, categoria) {
  if (!fechaCertificacionStr) return { estado: 'indefinido', diasRestantes: 0, fechaVencimiento: '' };

  const hoy = new Date();
  
  // Evitar desajustes de zona horaria
  const [year, month, day] = fechaCertificacionStr.split('-').map(Number);
  const emision = new Date(year, month - 1, day);

  // Normalizar la categoría a minúsculas
  const cat = (categoria || '').toLowerCase().trim();

  // Evaluar si es químico (acepta 'quimicos', 'quimico', 'fds', 'sustancia')
  const esQuimico = cat === 'quimicos' || cat === 'quimico' || cat.includes('quimico') || cat.includes('fds');
  
  // 1. Determinar años a sumar (5 para químicos, 1 para el resto)
  const añosASumar = esQuimico ? 5 : 1;

  // 2. Calcular fecha de vencimiento
  const vencimiento = new Date(emision);
  vencimiento.setFullYear(vencimiento.getFullYear() + añosASumar);

  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  const diferenciaMS = vencimiento - hoy;
  const diasRestantes = Math.ceil(diferenciaMS / (1000 * 60 * 60 * 24));

  const yyyy = vencimiento.getFullYear();
  const mm = String(vencimiento.getMonth() + 1).padStart(2, '0');
  const dd = String(vencimiento.getDate()).padStart(2, '0');
  const fechaVencimientoFormateada = `${yyyy}-${mm}-${dd}`;

  if (diasRestantes < 0) {
    return { 
      estado: 'vencido', 
      diasRestantes, 
      fechaVencimiento: fechaVencimientoFormateada 
    };
  } else if (diasRestantes <= 30) {
    return { 
      estado: 'por-vencer', 
      diasRestantes, 
      fechaVencimiento: fechaVencimientoFormateada 
    };
  } else {
    return { 
      estado: 'vigente', 
      diasRestantes, 
      fechaVencimiento: fechaVencimientoFormateada 
    };
  }
}