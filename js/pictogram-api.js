
class PictogramAPI {
    constructor() {
        this.baseURL = 'https://api.arasaac.org/v1';
        this.language = 'es'; // Idioma por defecto
        this.cache = new Map(); // Cache para mejorar rendimiento
        this.keywords = [];
        this.loadKeywords();
    }

    async loadKeywords() {
        try {
            const response = await fetch(`${this.baseURL}/keywords/${this.language}`);
            if (response.ok) {
                const data = await response.json();
                this.keywords = data.words || [];
                console.log(`Cargadas ${this.keywords.length} palabras clave`);
            }
        } catch (error) {
            console.warn('No se pudieron cargar las palabras clave:', error);
        }
    }

    async searchPictograms(searchText) {
        if (!searchText || searchText.trim().length < 2) {
            return [];
        }

        const text = searchText.trim().toLowerCase();
        
        if (this.cache.has(text)) {
            return this.cache.get(text);
        }

        try {
            const response = await fetch(`${this.baseURL}/pictograms/${this.language}/search/${encodeURIComponent(text)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const pictograms = await response.json();
            
            const processedPictograms = this.processPictograms(pictograms);
            
            this.cache.set(text, processedPictograms);
            
            return processedPictograms;
        } catch (error) {
            console.error('Error al buscar pictogramas:', error);
            return [];
        }
    }

    processPictograms(pictograms) {
        if (!Array.isArray(pictograms)) {
            return [];
        }

        return pictograms
            .slice(0, 8) // Limitar a 8 resultados máximo
            .map(pictogram => ({
                id: pictogram._id,
                keywords: pictogram.keywords || [],
                url: this.getPictogramURL(pictogram._id),
                description: pictogram.desc || '',
                schematic: pictogram.schematic || false,
                categories: pictogram.categories || []
            }));
    }

    getPictogramURL(id, options = {}) {
        const {
            size = 500,
            backgroundColor = 'none',
            color = true,
            skin = false,
            hair = false
        } = options;

        let url = `${this.baseURL.replace('/v1', '')}/pictograms/${id}`;
        
        const params = new URLSearchParams();
        if (backgroundColor !== 'none') params.append('backgroundColor', backgroundColor);
        if (!color) params.append('color', 'false');
        if (skin) params.append('skin', skin);
        if (hair) params.append('hair', hair);
        
        const paramString = params.toString();
        if (paramString) {
            url += `?${paramString}`;
        }

        return url;
    }

    async getBestSearch(searchText) {
        if (!searchText || searchText.trim().length < 2) {
            return [];
        }

        const text = searchText.trim().toLowerCase();

        try {
            const response = await fetch(`${this.baseURL}/pictograms/${this.language}/bestsearch/${encodeURIComponent(text)}`);
            
            if (!response.ok) {
                return await this.searchPictograms(text); // Fallback a búsqueda normal
            }

            const pictograms = await response.json();
            return this.processPictograms(pictograms);
        } catch (error) {
            console.error('Error en búsqueda optimizada:', error);
            return await this.searchPictograms(text); // Fallback
        }
    }

    async getPictogramById(id) {
        try {
            const response = await fetch(`${this.baseURL}/pictograms/${this.language}/${id}`);
            if (response.ok) {
                const pictogram = await response.json();
                return this.processPictograms([pictogram])[0];
            }
        } catch (error) {
            console.error('Error al obtener pictograma:', error);
        }
        return null;
    }

    getSuggestions(partialText) {
        if (!partialText || partialText.length < 2) {
            return [];
        }

        const text = partialText.toLowerCase();
        return this.keywords
            .filter(keyword => keyword.toLowerCase().includes(text))
            .slice(0, 5); // Máximo 5 sugerencias
    }

    setLanguage(language) {
        this.language = language;
        this.cache.clear(); // Limpiar cache al cambiar idioma
        this.loadKeywords();
    }
}


class PictogramSelector {
    constructor() {
        this.api = new PictogramAPI();
        this.currentResults = [];
        this.selectedPictograms = [];
        this.isVisible = false;
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'pictogram-selector-container';
        this.container.innerHTML = `
            <div class="pictogram-search-bar">
                <input type="text" id="pictogram-search" placeholder="Escribe una palabra para buscar pictogramas..." />
                <button class="search-btn" id="pictogram-search-btn">
                    <i class="fas fa-search"></i>
                </button>
                <button class="close-btn" id="pictogram-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="pictogram-suggestions" id="pictogram-suggestions"></div>
            
            <div class="pictogram-results" id="pictogram-results">
                <div class="results-header">
                    <h3>Resultados de búsqueda</h3>
                    <div class="results-count" id="results-count">0 pictogramas encontrados</div>
                </div>
                <div class="results-grid" id="results-grid"></div>
            </div>
            
            <div class="pictogram-loading" id="pictogram-loading">
                <div class="loading-spinner"></div>
                <p>Buscando pictogramas...</p>
            </div>
            
            <div class="selected-pictograms" id="selected-pictograms">
                <h4>Pictogramas seleccionados:</h4>
                <div class="selected-grid" id="selected-grid"></div>
                <button class="send-pictograms-btn" id="send-pictograms-btn">
                    <i class="fas fa-paper-plane"></i>
                    Enviar Pictogramas
                </button>
            </div>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            .pictogram-selector-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
                animation: selectorFadeIn 0.3s ease;
            }

            .pictogram-selector-container.active {
                display: flex;
            }

            .pictogram-selector-container > div {
                background: white;
                border-radius: 20px;
                padding: 20px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: selectorSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            @keyframes selectorFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes selectorSlideIn {
                from { 
                    opacity: 0;
                    transform: scale(0.8) translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .pictogram-search-bar {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                align-items: center;
            }

            #pictogram-search {
                flex: 1;
                padding: 15px 20px;
                border: 2px solid #FF6B9D;
                border-radius: 25px;
                font-size: 16px;
                outline: none;
                transition: all 0.3s ease;
                font-family: 'Poppins', sans-serif;
            }

            #pictogram-search:focus {
                border-color: #4ECDC4;
                box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.2);
                transform: translateY(-2px);
            }

            .search-btn, .close-btn {
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                font-size: 18px;
            }

            .search-btn {
                background: linear-gradient(135deg, #FF6B9D, #C44569);
                color: white;
            }

            .close-btn {
                background: linear-gradient(135deg, #FF8E53, #FF6B35);
                color: white;
            }

            .search-btn:hover, .close-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }

            .pictogram-suggestions {
                margin-bottom: 15px;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .pictogram-suggestions.show {
                max-height: 200px;
            }

            .suggestion-item {
                padding: 8px 15px;
                background: #f8f9fa;
                margin: 5px 0;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid transparent;
            }

            .suggestion-item:hover {
                background: #FF6B9D;
                color: white;
                transform: translateX(5px);
            }

            .pictogram-results {
                margin-bottom: 20px;
            }

            .results-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #f0f0f0;
            }

            .results-header h3 {
                color: #2C3E50;
                margin: 0;
                font-family: 'Fredoka One', cursive;
            }

            .results-count {
                color: #7F8C8D;
                font-size: 14px;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }

            .pictogram-item {
                background: white;
                border: 2px solid #f0f0f0;
                border-radius: 15px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
            }

            .pictogram-item::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255, 107, 157, 0.1), transparent);
                transform: rotate(45deg);
                transition: transform 0.5s ease;
                transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }

            .pictogram-item:hover::before {
                transform: translateX(100%) translateY(100%) rotate(45deg);
            }

            .pictogram-item:hover {
                border-color: #FF6B9D;
                transform: translateY(-5px) scale(1.05);
                box-shadow: 0 10px 25px rgba(255, 107, 157, 0.3);
            }

            .pictogram-item.selected {
                border-color: #4ECDC4;
                background: rgba(78, 205, 196, 0.1);
                transform: translateY(-3px);
            }

            .pictogram-item img {
                width: 80px;
                height: 80px;
                object-fit: contain;
                margin-bottom: 10px;
                border-radius: 10px;
            }

            .pictogram-item .title {
                font-size: 12px;
                color: #2C3E50;
                font-weight: 600;
                margin-bottom: 5px;
            }

            .pictogram-item .description {
                font-size: 10px;
                color: #7F8C8D;
                line-height: 1.2;
            }

            .pictogram-loading {
                text-align: center;
                padding: 40px;
                display: none;
            }

            .pictogram-loading.show {
                display: block;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #FF6B9D;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .selected-pictograms {
                border-top: 2px solid #f0f0f0;
                padding-top: 20px;
                display: none;
            }

            .selected-pictograms.show {
                display: block;
            }

            .selected-pictograms h4 {
                color: #2C3E50;
                margin-bottom: 15px;
                font-family: 'Fredoka One', cursive;
            }

            .selected-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 20px;
            }

            .selected-item {
                position: relative;
                background: rgba(78, 205, 196, 0.1);
                border: 2px solid #4ECDC4;
                border-radius: 15px;
                padding: 10px;
                text-align: center;
            }

            .selected-item img {
                width: 50px;
                height: 50px;
                object-fit: contain;
            }

            .selected-item .remove-btn {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                background: #FF5757;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .send-pictograms-btn {
                background: linear-gradient(135deg, #6BCF7F, #4CAF50);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0 auto;
            }

            .send-pictograms-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(107, 207, 127, 0.4);
            }

            .send-pictograms-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            @media (max-width: 768px) {
                .pictogram-selector-container > div {
                    width: 95vw;
                    height: 95vh;
                    padding: 15px;
                }

                .results-grid {
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 10px;
                }

                .pictogram-item img {
                    width: 60px;
                    height: 60px;
                }

                #pictogram-search {
                    font-size: 14px;
                    padding: 12px 15px;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(this.container);
    }

    bindEvents() {
        const searchInput = document.getElementById('pictogram-search');
        const searchBtn = document.getElementById('pictogram-search-btn');
        const closeBtn = document.getElementById('pictogram-close-btn');
        const sendBtn = document.getElementById('send-pictograms-btn');

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                this.showSuggestions(query);
                
                searchTimeout = setTimeout(() => {
                    this.searchPictograms(query);
                }, 500);
            } else {
                this.hideSuggestions();
                this.clearResults();
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query) {
                    this.searchPictograms(query);
                }
            }
        });

        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                this.searchPictograms(query);
            }
        });

        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        sendBtn.addEventListener('click', () => {
            this.sendSelectedPictograms();
        });

        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
    }

    show() {
        this.isVisible = true;
        this.container.classList.add('active');
        document.getElementById('pictogram-search').focus();
        
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.isVisible = false;
        this.container.classList.remove('active');
        this.clearSearch();
        this.clearSelected();
        
        document.body.style.overflow = '';
    }

    async searchPictograms(query) {
        this.showLoading();
        this.hideSuggestions();

        try {
            const results = await this.api.getBestSearch(query);
            this.currentResults = results;
            this.displayResults(results, query);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showError('Error al buscar pictogramas. Inténtalo de nuevo.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(results, query) {
        const resultsGrid = document.getElementById('results-grid');
        const resultsCount = document.getElementById('results-count');
        
        resultsCount.textContent = `${results.length} pictogramas encontrados para "${query}"`;
        
        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #7F8C8D;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No se encontraron pictogramas para "${query}"</p>
                    <p style="font-size: 14px;">Intenta con otra palabra o revisa la ortografía</p>
                </div>
            `;
            return;
        }

        resultsGrid.innerHTML = results.map(pictogram => `
            <div class="pictogram-item" data-id="${pictogram.id}" onclick="pictogramSelector.toggleSelection(${pictogram.id})">
                <img src="${pictogram.url}" alt="${pictogram.description}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjBGMEYwIiByeD0iMTAiLz4KPGD+IGNsYXNzPSJmYXMgZmEtaW1hZ2UiIHN0eWxlPSJmb250LXNpemU6IDJyZW07IGNvbG9yOiAjQkRDM0M3OyIvPgo8L3N2Zz4K'" />
                <div class="title">${pictogram.keywords[0] || 'Pictograma'}</div>
                <div class="description">${pictogram.description}</div>
            </div>
        `).join('');
    }

    toggleSelection(pictogramId) {
        const pictogram = this.currentResults.find(p => p.id === pictogramId);
        if (!pictogram) return;

        const existingIndex = this.selectedPictograms.findIndex(p => p.id === pictogramId);
        const pictogramElement = document.querySelector(`[data-id="${pictogramId}"]`);

        if (existingIndex >= 0) {
            this.selectedPictograms.splice(existingIndex, 1);
            pictogramElement?.classList.remove('selected');
        } else {
            if (this.selectedPictograms.length < 5) {
                this.selectedPictograms.push(pictogram);
                pictogramElement?.classList.add('selected');
            } else {
                showNotification('Máximo 5 pictogramas por mensaje', 'warning');
                return;
            }
        }

        this.updateSelectedDisplay();
        
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }

    updateSelectedDisplay() {
        const selectedContainer = document.getElementById('selected-pictograms');
        const selectedGrid = document.getElementById('selected-grid');
        const sendBtn = document.getElementById('send-pictograms-btn');

        if (this.selectedPictograms.length === 0) {
            selectedContainer.classList.remove('show');
            return;
        }

        selectedContainer.classList.add('show');
        
        selectedGrid.innerHTML = this.selectedPictograms.map(pictogram => `
            <div class="selected-item">
                <img src="${pictogram.url}" alt="${pictogram.description}" />
                <button class="remove-btn" onclick="pictogramSelector.removeSelection(${pictogram.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        sendBtn.disabled = false;
    }

    removeSelection(pictogramId) {
        this.selectedPictograms = this.selectedPictograms.filter(p => p.id !== pictogramId);
        
        const pictogramElement = document.querySelector(`[data-id="${pictogramId}"]`);
        pictogramElement?.classList.remove('selected');
        
        this.updateSelectedDisplay();
    }

    sendSelectedPictograms() {
        if (this.selectedPictograms.length === 0) {
            showNotification('Selecciona al menos un pictograma', 'warning');
            return;
        }

        const pictogramUrls = this.selectedPictograms.map(p => p.url);
        const pictogramTexts = this.selectedPictograms.map(p => p.keywords[0] || 'pictograma');
        
        this.sendPictogramMessage(pictogramUrls, pictogramTexts.join(' '));
        
        this.hide();
        
        showNotification(`${this.selectedPictograms.length} pictogramas enviados!`, 'success');
    }

    sendPictogramMessage(pictogramUrls, text) {
        const newMessage = {
            type: 'sent',
            content: text,
            time: getCurrentTime(),
            pictogramUrls: pictogramUrls // URLs de pictogramas reales
        };
        
        if (!messages[currentFriend]) {
            messages[currentFriend] = [];
        }
        messages[currentFriend].push(newMessage);
        
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = this.createPictogramMessageElement(newMessage);
        chatMessages.appendChild(messageElement);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        setTimeout(() => {
            simulateAutoReply();
        }, 1000 + Math.random() * 2000);
        
        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
        
        if (window.achievementSystem) {
            window.achievementSystem.updateProgress('pictogramMaster', pictogramUrls.length);
        }
    }

    createPictogramMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        
        const pictogramsHtml = message.pictogramUrls ? 
            `<div class="real-pictograms">
                ${message.pictogramUrls.map(url => 
                    `<img src="${url}" alt="pictograma" class="pictogram-img" />`
                ).join('')}
            </div>` : '';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${pictogramsHtml}
                <p>${message.content}</p>
                <span class="message-time">${message.time}</span>
            </div>
        `;
        
        return messageDiv;
    }

    showSuggestions(query) {
        const suggestions = this.api.getSuggestions(query);
        const suggestionsContainer = document.getElementById('pictogram-suggestions');
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        suggestionsContainer.innerHTML = suggestions.map(suggestion => 
            `<div class="suggestion-item" onclick="pictogramSelector.selectSuggestion('${suggestion}')">
                ${suggestion}
            </div>`
        ).join('');
        
        suggestionsContainer.classList.add('show');
    }

    hideSuggestions() {
        document.getElementById('pictogram-suggestions').classList.remove('show');
    }

    selectSuggestion(suggestion) {
        document.getElementById('pictogram-search').value = suggestion;
        this.hideSuggestions();
        this.searchPictograms(suggestion);
    }

    showLoading() {
        document.getElementById('pictogram-loading').classList.add('show');
    }

    hideLoading() {
        document.getElementById('pictogram-loading').classList.remove('show');
    }

    showError(message) {
        const resultsGrid = document.getElementById('results-grid');
        resultsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #FF5757;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>${message}</p>
            </div>
        `;
    }

    clearResults() {
        document.getElementById('results-grid').innerHTML = '';
        document.getElementById('results-count').textContent = '0 pictogramas encontrados';
        this.currentResults = [];
    }

    clearSearch() {
        document.getElementById('pictogram-search').value = '';
        this.clearResults();
        this.hideSuggestions();
    }

    clearSelected() {
        this.selectedPictograms = [];
        this.updateSelectedDisplay();
        
        document.querySelectorAll('.pictogram-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
    }
}

const pictogramSelector = new PictogramSelector();

window.openPictogramSelector = function() {
    pictogramSelector.show();
};

window.PictogramAPI = PictogramAPI;
window.PictogramSelector = PictogramSelector;
