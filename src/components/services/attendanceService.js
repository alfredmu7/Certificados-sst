// Importa la instancia desde tu archivo existente
//Para conectar la lógica  directamente con tu cliente de Supabase
import { supabase } from '../supabaseClient'; 

// 1. Obtener la lista de trabajadores activos
export const getTrabajadores = async () => {
  const { data, error } = await supabase
    .from('trabajadores')
    .select('*')
    .eq('activo', true)
    .order('nombre_completo', { ascending: true });

  if (error) throw error;
  return data;
};

// 2. Obtener asistencias del mes seleccionado (YYYY-MM)
export const getAsistenciaMes = async (mesAnio) => {
  const startDate = `${mesAnio}-01`;
  const [year, month] = mesAnio.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${mesAnio}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('asistencia_diaria')
    .select('*')
    .gte('fecha', startDate)
    .lte('fecha', endDate);

  if (error) throw error;
  return data;
};

// 3. Guardar o actualizar marca (Upsert en tiempo real)
export const saveAsistenciaMarca = async (trabajadorId, fecha, codigoEstado, observacion = '') => {
  const { data, error } = await supabase
    .from('asistencia_diaria')
    .upsert(
      {
        trabajador_id: trabajadorId,
        fecha: fecha,
        codigo_estado: codigoEstado,
        observacion: observacion
      },
      { onConflict: 'trabajador_id, fecha' }
    );

  if (error) throw error;
  return data;
};

// 4. Limpieza de asistencias del mes en Supabase
export const resetAsistenciaMes = async (mesAnio) => {
  const startDate = `${mesAnio}-01`;
  const [year, month] = mesAnio.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${mesAnio}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('asistencia_diaria')
    .delete()
    .gte('fecha', startDate)
    .lte('fecha', endDate);

  if (error) throw error;
  return data;
};