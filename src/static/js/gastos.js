// ====================================
// GESTIÓN DE GASTOS
// ====================================

async function loadGastos() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/gastos/`);
        
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
            response = await authenticatedFetch(`${API_BASE_URL}/gastos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await authenticatedFetch(`${API_BASE_URL}/gastos/`, {
                method: 'POST',
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

async function editGasto(id) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/gastos/${id}`);
        
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

async function deleteGasto(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/gastos/${id}`, {
            method: 'DELETE'
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

// Hacer funciones globales
window.editGasto = editGasto;
window.deleteGasto = deleteGasto;