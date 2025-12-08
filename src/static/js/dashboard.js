// ====================================
// DASHBOARD - RESUMEN GENERAL
// ====================================

async function loadDashboardData() {
    try {
        // Cargar resumen general
        const resumenResponse = await authenticatedFetch(`${API_BASE_URL}/analisis/resumen-general`);
        
        if (resumenResponse.ok) {
            const resumen = await resumenResponse.json();
            
            // Actualizar tarjetas
            document.getElementById('total-inversiones').textContent = formatCurrency(resumen.total_inversiones);
            document.getElementById('total-gastos').textContent = formatCurrency(resumen.total_gastos);
            document.getElementById('balance').textContent = formatCurrency(resumen.balance);
            document.getElementById('porcentaje-ahorro').textContent = `${resumen.porcentaje_ahorro}%`;
            
            const headerBalance = document.getElementById('header-balance');
            if (headerBalance) {
                headerBalance.querySelector('.stat-value').textContent = formatCurrency(resumen.balance);
            }
            
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
        const gastosResponse = await authenticatedFetch(`${API_BASE_URL}/analisis/gastos-por-tipo`);
        
        if (gastosResponse.ok) {
            const gastos = await gastosResponse.json();
            renderGastosChart(gastos);
        }
        
        // Cargar distribución de inversiones
        const inversionesResponse = await authenticatedFetch(`${API_BASE_URL}/analisis/inversiones-por-tipo`);
        
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

// Función para análisis (placeholder)
function loadAnalisis() {
    showToast('Función de análisis en desarrollo', 'info');
}