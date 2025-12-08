// ====================================
// INICIALIZACIÓN PRINCIPAL DEL DASHBOARD
// ====================================

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!checkAuth()) {
        return;
    }
    
    // Cargar perfil de usuario
    await loadUserProfile();
    
    // Configurar navegación
    setupNavigation();
    
    // Configurar chatbot
    setupChatbot();
    
    // Configurar modales
    setupModals();
    
    // Configurar análisis
    setupAnalisisPeriod();
    
    // Configurar botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Configurar botones para agregar inversiones/gastos
    const addInversionBtn = document.getElementById('add-inversion-btn');
    if (addInversionBtn) {
        addInversionBtn.addEventListener('click', showAddInversionModal);
    }
    
    const addGastoBtn = document.getElementById('add-gasto-btn');
    if (addGastoBtn) {
        addGastoBtn.addEventListener('click', showAddGastoModal);
    }
    
    // Configurar formularios con validación
    const inversionForm = document.getElementById('inversion-form');
    if (inversionForm) {
        inversionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                tipo_inversion: document.getElementById('tipo-inversion').value,
                cantidad_inversion: document.getElementById('cantidad-inversion').value,
                fecha_inversion: document.getElementById('fecha-inversion').value,
                descripcion: document.getElementById('descripcion-inversion').value
            };
            
            const validation = validateInversionForm(formData);
            
            if (!validation.valid) {
                displayValidationErrors(validation.errors, 'inversion-form');
                return;
            }
            
            await handleInversionSubmit(e);
        });
    }
    
    const gastoForm = document.getElementById('gasto-form');
    if (gastoForm) {
        gastoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                tipo_gasto: document.getElementById('tipo-gasto').value,
                cantidad_gasto: document.getElementById('cantidad-gasto').value,
                fecha_gasto: document.getElementById('fecha-gasto').value,
                descripcion: document.getElementById('descripcion-gasto').value
            };
            
            const validation = validateGastoForm(formData);
            
            if (!validation.valid) {
                displayValidationErrors(validation.errors, 'gasto-form');
                return;
            }
            
            await handleGastoSubmit(e);
        });
    }
    
    // Configurar atajos de teclado
    setupKeyboardShortcuts();
    
    // Cargar datos iniciales del dashboard
    loadDashboardData();
});

/**
 * Configura atajos de teclado
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para abrir chatbot
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const chatModal = document.getElementById('chat-modal');
            if (chatModal) {
                chatModal.classList.toggle('active');
            }
        }
        
        // Ctrl/Cmd + E para exportar
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            showExportMenu();
        }
        
        // Ctrl/Cmd + N para nueva inversión (solo si estamos en esa sección)
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            const inversionSection = document.getElementById('inversiones-section');
            if (inversionSection && inversionSection.classList.contains('active')) {
                e.preventDefault();
                showAddInversionModal();
            }
        }
    });
}