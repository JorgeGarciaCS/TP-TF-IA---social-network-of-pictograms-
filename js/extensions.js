
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-fast', '0s');
    document.documentElement.style.setProperty('--transition-normal', '0s');
    document.documentElement.style.setProperty('--transition-slow', '0s');
    document.documentElement.style.setProperty('--transition-bounce', '0s');
}


const themes = {
    default: {
        name: 'Arcoíris Mágico',
        colors: {
            primary: '#FF6B9D',
            secondary: '#4ECDC4',
            accent: '#FFE66D',
            success: '#6BCF7F',
            warning: '#FF8E53'
        }
    },
    ocean: {
        name: 'Océano Profundo',
        colors: {
            primary: '#0077BE',
            secondary: '#00A8CC',
            accent: '#FFD700',
            success: '#00CC88',
            warning: '#FF6B35'
        }
    },
    sunset: {
        name: 'Atardecer Dorado',
        colors: {
            primary: '#FF6B35',
            secondary: '#F7931E',
            accent: '#FFD23F',
            success: '#6BCF7F',
            warning: '#FF1744'
        }
    },
    forest: {
        name: 'Bosque Encantado',
        colors: {
            primary: '#4CAF50',
            secondary: '#8BC34A',
            accent: '#FFEB3B',
            success: '#2E7D32',
            warning: '#FF5722'
        }
    }
};

function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    Object.entries(theme.colors).forEach(([property, value]) => {
        document.documentElement.style.setProperty(`--${property}-color`, value);
    });
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(`Tema "${theme.name}" aplicado`, 'success');
    } else {
        console.log(`Tema "${theme.name}" aplicado`);
    }
    localStorage.setItem('pictoAmigosTheme', themeName);
}


class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.loadSounds();
        } catch (error) {
            console.log('Web Audio API no disponible en este navegador');
            this.audioContext = null;
        }
    }
    
    createBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playNotification() {
        this.createBeep(800, 0.1);
        setTimeout(() => this.createBeep(600, 0.1), 100);
    }
    
    playSuccess() {
        this.createBeep(523, 0.1); // C
        setTimeout(() => this.createBeep(659, 0.1), 100); // E
        setTimeout(() => this.createBeep(784, 0.2), 200); // G
    }
    
    playError() {
        this.createBeep(300, 0.2);
        setTimeout(() => this.createBeep(250, 0.3), 150);
    }
    
    playMessage() {
        this.createBeep(440, 0.1, 'triangle');
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (typeof window.showNotification === 'function') {
            window.showNotification(
                this.enabled ? 'Sonidos activados 🔊' : 'Sonidos desactivados 🔇',
                'info'
            );
        } else {
            console.log(this.enabled ? 'Sonidos activados 🔊' : 'Sonidos desactivados 🔇');
        }
        return this.enabled;
    }
}

const soundManager = new SoundManager();


class SettingsManager {
    constructor() {
        this.settings = {
            theme: 'default',
            soundEnabled: true,
            animationsEnabled: !prefersReducedMotion,
            fontSize: 'medium',
            autoReply: true,
            vibrationEnabled: true
        };
        this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('pictoAmigosSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }
    
    saveSettings() {
        localStorage.setItem('pictoAmigosSettings', JSON.stringify(this.settings));
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    applySettings() {
        applyTheme(this.settings.theme);
        
        soundManager.enabled = this.settings.soundEnabled;
        
        document.documentElement.style.setProperty(
            '--font-size-base',
            this.getFontSizeValue(this.settings.fontSize)
        );
        
        if (!this.settings.animationsEnabled) {
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-normal', '0s');
        }
    }
    
    getFontSizeValue(size) {
        const sizes = {
            small: '0.9rem',
            medium: '1rem',
            large: '1.1rem',
            xlarge: '1.2rem'
        };
        return sizes[size] || sizes.medium;
    }
}

const settingsManager = new SettingsManager();


class AchievementSystem {
    constructor() {
        this.achievements = {
            firstMessage: {
                id: 'firstMessage',
                title: '¡Primer Mensaje!',
                description: 'Enviaste tu primer mensaje',
                icon: '💬',
                unlocked: false
            },
            pictogramMaster: {
                id: 'pictogramMaster',
                title: 'Maestro de Pictogramas',
                description: 'Usaste 10 pictogramas diferentes',
                icon: '🎨',
                unlocked: false,
                progress: 0,
                target: 10
            },
            socialButterfly: {
                id: 'socialButterfly',
                title: 'Mariposa Social',
                description: 'Chateaste con 3 amigos diferentes',
                icon: '🦋',
                unlocked: false,
                progress: 0,
                target: 3
            },
            speedTyper: {
                id: 'speedTyper',
                title: 'Escritor Veloz',
                description: 'Enviaste 5 mensajes en menos de 1 minuto',
                icon: '⚡',
                unlocked: false,
                progress: 0,
                target: 5
            }
        };
        
        this.loadAchievements();
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('pictoAmigosAchievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(savedAchievements).forEach(key => {
                if (this.achievements[key]) {
                    this.achievements[key] = { ...this.achievements[key], ...savedAchievements[key] };
                }
            });
        }
    }
    
    saveAchievements() {
        localStorage.setItem('pictoAmigosAchievements', JSON.stringify(this.achievements));
    }
    
    unlock(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        this.saveAchievements();
        
        this.showAchievementNotification(achievement);
        soundManager.playSuccess();
        
        try {
            if (navigator.vibrate && document.hasFocus()) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }
        } catch (error) {
        }
    }
    
    updateProgress(achievementId, increment = 1) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;
        
        achievement.progress = (achievement.progress || 0) + increment;
        
        if (achievement.progress >= achievement.target) {
            this.unlock(achievementId);
        } else {
            this.saveAchievements();
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h3>¡Logro Desbloqueado!</h3>
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: white;
            padding: 20px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(255, 215, 0, 0.4);
            z-index: 10000;
            max-width: 400px;
            text-align: center;
            animation: achievementPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'achievementFadeOut 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

const achievementSystem = new AchievementSystem();


const originalSendMessage = window.sendMessage;
let messageCount = 0;
let lastMessageTime = Date.now();

window.sendMessage = function() {
    originalSendMessage();
    
    messageCount++;
    const currentTime = Date.now();
    
    if (messageCount === 1) {
        achievementSystem.unlock('firstMessage');
    }
    
    if (currentTime - lastMessageTime < 60000) { // Dentro de 1 minuto
        achievementSystem.updateProgress('speedTyper');
    }
    
    lastMessageTime = currentTime;
    
    soundManager.playMessage();
};

const originalAddPictogram = window.addPictogram;
const usedPictograms = new Set();

window.addPictogram = function(pictogram) {
    originalAddPictogram(pictogram);
    
    if (!usedPictograms.has(pictogram)) {
        usedPictograms.add(pictogram);
        achievementSystem.updateProgress('pictogramMaster');
    }
};

const originalSelectFriend = window.selectFriend;
const chattedFriends = new Set();

window.selectFriend = function(friendName) {
    originalSelectFriend(friendName);
    
    if (!chattedFriends.has(friendName)) {
        chattedFriends.add(friendName);
        achievementSystem.updateProgress('socialButterfly');
    }
};


document.addEventListener('DOMContentLoaded', function() {
    const achievementStyles = document.createElement('style');
    achievementStyles.textContent = `
        @keyframes achievementPop {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
            }
            50% {
                transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1) rotate(0deg);
            }
        }
        
        @keyframes achievementFadeOut {
            from {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
        }
        
        .achievement-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .achievement-icon {
            font-size: 3rem;
            animation: bounce 1s infinite;
        }
        
        .achievement-text h3 {
            margin: 0 0 5px 0;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .achievement-text h4 {
            margin: 0 0 5px 0;
            font-size: 1rem;
        }
        
        .achievement-text p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }
    `;
    document.head.appendChild(achievementStyles);
    
    setTimeout(() => {
        if (typeof window.showNotification === 'function') {
            window.showNotification('¡Bienvenido a PictoAmigos! 🌟', 'success');
        }
        soundManager.playNotification();
    }, 1000);
});


window.changeTheme = function(themeName) {
    applyTheme(themeName);
    settingsManager.updateSetting('theme', themeName);
};

window.toggleSound = function() {
    const enabled = soundManager.toggle();
    settingsManager.updateSetting('soundEnabled', enabled);
};

window.showAchievements = function() {
    const achievementsList = Object.values(achievementSystem.achievements)
        .map(achievement => {
            const status = achievement.unlocked ? '✅' : '⏳';
            const progress = achievement.target ? 
                ` (${achievement.progress || 0}/${achievement.target})` : '';
            return `${status} ${achievement.icon} ${achievement.title}${progress}`;
        }).join('\n');
    
    alert(`🏆 Tus Logros:\n\n${achievementsList}`);
};

window.PictoAmigosExtensions = {
    settingsManager,
    achievementSystem,
    soundManager,
    themes,
    changeTheme: window.changeTheme,
    toggleSound: window.toggleSound,
    showAchievements: window.showAchievements
};
