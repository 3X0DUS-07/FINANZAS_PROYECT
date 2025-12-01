// ====================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ====================================

const API_BASE_URL = 'http://127.0.0.1:8000';
let currentUser = null;
let token = null;

// ====================================
// UTILIDADES
// ====================================

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
    return new Intl.DateFormat('es-CO').format(date);
}

// Obtener fecha actual en formato YYYY-MM-DD
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// ====================================
// MANEJO DE AUTENTICACIÓN
// ====================================

// Login
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
        token = data.access_token;
        
        // Guardar token
        localStorage.setItem('token', token);
        
        // Obtener perfil de usuario
        await loadUserProfile();
        
        // Mostrar dashboard
        showDashboard();
        
        showToast('¡Bienvenido de vuelta!', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Registro
async function handleRegister(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('reg-username').value;
    const correo = document.getElementById('reg-email').value;
    const contraseña = document.getElementById('reg-password').value;
    
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
            throw new Error('Error al crear la cuenta');
        }
        
        showToast('¡Cuenta creada exitosamente! Por favor inicia sesión', 'success');
        
        // Cambiar a formulario de login
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'flex';
        
    } catch (error) {
        showToast(error.message, 'error');
    }
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
        document.getElementById('sidebar-username').textContent = currentUser.username;
        document.getElementById('sidebar-role').textContent = currentUser.rol || 'user';
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Logout
function handleLogout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    
    // Mostrar pantalla de login
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    
    showToast('Sesión cerrada correctamente', 'success');
}

// Mostrar dashboard
function showDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    
    // Cargar datos iniciales
    loadDashboardData();
}

// ====================================
// MANEJO DE NAVEGACIÓN
// ====================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover clase active de todos
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Agregar clase active al clickeado
            item.classList.add('active');
            
            // Obtener sección
            const section = item.dataset.section;
            
            // Ocultar todas las secciones
            document.querySelectorAll('.content-section').forEach(sec => {
                sec.classList.remove('active');
            });
            
            // Mostrar sección correspondiente
            const sectionElement = document.getElementById(`${section}-section`);
            if (sectionElement) {
                sectionElement.classList.add('active');
                
                // Actualizar título
                updatePageTitle(section);
                
                // Cargar datos de la sección
                loadSectionData(section);
            }
        });
    });
}

function updatePageTitle(section) {
    const titles = {
        'overview': { title: 'Resumen General', subtitle: 'Vista general de tus finanzas' },
        'inversiones': { title: 'Inversiones', subtitle: 'Gestiona tus ingresos' },
        'gastos': { title: 'Gastos', subtitle: 'Controla tus gastos' },
        'analisis': { title: 'Análisis Financiero', subtitle: 'Reportes y estadísticas' },
        'chat': { title: 'Asistente IA', subtitle: 'Tu asistente financiero inteligente' }
    };
    
    const pageData = titles[section] || titles['overview'];
    document.getElementById('page-title').textContent = pageData.title;
    document.getElementById('page-subtitle').textContent = pageData.subtitle;
}

function loadSectionData(section) {
    switch(section) {
        case 'overview':
            loadDashboardData();
            break;
        case 'inversiones':
            loadInversiones();
            break;
        case 'gastos':
            loadGastos();
            break;
        case 'analisis':
            loadAnalisis();
            break;
    }
}

// ====================================
// CARGAR DATOS DEL DASHBOARD
// ====================================

async function loadDashboardData() {
    try {
        // Cargar resumen general
        const resumenResponse = await fetch(`${API_BASE_URL}/analisis/resumen-general`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (resumenResponse.ok) {
            const resumen = await resumenResponse.json();
            
            // Actualizar tarjetas
            document.getElementById('total-inversiones').textContent = formatCurrency(resumen.total_inversiones);
            document.getElementById('total-gastos').textContent = formatCurrency(resumen.total_gastos);
            document.getElementById('balance').textContent = formatCurrency(resumen.balance);
            document.getElementById('porcentaje-ahorro').textContent = `${resumen.porcentaje_ahorro}%`;
            document.getElementById('header-balance').querySelector('.stat-value').textContent = formatCurrency(resumen.balance);
            
            // Actualizar badge de ahorro
            const ahorroBadge = document.getElementById('ahorro-badge');
            ahorroBadge.textContent = `${resumen.porcentaje_ahorro}% de ahorro`;
            ahorroBadge.className = 'stat-card-change';
            if (resumen.porcentaje_ahorro > 0) {
                ahorroBadge.classList.add('positive');
            } else {
                ahorroBadge.classList.add('negative');
            }
        }
        
        // Cargar distribución de gastos
        const gastosResponse = await fetch(`${API_BASE_URL}/analisis/gastos-por-tipo`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (gastosResponse.ok) {
            const gastos = await gastosResponse.json();
            renderGastosChart(gastos);
        }
        
        // Cargar distribución de inversiones
        const inversionesResponse = await fetch(`${API_BASE_URL}/analisis/inversiones-por-tipo`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (inversionesResponse.ok) {
            const inversiones = await inversionesResponse.json();
            renderInversionesChart(inversiones);
        }
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Renderizar gráfico de gastos
function renderGastosChart(data) {
    const chartContainer = document.getElementById('gastos-chart');
    
    if (!data || data.length === 0) {
        chartContainer.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        return;
    }
    
    // Crear gráfico simple con barras
    let html = '<div class="chart-bars" style="padding: 20px;">';
    
    data.forEach(item => {
        const percentage = item.porcentaje;
        const color = getColorForCategory(item.tipo_gasto);
        
        html += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; text-transform: capitalize;">${item.tipo_gasto}</span>
                    <span style="color: var(--text-secondary);">${formatCurrency(item.total)} (${percentage.toFixed(1)}%)</span>
                </div>
                <div style="background: var(--bg-dark); height: 24px; border-radius: 12px; overflow: hidden;">
                    <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 1s ease;"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    chartContainer.innerHTML = html;
}

// Renderizar gráfico de inversiones
function renderInversionesChart(data) {
    const chartContainer = document.getElementById('inversiones-chart');
    
    if (!data || data.length === 0) {
        chartContainer.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        return;
    }
    
    // Crear gráfico simple con barras
    let html = '<div class="chart-bars" style="padding: 20px;">';
    
    data.forEach(item => {
        const percentage = item.porcentaje;
        const color = getColorForCategory(item.tipo_inversion);
        
        html += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; text-transform: capitalize;">${item.tipo_inversion}</span>
                    <span style="color: var(--text-secondary);">${formatCurrency(item.total)} (${percentage.toFixed(1)}%)</span>
                </div>
                <div style="background: var(--bg-dark); height: 24px; border-radius: 12px; overflow: hidden;">
                    <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 1s ease;"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    chartContainer.innerHTML = html;
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

// ====================================
// GESTIÓN DE INVERSIONES
// ====================================

async function loadInversiones() {
    try {
        const response = await fetch(`${API_BASE_URL}/inversiones/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar inversiones');
        }
        
        const inversiones = await response.json();
        renderInversionesTable(inversiones);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar inversiones', 'error');
    }
}

function renderInversionesTable(inversiones) {
    const tbody = document.getElementById('inversiones-tbody');
    
    if (!inversiones || inversiones.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">No hay inversiones registradas</td></tr>';
        return;
    }
    
    let html = '';
    inversiones.forEach(inv => {
        html += `
            <tr>
                <td style="text-transform: capitalize; font-weight: 600;">${inv.tipo_inversion}</td>
                <td style="color: var(--success); font-weight: 600;">${formatCurrency(inv.cantidad_inversion)}</td>
                <td>${formatDate(inv.fecha_inversion)}</td>
                <td>${inv.descripcion || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editInversion(${inv.id})">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteInversion(${inv.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Agregar inversión
function showAddInversionModal() {
    document.getElementById('inversion-modal-title').textContent = 'Nueva Inversión';
    document.getElementById('inversion-form').reset();
    document.getElementById('inversion-id').value = '';
    document.getElementById('fecha-inversion').value = getCurrentDate();
    openModal('inversion-modal');
}

async function handleInversionSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('inversion-id').value;
    const tipo = document.getElementById('tipo-inversion').value;
    const cantidad = parseFloat(document.getElementById('cantidad-inversion').value);
    const fecha = document.getElementById('fecha-inversion').value;
    const descripcion = document.getElementById('descripcion-inversion').value;
    
    const data = {
        tipo_inversion: tipo,
        cantidad_inversion: cantidad,
        fecha_inversion: fecha,
        descripcion: descripcion || null
    };
    
    try {
        let response;
        
        if (id) {
            // Actualizar
            response = await fetch(`${API_BASE_URL}/inversiones/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Crear
            response = await fetch(`${API_BASE_URL}/inversiones/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) {
            throw new Error('Error al guardar inversión');
        }
        
        closeModal('inversion-modal');
        loadInversiones();
        loadDashboardData();
        showToast(id ? 'Inversión actualizada' : 'Inversión creada', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Editar inversión
async function editInversion(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/inversiones/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar inversión');
        }
        
        const inversion = await response.json();
        
        document.getElementById('inversion-modal-title').textContent = 'Editar Inversión';
        document.getElementById('inversion-id').value = inversion.id;
        document.getElementById('tipo-inversion').value = inversion.tipo_inversion;
        document.getElementById('cantidad-inversion').value = inversion.cantidad_inversion;
        document.getElementById('fecha-inversion').value = inversion.fecha_inversion;
        document.getElementById('descripcion-inversion').value = inversion.descripcion || '';
        
        openModal('inversion-modal');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Eliminar inversión
async function deleteInversion(id) {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/inversiones/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar inversión');
        }
        
        loadInversiones();
        loadDashboardData();
        showToast('Inversión eliminada', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ====================================
// GESTIÓN DE GASTOS
// ====================================

async function loadGastos() {
    try {
        const response = await fetch(`${API_BASE_URL}/gastos/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar gastos');
        }
        
        const gastos = await response.json();
        renderGastosTable(gastos);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar gastos', 'error');
    }
}

function renderGastosTable(gastos) {
    const tbody = document.getElementById('gastos-tbody');
    
    if (!gastos || gastos.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">No hay gastos registrados</td></tr>';
        return;
    }
    
    let html = '';
    gastos.forEach(gasto => {
        html += `
            <tr>
                <td style="text-transform: capitalize; font-weight: 600;">${gasto.tipo_gasto}</td>
                <td style="color: var(--danger); font-weight: 600;">${formatCurrency(gasto.cantidad_gasto)}</td>
                <td>${formatDate(gasto.fecha_gasto)}</td>
                <td>${gasto.descripcion || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editGasto(${gasto.id})">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteGasto(${gasto.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Agregar gasto
function showAddGastoModal() {
    document.getElementById('gasto-modal-title').textContent = 'Nuevo Gasto';
    document.getElementById('gasto-form').reset();
    document.getElementById('gasto-id').value = '';
    document.getElementById('fecha-gasto').value = getCurrentDate();
    openModal('gasto-modal');
}

async function handleGastoSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('gasto-id').value;
    const tipo = document.getElementById('tipo-gasto').value;
    const cantidad = parseFloat(document.getElementById('cantidad-gasto').value);
    const fecha = document.getElementById('fecha-gasto').value;
    const descripcion = document.getElementById('descripcion-gasto').value;
    
    const data = {
        tipo_gasto: tipo,
        cantidad_gasto: cantidad,
        fecha_gasto: fecha,
        descripcion: descripcion || null
    };
    
    try {
        let response;
        
        if (id) {
            // Actualizar
            response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Crear
            response = await fetch(`${API_BASE_URL}/gastos/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) {
            throw new Error('Error al guardar gasto');
        }
        
        closeModal('gasto-modal');
        loadGastos();
        loadDashboardData();
        showToast(id ? 'Gasto actualizado' : 'Gasto creado', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Editar gasto
async function editGasto(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar gasto');
        }
        
        const gasto = await response.json();
        
        document.getElementById('gasto-modal-title').textContent = 'Editar Gasto';
        document.getElementById('gasto-id').value = gasto.id;
        document.getElementById('tipo-gasto').value = gasto.tipo_gasto;
        document.getElementById('cantidad-gasto').value = gasto.cantidad_gasto;
        document.getElementById('fecha-gasto').value = gasto.fecha_gasto;
        document.getElementById('descripcion-gasto').value = gasto.descripcion || '';
        
        openModal('gasto-modal');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Eliminar gasto
async function deleteGasto(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar gasto');
        }
        
        loadGastos();
        loadDashboardData();
        showToast('Gasto eliminado', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ====================================
// ANÁLISIS
// ====================================

async function loadAnalisis() {
    // Implementar análisis personalizado
    showToast('Función de análisis en desarrollo', 'info');
}

// ====================================
// CHAT CON IA
// ====================================

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Agregar mensaje del usuario
    addChatMessage(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error('Error en el chat');
        }
        
        const data = await response.json();
        addChatMessage(data.reply, 'bot');
        
    } catch (error) {
        addChatMessage('Lo siento, hubo un error procesando tu mensaje.', 'bot');
    }
}

function addChatMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'bot' ? '🤖' : '👤';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    content.appendChild(textDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ====================================
// MANEJO DE MODALES
// ====================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ====================================
// INICIALIZACIÓN
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    // Ocultar loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);
    
    // Verificar si hay token guardado
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        token = savedToken;
        loadUserProfile().then(() => {
            showDashboard();
        });
    }
    
    // Event listeners para login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Alternar entre login y registro
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'flex';
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'flex';
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Navegación
    setupNavigation();
    
    // Botones para agregar
    document.getElementById('add-inversion-btn').addEventListener('click', showAddInversionModal);
    document.getElementById('add-gasto-btn').addEventListener('click', showAddGastoModal);
    
    // Formularios
    document.getElementById('inversion-form').addEventListener('submit', handleInversionSubmit);
    document.getElementById('gasto-form').addEventListener('submit', handleGastoSubmit);
    
    // Cerrar modales
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modal || this.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    // Chat
    document.getElementById('chat-send').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});

// Hacer funciones globales para onclick en HTML
window.editInversion = editInversion;
window.deleteInversion = deleteInversion;
window.editGasto = editGasto;
window.deleteGasto = deleteGasto;