// ====================================
// ANÁLISIS FINANCIERO
// ====================================

/**
 * Carga y muestra el análisis financiero
 */
async function loadAnalisis() {
    const period = document.getElementById('analysis-period')?.value || 'general';
    const container = document.getElementById('analysis-content');
    
    if (!container) return;
    
    // Mostrar loading
    container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Cargando análisis...</p></div>';
    
    try {
        let data;
        
        switch(period) {
            case 'general':
                data = await loadAnalisisGeneral();
                break;
            case 'mensual':
                data = await loadAnalisisMensual();
                break;
            case 'trimestral':
                data = await loadAnalisisTrimestral();
                break;
            default:
                data = await loadAnalisisGeneral();
        }
        
        renderAnalisis(data);
        
    } catch (error) {
        console.error('Error al cargar análisis:', error);
        container.innerHTML = '<div class="error-container"><p>Error al cargar el análisis</p></div>';
    }
}

/**
 * Carga análisis general (todo el tiempo)
 */
async function loadAnalisisGeneral() {
    const response = await authenticatedFetch(`${API_BASE_URL}/analisis/resumen-general`);
    
    if (!response.ok) {
        throw new Error('Error al cargar análisis general');
    }
    
    const resumen = await response.json();
    
    // Cargar distribuciones
    const gastosResponse = await authenticatedFetch(`${API_BASE_URL}/analisis/gastos-por-tipo`);
    const inversionesResponse = await authenticatedFetch(`${API_BASE_URL}/analisis/inversiones-por-tipo`);
    
    const gastosPorTipo = gastosResponse.ok ? await gastosResponse.json() : [];
    const inversionesPorTipo = inversionesResponse.ok ? await inversionesResponse.json() : [];
    
    return {
        periodo: 'Todo el tiempo',
        resumen,
        gastosPorTipo,
        inversionesPorTipo
    };
}

/**
 * Carga análisis mensual (mes actual)
 */
async function loadAnalisisMensual() {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    
    const response = await authenticatedFetch(
        `${API_BASE_URL}/analisis/resumen-mensual?mes=${mes}&anio=${anio}`
    );
    
    if (!response.ok) {
        throw new Error('Error al cargar análisis mensual');
    }
    
    const resumen = await response.json();
    
    // Cargar distribuciones del mes
    const gastosResponse = await authenticatedFetch(
        `${API_BASE_URL}/analisis/gastos-por-tipo?mes=${mes}&anio=${anio}`
    );
    const inversionesResponse = await authenticatedFetch(
        `${API_BASE_URL}/analisis/inversiones-por-tipo?mes=${mes}&anio=${anio}`
    );
    
    const gastosPorTipo = gastosResponse.ok ? await gastosResponse.json() : [];
    const inversionesPorTipo = inversionesResponse.ok ? await inversionesResponse.json() : [];
    
    return {
        periodo: `${getNombreMes(mes)} ${anio}`,
        resumen,
        gastosPorTipo,
        inversionesPorTipo
    };
}

/**
 * Carga análisis trimestral (últimos 3 meses)
 */
async function loadAnalisisTrimestral() {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/analisis/tendencia-mensual?meses=3`
    );
    
    if (!response.ok) {
        throw new Error('Error al cargar tendencia');
    }
    
    const tendencia = await response.json();
    
    return {
        periodo: 'Últimos 3 meses',
        tendencia
    };
}

/**
 * Renderiza el análisis en el contenedor
 */
function renderAnalisis(data) {
    const container = document.getElementById('analysis-content');
    
    if (!container) return;
    
    let html = `<div class="analysis-results">`;
    
    // Encabezado
    html += `
        <div class="analysis-header">
            <h2>Análisis Financiero</h2>
            <p class="analysis-period">${data.periodo}</p>
        </div>
    `;
    
    // Si es análisis general o mensual
    if (data.resumen) {
        html += renderResumenAnalisis(data.resumen);
        
        if (data.gastosPorTipo && data.gastosPorTipo.length > 0) {
            html += renderTopGastos(data.gastosPorTipo);
        }
        
        if (data.inversionesPorTipo && data.inversionesPorTipo.length > 0) {
            html += renderTopInversiones(data.inversionesPorTipo);
        }
    }
    
    // Si es análisis trimestral
    if (data.tendencia) {
        html += renderTendencia(data.tendencia);
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
}

/**
 * Renderiza el resumen del análisis
 */
function renderResumenAnalisis(resumen) {
    const balanceClass = resumen.balance >= 0 ? 'positive' : 'negative';
    const ahorroClass = resumen.porcentaje_ahorro >= 20 ? 'positive' : 
                       resumen.porcentaje_ahorro >= 10 ? 'warning' : 'negative';
    
    return `
        <div class="analysis-summary">
            <div class="summary-card">
                <div class="summary-icon">💰</div>
                <div class="summary-content">
                    <div class="summary-label">Total Ingresos</div>
                    <div class="summary-value positive">${formatCurrency(resumen.total_inversiones)}</div>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-icon">💸</div>
                <div class="summary-content">
                    <div class="summary-label">Total Gastos</div>
                    <div class="summary-value negative">${formatCurrency(resumen.total_gastos)}</div>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-icon">📊</div>
                <div class="summary-content">
                    <div class="summary-label">Balance</div>
                    <div class="summary-value ${balanceClass}">${formatCurrency(resumen.balance)}</div>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-icon">🎯</div>
                <div class="summary-content">
                    <div class="summary-label">Porcentaje de Ahorro</div>
                    <div class="summary-value ${ahorroClass}">${resumen.porcentaje_ahorro}%</div>
                </div>
            </div>
        </div>
        
        <div class="analysis-insights">
            ${generateInsights(resumen)}
        </div>
    `;
}

/**
 * Genera insights automáticos basados en los datos
 */
function generateInsights(resumen) {
    const insights = [];
    
    if (resumen.porcentaje_ahorro >= 20) {
        insights.push({
            icon: '✅',
            type: 'success',
            message: '¡Excelente! Estás ahorrando más del 20% de tus ingresos.'
        });
    } else if (resumen.porcentaje_ahorro >= 10) {
        insights.push({
            icon: '⚠️',
            type: 'warning',
            message: 'Estás ahorrando un porcentaje moderado. Intenta reducir gastos innecesarios.'
        });
    } else if (resumen.porcentaje_ahorro < 0) {
        insights.push({
            icon: '❌',
            type: 'danger',
            message: '¡Alerta! Tus gastos superan tus ingresos. Revisa tu presupuesto urgentemente.'
        });
    } else {
        insights.push({
            icon: '💡',
            type: 'info',
            message: 'Puedes mejorar tu ahorro. La meta recomendada es 20%.'
        });
    }
    
    if (resumen.balance > 0) {
        insights.push({
            icon: '📈',
            type: 'success',
            message: `Tu balance es positivo. Considera invertir ${formatCurrency(resumen.balance * 0.5)}.`
        });
    }
    
    let html = '<div class="insights-container">';
    html += '<h3 class="insights-title">💡 Recomendaciones</h3>';
    
    insights.forEach(insight => {
        html += `
            <div class="insight-card ${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <span class="insight-message">${insight.message}</span>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * Renderiza el top de gastos
 */
function renderTopGastos(gastos) {
    const top3 = gastos.slice(0, 3);
    
    let html = `
        <div class="top-section">
            <h3 class="section-title">🔥 Principales Categorías de Gastos</h3>
            <div class="top-items">
    `;
    
    top3.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        html += `
            <div class="top-item">
                <span class="top-medal">${medal}</span>
                <div class="top-info">
                    <div class="top-name">${item.tipo_gasto}</div>
                    <div class="top-amount">${formatCurrency(item.total)} (${item.porcentaje.toFixed(1)}%)</div>
                </div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

/**
 * Renderiza el top de inversiones
 */
function renderTopInversiones(inversiones) {
    const top3 = inversiones.slice(0, 3);
    
    let html = `
        <div class="top-section">
            <h3 class="section-title">💎 Principales Fuentes de Ingresos</h3>
            <div class="top-items">
    `;
    
    top3.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        html += `
            <div class="top-item">
                <span class="top-medal">${medal}</span>
                <div class="top-info">
                    <div class="top-name">${item.tipo_inversion}</div>
                    <div class="top-amount">${formatCurrency(item.total)} (${item.porcentaje.toFixed(1)}%)</div>
                </div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

/**
 * Renderiza la tendencia de varios meses
 */
function renderTendencia(tendencia) {
    if (!tendencia || tendencia.length === 0) {
        return '<p class="no-data">No hay datos de tendencia disponibles</p>';
    }
    
    let html = `
        <div class="tendencia-section">
            <h3 class="section-title">📈 Tendencia Mensual</h3>
            <div class="tendencia-chart">
    `;
    
    // Encontrar valor máximo para escalar
    const maxValue = Math.max(
        ...tendencia.map(m => Math.max(m.total_inversiones, m.total_gastos))
    );
    
    tendencia.forEach(mes => {
        const inversionHeight = (mes.total_inversiones / maxValue) * 100;
        const gastoHeight = (mes.total_gastos / maxValue) * 100;
        const balanceClass = mes.balance >= 0 ? 'positive' : 'negative';
        
        html += `
            <div class="tendencia-mes">
                <div class="tendencia-bars">
                    <div class="tendencia-bar inversion" style="height: ${inversionHeight}%">
                        <span class="bar-label">${formatCurrency(mes.total_inversiones)}</span>
                    </div>
                    <div class="tendencia-bar gasto" style="height: ${gastoHeight}%">
                        <span class="bar-label">${formatCurrency(mes.total_gastos)}</span>
                    </div>
                </div>
                <div class="tendencia-info">
                    <div class="tendencia-periodo">${mes.periodo}</div>
                    <div class="tendencia-balance ${balanceClass}">
                        ${mes.balance >= 0 ? '+' : ''}${formatCurrency(mes.balance)}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="tendencia-legend">
                <div class="legend-item">
                    <span class="legend-color inversion"></span>
                    <span>Ingresos</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color gasto"></span>
                    <span>Gastos</span>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Obtiene el nombre del mes en español
 */
function getNombreMes(numeroMes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[numeroMes - 1];
}

/**
 * Configura el selector de período
 */
function setupAnalisisPeriod() {
    const periodSelect = document.getElementById('analysis-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', loadAnalisis);
    }
}