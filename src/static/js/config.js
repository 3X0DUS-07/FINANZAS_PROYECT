// ====================================
// CONFIGURACIÓN COMPARTIDA
// ====================================

// URL base de la API
const API_BASE_URL = 'http://127.0.0.1:8000';

// Rutas de la aplicación (sin .html)
const ROUTES = {
    LOGIN: '/',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    INVERSIONES: '/inversiones',
    GASTOS: '/gastos',
    ANALISIS: '/analisis'
};

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token, redirigiendo a login...');
        window.location.href = ROUTES.LOGIN;
        return false;
    }
    console.log('✅ Token encontrado');
    return true;
}

// Fetch autenticado
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// Toast de notificaciones
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
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
    return new Intl.DateFormat('es-CO').format(date);
}

// Obtener fecha actual en formato YYYY-MM-DD
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Logout
function handleLogout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('token');
    showToast('Sesión cerrada correctamente', 'success');
    setTimeout(() => {
        window.location.href = ROUTES.LOGIN;
    }, 500);
}

// Cargar perfil de usuario
async function loadUserProfile() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/profile`);
        if (!response.ok) {
            throw new Error('Error al cargar perfil');
        }
        const user = await response.json();
        console.log('✅ Perfil cargado:', user);
        
        // Actualizar UI
        const usernameEl = document.getElementById('sidebar-username');
        const roleEl = document.getElementById('sidebar-role');
        
        if (usernameEl) usernameEl.textContent = user.username;
        if (roleEl) roleEl.textContent = user.rol || 'user';
        
        return user;
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        localStorage.removeItem('token');
        window.location.href = ROUTES.LOGIN;
    }
}

// Obtener color por categoría
function getColorForCategory(category) {
    const colors = {
        'comida': '#10b981',
        'transporte': '#3b82f6',
        'servicios': '#f59e0b',
        'entretenimiento': '#8b5cf6',
        'salud': '#ef4444',
        'educación': '#6366f1',
        'ropa': '#ec4899',
        'hogar': '#14b8a6',
        'trabajo': '#6366f1',
        'negocio': '#14b8a6',
        'arriendo': '#ec4899',
        'default': '#64748b'
    };
    return colors[category.toLowerCase()] || colors['default'];
}

// Modales
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Configurar modales globalmente
function setupModals() {
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modal || this.closest('.modal').id;
            if (modalId) closeModal(modalId);
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

// Inicialización común para páginas con dashboard
function initDashboardPage() {
    console.log('🚀 Inicializando página del dashboard...');
    
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Cargar perfil
    loadUserProfile();
    
    // Configurar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Configurar modales
    setupModals();
    
    // Ocultar loading screen si existe
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
    
    console.log('✅ Página inicializada correctamente');
}

// Exportar para uso global
window.API_BASE_URL = API_BASE_URL;
window.ROUTES = ROUTES;
window.checkAuth = checkAuth;
window.authenticatedFetch = authenticatedFetch;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getCurrentDate = getCurrentDate;
window.handleLogout = handleLogout;
window.loadUserProfile = loadUserProfile;
window.getColorForCategory = getColorForCategory;
window.openModal = openModal;
window.closeModal = closeModal;
window.setupModals = setupModals;
window.initDashboardPage = initDashboardPage;