// --- CONFIGURATION ---
const BIN_ID = "69"; // Use your actual BIN ID
const API_KEY = "$2a$cfvi"; // Use your actual API Key
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Default Pin Configuration (matches Arduino pinMap)
const DEFAULT_PIN_MAP = [
    { index: 0, pin: 0, name: "GPIO 0", type: "default", icon: "power_settings_new" },
    { index: 1, pin: 1, name: "GPIO 1", type: "default", icon: "power_settings_new" },
    { index: 2, pin: 2, name: "GPIO 2", type: "default", icon: "power_settings_new" },
    { index: 3, pin: 3, name: "GPIO 3", type: "default", icon: "power_settings_new" },
    { index: 4, pin: 4, name: "GPIO 4", type: "default", icon: "power_settings_new" },
    { index: 5, pin: 5, name: "Living Room", type: "red-light", icon: "lightbulb" },
    { index: 6, pin: 12, name: "GPIO 12", type: "default", icon: "power_settings_new" },
    { index: 7, pin: 13, name: "GPIO 13", type: "default", icon: "power_settings_new" },
    { index: 8, pin: 14, name: "GPIO 14", type: "default", icon: "power_settings_new" },
    { index: 9, pin: 15, name: "GPIO 15", type: "default", icon: "power_settings_new" },
    { index: 10, pin: 16, name: "GPIO 16", type: "default", icon: "power_settings_new" },
    { index: 11, pin: 17, name: "Bedroom", type: "blue-light", icon: "bed" },
    { index: 12, pin: 18, name: "GPIO 18", type: "default", icon: "power_settings_new" },
    { index: 13, pin: 19, name: "GPIO 19", type: "default", icon: "power_settings_new" },
    { index: 14, pin: 21, name: "GPIO 21", type: "default", icon: "power_settings_new" },
    { index: 15, pin: 22, name: "Kitchen", type: "green-light", icon: "restaurant" },
    { index: 16, pin: 23, name: "GPIO 23", type: "default", icon: "power_settings_new" },
    { index: 17, pin: 25, name: "GPIO 25", type: "default", icon: "power_settings_new" },
    { index: 18, pin: 26, name: "GPIO 26", type: "default", icon: "power_settings_new" },
    { index: 19, pin: 27, name: "GPIO 27", type: "default", icon: "power_settings_new" },
    { index: 20, pin: 32, name: "GPIO 32", type: "default", icon: "power_settings_new" },
    { index: 21, pin: 33, name: "GPIO 33", type: "default", icon: "power_settings_new" }
];

// Icon mapping for display
const ICON_MAP = {
    'lightbulb': 'lightbulb',
    'bed': 'bed',
    'restaurant': 'restaurant',
    'living': 'weekend',
    'garage': 'garage',
    'yard': 'yard',
    'power_settings_new': 'power_settings_new',
    'air': 'air',
    'tv': 'tv'
};

// Load saved configuration or use default
let PIN_MAP = JSON.parse(localStorage.getItem('pinConfig')) || [...DEFAULT_PIN_MAP];
let pinState = Array(22).fill(0);

// --- DOM ELEMENTS ---
const priorityContainer = document.getElementById("priorityContainer");
const standardContainer = document.getElementById("standardContainer");
const statusText = document.getElementById("statusText");
const statusDot = document.querySelector(".dot");
const welcomeModal = document.getElementById("welcomeModal");
const toast = document.getElementById("toast");

// Tab elements
const navTabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initializeTabs();
    initializeWelcomeModal();
    initializeConfigPanel();
    renderButtons();
    loadState();
});

// --- TAB NAVIGATION ---
function initializeTabs() {
    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.dataset.tab;
            
            // Update active states
            navTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            // Show target content
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === `${targetTab}Tab`) {
                    content.classList.add("active");
                }
            });
        });
    });
}

// --- WELCOME MODAL ---
function initializeWelcomeModal() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    // Render configured pins preview
    renderConfiguredPreview();
    
    if (!hasSeenWelcome) {
        welcomeModal.style.display = "flex";
    }
    
    document.getElementById("startDashboard").addEventListener("click", () => {
        welcomeModal.style.display = "none";
        localStorage.setItem('hasSeenWelcome', 'true');
    });
}

function renderConfiguredPreview() {
    const preview = document.getElementById("configuredPreview");
    const priorityPins = PIN_MAP.filter(p => p.type !== "default");
    
    if (priorityPins.length === 0) {
        preview.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No priority pins configured yet.</p>';
        return;
    }
    
    preview.innerHTML = priorityPins.map(pin => `
        <div class="preview-chip">
            <div class="chip-dot ${pin.type}"></div>
            <span>${pin.name}</span>
            <span style="color: var(--text-muted);">GPIO ${pin.pin}</span>
        </div>
    `).join('');
}

// --- RENDER DASHBOARD ---
function renderButtons() {
    priorityContainer.innerHTML = "";
    standardContainer.innerHTML = "";

    // Sort: Priority pins first
    const sortedPins = [...PIN_MAP].sort((a, b) => {
        if (a.type !== "default" && b.type === "default") return -1;
        if (a.type === "default" && b.type !== "default") return 1;
        return a.index - b.index;
    });

    sortedPins.forEach((config) => {
        const isOn = pinState[config.index] === 1;
        const btn = document.createElement("button");

        btn.classList.add("switch-card");
        
        if (config.type !== "default") {
            btn.classList.add("large", config.type);
        } else {
            btn.classList.add("small");
        }

        if (isOn) btn.classList.add("active");

        if (config.type !== "default") {
            btn.innerHTML = `
                <span class="material-icons icon-large">${ICON_MAP[config.icon] || 'power_settings_new'}</span>
                <span class="label">${config.name}</span>
                <span class="status">${isOn ? 'ON' : 'OFF'}</span>
            `;
            priorityContainer.appendChild(btn);
        } else {
            btn.innerHTML = `
                GPIO ${config.pin}<br/>
                <strong>${isOn ? 'ON' : 'OFF'}</strong>
            `;
            standardContainer.appendChild(btn);
        }

        btn.onclick = () => togglePin(config.index);
    });
}

// --- CONFIGURATION PANEL ---
function initializeConfigPanel() {
    const pinSelect = document.getElementById("pinSelect");
    const pinName = document.getElementById("pinName");
    const pinType = document.getElementById("pinType");
    const pinIcon = document.getElementById("pinIcon");
    const saveBtn = document.getElementById("saveConfig");
    const resetBtn = document.getElementById("resetConfig");

    // Populate pin select
    PIN_MAP.forEach(pin => {
        const option = document.createElement("option");
        option.value = pin.index;
        option.textContent = `GPIO ${pin.pin} (Index ${pin.index})`;
        pinSelect.appendChild(option);
    });

    // Load selected pin data
    pinSelect.addEventListener("change", () => {
        const selected = PIN_MAP.find(p => p.index === parseInt(pinSelect.value));
        if (selected) {
            pinName.value = selected.name;
            pinType.value = selected.type;
            pinIcon.value = selected.icon || 'power_settings_new';
        }
    });

    // Trigger initial load
    pinSelect.dispatchEvent(new Event('change'));

    // Save configuration
    saveBtn.addEventListener("click", () => {
        const index = parseInt(pinSelect.value);
        const pin = PIN_MAP.find(p => p.index === index);
        
        if (pin) {
            pin.name = pinName.value || `GPIO ${pin.pin}`;
            pin.type = pinType.value;
            pin.icon = pinIcon.value;
            
            // Save to localStorage
            localStorage.setItem('pinConfig', JSON.stringify(PIN_MAP));
            
            // Re-render
            renderButtons();
            renderConfigList();
            renderConfiguredPreview();
            
            showToast("Configuration saved!", "success");
        }
    });

    // Reset configuration
    resetBtn.addEventListener("click", () => {
        if (confirm("Reset all pin configurations to default?")) {
            PIN_MAP = JSON.parse(JSON.stringify(DEFAULT_PIN_MAP));
            localStorage.setItem('pinConfig', JSON.stringify(PIN_MAP));
            
            // Re-render
            renderButtons();
            renderConfigList();
            renderConfiguredPreview();
            pinSelect.dispatchEvent(new Event('change'));
            
            showToast("Configuration reset!", "success");
        }
    });

    // Initial render of config list
    renderConfigList();
}

function renderConfigList() {
    const configList = document.getElementById("configList");
    
    // Show priority pins first, then others
    const sorted = [...PIN_MAP].sort((a, b) => {
        if (a.type !== "default" && b.type === "default") return -1;
        if (a.type === "default" && b.type !== "default") return 1;
        return a.index - b.index;
    });

    configList.innerHTML = sorted.map(pin => `
        <div class="config-item">
            <div class="config-item-left">
                <div class="config-item-dot ${pin.type}"></div>
                <div class="config-item-info">
                    <strong>${pin.name}</strong>
                    <span>${pin.type === 'default' ? 'Standard' : pin.type.replace('-light', ' Priority')}</span>
                </div>
            </div>
            <span class="config-item-pin">GPIO ${pin.pin}</span>
        </div>
    `).join('');
}

// --- CLOUD SYNC ---
async function togglePin(index) {
    pinState[index] = pinState[index] === 0 ? 1 : 0;
    renderButtons();

    updateStatus("Saving...", "#f59e0b");

    try {
        const response = await fetch(URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify({ pins: pinState })
        });

        if (response.ok) {
            updateStatus("Online", "#22c55e");
        } else {
            throw new Error("API Error");
        }
    } catch (error) {
        console.error(error);
        updateStatus("Connection Failed", "#ef4444");
        showToast("Failed to save. Check connection.", "error");
    }
}

async function loadState() {
    updateStatus("Syncing...", "#3b82f6");
    
    try {
        const response = await fetch(URL + "/latest", {
            headers: { "X-Master-Key": API_KEY }
        });
        
        const data = await response.json();

        if (data.record && data.record.pins) {
            pinState = data.record.pins;
            renderButtons();
            updateStatus("Online", "#22c55e");
        } else {
            updateStatus("Online", "#22c55e");
        }
    } catch (error) {
        console.error(error);
        updateStatus("Offline", "#ef4444");
    }
}

function updateStatus(text, color) {
    statusText.innerText = text;
    statusDot.style.backgroundColor = color;
    
    if (color === "#22c55e") {
        statusDot.style.boxShadow = "0 0 10px #22c55e";
    } else {
        statusDot.style.boxShadow = "none";
    }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}