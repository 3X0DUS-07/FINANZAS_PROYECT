// ====================================
// CHATBOT IA
// ====================================

function setupChatbot() {
    const chatModal = document.getElementById('chat-modal');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatSendBtn = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    
    if (!chatModal || !chatToggleBtn) return;
    
    // Abrir modal del chat
    chatToggleBtn.addEventListener('click', () => {
        chatModal.classList.add('active');
        chatInput.focus();
    });
    
    // Cerrar modal del chat
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', () => {
            chatModal.classList.remove('active');
        });
    }
    
    // Enviar mensaje
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
    }
    
    // Enviar con Enter
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Cerrar al hacer click fuera
    chatModal.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            chatModal.classList.remove('active');
        }
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Agregar mensaje del usuario
    addChatMessage(message, 'user');
    input.value = '';
    
    // Deshabilitar input mientras se procesa
    input.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error('Error en el chat');
        }
        
        const data = await response.json();
        
        if (data.error) {
            addChatMessage(`Error: ${data.error}. ${data.suggestion || ''}`, 'bot');
        } else {
            addChatMessage(data.reply, 'bot');
        }
        
    } catch (error) {
        addChatMessage('Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.', 'bot');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function addChatMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'bot' ? '🤖' : '👤';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    content.appendChild(textDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}