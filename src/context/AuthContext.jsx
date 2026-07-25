// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Clave secreta temporal para el personal de SST (puedes cambiarla cuando quieras)
const CLAVE_SST_CORRECTA = "SST"; 

export function AuthProvider({ children }) {
  const [esSST, setEsSST] = useState(false);

  // Al cargar la app, verificar si ya se había iniciado sesión anteriormente
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesion_sst_activa');
    if (sesionGuardada === 'true') {
      setEsSST(true);
    }
  }, []);

  // Función para iniciar sesión como SST
  const loginSST = (password) => {
    if (password === CLAVE_SST_CORRECTA) {
      setEsSST(true);
      localStorage.setItem('sesion_sst_activa', 'true');
      return { exito: true };
    } else {
      return { exito: false, mensaje: 'Contraseña de acceso SST incorrecta.' };
    }
  };

  // Función para cerrar sesión (Volver a modo solo lectura)
  const logoutSST = () => {
    setEsSST(false);
    localStorage.removeItem('sesion_sst_activa');
  };

  return (
    <AuthContext.Provider value={{ esSST, loginSST, logoutSST }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir la sesión en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};