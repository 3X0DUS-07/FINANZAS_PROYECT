// ====================================
// GESTIÓN DE MODALES
// ====================================

/**
 * Abre un modal por su ID
 * @param {string} modalId - ID del modal a abrir
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Agregar clase al body para prevenir scroll
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra un modal por su ID
 * @param {string} modalId - ID del modal a cerrar
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }
}

/**
 * Cierra todos los modales abiertos
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal.active, .modal-chat.active');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/**
 * Inicializa los event listeners de los modales
 */
function setupModals() {
    // Cerrar modales con botón X o botón cancelar
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modal || this.closest('.modal').id;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    
    // Cerrar modal al hacer click fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Cerrar modales con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Hacer funciones disponibles globalmente
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;