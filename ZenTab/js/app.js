import { Icons } from './icons.js';

class App {
    constructor() {
        this.state = {
            theme: 'light',
            accentColor: '#007aff',
            editMode: false,
            blurStrength: 16,
            language: 'it', // 'it' or 'en'
            widgets: {
                time: { enabled: true, container: 'center', order: 0, settings: { size: 6, weight: 200, style: 'default', color: '#ffffff' } },
                literature: { enabled: false, container: 'left', order: 0, height: 150 },
                weather: { enabled: true, container: 'right', order: 0, height: 200, location: '' },
                notes: { enabled: true, container: 'left', order: 1, height: 250 },
                todo: { enabled: false, container: 'left', order: 2, height: 350 },
                racing: { enabled: false, container: 'right', order: 3, height: 280 },
                ip: {
                    enabled: false,
                    container: 'right',
                    order: 1,
                    height: 150,
                    settings: { showIp: true, showCity: true, showCountry: true, showIsp: true, showCopy: true }
                },
                pomodoro: { enabled: true, container: 'right', order: 2, height: 200, settings: { duration: 25 } }
            },
            background: {
                type: 'color', // 'color', 'image', 'url'
                value: ''
            },
            customCSS: ''
        };
        this.timers = {}; // Store timer IDs

        this.init();
    }

    init() {
        this.loadState();
        this.applyTheme();
        this.applyCustomCSS();
        this.applyBackground();
        this.renderLayout();
        this.setupEventListeners();
        this.injectIcons();
    }

    loadState() {
        const saved = localStorage.getItem('newTabState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = {
                    ...this.state,
                    ...parsed,
                    editMode: false,
                    widgets: { ...this.state.widgets, ...parsed.widgets }
                };

                // Migrations
                if (!this.state.widgets.time.settings) {
                    this.state.widgets.time.settings = { size: 6, weight: 200, style: 'default', color: '#ffffff' };
                }
                if (!this.state.widgets.pomodoro.settings) {
                    this.state.widgets.pomodoro.settings = { duration: 25 };
                }
                if (!this.state.widgets.ip.settings) {
                    this.state.widgets.ip.settings = { showIp: true, showCity: true, showCountry: true, showIsp: true, showCopy: true };
                }
                if (!this.state.accentColor) {
                    this.state.accentColor = '#ffffff';
                }
                if (this.state.blurStrength === undefined) {
                    this.state.blurStrength = 16;
                }
                if (this.state.widgets.weather && this.state.widgets.weather.location === undefined) {
                    this.state.widgets.weather.location = '';
                }

            } catch (e) {
                console.error('Error loading state:', e);
            }
        }
    }

    saveState() {
        const stateToSave = { ...this.state, editMode: false };
        localStorage.setItem('newTabState', JSON.stringify(stateToSave));
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        document.documentElement.style.setProperty('--glass-blur', `${this.state.blurStrength}px`);
        document.documentElement.style.setProperty('--accent-color', this.state.accentColor);

        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = this.state.theme;

        const blurInput = document.getElementById('blur-input');
        if (blurInput) blurInput.value = this.state.blurStrength;

        const accentInput = document.getElementById('accent-color-input');
        if (accentInput) accentInput.value = this.state.accentColor;
    }

    applyCustomCSS() {
        let styleEl = document.getElementById('custom-css-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'custom-css-style';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = this.state.customCSS;
        const customCssInput = document.getElementById('custom-css');
        if (customCssInput) customCssInput.value = this.state.customCSS;
    }

    applyBackground() {
        const bgLayer = document.getElementById('background-layer');
        if (this.state.background.type === 'image' || this.state.background.type === 'url') {
            bgLayer.style.backgroundImage = `url('${this.state.background.value}')`;
        } else {
            bgLayer.style.backgroundImage = 'none';
        }
    }

    injectIcons() {
        const settingsToggle = document.getElementById('settings-toggle');
        if (settingsToggle) settingsToggle.innerHTML = Icons.settings;

        const closeSettings = document.getElementById('close-settings');
        if (closeSettings) closeSettings.innerHTML = Icons.close;
    }

    renderLayout() {
        const leftSidebar = document.getElementById('left-sidebar');
        const centerContainer = document.getElementById('center-container');
        const rightSidebar = document.getElementById('right-sidebar');

        if (leftSidebar) leftSidebar.innerHTML = '';
        if (centerContainer) centerContainer.innerHTML = '';
        if (rightSidebar) rightSidebar.innerHTML = '';

        // Render Clock (Center)
        if (this.state.widgets.time.enabled && centerContainer) {
            const clockEl = document.createElement('div');
            this.startClock(clockEl, true);
            centerContainer.appendChild(clockEl);
        }

        // Sort and Render Widgets
        const sortedKeys = Object.keys(this.state.widgets).sort((a, b) => {
            return (this.state.widgets[a].order || 0) - (this.state.widgets[b].order || 0);
        });

        sortedKeys.forEach((key) => {
            if (key === 'time') return;

            const config = this.state.widgets[key];
            if (config.enabled) {
                const widget = this.createWidgetElement(key, config);
                if (config.container === 'right' && rightSidebar) {
                    rightSidebar.appendChild(widget);
                } else if (leftSidebar) {
                    leftSidebar.appendChild(widget); // Default to left
                }
                this.initWidgetLogic(key, widget);
            }
        });

        this.setupDragAndDrop();
    }

    createWidgetElement(type, config) {
        const el = document.createElement('div');
        el.className = `widget glass-panel widget-${type}`;
        el.dataset.type = type;
        el.draggable = this.state.editMode;

        if (config.height) el.style.height = `${config.height}px`;

        let title = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === 'ip') title = 'IP Info';

        el.innerHTML = `
            <div class="widget-header">
                <span>${title}</span>
            </div>
            <div class="widget-content" id="widget-content-${type}">
                Loading...
            </div>
            <div class="resize-handle"></div>
        `;

        // Resize Logic
        const handle = el.querySelector('.resize-handle');
        handle.addEventListener('mousedown', (e) => this.initResize(e, el, type));

        return el;
    }

    initResize(e, element, type) {
        if (!this.state.editMode) return;
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
        const snapSize = 50; // Snap to 50px increments

        const doDrag = (e) => {
            let newHeight = startHeight + e.clientY - startY;
            // Snap logic
            newHeight = Math.round(newHeight / snapSize) * snapSize;

            if (newHeight > 100) { // Min height
                element.style.height = `${newHeight}px`;
            }
        };

        const stopDrag = () => {
            document.documentElement.removeEventListener('mousemove', doDrag, false);
            document.documentElement.removeEventListener('mouseup', stopDrag, false);
            this.state.widgets[type].height = parseInt(element.style.height, 10);
            this.saveState();
        };

        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    setupDragAndDrop() {
        const containers = [document.getElementById('left-sidebar'), document.getElementById('right-sidebar')];
        let draggedItem = null;

        containers.forEach(container => {
            if (!container) return;

            container.addEventListener('dragstart', (e) => {
                if (!this.state.editMode) {
                    e.preventDefault();
                    return;
                }
                draggedItem = e.target.closest('.widget');
                if (draggedItem) {
                    draggedItem.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                }
            });

            container.addEventListener('dragend', (e) => {
                if (draggedItem) {
                    draggedItem.classList.remove('dragging');
                    draggedItem = null;
                    this.saveWidgetOrder();
                }
            });

            container.addEventListener('dragover', (e) => {
                if (!this.state.editMode) return;
                e.preventDefault();
                const afterElement = this.getDragAfterElement(container, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (draggable) {
                    if (afterElement == null) {
                        container.appendChild(draggable);
                    } else {
                        container.insertBefore(draggable, afterElement);
                    }
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    saveWidgetOrder() {
        const leftContainer = document.getElementById('left-sidebar');
        const rightContainer = document.getElementById('right-sidebar');

        const updateContainer = (container, side) => {
            if (!container) return;
            const widgets = container.querySelectorAll('.widget');
            widgets.forEach((widget, index) => {
                const type = widget.dataset.type;
                if (this.state.widgets[type]) {
                    this.state.widgets[type].order = index;
                    this.state.widgets[type].container = side;
                }
            });
        };

        updateContainer(leftContainer, 'left');
        updateContainer(rightContainer, 'right');
        this.saveState();
    }

    initWidgetLogic(type, element) {
        const content = element.querySelector(`#widget-content-${type}`);

        switch (type) {
            case 'literature':
                this.startLiteratureClock(content);
                break;
            case 'weather':
                this.initWeather(content);
                break;
            case 'notes':
                this.initNotes(content);
                break;
            case 'todo':
                this.initTodo(content);
                break;
            case 'racing':
                this.initRacing(content);
                break;
            case 'ip':
                this.initIPInfo(content);
                break;
            case 'pomodoro':
                this.initPomodoro(content);
                break;
        }
    }

    startClock(element, isHero = false) {
        const settings = this.state.widgets.time.settings || { size: 6, weight: 200, style: 'default', color: '#ffffff' };

        // Apply clock color variable
        document.documentElement.style.setProperty('--clock-color', settings.color || '#ffffff');

        const update = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

            let html = '';
            let styleClass = '';
            if (settings.style === 'liquid') styleClass = 'clock-liquid';
            if (settings.style === 'neon') styleClass = 'clock-neon';

            if (settings.style === 'minimal') {
                html = `
                    <h1 style="font-size: ${settings.size}rem; font-weight: ${settings.weight}; line-height: 0.9; letter-spacing: -2px;">${timeStr}</h1>
                `;
            } else if (settings.style === 'bold') {
                html = `
                    <h1 style="font-size: ${settings.size}rem; font-weight: 800; line-height: 1;">${timeStr}</h1>
                    <p style="font-size: 1.2rem; text-transform: uppercase; letter-spacing: 4px; font-weight: 600;">${dateStr}</p>
                `;
            } else {
                // Default, Liquid, Neon
                html = `
                    <h1 class="${styleClass}" style="font-size: ${settings.size}rem; font-weight: ${settings.weight}; line-height: 1; margin-bottom: 10px; text-shadow: ${settings.style === 'default' ? '0 4px 12px rgba(0,0,0,0.1)' : ''};">${timeStr}</h1>
                    <p style="font-size: 1.5rem; opacity: 0.8; font-weight: 300;">${dateStr}</p>
                `;
            }

            element.innerHTML = html;
            element.style.color = 'var(--text-color)';
        };
        update();
        if (this.timers.clock) clearInterval(this.timers.clock);
        this.timers.clock = setInterval(update, 1000);
    }

    startLiteratureClock(element) {
        // Extensive collection of iconic F1 driver quotes
        const f1Quotes = [
            { text: "Se non vai più per un buco che esiste, non sei più un pilota di Formula 1.", author: "Ayrton Senna" },
            { text: "Essere secondo è essere il primo degli sconfitti.", author: "Ayrton Senna" },
            { text: "Ho dato tutto me stesso. Avevo un obiettivo, che era vincere, e sono arrivato al limite.", author: "Ayrton Senna" },
            { text: "La paura è eccitante per me.", author: "Ayrton Senna" },
            { text: "Una volta che hai deciso che qualcosa è assolutamente vero, hai chiuso la tua mente.", author: "Ayrton Senna" },

            { text: "Il talento ti fa vincere una gara, l'intelligenza ti fa vincere un campionato.", author: "Michael Schumacher" },
            { text: "Una volta che senti il profumo di un Gran Premio, è per sempre.", author: "Michael Schumacher" },
            { text: "Vincere non è tutto, ma la volontà di vincere lo è.", author: "Michael Schumacher" },
            { text: "Non importa quanto veloce sei, se sei nella macchina sbagliata.", author: "Michael Schumacher" },

            { text: "Devi sempre dare il 100%. La percentuale può cambiare, ma deve essere il tuo massimo.", author: "Lewis Hamilton" },
            { text: "Credo ancora nei miei sogni.", author: "Lewis Hamilton" },
            { text: "Il segreto è credere nei propri sogni; nella propria stella interiore.", author: "Lewis Hamilton" },
            { text: "Più pressione c'è, più forte divento.", author: "Lewis Hamilton" },
            { text: "Ogni freccia che ti viene scagliata diventa parte della tua armatura.", author: "Lewis Hamilton" },

            { text: "La pressione è per i pneumatici.", author: "Sebastian Vettel" },
            { text: "Non si vince guidando da soli, si vince con una squadra.", author: "Sebastian Vettel" },
            { text: "Il motorsport è nel mio DNA.", author: "Sebastian Vettel" },

            { text: "Il pensionamento è quando smetti di vivere e cominci a esistere.", author: "Fernando Alonso" },
            { text: "Quando sei dentro la macchina, non ci sono problemi. Sei concentrato solo su quello.", author: "Fernando Alonso" },
            { text: "Nella vita, come nelle corse, vince chi fa meno errori.", author: "Fernando Alonso" },
            { text: "La passione è più importante di qualsiasi cosa.", author: "Fernando Alonso" },

            { text: "Vincere è fantastico, ma il viaggio verso la vittoria è ciò che conta.", author: "Kimi Raikkonen" },
            { text: "Lasciami in pace, so cosa sto facendo!", author: "Kimi Raikkonen" },
            { text: "È bello essere qui, ma preferirei essere sul podio.", author: "Kimi Raikkonen" },

            { text: "Imparare a perdere è importante quanto imparare a vincere.", author: "Niki Lauda" },
            { text: "Per avere successo devi essere egoista, altrimenti non raggiungerai mai nulla.", author: "Niki Lauda" },
            { text: "La felicità è il peggior nemico della concentrazione.", author: "Niki Lauda" },

            { text: "Più vai veloce, meno tempo hai per aver paura.", author: "Jackie Stewart" },
            { text: "Nella vita come nelle corse non sempre vince il più veloce.", author: "Alain Prost" },

            { text: "Nelle corse capita di dover pensare più veloce di quanto si va.", author: "Juan Manuel Fangio" },
            { text: "Devi sempre affrontare le curve al limite. È lì che trovi chi sei.", author: "Gilles Villeneuve" },

            { text: "La differenza tra una buona stagione e una grande stagione sono i dettagli.", author: "Max Verstappen" },
            { text: "Quando sei giovane, corri rischi. Ed è quello che rende tutto emozionante.", author: "Max Verstappen" },
            { text: "Semplicemente adorabile!", author: "Max Verstappen" },

            { text: "Non si è mai veramente pronti, ma si impara facendolo.", author: "Charles Leclerc" },
            { text: "La pressione fa parte del gioco, devi solo imparare a gestirla.", author: "Charles Leclerc" },

            { text: "La velocità è una droga e io ne sono dipendente.", author: "Enzo Ferrari" },
            { text: "L'auto più bella è quella che non è ancora stata costruita.", author: "Enzo Ferrari" },

            { text: "Il vero pilota non guida la macchina, la sente.", author: "Stirling Moss" },
            { text: "Correre è nella mia natura. È ciò che sono.", author: "Ayrton Senna" },

            { text: "Non posso controllare quello che dicono gli altri, posso solo concentrarmi su me stesso.", author: "Lando Norris" },
            { text: "Devi goderti il momento. Non sai mai quando potrebbe finire.", author: "Lando Norris" },
            { text: "Il lavoro di squadra fa funzionare il sogno.", author: "Lando Norris" }
        ];

        const f1QuotesEn = [
            { text: "If you no longer go for a gap that exists, you are no longer a racing driver.", author: "Ayrton Senna" },
            { text: "Being second is to be the first of the ones who lose.", author: "Ayrton Senna" },
            { text: "I gave it everything I had. I had a goal, which was to win, and I reached the limit.", author: "Ayrton Senna" },
            { text: "Fear is exciting for me.", author: "Ayrton Senna" },
            { text: "Once you commit to something, you've closed your mind.", author: "Ayrton Senna" },

            { text: "Talent wins races, intelligence wins championships.", author: "Michael Schumacher" },
            { text: "Once you've smelled a Grand Prix, it's forever.", author: "Michael Schumacher" },
            { text: "Winning is not everything, but the will to win is.", author: "Michael Schumacher" },
            { text: "It doesn't matter how fast you are if you're in the wrong car.", author: "Michael Schumacher" },

            { text: "You always have to give 100%. The percentage may change, but it must be your maximum.", author: "Lewis Hamilton" },
            { text: "I still believe in my dreams.", author: "Lewis Hamilton" },
            { text: "The secret is to believe in your dreams; in your inner star.", author: "Lewis Hamilton" },
            { text: "The more pressure there is, the stronger I become.", author: "Lewis Hamilton" },
            { text: "Every arrow shot at you becomes part of your armor.", author: "Lewis Hamilton" },

            { text: "Pressure is for tires.", author: "Sebastian Vettel" },
            { text: "You don't win by driving alone, you win with a team.", author: "Sebastian Vettel" },
            { text: "Motorsport is in my DNA.", author: "Sebastian Vettel" },

            { text: "Retirement is when you stop living and start existing.", author: "Fernando Alonso" },
            { text: "When you're inside the car, there are no problems. You're just focused on that.", author: "Fernando Alonso" },
            { text: "In life, as in racing, whoever makes fewer mistakes wins.", author: "Fernando Alonso" },
            { text: "Passion is more important than anything.", author: "Fernando Alonso" },

            { text: "Winning is great, but the journey to victory is what truly matters.", author: "Kimi Raikkonen" },
            { text: "Leave me alone, I know what I'm doing!", author: "Kimi Raikkonen" },
            { text: "It's nice to be here, but I'd rather be on the podium.", author: "Kimi Raikkonen" },

            { text: "Learning to lose is as important as learning to win.", author: "Niki Lauda" },
            { text: "To be successful you have to be selfish, or else you never achieve.", author: "Niki Lauda" },
            { text: "Happiness is the enemy of concentration.", author: "Niki Lauda" },

            { text: "The faster you go, the less time you have to be afraid.", author: "Jackie Stewart" },
            { text: "In life as in racing, the fastest doesn't always win.", author: "Alain Prost" },

            { text: "In racing, you sometimes have to think faster than you're going.", author: "Juan Manuel Fangio" },
            { text: "You must always take corners at the limit. That's where you find who you really are.", author: "Gilles Villeneuve" },

            { text: "The difference between a good season and a great season is in the details.", author: "Max Verstappen" },
            { text: "When you're young, you take risks. And that's what makes it all exciting.", author: "Max Verstappen" },
            { text: "Simply lovely!", author: "Max Verstappen" },

            { text: "You're never really ready, but you learn by doing.", author: "Charles Leclerc" },
            { text: "Pressure is part of the game, you just have to learn to manage it.", author: "Charles Leclerc" },

            { text: "Speed is a drug and I'm addicted.", author: "Enzo Ferrari" },
            { text: "The most beautiful car is the one that hasn't been built yet.", author: "Enzo Ferrari" },

            { text: "The real driver doesn't drive the car, he feels it.", author: "Stirling Moss" },
            { text: "Racing is in my nature. It's what I am.", author: "Ayrton Senna" },

            { text: "I can't control what others say, I can only focus on myself.", author: "Lando Norris" },
            { text: "You have to enjoy the moment. You never know when it could end.", author: "Lando Norris" },
            { text: "Teamwork makes the dream work.", author: "Lando Norris" }
        ];

        // Pick a random quote based on language
        const quotes = this.state.language === 'en' ? f1QuotesEn : f1Quotes;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        element.innerHTML = `
            <div style="text-align: center; padding: 10px;">
                <p style="font-family: serif; font-size: 1.1rem; font-style: italic; line-height: 1.4;">"${randomQuote.text}"</p>
                <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.8;">— ${randomQuote.author}</p>
            </div>
        `;
    }

    async initWeather(element) {
        element.innerHTML = 'Loading...';
        try {
            const getPosition = () => new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject)
            );

            let lat = 41.9028; // Rome default
            let lon = 12.4964;
            let locationName = 'Roma'; // Default

            // Check for manual location
            const manualLoc = this.state.widgets.weather.location;
            if (manualLoc) {
                try {
                    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLoc)}&count=1&language=it&format=json`);
                    const geoData = await geoRes.json();
                    if (geoData.results && geoData.results.length > 0) {
                        lat = geoData.results[0].latitude;
                        lon = geoData.results[0].longitude;
                        locationName = geoData.results[0].name;
                    }
                } catch (e) {
                    console.error('Geocoding error', e);
                }
            } else {
                try {
                    const pos = await getPosition();
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                    locationName = 'Posizione Attuale';
                } catch (e) {
                    console.log('Geo access denied, using default');
                }
            }

            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,pressure_msl&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await res.json();

            if (!data.current_weather) throw new Error('Invalid data');
            const w = data.current_weather;
            const daily = data.daily || {};
            const hourly = data.hourly || {};

            // Get current hour index for humidity/pressure
            const now = new Date();
            const hourIndex = now.getHours();
            const humidity = hourly.relativehumidity_2m ? hourly.relativehumidity_2m[hourIndex] : '--';
            const maxTemp = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : '--';
            const minTemp = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : '--';

            // Update Header with Location
            const header = element.parentElement.querySelector('.widget-header span');
            if (header) header.textContent = locationName;

            // Data-Rich Layout
            element.innerHTML = `
                <div class="weather-data-grid">
                    <div class="weather-item">
                        <div class="weather-label">Temp</div>
                        <div class="weather-value">${Math.round(w.temperature)}°C</div>
                    </div>
                    <div class="weather-item">
                        <div class="weather-label">Vento</div>
                        <div class="weather-value">${w.windspeed} km/h</div>
                    </div>
                    <div class="weather-item">
                        <div class="weather-label">Umidità</div>
                        <div class="weather-value">${humidity}%</div>
                    </div>
                    <div class="weather-item">
                        <div class="weather-label">Min / Max</div>
                        <div class="weather-value">${minTemp}° / ${maxTemp}°</div>
                    </div>
                </div>
            `;
        } catch (err) {
            element.innerHTML = 'Weather unavailable';
        }
    }

    initNotes(element) {
        const savedNotes = localStorage.getItem('newTabNotes') || '';
        element.innerHTML = `
            <textarea id="notes-area" 
                style="width:100%; height:100%; background:transparent; border:none; resize:none; color:inherit; font-family: inherit; outline: none; padding: 10px;"
                placeholder="Type your notes here..."></textarea>
            <div class="notes-toolbar">
                <button class="note-btn" data-action="clear">Clear</button>
                <button class="note-btn" data-action="copy">Copy</button>
            </div>
        `;

        const textarea = element.querySelector('#notes-area');
        textarea.value = savedNotes;
        textarea.addEventListener('input', (e) => {
            localStorage.setItem('newTabNotes', e.target.value);
        });

        element.querySelector('[data-action="clear"]').onclick = (e) => {
            textarea.value = '';
            localStorage.setItem('newTabNotes', '');

            // Visual feedback
            textarea.style.transition = 'opacity 0.2s ease';
            textarea.style.opacity = '0.3';
            setTimeout(() => {
                textarea.style.opacity = '1';
            }, 200);

            // Button feedback
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = 'Cleared! ✓';
            btn.style.background = 'rgba(52, 199, 89, 0.2)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1500);
        };

        element.querySelector('[data-action="copy"]').onclick = (e) => {
            textarea.select();
            document.execCommand('copy');

            // Button feedback
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied! ✓';
            btn.style.background = 'rgba(0, 122, 255, 0.2)';
            btn.style.transform = 'scale(1.05)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.transform = '';
            }, 1500);
        };
    }

    initTodo(element) {
        const savedTodos = JSON.parse(localStorage.getItem('newTabTodos') || '[]');

        const render = () => {
            let html = `
        <div class="todo-add-container">
            <div class="todo-add-form">
                <button id="todo-add-btn">+</button>
                <input id="todo-input" placeholder="New task...">
            </div>
        </div>

        <div id="todo-list">
        `;

            if (savedTodos.length === 0) {
                html += `<div class="todo-empty">No tasks</div>`;
            } else {
                savedTodos.forEach((todo, index) => {
                    html += `
                <div class="todo-item" data-index="${index}">
                    <div class="circle-check ${todo.completed ? 'checked' : ''}" data-index="${index}"></div>
                    <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                </div>
                `;
                });
            }

            html += `</div>`;
            element.innerHTML = html;

            // Add todo
            const input = element.querySelector("#todo-input");
            const addBtn = element.querySelector("#todo-add-btn");

            const addTodo = () => {
                const text = input.value.trim();
                if (!text) return;

                savedTodos.push({ text, completed: false });
                localStorage.setItem("newTabTodos", JSON.stringify(savedTodos));
                input.value = "";

                addBtn.style.transform = "scale(0.85)";
                setTimeout(() => {
                    addBtn.style.transform = "scale(1)";
                    render();
                }, 180);
            };

            addBtn.onclick = addTodo;
            input.onkeypress = e => { if (e.key === "Enter") addTodo(); };

            // Remove on check
            element.querySelectorAll(".circle-check").forEach((circle, index) => {
                circle.onclick = () => {
                    const item = circle.closest(".todo-item");
                    item.style.opacity = "0";
                    item.style.transform = "translateX(-10px)";

                    setTimeout(() => {
                        savedTodos.splice(index, 1);
                        localStorage.setItem("newTabTodos", JSON.stringify(savedTodos));
                        render();
                    }, 170);
                };
            });
        };

        render();
    }

    initRacing(element) {
        const savedChampionship = localStorage.getItem('racingChampionship') || 'F1';

        // API Jolpica (sempre aggiornata e free)
        const endpoint = 'https://api.jolpi.ca/ergast/f1/current.json';

        // Mappa per tradurre i nomi tecnici dell'API in etichette leggibili
        const sessionNames = {
            FirstPractice: 'FP1',
            SecondPractice: 'FP2',
            ThirdPractice: 'FP3',
            Qualifying: 'Qualifiche',
            Sprint: 'Sprint',
            SprintQualifying: 'Sprint Shootout', // Qualifica per la sprint (nuovo formato)
            Race: 'Gara'
        };

        // Durate stimate in ore per capire quando nascondere la sessione
        const durations = {
            FirstPractice: 1.5,
            SecondPractice: 1.5,
            ThirdPractice: 1.5,
            Qualifying: 1.5,
            Sprint: 1,
            SprintQualifying: 1,
            Race: 2.5
        };

        const render = async () => {
            let nextSession = null;

            try {
                const res = await fetch(endpoint);
                if (!res.ok) throw new Error('Network error');
                const data = await res.json();
                const races = data.MRData.RaceTable.Races;

                const now = new Date();
                const allSessions = [];

                // 1. "Sbobiniamo" tutte le sessioni di tutte le gare
                races.forEach(race => {
                    // Elenco delle chiavi possibili nell'oggetto gara
                    const keys = ['FirstPractice', 'SecondPractice', 'ThirdPractice', 'Qualifying', 'Sprint', 'SprintQualifying'];

                    // Aggiungiamo le sessioni "minori"
                    keys.forEach(key => {
                        if (race[key]) {
                            allSessions.push({
                                type: key,
                                label: sessionNames[key] || key,
                                date: race[key].date,
                                time: race[key].time, // Nota: alcuni endpoint vecchi non hanno time per le FP, Jolpica di solito sì
                                raceName: race.raceName,
                                circuit: race.Circuit.circuitName
                            });
                        }
                    });

                    // Aggiungiamo la Gara principale (che è nella root dell'oggetto)
                    allSessions.push({
                        type: 'Race',
                        label: 'Gara',
                        date: race.date,
                        time: race.time,
                        raceName: race.raceName,
                        circuit: race.Circuit.circuitName
                    });
                });

                // 2. Troviamo la prima sessione che non è ancora finita
                // Ordiniamo per data (sicurezza)
                allSessions.sort((a, b) => {
                    const da = new Date(`${a.date}T${a.time || '00:00:00Z'}`);
                    const db = new Date(`${b.date}T${b.time || '00:00:00Z'}`);
                    return da - db;
                });

                nextSession = allSessions.find(s => {
                    const timeStr = s.time || '14:00:00Z'; // Fallback se manca orario
                    const start = new Date(`${s.date}T${timeStr}`);
                    // Calcola fine presunta (Start + Durata)
                    const end = new Date(start.getTime() + (durations[s.type] * 60 * 60 * 1000));

                    // Se ADESSO è prima della FINE, allora questa è la sessione corrente/prossima
                    return now < end;
                });

            } catch (e) {
                console.error('Err:', e);
            }

            if (!nextSession) {
                // Caso fine stagione
                element.innerHTML = `<div style="padding:10px; font-size:0.9rem; opacity:0.7;">Stagione Terminata</div>`;
                return;
            }

            // --- CALCOLI DISPLAY ---
            const startRaw = new Date(`${nextSession.date}T${nextSession.time || '00:00:00Z'}`);
            const now = new Date();
            const diffMs = startRaw - now;

            // Formattazione
            const dateStr = startRaw.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
            const timeStr = startRaw.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

            // Logica Countdown / LIVE
            let statusBadge = '';
            let isLive = false;

            if (diffMs < 0) {
                // Se la differenza è negativa ma siamo qui, vuol dire che siamo nel "buffer" della durata -> LIVE
                isLive = true;
                statusBadge = 'IN CORSO';
            } else {
                // Futuro
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                if (days > 0) statusBadge = `-${days}gg`;
                else if (hours > 0) statusBadge = `-${hours}h`;
                else statusBadge = 'IMMINENTE';
            }

            // Colori per distinguere le sessioni
            const isRace = nextSession.type === 'Race';
            const isQuali = nextSession.type.includes('Qualifying');

            // --- RENDER HTML ---
            element.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                height: 100%; 
                padding: 10px 4px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                color: inherit;
                box-sizing: border-box;
            ">
                
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size: 0.7rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px;">Next Session</span>
                        
                        <span style="
                            font-size: 0.65rem; 
                            font-weight: 700; 
                            padding: 2px 6px; 
                            border-radius: 4px;
                            background: rgba(255,255,255,0.1);
                            ${isLive ? 'background: #E10600; color: #fff; animation: pulse 1.5s infinite;' : ''}
                        ">
                            ${statusBadge}
                        </span>
                    </div>
                    <div style="font-size: 0.7rem; font-weight: 800; opacity: 0.3;">F1</div>
                </div>

                <div style="
                    font-size: 1.3rem; 
                    font-weight: 700; 
                    line-height: 1.1; 
                    margin-bottom: 2px;
                    color: ${isRace ? '#fff' : (isQuali ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)')};
                ">
                    ${nextSession.label}
                </div>
                
                <div style="font-size: 0.85rem; font-weight:500; opacity: 0.8; margin-bottom: 6px;">
                    ${nextSession.raceName}
                </div>

                <div style="
                    display: flex; 
                    justify-content: space-between;
                    align-items: flex-end;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding-top: 8px;
                ">
                    <div style="display:flex; flex-direction:column; gap:0px;">
                        <span style="font-size: 0.75rem; opacity:0.6;">Inizio</span>
                        <div style="font-size: 0.95rem; font-weight: 600;">
                            ${timeStr} <span style="font-size:0.75rem; opacity:0.5; font-weight:400;">${dateStr}</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.65rem; opacity: 0.4; max-width: 40%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${nextSession.circuit}
                    </div>
                </div>

                <style>
                    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                </style>
            </div>
        `;
        };

        render();
    }


    async initIPInfo(element) {
        element.innerHTML = 'Fetching IP...';
        const settings = this.state.widgets.ip.settings || { showIp: true, showCity: true, showCountry: true, showIsp: true, showCopy: true };

        const renderIP = (data) => {
            let html = '<div class="ip-info-grid">';

            if (settings.showIp) {
                html += `
                    <div class="ip-row">
                        <span class="ip-label">IP</span>
                        <span class="ip-value">${data.ip}</span>
                    </div>`;
            }
            if (settings.showCity) {
                html += `
                    <div class="ip-row">
                        <span class="ip-label">Città</span>
                        <span class="ip-value">${data.city}</span>
                    </div>`;
            }
            if (settings.showCountry) {
                html += `
                    <div class="ip-row">
                        <span class="ip-label">Paese</span>
                        <span class="ip-value">${data.country_code || data.country}</span>
                    </div>`;
            }
            if (settings.showIsp) {
                html += `
                    <div class="ip-row">
                        <span class="ip-label">ISP</span>
                        <span class="ip-value">${data.org || data.connection?.isp || 'N/A'}</span>
                    </div>`;
            }
            if (settings.showCopy) {
                html += `<button class="copy-ip-btn" data-ip="${data.ip}">Copia IP</button>`;
            }

            html += '</div>';
            element.innerHTML = html;

            if (settings.showCopy) {
                const btn = element.querySelector('.copy-ip-btn');
                if (btn) {
                    btn.onclick = (e) => {
                        const ip = e.target.dataset.ip;
                        navigator.clipboard.writeText(ip).then(() => {
                            e.target.textContent = 'Copiato!';
                            setTimeout(() => e.target.textContent = 'Copia IP', 2000);
                        });
                    };
                }
            }
        };

        try {
            // Switch to ipwho.is as primary (CORS friendly, no key, good free tier)
            const res = await fetch('https://ipwho.is/');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();

            if (!data.success) throw new Error(data.message);

            renderIP({
                ip: data.ip,
                city: data.city,
                country_code: data.country_code,
                org: data.connection.isp
            });

        } catch (e) {
            console.warn('Primary IP fetch failed:', e);
            element.innerHTML = '<div style="text-align:center; opacity:0.7;">IP Unavailable<br><small style="font-size:0.7em">Check connection</small></div>';
        }
    }

    initPomodoro(element) {
        const duration = this.state.widgets.pomodoro.settings?.duration || 25;
        let timeLeft = duration * 60;
        let isRunning = false;

        if (this.timers.pomodoro) clearInterval(this.timers.pomodoro);

        const render = () => {
            const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const s = (timeLeft % 60).toString().padStart(2, '0');
            const totalTime = duration * 60;
            const progress = ((totalTime - timeLeft) / totalTime) * 283;

            // SVG Icons
            const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
            const resetIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;

            element.innerHTML = `
                <div class="pomodoro-container">
                    <svg class="pomodoro-svg" viewBox="0 0 100 100">
                        <circle class="pomodoro-circle-bg" cx="50" cy="50" r="45"></circle>
                        <circle class="pomodoro-circle-progress" cx="50" cy="50" r="45" style="stroke-dashoffset: ${283 - progress}"></circle>
                    </svg>
                    <div class="pomodoro-text">
                        <div class="pomodoro-time">${m}:${s}</div>
                    </div>
                </div>
                <div class="pomodoro-controls">
                    <button id="pomo-toggle" class="pomodoro-btn" title="${isRunning ? 'Pause' : 'Start'}">
                        ${isRunning ? pauseIcon : playIcon}
                    </button>
                    <button id="pomo-reset" class="pomodoro-btn" title="Reset">
                        ${resetIcon}
                    </button>
                </div>
            `;

            element.querySelector('#pomo-toggle').onclick = () => {
                if (isRunning) {
                    clearInterval(this.timers.pomodoro);
                    isRunning = false;
                } else {
                    this.timers.pomodoro = setInterval(() => {
                        if (timeLeft > 0) {
                            timeLeft--;
                            render();
                        } else {
                            clearInterval(this.timers.pomodoro);
                            isRunning = false;
                            if (Notification.permission === "granted") {
                                new Notification("Pomodoro Finished!");
                            }
                            render();
                        }
                    }, 1000);
                    isRunning = true;
                }
                render();
            };

            element.querySelector('#pomo-reset').onclick = () => {
                clearInterval(this.timers.pomodoro);
                isRunning = false;
                timeLeft = duration * 60;
                render();
            };
        };

        render();
    }

    setupEventListeners() {
        const settingsBtn = document.getElementById('settings-toggle');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.renderSettingsToggles();
                // Sync static inputs with state
                const editSwitch = document.getElementById('edit-mode-switch');
                if (editSwitch) editSwitch.checked = this.state.editMode;

                const styleSelect = document.getElementById('clock-style-select');
                if (styleSelect) {
                    styleSelect.value = this.state.widgets.time.settings?.style || 'default';
                    // Show color picker if neon
                    const colorContainer = document.getElementById('clock-color-container');
                    if (colorContainer) {
                        colorContainer.style.display = styleSelect.value === 'neon' ? 'block' : 'none';
                    }
                }

                const sizeInput = document.getElementById('clock-size-input');
                if (sizeInput) sizeInput.value = this.state.widgets.time.settings?.size || 6;

                const weightInput = document.getElementById('clock-weight-input');
                if (weightInput) weightInput.value = this.state.widgets.time.settings?.weight || 200;

                const pomoInput = document.getElementById('pomodoro-duration');
                if (pomoInput) pomoInput.value = this.state.widgets.pomodoro.settings?.duration || 25;

                const blurInput = document.getElementById('blur-input');
                if (blurInput) blurInput.value = this.state.blurStrength || 16;

                const weatherLoc = document.getElementById('weather-location');
                if (weatherLoc) weatherLoc.value = this.state.widgets.weather.location || '';

                const colorInput = document.getElementById('clock-color-input');
                if (colorInput) colorInput.value = this.state.widgets.time.settings?.color || '#ffffff';

                const accentInput = document.getElementById('accent-color-input');
                if (accentInput) accentInput.value = this.state.accentColor || '#007aff';

                const languageSelect = document.getElementById('language-select');
                if (languageSelect) languageSelect.value = this.state.language || 'it';

                // IP Settings Sync - Add null checks
                const ipSettings = this.state.widgets.ip.settings;
                if (ipSettings) {
                    const elIp = document.getElementById('ip-show-ip');
                    if (elIp) elIp.checked = ipSettings.showIp;

                    const elCity = document.getElementById('ip-show-city');
                    if (elCity) elCity.checked = ipSettings.showCity;

                    const elCountry = document.getElementById('ip-show-country');
                    if (elCountry) elCountry.checked = ipSettings.showCountry;

                    const elIsp = document.getElementById('ip-show-isp');
                    if (elIsp) elIsp.checked = ipSettings.showIsp;

                    const elCopy = document.getElementById('ip-show-copy');
                    if (elCopy) elCopy.checked = ipSettings.showCopy;
                }

                settingsModal.classList.remove('hidden');
            });
        }

        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                settingsModal.classList.add('hidden');
            });
        }

        // Edit Mode Toggle
        const editSwitch = document.getElementById('edit-mode-switch');
        if (editSwitch) {
            editSwitch.addEventListener('change', (e) => {
                this.state.editMode = e.target.checked;
                if (this.state.editMode) {
                    document.body.classList.add('edit-mode');
                } else {
                    document.body.classList.remove('edit-mode');
                }
                this.renderLayout();
            });
        }

        // Accent Color
        const accentInput = document.getElementById('accent-color-input');
        if (accentInput) {
            accentInput.addEventListener('input', (e) => {
                this.state.accentColor = e.target.value;
                this.applyTheme();
                this.saveState();
            });
        }

        // Language Selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.state.language = e.target.value;
                this.saveState();
                this.renderLayout(); // Reload to apply new language
            });
        }

        // IP Settings Listeners
        const updateIPSettings = () => {
            const elIp = document.getElementById('ip-show-ip');
            const elCity = document.getElementById('ip-show-city');
            const elCountry = document.getElementById('ip-show-country');
            const elIsp = document.getElementById('ip-show-isp');
            const elCopy = document.getElementById('ip-show-copy');

            this.state.widgets.ip.settings = {
                showIp: elIp ? elIp.checked : true,
                showCity: elCity ? elCity.checked : true,
                showCountry: elCountry ? elCountry.checked : true,
                showIsp: elIsp ? elIsp.checked : true,
                showCopy: elCopy ? elCopy.checked : true
            };
            this.saveState();
            this.renderLayout();
        };

        ['ip-show-ip', 'ip-show-city', 'ip-show-country', 'ip-show-isp', 'ip-show-copy'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', updateIPSettings);
        });

        // Clock Settings
        const styleSelect = document.getElementById('clock-style-select');
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                this.state.widgets.time.settings = { ...this.state.widgets.time.settings, style: e.target.value };

                // Toggle color picker visibility
                const colorContainer = document.getElementById('clock-color-container');
                if (colorContainer) {
                    colorContainer.style.display = e.target.value === 'neon' ? 'block' : 'none';
                }

                this.saveState();
                this.renderLayout();
            });
        }

        const colorInput = document.getElementById('clock-color-input');
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                this.state.widgets.time.settings = { ...this.state.widgets.time.settings, color: e.target.value };
                this.saveState();
                this.renderLayout();
            });
        }

        const sizeInput = document.getElementById('clock-size-input');
        if (sizeInput) {
            sizeInput.addEventListener('input', (e) => {
                this.state.widgets.time.settings = { ...this.state.widgets.time.settings, size: e.target.value };
                this.saveState();
                this.renderLayout();
            });
        }

        const weightInput = document.getElementById('clock-weight-input');
        if (weightInput) {
            weightInput.addEventListener('input', (e) => {
                this.state.widgets.time.settings = { ...this.state.widgets.time.settings, weight: e.target.value };
                this.saveState();
                this.renderLayout();
            });
        }

        // Pomodoro Settings
        const pomoInput = document.getElementById('pomodoro-duration');
        if (pomoInput) {
            pomoInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value);
                if (val < 1) val = 1;
                if (val > 60) val = 60;
                this.state.widgets.pomodoro.settings = { ...this.state.widgets.pomodoro.settings, duration: val };
                this.saveState();
                this.renderLayout();
            });
        }

        // Blur Settings
        const blurInput = document.getElementById('blur-input');
        if (blurInput) {
            blurInput.addEventListener('input', (e) => {
                this.state.blurStrength = e.target.value;
                this.applyTheme();
                this.saveState();
            });
        }

        // Weather Location
        const weatherLoc = document.getElementById('weather-location');
        if (weatherLoc) {
            weatherLoc.addEventListener('change', (e) => {
                this.state.widgets.weather.location = e.target.value;
                this.saveState();
                this.renderLayout(); // Re-fetch weather
            });
        }

        // Reset Button
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Sei sicuro di voler resettare tutto alle impostazioni di default?')) {
                    localStorage.removeItem('newTabState');
                    localStorage.removeItem('newTabNotes');
                    location.reload();
                }
            });
        }

        // Theme Change
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.state.theme = e.target.value;
                this.applyTheme();
                this.saveState();
            });
        }

        // Custom CSS
        const customCss = document.getElementById('custom-css');
        if (customCss) {
            customCss.addEventListener('input', (e) => {
                this.state.customCSS = e.target.value;
                this.applyCustomCSS();
                this.saveState();
            });
        }

        // Background Upload
        const bgUpload = document.getElementById('bg-upload');
        if (bgUpload) {
            bgUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.state.background = { type: 'image', value: event.target.result };
                        this.applyBackground();
                        this.saveState();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Background URL
        const bgUrl = document.getElementById('bg-url');
        if (bgUrl) {
            bgUrl.addEventListener('change', (e) => {
                this.state.background = { type: 'url', value: e.target.value };
                this.applyBackground();
                this.saveState();
            });
        }

        // Remove Background Button
        const removeBgBtn = document.getElementById('remove-bg-btn');
        if (removeBgBtn) {
            removeBgBtn.addEventListener('click', () => {
                this.state.background = { type: 'none', value: '' };
                this.applyBackground();
                this.saveState();

                // Clear inputs
                if (bgUpload) bgUpload.value = '';
                if (bgUrl) bgUrl.value = '';

                // Visual feedback
                removeBgBtn.textContent = 'Sfondo Rimosso ✓';
                setTimeout(() => {
                    removeBgBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Rimuovi Sfondo
                    `;
                }, 1500);
            });
        }
    }

    renderSettingsToggles() {
        const container = document.getElementById('widget-toggles');
        if (!container) return;

        container.innerHTML = '';

        // Widget Toggles Only
        Object.entries(this.state.widgets).forEach(([key, config]) => {
            if (key === 'time') return;
            const div = document.createElement('div');
            div.className = 'setting-row';

            const label = key.charAt(0).toUpperCase() + key.slice(1);

            div.innerHTML = `
                <label for="toggle-${key}">${label}</label>
                <input type="checkbox" id="toggle-${key}" ${config.enabled ? 'checked' : ''} class="checkbox-modern">
            `;

            div.querySelector('input').addEventListener('change', (e) => {
                this.state.widgets[key].enabled = e.target.checked;
                this.saveState();
                this.renderLayout();
            });

            container.appendChild(div);
        });
    }

    // New Settings UI Handlers
    setupModernSettings() {
        // Tab Switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                tabContents.forEach(content => {
                    if (content.dataset.content === targetTab) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });

        // Theme Selector Visual
        const themeOptions = document.querySelectorAll('.theme-option');
        const themeSelect = document.getElementById('theme-select');

        themeOptions.forEach(option => {
            // Set initial active state
            if (option.dataset.theme === this.state.theme) {
                option.classList.add('active');
            }

            option.addEventListener('click', () => {
                const theme = option.dataset.theme;

                // Update visual selection
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Update hidden select
                themeSelect.value = theme;

                // Apply theme
                this.state.theme = theme;
                this.applyTheme();
                this.saveState();
            });
        });

        // Slider Value Updates
        const sliders = [
            { id: 'blur-input', valueId: 'blur-value', suffix: 'px' },
            { id: 'clock-size-input', valueId: 'clock-size-value', suffix: 'rem' },
            { id: 'clock-weight-input', valueId: 'clock-weight-value', suffix: '' }
        ];

        sliders.forEach(({ id, valueId, suffix }) => {
            const slider = document.getElementById(id);
            const valueSpan = document.getElementById(valueId);

            if (slider && valueSpan) {
                // Set initial value
                valueSpan.textContent = slider.value + suffix;

                // Update on change
                slider.addEventListener('input', (e) => {
                    valueSpan.textContent = e.target.value + suffix;
                });
            }
        });
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    const app = new App();

    // Setup modern settings UI handlers
    setTimeout(() => {
        app.setupModernSettings();
    }, 100);
});
