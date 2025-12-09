// ====================================
// GESTIÓN DE INVERSIONES
// ====================================

const API_BASE_URL = 'http://127.0.0.1:8000';
let token = null;
let currentUser = null;
let allInversiones = [];
let filteredInversiones = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = 'fecha';
let sortDirection = 'desc';
let deleteInversionId = null;

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
    return new Intl.DateFormat('es-CO').format(date);
}

/**
 * Obtener fecha actual en formato YYYY-MM-DD
 */
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
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
 * Cargar inversiones del usuario autenticado
 */
async function loadInversiones() {
    try {
        console.log('📥 Cargando inversiones del usuario...');
        const response = await authenticatedFetch(`${API_BASE_URL}/inversiones/`);
        
        if (!response.ok) {
            throw new Error('Error al cargar inversiones');
        }
        
        allInversiones = await response.json();
        console.log('✅ Inversiones cargadas:', allInversiones.length);
        
        // Actualizar estadísticas y filtros
        updateStats();
        updateTipoFilter();
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error al cargar inversiones:', error);
        showToast('Error al cargar inversiones', 'error');
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
    const total = allInversiones.reduce((sum, inv) => sum + inv.cantidad_inversion, 0);
    document.getElementById('total-acumulado').textContent = formatCurrency(total);
    document.getElementById('total-inversiones-header').textContent = formatCurrency(total);
    
    // Total de registros
    document.getElementById('total-registros').textContent = allInversiones.length;

    // Total del mes actual
    const now = new Date();
    const mesActual = allInversiones.filter(inv => {
        const fecha = new Date(inv.fecha_inversion);
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    });
    const totalMes = mesActual.reduce((sum, inv) => sum + inv.cantidad_inversion, 0);
    document.getElementById('total-mes').textContent = formatCurrency(totalMes);

    // Promedio mensual últimos 6 meses
    const seisM = new Date();
    seisM.setMonth(seisM.getMonth() - 6);
    const ultimos6 = allInversiones.filter(inv => new Date(inv.fecha_inversion) >= seisM);
    const promedio = ultimos6.length > 0 ? ultimos6.reduce((sum, inv) => sum + inv.cantidad_inversion, 0) / 6 : 0;
    document.getElementById('promedio-mensual').textContent = formatCurrency(promedio);
    
    console.log('📊 Estadísticas actualizadas');
}

/**
 * Actualizar filtro de tipos
 */
function updateTipoFilter() {
    const tipos = [...new Set(allInversiones.map(inv => inv.tipo_inversion))];
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

    filteredInversiones = allInversiones.filter(inv => {
        const matchSearch = inv.tipo_inversion.toLowerCase().includes(search) || 
                          (inv.descripcion && inv.descripcion.toLowerCase().includes(search));
        const matchTipo = !tipo || inv.tipo_inversion === tipo;
        return matchSearch && matchTipo;
    });

    sortInversiones();
    currentPage = 1;
    renderTable();
}

/**
 * Ordenar inversiones
 */
function sortInversiones() {
    filteredInversiones.sort((a, b) => {
        let aVal, bVal;
        
        if (sortField === 'tipo') {
            aVal = a.tipo_inversion;
            bVal = b.tipo_inversion;
        } else if (sortField === 'cantidad') {
            aVal = a.cantidad_inversion;
            bVal = b.cantidad_inversion;
        } else if (sortField === 'fecha') {
            aVal = new Date(a.fecha_inversion);
            bVal = new Date(b.fecha_inversion);
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
 * Renderizar tabla de inversiones
 */
function renderTable() {
    const tbody = document.getElementById('inversiones-tbody');
    
    if (!tbody) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredInversiones.slice(start, end);

    // Si no hay items, mostrar mensaje vacío
    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                            ${allInversiones.length === 0 ? 'No hay inversiones registradas' : 'No se encontraron inversiones'}
                        </div>
                        <div style="color: var(--text-secondary);">
                            ${allInversiones.length === 0 ? 'Comienza agregando tu primera inversión' : 'Intenta ajustar los filtros de búsqueda'}
                        </div>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    // Renderizar filas de inversiones
    let html = '';
    pageItems.forEach(inv => {
        html += `
            <tr>
                <td style="text-transform: capitalize; font-weight: 600;">${inv.tipo_inversion}</td>
                <td style="color: var(--success); font-weight: 600;">${formatCurrency(inv.cantidad_inversion)}</td>
                <td>${formatDate(inv.fecha_inversion)}</td>
                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${inv.descripcion || '-'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editInversion(${inv.id})" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" onclick="confirmDelete(${inv.id})" title="Eliminar">🗑️</button>
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
    const totalPages = Math.ceil(filteredInversiones.length / itemsPerPage);
    
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
 * Mostrar modal de agregar inversión
 */
function showAddModal() {
    document.getElementById('inversion-modal-title').textContent = 'Nueva Inversión';
    document.getElementById('inversion-form').reset();
    document.getElementById('inversion-id').value = '';
    document.getElementById('fecha-inversion').value = getCurrentDate();
    document.getElementById('submit-text').textContent = 'Guardar';
    openModal('inversion-modal');
}

// ====================================
// CRUD OPERATIONS
// ====================================

/**
 * Editar inversión
 */
async function editInversion(id) {
    try {
        console.log('📝 Cargando inversión para editar:', id);
        const response = await authenticatedFetch(`${API_BASE_URL}/inversiones/${id}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar inversión');
        }
        
        const inv = await response.json();
        console.log('✅ Inversión cargada:', inv);
        
        // Llenar formulario
        document.getElementById('inversion-modal-title').textContent = 'Editar Inversión';
        document.getElementById('inversion-id').value = inv.id;
        document.getElementById('tipo-inversion').value = inv.tipo_inversion;
        document.getElementById('cantidad-inversion').value = inv.cantidad_inversion;
        document.getElementById('fecha-inversion').value = inv.fecha_inversion;
        document.getElementById('descripcion-inversion').value = inv.descripcion || '';
        document.getElementById('submit-text').textContent = 'Actualizar';
        
        openModal('inversion-modal');
        
    } catch (error) {
        console.error('❌ Error al cargar inversión:', error);
        showToast('Error al cargar inversión', 'error');
    }
}

/**
 * Confirmar eliminación
 */
function confirmDelete(id) {
    deleteInversionId = id;
    openModal('delete-modal');
}

/**
 * Eliminar inversión
 */
async function deleteInversion() {
    try {
        console.log('🗑️ Eliminando inversión:', deleteInversionId);
        const response = await authenticatedFetch(`${API_BASE_URL}/inversiones/${deleteInversionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar');
        }
        
        console.log('✅ Inversión eliminada');
        closeModal('delete-modal');
        await loadInversiones();
        showToast('Inversión eliminada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al eliminar inversión:', error);
        showToast('Error al eliminar inversión', 'error');
    }
}

/**
 * Guardar inversión (crear o actualizar)
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('inversion-id').value;
    const data = {
        tipo_inversion: document.getElementById('tipo-inversion').value.trim(),
        cantidad_inversion: parseFloat(document.getElementById('cantidad-inversion').value),
        fecha_inversion: document.getElementById('fecha-inversion').value,
        descripcion: document.getElementById('descripcion-inversion').value.trim() || null
    };

    // Validaciones
    if (data.cantidad_inversion <= 0) {
        showToast('La cantidad debe ser mayor a cero', 'error');
        return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    document.getElementById('submit-text').textContent = 'Guardando...';

    try {
        const url = id ? `${API_BASE_URL}/inversiones/${id}` : `${API_BASE_URL}/inversiones/`;
        const method = id ? 'PUT' : 'POST';
        
        console.log(`${method === 'POST' ? '➕' : '✏️'} ${method === 'POST' ? 'Creando' : 'Actualizando'} inversión:`, data);
        
        const response = await authenticatedFetch(url, {
            method,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al guardar');
        }

        const savedInversion = await response.json();
        console.log('✅ Inversión guardada:', savedInversion);
        
        closeModal('inversion-modal');
        await loadInversiones();
        showToast(id ? 'Inversión actualizada' : 'Inversión creada', 'success');

    } catch (error) {
        console.error('❌ Error al guardar inversión:', error);
        showToast(error.message || 'Error al guardar inversión', 'error');
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
// INICIALIZACIÓN
// ====================================

/**
 * Inicializar la página
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando página de inversiones...');
    
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Cargar datos
    await loadUserProfile();
    await loadInversiones();

    // ====================================
    // EVENT LISTENERS
    // ====================================
    
    // Botón agregar inversión
    const addBtn = document.getElementById('add-inversion-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddModal);
    }
    
    // Formulario de inversión
    const form = document.getElementById('inversion-form');
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
        confirmDeleteBtn.addEventListener('click', deleteInversion);
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
            const totalPages = Math.ceil(filteredInversiones.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
    
    console.log('✅ Página de inversiones inicializada correctamente');
});

// ====================================
// EXPORTAR FUNCIONES GLOBALES
// ====================================

// Hacer funciones disponibles globalmente para onclick en HTML
window.editInversion = editInversion;
window.confirmDelete = confirmDelete;