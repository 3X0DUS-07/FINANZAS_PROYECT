// ====================================
// NAVEGACIÓN DEL DASHBOARD
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
        'analisis': { title: 'Análisis Financiero', subtitle: 'Reportes y estadísticas' }
    };
    
    const pageData = titles[section] || titles['overview'];
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    
    if (titleEl) titleEl.textContent = pageData.title;
    if (subtitleEl) subtitleEl.textContent = pageData.subtitle;
}

function loadSectionData(section) {
    switch(section) {
        case 'overview':
            if (typeof loadDashboardData !== 'undefined') {
                loadDashboardData();
            }
            break;
        case 'inversiones':
            if (typeof loadInversiones !== 'undefined') {
                loadInversiones();
            }
            break;
        case 'gastos':
            if (typeof loadGastos !== 'undefined') {
                loadGastos();
            }
            break;
        case 'analisis':
            if (typeof loadAnalisis !== 'undefined') {
                loadAnalisis();
            }
            break;
    }
}