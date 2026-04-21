// utils/formatters.ts

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumberWithDots = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('es-CO');
};

export const parseDottedNumber = (value: string): number => {
  return parseFloat(value.replace(/\./g, '')) || 0;
};

// Función para formatear fecha SIN offset de zona horaria
export const formatDate = (date: string, format: 'short' | 'long' | 'relative' = 'short'): string => {
  // Parsear la fecha manualmente para evitar offset UTC
  const [year, month, day] = date.split('T')[0].split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (format === 'short') {
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (format === 'relative') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const diff = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return formatDate(date, 'short');
  }
  
  return `${day}/${month}/${year}`;
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Food': '🍔',
    'Transport': '🚗',
    'Weed': '🌿',
    'Entertainment': '🎮',
    'Shopping': '🛍️',
    'Health': '💪',
    'Education': '📚',
    'Savings': '💰',
    'Rent': '🏠',
    'Utilities': '⚡',
    'Income': '💵',
    'Other': '📝'
  };
  return icons[category] || '📝';
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food': 'text-orange-400',
    'Transport': 'text-blue-400',
    'Weed': 'text-green-400',
    'Entertainment': 'text-purple-400',
    'Shopping': 'text-pink-400',
    'Health': 'text-red-400',
    'Education': 'text-yellow-400',
    'Savings': 'text-emerald-400',
    'Income': 'text-green-500'
  };
  return colors[category] || 'text-gray-400';
};

export const formatInputNumber = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return num.toLocaleString('es-CO');
};

export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

export const isValidDate = (date: string): boolean => {
  const [year, month, day] = date.split('-');
  const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

export const formatDateTime = (dateString: string): string => {
  const [year, month, day] = dateString.split('T')[0].split('-');
  const timePart = dateString.split('T')[1]?.split('.')[0] || '00:00:00';
  const [hours, minutes] = timePart.split(':');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  const dateStr = date.toLocaleDateString('es-CO', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  return `${dateStr} ${timeStr}`;
};