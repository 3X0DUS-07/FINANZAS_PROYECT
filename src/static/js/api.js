// ====================================
// FUNCIONES DE API
// ====================================

let currentUser = null;
let token = null;

// Verificar autenticación
function checkAuth() {
    token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Cargar perfil de usuario
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar perfil');
        }
        
        currentUser = await response.json();
        
        // Actualizar UI con datos del usuario
        const usernameEl = document.getElementById('sidebar-username');
        const roleEl = document.getElementById('sidebar-role');
        
        if (usernameEl) usernameEl.textContent = currentUser.username;
        if (roleEl) roleEl.textContent = currentUser.rol || 'user';
        
        return currentUser;
        
    } catch (error) {
        console.error('Error:', error);
        // Si falla la autenticación, redirigir al login
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Logout
function handleLogout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    
    showToast('Sesión cerrada correctamente', 'success');
    
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
}

// Hacer request con autenticación
async function authenticatedFetch(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    return fetch(url, { ...options, ...defaultOptions });
}