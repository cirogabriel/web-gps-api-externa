// Utilidad para asignar colores consistentes a usuarios
export const getUserColor = (userId) => {
  const colors = [
    '#EF4444', // Rojo
    '#10B981', // Verde
    '#3B82F6', // Azul
    '#8B5CF6', // Violeta
    '#F59E0B', // Amarillo
    '#EC4899', // Rosa
    '#6366F1', // Índigo
    '#84CC16', // Lima
    '#06B6D4', // Cian
    '#F97316', // Naranja
    '#14B8A6', // Verde azulado
    '#EAB308'  // Amarillo oscuro
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Obtener versión más clara del color para fondos
export const getUserColorLight = (userId) => {
  const color = getUserColor(userId);
  const lightColors = {
    '#EF4444': '#FEF2F2', // Rojo claro
    '#10B981': '#F0FDF4', // Verde claro
    '#3B82F6': '#EFF6FF', // Azul claro
    '#8B5CF6': '#F5F3FF', // Violeta claro
    '#F59E0B': '#FFFBEB', // Amarillo claro
    '#EC4899': '#FDF2F8', // Rosa claro
    '#6366F1': '#EEF2FF', // Índigo claro
    '#84CC16': '#F7FEE7', // Lima claro
    '#06B6D4': '#ECFEFF', // Cian claro
    '#F97316': '#FFF7ED', // Naranja claro
    '#14B8A6': '#F0FDFA', // Verde azulado claro
    '#EAB308': '#FEFCE8'  // Amarillo oscuro claro
  };
  return lightColors[color] || '#F3F4F6';
};
