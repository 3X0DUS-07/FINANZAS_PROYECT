// ====================================
// VALIDACIONES DE FORMULARIOS
// ====================================

/**
 * Valida que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {Object} { valid: boolean, message: string }
 */
function validateRequired(value, fieldName = 'Campo') {
    if (!value || value.trim() === '') {
        return {
            valid: false,
            message: `${fieldName} es requerido`
        };
    }
    return { valid: true, message: '' };
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {Object} { valid: boolean, message: string }
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim() === '') {
        return { valid: false, message: 'El correo electrónico es requerido' };
    }
    
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Ingresa un correo electrónico válido' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePassword(password, minLength = 6) {
    if (!password || password.trim() === '') {
        return { valid: false, message: 'La contraseña es requerida' };
    }
    
    if (password.length < minLength) {
        return {
            valid: false,
            message: `La contraseña debe tener al menos ${minLength} caracteres`
        };
    }
    
    return { valid: true, message: '' };
}

/**
 * Valida un nombre de usuario
 * @param {string} username - Nombre de usuario a validar
 * @param {number} minLength - Longitud mínima (default: 3)
 * @returns {Object} { valid: boolean, message: string }
 */
function validateUsername(username, minLength = 3) {
    if (!username || username.trim() === '') {
        return { valid: false, message: 'El nombre de usuario es requerido' };
    }
    
    if (username.length < minLength) {
        return {
            valid: false,
            message: `El nombre de usuario debe tener al menos ${minLength} caracteres`
        };
    }
    
    // Solo letras, números y guión bajo
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return {
            valid: false,
            message: 'El nombre de usuario solo puede contener letras, números y guión bajo'
        };
    }
    
    return { valid: true, message: '' };
}

/**
 * Valida un número positivo
 * @param {string|number} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePositiveNumber(value, fieldName = 'Valor') {
    if (value === '' || value === null || value === undefined) {
        return { valid: false, message: `${fieldName} es requerido` };
    }
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return { valid: false, message: `${fieldName} debe ser un número válido` };
    }
    
    if (num <= 0) {
        return { valid: false, message: `${fieldName} debe ser mayor a cero` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Valida una fecha
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {Object} options - Opciones de validación
 * @returns {Object} { valid: boolean, message: string }
 */
function validateDate(dateString, options = {}) {
    const {
        allowFuture = true,
        allowPast = true,
        fieldName = 'Fecha'
    } = options;
    
    if (!dateString) {
        return { valid: false, message: `${fieldName} es requerida` };
    }
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) {
        return { valid: false, message: `${fieldName} no es válida` };
    }
    
    if (!allowFuture && date > today) {
        return { valid: false, message: `${fieldName} no puede ser futura` };
    }
    
    if (!allowPast && date < today) {
        return { valid: false, message: `${fieldName} no puede ser pasada` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Valida el formulario de inversión
 * @param {Object} formData - Datos del formulario
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateInversionForm(formData) {
    const errors = {};
    
    // Validar tipo
    const tipoValidation = validateRequired(formData.tipo_inversion, 'Tipo de inversión');
    if (!tipoValidation.valid) {
        errors.tipo_inversion = tipoValidation.message;
    }
    
    // Validar cantidad
    const cantidadValidation = validatePositiveNumber(formData.cantidad_inversion, 'Cantidad');
    if (!cantidadValidation.valid) {
        errors.cantidad_inversion = cantidadValidation.message;
    }
    
    // Validar fecha
    const fechaValidation = validateDate(formData.fecha_inversion, {
        allowFuture: false,
        fieldName: 'Fecha de inversión'
    });
    if (!fechaValidation.valid) {
        errors.fecha_inversion = fechaValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Valida el formulario de gasto
 * @param {Object} formData - Datos del formulario
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateGastoForm(formData) {
    const errors = {};
    
    // Validar tipo
    const tipoValidation = validateRequired(formData.tipo_gasto, 'Tipo de gasto');
    if (!tipoValidation.valid) {
        errors.tipo_gasto = tipoValidation.message;
    }
    
    // Validar cantidad
    const cantidadValidation = validatePositiveNumber(formData.cantidad_gasto, 'Cantidad');
    if (!cantidadValidation.valid) {
        errors.cantidad_gasto = cantidadValidation.message;
    }
    
    // Validar fecha
    const fechaValidation = validateDate(formData.fecha_gasto, {
        allowFuture: false,
        fieldName: 'Fecha del gasto'
    });
    if (!fechaValidation.valid) {
        errors.fecha_gasto = fechaValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Valida el formulario de registro
 * @param {Object} formData - Datos del formulario
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateRegisterForm(formData) {
    const errors = {};
    
    // Validar username
    const usernameValidation = validateUsername(formData.nombre);
    if (!usernameValidation.valid) {
        errors.nombre = usernameValidation.message;
    }
    
    // Validar email
    const emailValidation = validateEmail(formData.correo);
    if (!emailValidation.valid) {
        errors.correo = emailValidation.message;
    }
    
    // Validar password
    const passwordValidation = validatePassword(formData.contraseña);
    if (!passwordValidation.valid) {
        errors.contraseña = passwordValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Valida el formulario de login
 * @param {Object} formData - Datos del formulario
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateLoginForm(formData) {
    const errors = {};
    
    // Validar username
    const usernameValidation = validateRequired(formData.username, 'Nombre de usuario');
    if (!usernameValidation.valid) {
        errors.username = usernameValidation.message;
    }
    
    // Validar password
    const passwordValidation = validateRequired(formData.password, 'Contraseña');
    if (!passwordValidation.valid) {
        errors.password = passwordValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Muestra errores de validación en el formulario
 * @param {Object} errors - Objeto con los errores
 * @param {string} formId - ID del formulario
 */
function displayValidationErrors(errors, formId) {
    // Limpiar errores previos
    clearValidationErrors(formId);
    
    // Mostrar nuevos errores
    Object.keys(errors).forEach(fieldName => {
        const input = document.getElementById(fieldName) || 
                     document.querySelector(`#${formId} [name="${fieldName}"]`);
        
        if (input) {
            // Agregar clase de error
            input.classList.add('input-error');
            
            // Crear y agregar mensaje de error
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = errors[fieldName];
            
            // Insertar después del input
            input.parentNode.appendChild(errorDiv);
            
            // Remover error al escribir
            input.addEventListener('input', function removeError() {
                input.classList.remove('input-error');
                const errorMsg = input.parentNode.querySelector('.validation-error');
                if (errorMsg) {
                    errorMsg.remove();
                }
                input.removeEventListener('input', removeError);
            });
        }
    });
    
    // Mostrar primer error en toast
    const firstError = Object.values(errors)[0];
    if (firstError) {
        showToast(firstError, 'error');
    }
}

/**
 * Limpia los errores de validación de un formulario
 * @param {string} formId - ID del formulario
 */
function clearValidationErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remover clases de error
    form.querySelectorAll('.input-error').forEach(input => {
        input.classList.remove('input-error');
    });
    
    // Remover mensajes de error
    form.querySelectorAll('.validation-error').forEach(error => {
        error.remove();
    });
}

/**
 * Valida un campo en tiempo real
 * @param {HTMLElement} input - Input a validar
 * @param {Function} validationFunction - Función de validación
 */
function setupRealtimeValidation(input, validationFunction) {
    if (!input) return;
    
    input.addEventListener('blur', () => {
        const result = validationFunction(input.value);
        
        if (!result.valid) {
            input.classList.add('input-error');
            
            // Remover error existente si hay
            const existingError = input.parentNode.querySelector('.validation-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Agregar nuevo error
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = result.message;
            input.parentNode.appendChild(errorDiv);
        }
    });
    
    input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const error = input.parentNode.querySelector('.validation-error');
        if (error) {
            error.remove();
        }
    });
}

// Hacer funciones disponibles globalmente
window.validateRequired = validateRequired;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.validateUsername = validateUsername;
window.validatePositiveNumber = validatePositiveNumber;
window.validateDate = validateDate;
window.validateInversionForm = validateInversionForm;
window.validateGastoForm = validateGastoForm;
window.validateRegisterForm = validateRegisterForm;
window.validateLoginForm = validateLoginForm;
window.displayValidationErrors = displayValidationErrors;
window.clearValidationErrors = clearValidationErrors;
window.setupRealtimeValidation = setupRealtimeValidation;