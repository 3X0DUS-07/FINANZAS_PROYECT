// ====================================
// GENERACIÓN DE GRÁFICOS
// ====================================

/**
 * Renderiza un gráfico de barras horizontales
 * @param {string} containerId - ID del contenedor
 * @param {Array} data - Datos a graficar
 * @param {Object} options - Opciones de configuración
 */
function renderBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container || !data || data.length === 0) {
        if (container) {
            container.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    const {
        labelKey = 'label',
        valueKey = 'value',
        percentageKey = 'percentage',
        colorKey = 'color',
        showPercentage = true,
        maxBars = 10,
        height = 24
    } = options;
    
    // Limitar cantidad de barras
    const displayData = data.slice(0, maxBars);
    
    let html = '<div class="chart-bars" style="padding: 20px;">';
    
    displayData.forEach(item => {
        const label = item[labelKey];
        const value = item[valueKey];
        const percentage = item[percentageKey] || 100;
        const color = item[colorKey] || getColorForCategory(label);
        
        html += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; text-transform: capitalize;">${label}</span>
                    <span style="color: var(--text-secondary);">
                        ${formatCurrency(value)}
                        ${showPercentage ? ` (${percentage.toFixed(1)}%)` : ''}
                    </span>
                </div>
                <div style="background: var(--bg-dark); height: ${height}px; border-radius: 12px; overflow: hidden;">
                    <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 1s ease;"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Renderiza un gráfico de pie simple con CSS
 * @param {string} containerId - ID del contenedor
 * @param {Array} data - Datos a graficar
 * @param {Object} options - Opciones de configuración
 */
function renderPieChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container || !data || data.length === 0) {
        if (container) {
            container.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    const {
        labelKey = 'label',
        valueKey = 'value',
        colorKey = 'color'
    } = options;
    
    let html = '<div class="pie-chart-container">';
    
    // Crear lista de items con colores
    html += '<div class="pie-legend">';
    data.forEach(item => {
        const label = item[labelKey];
        const value = item[valueKey];
        const color = item[colorKey] || getColorForCategory(label);
        const percentage = (value / data.reduce((sum, i) => sum + i[valueKey], 0)) * 100;
        
        html += `
            <div class="pie-legend-item">
                <span class="pie-color" style="background: ${color};"></span>
                <span class="pie-label">${label}</span>
                <span class="pie-value">${formatCurrency(value)} (${percentage.toFixed(1)}%)</span>
            </div>
        `;
    });
    html += '</div>';
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Renderiza un gráfico de línea simple
 * @param {string} containerId - ID del contenedor
 * @param {Array} data - Datos a graficar
 * @param {Object} options - Opciones de configuración
 */
function renderLineChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container || !data || data.length === 0) {
        if (container) {
            container.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    const {
        xKey = 'x',
        yKey = 'y',
        labelKey = 'label',
        color = 'var(--primary)',
        height = 200
    } = options;
    
    // Encontrar valores mín y máx
    const values = data.map(item => item[yKey]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    let html = `<div class="line-chart" style="height: ${height}px; padding: 20px;">`;
    html += '<div class="line-chart-canvas" style="position: relative; height: 100%;">';
    
    // Crear puntos y línea
    const points = [];
    data.forEach((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - (((item[yKey] - minValue) / range) * 100);
        points.push(`${x}%,${y}%`);
    });
    
    // SVG para la línea
    html += `
        <svg style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;">
            <polyline
                points="${points.join(' ')}"
                fill="none"
                stroke="${color}"
                stroke-width="2"
                style="transition: all 1s ease;"
            />
        </svg>
    `;
    
    // Etiquetas del eje X
    html += '<div class="line-chart-labels" style="display: flex; justify-content: space-between; margin-top: 10px;">';
    data.forEach(item => {
        const label = item[labelKey] || item[xKey];
        html += `<span style="font-size: 12px; color: var(--text-secondary);">${label}</span>`;
    });
    html += '</div>';
    
    html += '</div></div>';
    container.innerHTML = html;
}

/**
 * Renderiza un gráfico de área apilada (ingresos vs gastos)
 * @param {string} containerId - ID del contenedor
 * @param {Array} data - Datos a graficar
 */
function renderAreaChart(containerId, data) {
    const container = document.getElementById(containerId);
    
    if (!container || !data || data.length === 0) {
        if (container) {
            container.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    const maxValue = Math.max(
        ...data.map(item => Math.max(item.total_inversiones || 0, item.total_gastos || 0))
    );
    
    let html = '<div class="area-chart" style="padding: 20px;">';
    
    data.forEach(item => {
        const inversionHeight = ((item.total_inversiones || 0) / maxValue) * 100;
        const gastoHeight = ((item.total_gastos || 0) / maxValue) * 100;
        
        html += `
            <div class="area-chart-bar" style="margin-bottom: 15px;">
                <div style="display: flex; gap: 5px; height: 100px;">
                    <div style="flex: 1; position: relative;">
                        <div style="
                            position: absolute;
                            bottom: 0;
                            width: 100%;
                            height: ${inversionHeight}%;
                            background: linear-gradient(180deg, var(--success) 0%, rgba(16, 185, 129, 0.3) 100%);
                            border-radius: 8px 8px 0 0;
                            transition: height 1s ease;
                        "></div>
                    </div>
                    <div style="flex: 1; position: relative;">
                        <div style="
                            position: absolute;
                            bottom: 0;
                            width: 100%;
                            height: ${gastoHeight}%;
                            background: linear-gradient(180deg, var(--danger) 0%, rgba(239, 68, 68, 0.3) 100%);
                            border-radius: 8px 8px 0 0;
                            transition: height 1s ease;
                        "></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <span style="font-size: 12px; color: var(--text-secondary);">${item.periodo || item.mes}</span>
                    <span style="font-size: 12px; font-weight: 600; color: ${item.balance >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${formatCurrency(item.balance || 0)}
                    </span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Renderiza un medidor/gauge de porcentaje
 * @param {string} containerId - ID del contenedor
 * @param {number} percentage - Porcentaje a mostrar (0-100)
 * @param {Object} options - Opciones de configuración
 */
function renderGauge(containerId, percentage, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const {
        label = 'Porcentaje',
        size = 150,
        strokeWidth = 15,
        color = 'var(--primary)'
    } = options;
    
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    // Determinar color según el porcentaje
    let gaugeColor = color;
    if (color === 'auto') {
        if (percentage >= 75) gaugeColor = 'var(--success)';
        else if (percentage >= 50) gaugeColor = 'var(--warning)';
        else gaugeColor = 'var(--danger)';
    }
    
    const html = `
        <div class="gauge-container" style="text-align: center; padding: 20px;">
            <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke="var(--bg-dark)"
                    stroke-width="${strokeWidth}"
                    fill="none"
                />
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke="${gaugeColor}"
                    stroke-width="${strokeWidth}"
                    fill="none"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    style="transition: stroke-dashoffset 1s ease;"
                    stroke-linecap="round"
                />
            </svg>
            <div style="margin-top: 10px;">
                <div style="font-size: 32px; font-weight: 700; color: ${gaugeColor};">${percentage}%</div>
                <div style="font-size: 14px; color: var(--text-secondary);">${label}</div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Actualiza un gráfico existente con nuevos datos
 * @param {string} containerId - ID del contenedor
 * @param {Array} data - Nuevos datos
 * @param {string} chartType - Tipo de gráfico ('bar', 'pie', 'line', 'area', 'gauge')
 * @param {Object} options - Opciones de configuración
 */
function updateChart(containerId, data, chartType, options = {}) {
    switch(chartType) {
        case 'bar':
            renderBarChart(containerId, data, options);
            break;
        case 'pie':
            renderPieChart(containerId, data, options);
            break;
        case 'line':
            renderLineChart(containerId, data, options);
            break;
        case 'area':
            renderAreaChart(containerId, data);
            break;
        case 'gauge':
            renderGauge(containerId, data, options);
            break;
        default:
            console.error('Tipo de gráfico no reconocido:', chartType);
    }
}

// Hacer funciones disponibles globalmente
window.renderBarChart = renderBarChart;
window.renderPieChart = renderPieChart;
window.renderLineChart = renderLineChart;
window.renderAreaChart = renderAreaChart;
window.renderGauge = renderGauge;
window.updateChart = updateChart;