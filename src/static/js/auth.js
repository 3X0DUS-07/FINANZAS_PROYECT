// ====================================
// AUTENTICACIÓN - LOGIN
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    // Verificar si ya hay token guardado
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        window.location.href = '/dashboard'; 
        return;
    }
    
    loginForm.addEventListener('submit', handleLogin);
});

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Credenciales incorrectas');
        }
        
        const data = await response.json();
        
        // Guardar token en localStorage
        localStorage.setItem('token', data.access_token);
        
        showToast('¡Bienvenido de vuelta!', 'success');
        
        // Redirigir al dashboard después del aviso
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 500);
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}
