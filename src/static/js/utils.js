// ====================================
// UTILIDADES GENERALES
// ====================================

const API_BASE_URL = 'http://127.0.0.1:8000';

// Mostrar notificación toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO').format(date);
}

// Obtener fecha actual en formato YYYY-MM-DD
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Obtener color para categoría
function getColorForCategory(category) {
    const colors = {
        'comida': '#10b981',
        'transporte': '#3b82f6',
        'servicios': '#f59e0b',
        'entretenimiento': '#8b5cf6',
        'salud': '#ef4444',
        'trabajo': '#6366f1',
        'negocio': '#14b8a6',
        'arriendo': '#ec4899',
        'default': '#64748b'
    };
    
    return colors[category.toLowerCase()] || colors['default'];
}

// Manejo de loading screen
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1000);
    }
});