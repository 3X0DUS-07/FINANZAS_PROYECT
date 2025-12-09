// ====================================
// GESTIÓN DE GASTOS
// ====================================

const API_BASE_URL = 'http://127.0.0.1:8000';
let token = null;
let currentUser = null;
let allGastos = [];
let filteredGastos = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = 'fecha';
let sortDirection = 'desc';
let deleteGastoId = null;

// ====================================
// AUTENTICACIÓN Y UTILIDADES
// ====================================

/**
 * Verificar autenticación
 */
function checkAuth() {
    token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token, redirigiendo a login...');
        window.location.href = '/';
        return false;
    }
    console.log('✅ Token encontrado');
    return true;
}

/**
 * Fetch autenticado
 */
async function authenticatedFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

/**
 * Mostrar toast de notificación
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Formatear moneda
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO').format(date);
}

/**
 * Obtener fecha actual en formato YYYY-MM-DD
 */
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Obtener color por categoría
 */
function getColorForCategory(category) {
    const colors = {
        'comida': '#10b981',
        'transporte': '#3b82f6',
        'servicios': '#f59e0b',
        'entretenimiento': '#8b5cf6',
        'salud': '#ef4444',
        'educación': '#6366f1',
        'ropa': '#ec4899',
        'hogar': '#14b8a6'
    };
    return colors[category.toLowerCase()] || '#64748b';
}

// ====================================
// CARGA DE DATOS
// ====================================

/**
 * Cargar perfil del usuario
 */
async function loadUserProfile() {
    try {
        console.log('📥 Cargando perfil de usuario...');
        const response = await authenticatedFetch(`${API_BASE_URL}/users/profile`);
        
        if (!response.ok) {
            throw new Error('Error al cargar perfil');
        }
        
        currentUser = await response.json();
        console.log('✅ Perfil cargado:', currentUser);
        
        // Actualizar UI
        const usernameEl = document.getElementById('sidebar-username');
        const roleEl = document.getElementById('sidebar-role');
        
        if (usernameEl) usernameEl.textContent = currentUser.username;
        if (roleEl) roleEl.textContent = currentUser.rol || 'user';
        
        return currentUser;
        
    } catch (error) {
        console.error('❌ Error al cargar perfil:', error);
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

/**
 * Cargar gastos del usuario autenticado
 */
async function loadGastos() {
    try {
        console.log('📥 Cargando gastos del usuario...');
        const response = await authenticatedFetch(`${API_BASE_URL}/gastos/`);
        
        if (!response.ok) {
            throw new Error('Error al cargar gastos');
        }
        
        allGastos = await response.json();
        console.log('✅ Gastos cargados:', allGastos.length);
        
        // Actualizar estadísticas y filtros
        updateStats();
        updateTipoFilter();
        renderCategoriasChart();
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error al cargar gastos:', error);
        showToast('Error al cargar gastos', 'error');
    }
}

// ====================================
// ESTADÍSTICAS Y GRÁFICOS
// ====================================

/**
 * Actualizar estadísticas
 */
function updateStats() {
    // Total acumulado
    const total = allGastos.reduce((sum, g) => sum + g.cantidad_gasto, 0);
    document.getElementById('total-acumulado').textContent = formatCurrency(total);
    document.getElementById('total-gastos-header').textContent = formatCurrency(total);
    
    // Total de registros
    document.getElementById('total-registros').textContent = allGastos.length;

    // Total del mes actual
    const now = new Date();
    const mesActual = allGastos.filter(g => {
        const fecha = new Date(g.fecha_gasto);
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    });
    const totalMes = mesActual.reduce((sum, g) => sum + g.cantidad_gasto, 0);
    document.getElementById('total-mes').textContent = formatCurrency(totalMes);

    // Promedio mensual últimos 6 meses
    const seisM = new Date();
    seisM.setMonth(seisM.getMonth() - 6);
    const ultimos6 = allGastos.filter(g => new Date(g.fecha_gasto) >= seisM);
    const promedio = ultimos6.length > 0 ? ultimos6.reduce((sum, g) => sum + g.cantidad_gasto, 0) / 6 : 0;
    document.getElementById('promedio-mensual').textContent = formatCurrency(promedio);
    
    console.log('📊 Estadísticas actualizadas');
}

/**
 * Renderizar gráfico de categorías
 */
function renderCategoriasChart() {
    const now = new Date();
    const mesActual = allGastos.filter(g => {
        const fecha = new Date(g.fecha_gasto);
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    });

    const categorias = {};
    mesActual.forEach(g => {
        categorias[g.tipo_gasto] = (categorias[g.tipo_gasto] || 0) + g.cantidad_gasto;
    });

    const chartContainer = document.getElementById('categorias-chart');
    if (Object.keys(categorias).length === 0) {
        chartContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No hay gastos este mes</div>';
        return;
    }

    const total = Object.values(categorias).reduce((sum, val) => sum + val, 0);
    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

    Object.entries(categorias)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tipo, monto]) => {
            const porcentaje = (monto / total) * 100;
            const color = getColorForCategory(tipo);
            
            html += `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600; text-transform: capitalize;">${tipo}</span>
                        <span style="color: var(--text-secondary);">${formatCurrency(monto)} (${porcentaje.toFixed(1)}%)</span>
                    </div>
                    <div style="background: var(--bg-dark); height: 24px; border-radius: 12px; overflow: hidden;">
                        <div style="background: ${color}; height: 100%; width: ${porcentaje}%; transition: width 1s ease;"></div>
                    </div>
                </div>
            `;
        });

    html += '</div>';
    chartContainer.innerHTML = html;
}

/**
 * Actualizar filtro de tipos
 */
function updateTipoFilter() {
    const tipos = [...new Set(allGastos.map(g => g.tipo_gasto))];
    const select = document.getElementById('filter-tipo');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Todos los tipos</option>';
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        select.appendChild(option);
    });
}

// ====================================
// FILTRADO Y ORDENAMIENTO
// ====================================

/**
 * Aplicar filtros de búsqueda y tipo
 */
function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const filterTipo = document.getElementById('filter-tipo');
    
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const tipo = filterTipo ? filterTipo.value : '';

    filteredGastos = allGastos.filter(g => {
        const matchSearch = g.tipo_gasto.toLowerCase().includes(search) || 
                          (g.descripcion && g.descripcion.toLowerCase().includes(search));
        const matchTipo = !tipo || g.tipo_gasto === tipo;
        return matchSearch && matchTipo;
    });

    sortGastos();
    currentPage = 1;
    renderTable();
}

/**
 * Ordenar gastos
 */
function sortGastos() {
    filteredGastos.sort((a, b) => {
        let aVal, bVal;
        
        if (sortField === 'tipo') {
            aVal = a.tipo_gasto;
            bVal = b.tipo_gasto;
        } else if (sortField === 'cantidad') {
            aVal = a.cantidad_gasto;
            bVal = b.cantidad_gasto;
        } else if (sortField === 'fecha') {
            aVal = new Date(a.fecha_gasto);
            bVal = new Date(b.fecha_gasto);
        }

        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// ====================================
// RENDERIZADO DE TABLA
// ====================================

/**
 * Renderizar tabla de gastos
 */
function renderTable() {
    const tbody = document.getElementById('gastos-tbody');
    
    if (!tbody) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredGastos.slice(start, end);

    console.log('Renderizando tabla con', pageItems.length, 'items');

    // Si no hay items, mostrar mensaje vacío
    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                            ${allGastos.length === 0 ? 'No hay gastos registrados' : 'No se encontraron gastos'}
                        </div>
                        <div style="color: var(--text-secondary);">
                            ${allGastos.length === 0 ? 'Comienza registrando tu primer gasto' : 'Intenta ajustar los filtros de búsqueda'}
                        </div>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    // Renderizar filas de gastos
    let html = '';
    pageItems.forEach(g => {
        html += `
            <tr>
                <td style="text-transform: capitalize; font-weight: 600;">${g.tipo_gasto}</td>
                <td style="color: var(--danger); font-weight: 600;">${formatCurrency(g.cantidad_gasto)}</td>
                <td>${formatDate(g.fecha_gasto)}</td>
                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${g.descripcion || '-'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editGasto(${g.id})" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" onclick="confirmDelete(${g.id})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;

    // Actualizar paginación
    updatePagination();
}

/**
 * Actualizar paginación
 */
function updatePagination() {
    const paginationDiv = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
    
    if (!paginationDiv) return;
    
    if (totalPages > 1) {
        paginationDiv.style.display = 'flex';
        document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages;
    } else {
        paginationDiv.style.display = 'none';
    }
}

// ====================================
// MODALES
// ====================================

/**
 * Abrir modal
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cerrar modal
 */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Mostrar modal de agregar gasto
 */
function showAddModal() {
    document.getElementById('gasto-modal-title').textContent = 'Nuevo Gasto';
    document.getElementById('gasto-form').reset();
    document.getElementById('gasto-id').value = '';
    document.getElementById('fecha-gasto').value = getCurrentDate();
    document.getElementById('submit-text').textContent = 'Guardar';
    openModal('gasto-modal');
}

// ====================================
// CRUD OPERATIONS
// ====================================

/**
 * Editar gasto
 */
async function editGasto(id) {
    try {
        console.log('📝 Cargando gasto para editar:', id);
        const response = await authenticatedFetch(`${API_BASE_URL}/gastos/${id}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar gasto');
        }
        
        const g = await response.json();
        console.log('✅ Gasto cargado:', g);
        
        // Llenar formulario
        document.getElementById('gasto-modal-title').textContent = 'Editar Gasto';
        document.getElementById('gasto-id').value = g.id;
        document.getElementById('tipo-gasto').value = g.tipo_gasto;
        document.getElementById('cantidad-gasto').value = g.cantidad_gasto;
        document.getElementById('fecha-gasto').value = g.fecha_gasto;
        document.getElementById('descripcion-gasto').value = g.descripcion || '';
        document.getElementById('submit-text').textContent = 'Actualizar';
        
        openModal('gasto-modal');
        
    } catch (error) {
        console.error('❌ Error al cargar gasto:', error);
        showToast('Error al cargar gasto', 'error');
    }
}

/**
 * Confirmar eliminación
 */
function confirmDelete(id) {
    deleteGastoId = id;
    openModal('delete-modal');
}

/**
 * Eliminar gasto
 */
async function deleteGasto() {
    try {
        console.log('🗑️ Eliminando gasto:', deleteGastoId);
        const response = await authenticatedFetch(`${API_BASE_URL}/gastos/${deleteGastoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar');
        }
        
        console.log('✅ Gasto eliminado');
        closeModal('delete-modal');
        await loadGastos();
        showToast('Gasto eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al eliminar gasto:', error);
        showToast('Error al eliminar gasto', 'error');
    }
}

/**
 * Guardar gasto (crear o actualizar)
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('gasto-id').value;
    const data = {
        tipo_gasto: document.getElementById('tipo-gasto').value.trim(),
        cantidad_gasto: parseFloat(document.getElementById('cantidad-gasto').value),
        fecha_gasto: document.getElementById('fecha-gasto').value,
        descripcion: document.getElementById('descripcion-gasto').value.trim() || null
    };

    // Validaciones
    if (data.cantidad_gasto <= 0) {
        showToast('La cantidad debe ser mayor a cero', 'error');
        return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    document.getElementById('submit-text').textContent = 'Guardando...';

    try {
        const url = id ? `${API_BASE_URL}/gastos/${id}` : `${API_BASE_URL}/gastos/`;
        const method = id ? 'PUT' : 'POST';
        
        console.log(`${method === 'POST' ? '➕' : '✏️'} ${method === 'POST' ? 'Creando' : 'Actualizando'} gasto:`, data);
        
        const response = await authenticatedFetch(url, {
            method,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al guardar');
        }

        const savedGasto = await response.json();
        console.log('✅ Gasto guardado:', savedGasto);
        
        closeModal('gasto-modal');
        await loadGastos();
        showToast(id ? 'Gasto actualizado' : 'Gasto creado', 'success');

    } catch (error) {
        console.error('❌ Error al guardar gasto:', error);
        showToast(error.message || 'Error al guardar gasto', 'error');
    } finally {
        submitBtn.disabled = false;
        document.getElementById('submit-text').textContent = id ? 'Actualizar' : 'Guardar';
    }
}

// ====================================
// LOGOUT
// ====================================

/**
 * Cerrar sesión
 */
function handleLogout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('token');
    showToast('Sesión cerrada correctamente', 'success');
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
}

// ====================================
// CHATBOT
// ====================================

/**
 * Configurar chatbot
 */
function setupChatbot() {
    const chatModal = document.getElementById('chat-modal');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatSendBtn = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    
    if (!chatModal || !chatToggleBtn) return;
    
    chatToggleBtn.addEventListener('click', () => {
        chatModal.classList.add('active');
        chatInput.focus();
    });
    
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', () => {
            chatModal.classList.remove('active');
        });
    }
    
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    chatModal.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            chatModal.classList.remove('active');
        }
    });
}

/**
 * Enviar mensaje al chatbot
 */
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    input.disabled = true;
    
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
        
        if (data.error) {
            addChatMessage(`Error: ${data.error}. ${data.suggestion || ''}`, 'bot');
        } else {
            addChatMessage(data.reply, 'bot');
        }
        
    } catch (error) {
        addChatMessage('Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.', 'bot');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

/**
 * Agregar mensaje al chat
 */
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
// INICIALIZACIÓN
// ====================================

/**
 * Inicializar la página
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando página de gastos...');
    
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Cargar datos
    await loadUserProfile();
    await loadGastos();

    // Configurar chatbot
    setupChatbot();

    // ====================================
    // EVENT LISTENERS
    // ====================================
    
    // Botón agregar gasto
    const addBtn = document.getElementById('add-gasto-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddModal);
    }
    
    // Formulario de gasto
    const form = document.getElementById('gasto-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // Botón logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Input de búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    // Filtro por tipo
    const filterTipo = document.getElementById('filter-tipo');
    if (filterTipo) {
        filterTipo.addEventListener('change', applyFilters);
    }
    
    // Botón confirmar eliminación
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteGasto);
    }

    // Cerrar modales con botones
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modal || this.closest('.modal').id;
            if (modalId) closeModal(modalId);
        });
    });

    // Cerrar modal al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // Ordenamiento de tabla
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (sortField === field) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDirection = 'desc';
            }
            applyFilters();
        });
    });

    // Paginación
    const prevPageBtn = document.getElementById('prev-page');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
    
    console.log('✅ Página de gastos inicializada correctamente');
});

// ====================================
// EXPORTAR FUNCIONES GLOBALES
// ====================================

// Hacer funciones disponibles globalmente para onclick en HTML
window.editGasto = editGasto;
window.confirmDelete = confirmDelete;