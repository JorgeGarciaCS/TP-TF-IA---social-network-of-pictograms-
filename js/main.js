let currentUser = null;
let currentFriend = 'Ana';
let messages = {
    'Ana': [
        {
            type: 'received',
            content: '¡Hola! ¿Cómo estás?',
            time: '10:30 AM',
            avatar: '🌸'
        },
        {
            type: 'sent',
            content: '¡Muy bien! ¿Y tú?',
            time: '10:32 AM'
        },
        {
            type: 'received',
            content: '¡Es mi cumpleaños!',
            time: '10:35 AM',
            avatar: '🌸',
            pictograms: '🎈🎉🎂'
        }
    ],
    'Carlos': [
        {
            type: 'received',
            content: '¿Jugamos?',
            time: '09:15 AM',
            avatar: '🚀'
        }
    ],
    'María': [
        {
            type: 'received',
            content: 'Mira este pictograma...',
            time: 'Ayer',
            avatar: '🦄',
            pictograms: '🌈✨'
        }
    ]
};

const friendsData = {
    'Ana': {
        avatar: '🌸',
        status: 'online',
        lastMessage: '¡Hola! ¿Cómo estás?'
    },
    'Carlos': {
        avatar: '🚀',
        status: 'online',
        lastMessage: '¿Jugamos?'
    },
    'María': {
        avatar: '🦄',
        status: 'offline',
        lastMessage: 'Mira este pictograma...'
    }
};

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen, .welcome-screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        setTimeout(() => {
            targetScreen.classList.add('active');
            
            if (screenId === 'mainScreen') {
                initializeMainScreen();
            }
        }, 100);
    }

    safeVibrate(50);
}

function safeVibrate(pattern) {
    try {
        if (navigator.vibrate && document.hasFocus()) {
            navigator.vibrate(pattern);
        }
    } catch (error) {
    }
}

window.showNotification = showNotification;
window.safeVibrate = safeVibrate;

function initializeMainScreen() {
    const friendsList = document.getElementById('friendsList');
    if (friendsList && friendsList.children.length === 0) {
        loadFriendsList();
    } else {
        loadFriendsList();
    }
    
    loadMessages(currentFriend);
    
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
        chatArea.style.display = 'flex';
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        age: formData.get('age')
    };

    let isValid = true;
    
    const usernameGroup = document.querySelector('#username').closest('.input-group');
    if (!userData.username || userData.username.length < 3) {
        markFieldAsError(usernameGroup, 'El nombre debe tener al menos 3 caracteres');
        isValid = false;
    } else {
        markFieldAsValid(usernameGroup);
    }
    
    const emailGroup = document.querySelector('#email').closest('.input-group');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
        markFieldAsError(emailGroup, 'Ingresa un email válido');
        isValid = false;
    } else {
        markFieldAsValid(emailGroup);
    }
    
    const passwordGroup = document.querySelector('#password').closest('.input-group');
    if (!userData.password || userData.password.length < 6) {
        markFieldAsError(passwordGroup, 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    } else {
        markFieldAsValid(passwordGroup);
    }
    
    const ageGroup = document.querySelector('#age').closest('.input-group');
    if (!userData.age) {
        markFieldAsError(ageGroup, 'Por favor selecciona tu edad');
        isValid = false;
    } else {
        markFieldAsValid(ageGroup);
    }

    if (!isValid) {
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }, 500);
        showNotification('Por favor, corrige los errores en el formulario', 'warning');
        safeVibrate([100, 50, 100]);
        return;
    }

    setTimeout(() => {
        currentUser = userData;
        
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        submitBtn.style.background = 'var(--gradient-success)';
        submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Cuenta Creada!';
        
        showNotification('¡Cuenta creada exitosamente! Bienvenido a PictoAmigos', 'success');
        
        createCelebrationEffect();
        
        setTimeout(() => {
            document.getElementById('userNameDisplay').textContent = `¡Hola, ${userData.username}!`;
            showScreen('mainScreen');
        }, 1000); // Reducido de 2000 a 1000ms
    }, 1000); // Reducido de 1500 a 1000ms
}

function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    let isValid = true;
    
    const emailGroup = document.querySelector('#loginEmail').closest('.input-group');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginData.email || !emailRegex.test(loginData.email)) {
        markFieldAsError(emailGroup, 'Ingresa un email válido');
        isValid = false;
    } else {
        markFieldAsValid(emailGroup);
    }
    
    const passwordGroup = document.querySelector('#loginPassword').closest('.input-group');
    if (!loginData.password) {
        markFieldAsError(passwordGroup, 'Ingresa tu contraseña');
        isValid = false;
    } else {
        markFieldAsValid(passwordGroup);
    }

    if (!isValid) {
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }, 500);
        showNotification('Por favor, completa todos los campos correctamente', 'warning');
        safeVibrate([100, 50, 100]);
        return;
    }

    setTimeout(() => {
        currentUser = {
            username: loginData.email.split('@')[0], // Usar la parte antes del @ como nombre
            email: loginData.email
        };

        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        submitBtn.style.background = 'var(--gradient-success)';
        submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Bienvenido!';

        showNotification('¡Bienvenido de vuelta!', 'success');
        
        setTimeout(() => {
            document.getElementById('userNameDisplay').textContent = `¡Hola, ${currentUser.username}!`;
            showScreen('mainScreen');
        }, 800); // Reducido de 1500 a 800ms
    }, 800); // Reducido de 1200 a 800ms
}

function markFieldAsValid(inputGroup) {
    inputGroup.classList.remove('error');
    inputGroup.classList.add('valid');
    
    const existingError = inputGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function markFieldAsError(inputGroup, message) {
    inputGroup.classList.remove('valid');
    inputGroup.classList.add('error');
    
    const existingError = inputGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: var(--danger-color);
        font-size: var(--font-size-xs);
        margin-top: var(--spacing-xs);
        animation: errorSlide 0.3s ease;
    `;
    
    inputGroup.appendChild(errorElement);
}

function createCelebrationEffect() {
    const colors = ['#FF6B9D', '#4ECDC4', '#FFE66D', '#6BCF7F', '#FF8E53'];
    const emojis = ['🎉', '🎊', '✨', '🌟', '🎈', '🦄', '🌈'];
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.cssText = `
                position: fixed;
                font-size: ${Math.random() * 20 + 20}px;
                left: ${Math.random() * 100}vw;
                top: -50px;
                pointer-events: none;
                z-index: 10000;
                animation: celebrationFall ${Math.random() * 2 + 3}s ease-out forwards;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.remove();
                }
            }, 5000);
        }, i * 100);
    }
}

const celebrationStyles = document.createElement('style');
celebrationStyles.textContent = `
    @keyframes celebrationFall {
        0% {
            opacity: 1;
            transform: translateY(-50px) rotate(0deg);
        }
        100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
        }
    }
    
    @keyframes errorSlide {
        0% {
            opacity: 0;
            transform: translateX(-10px);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideInRight {
        0% {
            opacity: 0;
            transform: translateX(100%);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        0% {
            opacity: 1;
            transform: translateX(0);
        }
        100% {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .error-message {
        animation: errorSlide 0.3s ease;
    }
    
    .notification {
        font-family: 'Poppins', sans-serif;
        user-select: none;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        margin-left: 10px;
        border-radius: 50%;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
    
    :root {
        --gradient-success: linear-gradient(135deg, #6BCF7F 0%, #4CAF50 100%);
    }
`;
document.head.appendChild(celebrationStyles);

function logout() {
    currentUser = null;
    showNotification('¡Hasta luego! Vuelve pronto', 'info');
    setTimeout(() => {
        showScreen('welcomeScreen');
    }, 1000);
}

function testDirectAccess() {
    currentUser = {
        username: 'Usuario Prueba',
        email: 'prueba@test.com'
    };
    
    document.getElementById('userNameDisplay').textContent = `¡Hola, ${currentUser.username}!`;
    showNotification('¡Acceso directo activado!', 'success');
    
    setTimeout(() => {
        showScreen('mainScreen');
    }, 1000);
}


function loadFriendsList() {
    const friendsList = document.getElementById('friendsList');
    if (!friendsList) {
        return;
    }

    const existingItems = friendsList.querySelectorAll('.friend-item');
    if (existingItems.length > 0) {
        existingItems.forEach(item => {
            const nameElement = item.querySelector('h4');
            if (nameElement && nameElement.textContent === currentFriend) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        return;
    }

    friendsList.innerHTML = '';

    Object.keys(friendsData).forEach((friendName, index) => {
        const friendData = friendsData[friendName];
        const isActive = friendName === currentFriend ? 'active' : '';
        
        const friendElement = document.createElement('div');
        friendElement.className = `friend-item ${isActive}`;
        friendElement.onclick = () => selectFriend(friendName);
        
        friendElement.innerHTML = `
            <div class="friend-avatar">${friendData.avatar}</div>
            <div class="friend-info">
                <h4>${friendName}</h4>
                <p>${friendData.lastMessage}</p>
            </div>
            <div class="friend-status ${friendData.status}"></div>
        `;
        
        friendsList.appendChild(friendElement);
    });
}

function selectFriend(friendName) {
    currentFriend = friendName;
    
    const friendItems = document.querySelectorAll('.friend-item');
    friendItems.forEach(item => item.classList.remove('active'));
    
    friendItems.forEach(item => {
        if (item.querySelector('h4').textContent === friendName) {
            item.classList.add('active');
        }
    });
    
    const friendData = friendsData[friendName];
    const chatFriendName = document.getElementById('chatFriendName');
    const chatFriendAvatar = document.querySelector('.chat-friend-avatar');
    const chatFriendStatus = document.querySelector('.chat-friend-status');
    
    if (chatFriendName) chatFriendName.textContent = friendName;
    if (chatFriendAvatar) chatFriendAvatar.textContent = friendData.avatar;
    if (chatFriendStatus) {
        chatFriendStatus.textContent = friendData.status === 'online' ? 'En línea' : 'Desconectado';
    }
    
    loadMessages(friendName);
    
    safeVibrate(30);
}

function loadMessages(friendName) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    const friendMessages = messages[friendName] || [];
    
    friendMessages.forEach((message, index) => {
        setTimeout(() => {
            const messageElement = createMessageElement(message);
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, index * 100);
    });
}


function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    
    let messageHTML = '';
    
    if (message.type === 'received') {
        messageHTML += `<div class="message-avatar">${message.avatar}</div>`;
    }
    
    messageHTML += `<div class="message-content">`;
    
    if (message.pictogramUrls && message.pictogramUrls.length > 0) {
        messageHTML += `<div class="real-pictograms">`;
        message.pictogramUrls.forEach(url => {
            messageHTML += `<img src="${url}" alt="pictograma" class="pictogram-img" loading="lazy" />`;
        });
        messageHTML += `</div>`;
    }
    
    if (message.pictograms) {
        messageHTML += `<div class="pictogram-message">${message.pictograms}</div>`;
    }
    
    messageHTML += `<p>${message.content}</p>`;
    messageHTML += `<span class="message-time">${message.time}</span>`;
    messageHTML += `</div>`;
    
    messageDiv.innerHTML = messageHTML;
    return messageDiv;
}

function autoSearchPictograms(text) {
    const pictogramWords = [
        'hola', 'adios', 'casa', 'comida', 'agua', 'feliz', 'triste', 
        'si', 'no', 'gracias', 'por favor', 'amor', 'familia', 'escuela',
        'jugar', 'dormir', 'comer', 'beber', 'correr', 'caminar'
    ];
    
    const words = text.toLowerCase().split(' ');
    const foundWords = words.filter(word => 
        pictogramWords.includes(word.replace(/[.,!?;]/g, ''))
    );
    
    if (foundWords.length > 0) {
        showPictogramSuggestion(foundWords[0]);
    }
}

function showPictogramSuggestion(word) {
    const lastSuggestion = localStorage.getItem('lastPictogramSuggestion');
    const now = Date.now();
    
    if (!lastSuggestion || now - parseInt(lastSuggestion) > 30000) { // 30 segundos
        const suggestion = document.createElement('div');
        suggestion.className = 'pictogram-suggestion-toast';
        suggestion.innerHTML = `
            <div class="suggestion-content">
                <i class="fas fa-lightbulb"></i>
                <span>¿Quieres agregar un pictograma para "${word}"?</span>
                <button onclick="openPictogramSelector(); this.parentElement.parentElement.remove();">
                    <i class="fas fa-images"></i>
                </button>
                <button onclick="this.parentElement.parentElement.remove();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        suggestion.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            animation: suggestionSlideIn 0.5s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(suggestion);
        
        setTimeout(() => {
            if (suggestion.parentElement) {
                suggestion.style.animation = 'suggestionSlideOut 0.3s ease forwards';
                setTimeout(() => suggestion.remove(), 300);
            }
        }, 5000);
        
        localStorage.setItem('lastPictogramSuggestion', now.toString());
    }
}

const suggestionStyles = document.createElement('style');
suggestionStyles.textContent = `
    @keyframes suggestionSlideIn {
        0% {
            opacity: 0;
            transform: translateX(100%);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes suggestionSlideOut {
        0% {
            opacity: 1;
            transform: translateX(0);
        }
        100% {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .suggestion-content {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    }
    
    .suggestion-content button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    
    .suggestion-content button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }
    
    @media (max-width: 768px) {
        .pictogram-suggestion-toast {
            bottom: 120px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
        }
    }
`;
document.head.appendChild(suggestionStyles);


function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        showNotification('Escribe un mensaje antes de enviar', 'warning');
        return;
    }
    
    const newMessage = {
        type: 'sent',
        content: messageText,
        time: getCurrentTime()
    };
    
    if (!messages[currentFriend]) {
        messages[currentFriend] = [];
    }
    messages[currentFriend].push(newMessage);
    
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = createMessageElement(newMessage);
    chatMessages.appendChild(messageElement);
    
    setTimeout(() => {
        autoSearchPictograms(messageText);
    }, 1000);
    
    messageInput.value = '';
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setTimeout(() => {
        simulateAutoReply();
    }, 1000 + Math.random() * 2000);
    
    if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
    }
}

function addPictogram(pictogram) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value += pictogram;
    messageInput.focus();
    
    if (event && event.target) {
        event.target.style.transform = 'scale(1.3) rotate(15deg)';
        setTimeout(() => {
            event.target.style.transform = '';
        }, 200);
    }
    
    if (navigator.vibrate) {
        navigator.vibrate(25);
    }
}

function simulateAutoReply() {
    const autoReplies = [
        '¡Qué divertido! 😊',
        '¡Me encanta! ✨',
        '¡Genial! 🎉',
        '¿En serio? 😮',
        '¡Ja ja ja! 😄',
        '¡Súper! 🌟',
        '¡Wow! 🤩',
        '¡Increíble! 🚀'
    ];
    
    const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
    const friendData = friendsData[currentFriend];
    
    if (friendData.status === 'online') {
        const autoMessage = {
            type: 'received',
            content: randomReply,
            time: getCurrentTime(),
            avatar: friendData.avatar
        };
        
        messages[currentFriend].push(autoMessage);
        
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = createMessageElement(autoMessage);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        showNotification(`${currentFriend} te ha enviado un mensaje`, 'info');
    }
}


function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${iconMap[type] || iconMap.info}"></i>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 350px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideInRight 0.3s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
    
    return notification;
}

function getNotificationColor(type) {
    const colors = {
        success: 'linear-gradient(135deg, #6BCF7F 0%, #4CAF50 100%)',
        error: 'linear-gradient(135deg, #FF6B6B 0%, #E74C3C 100%)',
        warning: 'linear-gradient(135deg, #FFD93D 0%, #F39C12 100%)',
        info: 'linear-gradient(135deg, #4ECDC4 0%, #17A2B8 100%)'
    };
    return colors[type] || colors.info;
}

function showNotifications() {
    showNotification('¡Tienes 3 mensajes nuevos!', 'info');
}


document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    addRealTimeValidation();
    addFormEnhancements();
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', function() {
            const chatFriendStatus = document.querySelector('.chat-friend-status');
            if (this.value.length > 0) {
                chatFriendStatus.textContent = 'Escribiendo...';
                chatFriendStatus.style.color = '#FF6B9D';
            } else {
                chatFriendStatus.textContent = friendsData[currentFriend].status === 'online' ? 'En línea' : 'Desconectado';
                chatFriendStatus.style.color = '#6BCF7F';
            }
        });
    }
    
    if (document.getElementById('mainScreen')) {
        loadMessages(currentFriend);
    }
    
    createParticleEffect();
});


function addRealTimeValidation() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const ageSelect = document.getElementById('age');

        if (usernameInput) {
            usernameInput.addEventListener('input', function() {
                const inputGroup = this.closest('.input-group');
                if (this.value.length >= 3) {
                    markFieldAsValid(inputGroup);
                } else if (this.value.length > 0) {
                    markFieldAsError(inputGroup, 'El nombre debe tener al menos 3 caracteres');
                } else {
                    inputGroup.classList.remove('valid', 'error');
                }
            });
        }

        if (emailInput) {
            emailInput.addEventListener('input', function() {
                const inputGroup = this.closest('.input-group');
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(this.value)) {
                    markFieldAsValid(inputGroup);
                } else if (this.value.length > 0) {
                    markFieldAsError(inputGroup, 'Ingresa un email válido');
                } else {
                    inputGroup.classList.remove('valid', 'error');
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const inputGroup = this.closest('.input-group');
                if (this.value.length >= 6) {
                    markFieldAsValid(inputGroup);
                } else if (this.value.length > 0) {
                    markFieldAsError(inputGroup, 'La contraseña debe tener al menos 6 caracteres');
                } else {
                    inputGroup.classList.remove('valid', 'error');
                }
            });
        }

        if (ageSelect) {
            ageSelect.addEventListener('change', function() {
                const inputGroup = this.closest('.input-group');
                if (this.value) {
                    markFieldAsValid(inputGroup);
                } else {
                    markFieldAsError(inputGroup, 'Por favor selecciona tu edad');
                }
            });
        }
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginEmailInput = document.getElementById('loginEmail');
        const loginPasswordInput = document.getElementById('loginPassword');

        if (loginEmailInput) {
            loginEmailInput.addEventListener('input', function() {
                const inputGroup = this.closest('.input-group');
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(this.value)) {
                    markFieldAsValid(inputGroup);
                } else if (this.value.length > 0) {
                    markFieldAsError(inputGroup, 'Ingresa un email válido');
                } else {
                    inputGroup.classList.remove('valid', 'error');
                }
            });
        }

        if (loginPasswordInput) {
            loginPasswordInput.addEventListener('input', function() {
                const inputGroup = this.closest('.input-group');
                if (this.value.length > 0) {
                    markFieldAsValid(inputGroup);
                } else {
                    inputGroup.classList.remove('valid', 'error');
                }
            });
        }
    }
}


function addFormEnhancements() {
    const labels = document.querySelectorAll('.input-group label');
    labels.forEach(label => {
        label.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input, select');
            if (input) {
                input.focus();
            }
        });
    });

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.input-group').style.transform = 'translateY(-2px)';
            this.closest('.input-group').style.transition = 'transform 0.3s ease';
        });

        input.addEventListener('blur', function() {
            this.closest('.input-group').style.transform = 'translateY(0)';
        });
    });

    const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    textInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (navigator.vibrate && this.value.length > 0) {
                navigator.vibrate(10);
            }
        });
    });
}


function createParticleEffect() {
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (!welcomeScreen) return;
    
    const particles = ['✨', '🌟', '💫', '⭐', '🌈', '🎈', '🎨', '🦄'];
    
    setInterval(() => {
        const particle = document.createElement('div');
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 15}px;
            left: ${Math.random() * 100}%;
            top: -50px;
            opacity: 0.7;
            pointer-events: none;
            z-index: -1;
            animation: particleFall ${Math.random() * 3 + 2}s linear forwards;
        `;
        
        welcomeScreen.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentElement) {
                particle.remove();
            }
        }, 5000);
    }, 1000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes particleFall {
        0% {
            opacity: 0;
            transform: translateY(-50px) rotate(0deg);
        }
        10% {
            opacity: 0.7;
        }
        90% {
            opacity: 0.7;
        }
        100% {
            opacity: 0;
            transform: translateY(100vh) rotate(360deg);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background 0.2s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);


function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobile()) {
    document.addEventListener('DOMContentLoaded', function() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.style.fontSize = '16px';
            });
        });
        
        let touchStartY = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', function(event) {
            touchStartY = event.changedTouches[0].screenY;
        });
        
        document.addEventListener('touchend', function(event) {
            touchEndY = event.changedTouches[0].screenY;
            handleGesture();
        });
        
        function handleGesture() {
            const swipeThreshold = 50;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (navigator.vibrate) {
                    navigator.vibrate(25);
                }
            }
        }
    });
}


let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(event) {
    konamiCode.push(event.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        activateRainbowMode();
        konamiCode = [];
    }
});

function activateRainbowMode() {
    showNotification('¡Modo Arcoíris Activado! 🌈✨', 'success');
    
    document.body.style.animation = 'rainbow 2s infinite';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            25% { filter: hue-rotate(90deg); }
            50% { filter: hue-rotate(180deg); }
            75% { filter: hue-rotate(270deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        style.remove();
    }, 10000);
}


function initApp() {
    showScreen('welcomeScreen');
    
    addRealTimeValidation();
    
    addFormEnhancements();
}

initApp();
