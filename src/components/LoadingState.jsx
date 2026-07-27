import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import '../styles/LoadingState.css';

export default function LoadingState() {
  const [mensaje, setMensaje] = useState('Cargando registros e inspecciones...');

  useEffect(() => {
    // Primer cambio de mensaje a los 3.5 segundos
    const timer1 = setTimeout(() => {
      setMensaje('Optimizando la conexión con el servidor...');
    }, 3500);

    // Segundo cambio si la conexión está muy lenta (7 segundos)
    const timer2 = setTimeout(() => {
      setMensaje('Tu conexión a internet parece algo lenta, un momento por favor...');
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="loading-container">
      <Loader2 className="spinner-icon" size={36} />
      <p className="loading-text">{mensaje}</p>
    </div>
  );
}