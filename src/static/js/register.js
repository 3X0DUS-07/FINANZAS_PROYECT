// ====================================
// REGISTRO DE USUARIOS
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    
    // Verificar si ya hay token guardado
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        // Redirigir al dashboard
        window.location.href = '/dashboard';
        return;
    }
    
    // Manejar submit del formulario
    registerForm.addEventListener('submit', handleRegister);
});

async function handleRegister(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('reg-username').value;
    const correo = document.getElementById('reg-email').value;
    const contraseña = document.getElementById('reg-password').value;
    
    // Validaciones básicas
    if (nombre.length < 3) {
        showToast('El nombre de usuario debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (contraseña.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/items/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre,
                correo,
                contraseña
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al crear la cuenta');
        }
        
        showToast('¡Cuenta creada exitosamente!', 'success');
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}