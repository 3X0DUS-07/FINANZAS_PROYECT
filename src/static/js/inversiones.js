// ====================================
// GESTIÓN DE INVERSIONES
// ====================================

async function loadInversiones() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inversiones/`);
        
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
            response = await authenticatedFetch(`${API_BASE_URL}/inversiones/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await authenticatedFetch(`${API_BASE_URL}/inversiones/`, {
                method: 'POST',
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

async function editInversion(id) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inversiones/${id}`);
        
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

async function deleteInversion(id) {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inversiones/${id}`, {
            method: 'DELETE'
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

// Hacer funciones globales
window.editInversion = editInversion;
window.deleteInversion = deleteInversion;