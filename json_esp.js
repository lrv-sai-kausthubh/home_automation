// ==========================================
// SMARTHOME PRO - Configuration
// ==========================================
const BIN_ID = "6966242fd0ea881f4068c288";
const API_KEY = "$2a$10$NowiFr60Dk50zXLYuLnVse6g/5C5XCJlC/EgZpCP8glWMxdVvcfvi";
const URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Pin Configuration
const PIN_MAP = [{
        index: 5,
        pin: 5,
        name: "Living Room",
        type: "red-light",
        icon: "lightbulb"
    },
    {
        index: 11,
        pin: 17,
        name: "Bedroom",
        type: "blue-light",
        icon: "bed"
    },
    {
        index: 15,
        pin: 22,
        name: "Kitchen",
        type: "green-light",
        icon: "restaurant"
    },
    {
        index: 0,
        pin: 0,
        name: "GPIO 0",
        type: "default"
    },
    {
        index: 1,
        pin: 1,
        name: "GPIO 1",
        type: "default"
    },
    {
        index: 2,
        pin: 2,
        name: "GPIO 2",
        type: "default"
    },
    {
        index: 3,
        pin: 3,
        name: "GPIO 3",
        type: "default"
    },
    {
        index: 4,
        pin: 4,
        name: "GPIO 4",
        type: "default"
    },
    {
        index: 6,
        pin: 12,
        name: "GPIO 12",
        type: "default"
    },
    {
        index: 7,
        pin: 13,
        name: "GPIO 13",
        type: "default"
    },
    {
        index: 8,
        pin: 14,
        name: "GPIO 14",
        type: "default"
    },
    {
        index: 9,
        pin: 15,
        name: "GPIO 15",
        type: "default"
    },
    {
        index: 10,
        pin: 16,
        name: "GPIO 16",
        type: "default"
    },
    {
        index: 12,
        pin: 18,
        name: "GPIO 18",
        type: "default"
    },
    {
        index: 13,
        pin: 19,
        name: "GPIO 19",
        type: "default"
    },
    {
        index: 14,
        pin: 21,
        name: "GPIO 21",
        type: "default"
    },
    {
        index: 16,
        pin: 23,
        name: "GPIO 23",
        type: "default"
    },
    {
        index: 17,
        pin: 25,
        name: "GPIO 25",
        type: "default"
    },
    {
        index: 18,
        pin: 26,
        name: "GPIO 26",
        type: "default"
    },
    {
        index: 19,
        pin: 27,
        name: "GPIO 27",
        type: "default"
    },
    {
        index: 20,
        pin: 32,
        name: "GPIO 32",
        type: "default"
    },
    {
        index: 21,
        pin: 33,
        name: "GPIO 33",
        type: "default"
    }
];

// ==========================================
// STATE MANAGEMENT
// ==========================================
let pinState = Array(22).fill(0);
let timers = {}; // { pinIndex: { endTime: timestamp, timeoutId: number } }
let presets = []; // [{ id, name, icon, pins: [indices] }]
let schedules = []; // [{ id, name, time, action, days: [0-6], pins: [indices], active }]

// ==========================================
// DOM ELEMENTS
// ==========================================
const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

// Containers
const priorityContainer = $("priorityContainer");
const standardContainer = $("standardContainer");
const presetsContainer = $("presetsContainer");
const schedulesContainer = $("schedulesContainer");
const quickPresetsBar = $("quickPresetsBar");

// Status
const statusText = $("statusText");
const statusDot = document.querySelector(".dot");

// Side Menu
const sideMenu = $("sideMenu");
const sideMenuOverlay = $("sideMenuOverlay");
const menuBtn = $("menuBtn");

// Modals
const timerModal = $("timerModal");
const presetModal = $("presetModal");
const scheduleModal = $("scheduleModal");
const wiringModal = $("wiringModal");

// Toast
const toast = $("toast");
const toastMessage = $("toastMessage");
const toastIcon = $("toastIcon");

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    setupEventListeners();
    renderAll();
    loadState();
    startScheduleChecker();
});

function loadLocalData() {
    const savedPresets = localStorage.getItem("smarthome_presets");
    const savedSchedules = localStorage.getItem("smarthome_schedules");
    const savedTimers = localStorage.getItem("smarthome_timers");

    if (savedPresets) presets = JSON.parse(savedPresets);
    if (savedSchedules) schedules = JSON.parse(savedSchedules);
    if (savedTimers) {
        const parsedTimers = JSON.parse(savedTimers);
        // Restore timers that haven't expired
        Object.entries(parsedTimers).forEach(([index, data]) => {
            if (data.endTime > Date.now()) {
                const remaining = data.endTime - Date.now();
                timers[index] = {
                    endTime: data.endTime,
                    timeoutId: setTimeout(() => executeTimer(parseInt(index)), remaining)
                };
            }
        });
    }
}

function saveLocalData() {
    localStorage.setItem("smarthome_presets", JSON.stringify(presets));
    localStorage.setItem("smarthome_schedules", JSON.stringify(schedules));

    // Save timer end times (not timeoutIds)
    const timerData = {};
    Object.entries(timers).forEach(([index, data]) => {
        timerData[index] = {
            endTime: data.endTime
        };
    });
    localStorage.setItem("smarthome_timers", JSON.stringify(timerData));
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Side Menu
    menuBtn.onclick = () => toggleSideMenu(true);
    sideMenuOverlay.onclick = () => toggleSideMenu(false);

    // Tab Navigation - Side Menu
    $$(".menu-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTab(btn.dataset.tab);
        });
    });

    // Tab Navigation - Bottom Nav (attach directly to each button)
    document.querySelectorAll(".bottom-nav .nav-item").forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tabName = this.dataset.tab;
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    // GPIO Toggle
    $("toggleGPIO").onclick = (e) => {
        const btn = e.currentTarget;
        const grid = standardContainer;
        btn.classList.toggle("collapsed");
        grid.classList.toggle("collapsed");
    };

    // Quick Presets
    quickPresetsBar.onclick = (e) => {
        const chip = e.target.closest(".preset-chip");
        if (!chip) return;

        const presetId = chip.dataset.preset;
        if (presetId === "all-on") {
            setAllPins(1);
        } else if (presetId === "all-off") {
            setAllPins(0);
        } else {
            activatePreset(presetId);
        }
    };

    // Modal Close Buttons
    $$("[data-close]").forEach(btn => {
        btn.onclick = () => closeModal(btn.dataset.close);
    });

    // Timer Modal
    $$(".timer-option").forEach(btn => {
        btn.onclick = () => handleTimerOption(btn.dataset.minutes);
    });
    $("setCustomTimerBtn").onclick = setCustomTimer;

    // Preset Modal
    $("addPresetBtn").onclick = () => openPresetModal();
    $("savePresetBtn").onclick = savePreset;

    // Icon Picker
    $("iconPicker").onclick = (e) => {
        const btn = e.target.closest(".icon-option");
        if (!btn) return;
        $$(".icon-option").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
    };

    // Schedule Modal
    $("addScheduleBtn").onclick = () => openScheduleModal();
    $("saveScheduleBtn").onclick = saveSchedule;

    // Day Selector
    $("daySelector").onclick = (e) => {
        const btn = e.target.closest(".day-btn");
        if (btn) btn.classList.toggle("selected");
    };

    // Settings
    $("showWiringBtn").onclick = () => {
        renderVisualBoard();
        openModal("wiringModal");
    };

    $("clearDataBtn").onclick = () => {
        if (confirm("Clear all presets, schedules, and timers?")) {
            localStorage.clear();
            presets = [];
            schedules = [];
            Object.values(timers).forEach(t => clearTimeout(t.timeoutId));
            timers = {};
            renderAll();
            showToast("All data cleared", "success");
        }
    };

    // Click outside modal to close
    $$(".modal").forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal(modal.id);
        };
    });
}

// ==========================================
// NAVIGATION
// ==========================================
function toggleSideMenu(show) {
    sideMenu.classList.toggle("active", show);
    sideMenuOverlay.classList.toggle("active", show);
}

function switchTab(tabName) {
    // Update nav buttons
    $$(".menu-item, .nav-item").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update tab content
    $$(".tab-content").forEach(tab => {
        tab.classList.toggle("active", tab.id === `tab-${tabName}`);
    });

    // Close side menu on mobile
    toggleSideMenu(false);
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================
function renderAll() {
    renderLights();
    renderPresets();
    renderSchedules();
    renderQuickPresets();
}

function renderLights() {
    priorityContainer.innerHTML = "";
    standardContainer.innerHTML = "";

    PIN_MAP.forEach(config => {
        const isOn = pinState[config.index] === 1;
        const hasTimer = timers[config.index];

        if (config.type !== "default") {
            // Priority Light Card
            const card = document.createElement("div");
            card.className = `light-card ${config.type}${isOn ? " active" : ""}`;
            card.innerHTML = `
                <div class="light-card-header">
                    <div class="light-icon">
                        <span class="material-icons">${config.icon || "lightbulb"}</span>
                    </div>
                    <div class="light-actions">
                        <button class="light-action-btn" data-action="timer" title="Set Timer">
                            <span class="material-icons">timer</span>
                        </button>
                    </div>
                </div>
                <div class="light-card-body">
                    <div class="light-name">${config.name}</div>
                    <div class="light-status">${isOn ? "ON" : "OFF"}</div>
                </div>
                ${hasTimer ? `
                    <div class="timer-badge">
                        <span class="material-icons">timer</span>
                        <span>${formatTimeRemaining(hasTimer.endTime)}</span>
                    </div>
                ` : ""}
            `;

            card.onclick = (e) => {
                if (e.target.closest("[data-action='timer']")) {
                    openTimerModal(config.index);
                } else {
                    togglePin(config.index);
                }
            };

            priorityContainer.appendChild(card);
        } else {
            // GPIO Button
            const btn = document.createElement("button");
            btn.className = `gpio-btn${isOn ? " active" : ""}`;
            btn.innerHTML = `
                <span class="gpio-label">${config.name}</span>
                <span class="gpio-state">${isOn ? "ON" : "OFF"}</span>
            `;
            btn.onclick = () => togglePin(config.index);
            standardContainer.appendChild(btn);
        }
    });
}

function renderQuickPresets() {
    // Keep default All On/Off buttons and add custom presets
    const existingChips = quickPresetsBar.querySelectorAll(".custom-preset");
    existingChips.forEach(chip => chip.remove());

    presets.slice(0, 3).forEach(preset => {
        const chip = document.createElement("button");
        chip.className = "preset-chip custom-preset";
        chip.dataset.preset = preset.id;
        chip.innerHTML = `
            <span class="material-icons">${preset.icon}</span>
            ${preset.name}
        `;
        quickPresetsBar.appendChild(chip);
    });
}

function renderPresets() {
    if (presets.length === 0) {
        presetsContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">auto_awesome</span>
                <h3>No Presets Yet</h3>
                <p>Create custom presets for quick access to your favorite light configurations.</p>
            </div>
        `;
        return;
    }

    presetsContainer.innerHTML = presets.map(preset => `
        <div class="preset-card" data-id="${preset.id}">
            <div class="preset-icon">
                <span class="material-icons">${preset.icon}</span>
            </div>
            <div class="preset-info">
                <div class="preset-name">${preset.name}</div>
                <div class="preset-pins">${preset.pins.length} pins configured</div>
            </div>
            <div class="preset-actions">
                <button class="preset-action-btn play" data-action="activate" title="Activate">
                    <span class="material-icons">play_arrow</span>
                </button>
                <button class="preset-action-btn" data-action="edit" title="Edit">
                    <span class="material-icons">edit</span>
                </button>
                <button class="preset-action-btn delete" data-action="delete" title="Delete">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </div>
    `).join("");

    // Add event listeners
    presetsContainer.querySelectorAll(".preset-card").forEach(card => {
        card.onclick = (e) => {
            const action = e.target.closest("[data-action]")?.dataset.action;
            const id = card.dataset.id;

            if (action === "activate") activatePreset(id);
            else if (action === "edit") openPresetModal(id);
            else if (action === "delete") deletePreset(id);
        };
    });
}

function renderSchedules() {
    if (schedules.length === 0) {
        schedulesContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">schedule</span>
                <h3>No Schedules Yet</h3>
                <p>Create scheduled alarms to automatically control your lights at specific times.</p>
            </div>
        `;
        return;
    }

    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    schedulesContainer.innerHTML = schedules.map(schedule => `
        <div class="schedule-card" data-id="${schedule.id}">
            <div class="schedule-header">
                <div class="schedule-info">
                    <div class="schedule-time-badge">
                        <span class="schedule-time">${formatTime12h(schedule.time)}</span>
                        <span class="schedule-action-badge ${schedule.action}">${schedule.action}</span>
                    </div>
                    <div>
                        <div class="schedule-name">${schedule.name}</div>
                        <div class="schedule-pins-label">${schedule.pins.length} pins</div>
                    </div>
                </div>
                <button class="schedule-toggle${schedule.active ? " active" : ""}" data-action="toggle"></button>
            </div>
            <div class="schedule-days">
                ${dayNames.map((day, i) => `
                    <div class="schedule-day${schedule.days.includes(i) ? " active" : ""}">${day}</div>
                `).join("")}
            </div>
            <div class="schedule-footer">
                <button class="schedule-btn" data-action="edit">Edit</button>
                <button class="schedule-btn delete" data-action="delete">Delete</button>
            </div>
        </div>
    `).join("");

    // Add event listeners
    schedulesContainer.querySelectorAll(".schedule-card").forEach(card => {
        card.onclick = (e) => {
            const action = e.target.closest("[data-action]")?.dataset.action;
            const id = card.dataset.id;

            if (action === "toggle") toggleSchedule(id);
            else if (action === "edit") openScheduleModal(id);
            else if (action === "delete") deleteSchedule(id);
        };
    });
}

function renderVisualBoard() {
    const visualBoard = $("visualPinHeader");
    visualBoard.innerHTML = PIN_MAP.map(item => `
        <div class="board-row ${item.type !== 'default' ? `highlighted ${item.type}` : ''}">
            <span>${item.name}</span>
            <div class="pin-indicator"></div>
            <span>GPIO ${item.pin}</span>
        </div>
    `).join("");
}

function renderPinSelector(containerId, selectedPins = []) {
    const container = $(containerId);
    container.innerHTML = PIN_MAP.map(config => `
        <button class="pin-selector-btn${selectedPins.includes(config.index) ? " selected" : ""}" 
                data-index="${config.index}">
            ${config.name}
        </button>
    `).join("");

    container.onclick = (e) => {
        const btn = e.target.closest(".pin-selector-btn");
        if (btn) btn.classList.toggle("selected");
    };
}

// ==========================================
// PIN CONTROL
// ==========================================
async function togglePin(index) {
    pinState[index] = pinState[index] === 0 ? 1 : 0;
    renderLights();
    await syncToCloud();
}

async function setAllPins(state) {
    pinState = pinState.map(() => state);
    renderLights();
    await syncToCloud();
    showToast(state ? "All lights on" : "All lights off", "success");
}

async function setPins(indices, state) {
    indices.forEach(i => pinState[i] = state);
    renderLights();
    await syncToCloud();
}

// ==========================================
// TIMER FUNCTIONS
// ==========================================
let currentTimerPin = null;

function openTimerModal(pinIndex) {
    currentTimerPin = pinIndex;
    const config = PIN_MAP.find(p => p.index === pinIndex);
    $("timerPinName").textContent = config?.name || `GPIO ${pinIndex}`;
    $("customTimerSection").style.display = "none";
    openModal("timerModal");
}

function handleTimerOption(minutes) {
    if (minutes === "custom") {
        $("customTimerSection").style.display = "block";
        return;
    }

    const mins = parseInt(minutes);
    if (mins === 0) {
        cancelTimer(currentTimerPin);
    } else {
        setTimer(currentTimerPin, mins);
    }
    closeModal("timerModal");
}

function setCustomTimer() {
    const mins = parseInt($("customMinutes").value);
    if (mins > 0) {
        setTimer(currentTimerPin, mins);
        closeModal("timerModal");
    }
}

function setTimer(pinIndex, minutes) {
    // Clear existing timer
    if (timers[pinIndex]) {
        clearTimeout(timers[pinIndex].timeoutId);
    }

    const endTime = Date.now() + minutes * 60 * 1000;
    timers[pinIndex] = {
        endTime,
        timeoutId: setTimeout(() => executeTimer(pinIndex), minutes * 60 * 1000)
    };

    saveLocalData();
    renderLights();
    showToast(`Timer set for ${formatDuration(minutes)}`, "success");

    // Update timer display periodically
    startTimerDisplayUpdate();
}

function cancelTimer(pinIndex) {
    if (timers[pinIndex]) {
        clearTimeout(timers[pinIndex].timeoutId);
        delete timers[pinIndex];
        saveLocalData();
        renderLights();
        showToast("Timer cancelled", "success");
    }
}

async function executeTimer(pinIndex) {
    pinState[pinIndex] = 0; // Turn off
    delete timers[pinIndex];
    saveLocalData();
    renderLights();
    await syncToCloud();
    showToast(`Timer completed - light turned off`, "success");
}

let timerDisplayInterval = null;

function startTimerDisplayUpdate() {
    if (timerDisplayInterval) return;
    timerDisplayInterval = setInterval(() => {
        if (Object.keys(timers).length === 0) {
            clearInterval(timerDisplayInterval);
            timerDisplayInterval = null;
            return;
        }
        renderLights();
    }, 60000); // Update every minute
}

function formatTimeRemaining(endTime) {
    const remaining = Math.max(0, endTime - Date.now());
    const mins = Math.floor(remaining / 60000);
    const hours = Math.floor(mins / 60);

    if (hours > 0) {
        return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m`;
}

function formatDuration(minutes) {
    if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`;
    }
    return `${minutes} minutes`;
}

// ==========================================
// PRESET FUNCTIONS
// ==========================================
let editingPresetId = null;

function openPresetModal(id = null) {
    editingPresetId = id;

    if (id) {
        const preset = presets.find(p => p.id === id);
        $("presetModalTitle").textContent = "Edit Preset";
        $("presetName").value = preset.name;

        // Select icon
        $$(".icon-option").forEach(btn => {
            btn.classList.toggle("selected", btn.dataset.icon === preset.icon);
        });

        renderPinSelector("pinSelector", preset.pins);
    } else {
        $("presetModalTitle").textContent = "Create Preset";
        $("presetName").value = "";
        $$(".icon-option").forEach((btn, i) => {
            btn.classList.toggle("selected", i === 0);
        });
        renderPinSelector("pinSelector", []);
    }

    openModal("presetModal");
}

function savePreset() {
    const name = $("presetName").value.trim();
    if (!name) {
        showToast("Please enter a preset name", "error");
        return;
    }

    const icon = document.querySelector(".icon-option.selected")?.dataset.icon || "celebration";
    const pins = Array.from($$("#pinSelector .pin-selector-btn.selected"))
        .map(btn => parseInt(btn.dataset.index));

    if (pins.length === 0) {
        showToast("Please select at least one pin", "error");
        return;
    }

    if (editingPresetId) {
        const preset = presets.find(p => p.id === editingPresetId);
        preset.name = name;
        preset.icon = icon;
        preset.pins = pins;
    } else {
        presets.push({
            id: Date.now().toString(),
            name,
            icon,
            pins
        });
    }

    saveLocalData();
    renderPresets();
    renderQuickPresets();
    closeModal("presetModal");
    showToast(editingPresetId ? "Preset updated" : "Preset created", "success");
}

async function activatePreset(id) {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    // Turn off all pins first, then turn on preset pins
    pinState = pinState.map(() => 0);
    preset.pins.forEach(i => pinState[i] = 1);

    renderLights();
    await syncToCloud();
    showToast(`${preset.name} activated`, "success");
}

function deletePreset(id) {
    if (!confirm("Delete this preset?")) return;
    presets = presets.filter(p => p.id !== id);
    saveLocalData();
    renderPresets();
    renderQuickPresets();
    showToast("Preset deleted", "success");
}

// ==========================================
// SCHEDULE FUNCTIONS
// ==========================================
let editingScheduleId = null;

function openScheduleModal(id = null) {
    editingScheduleId = id;

    if (id) {
        const schedule = schedules.find(s => s.id === id);
        $("scheduleModalTitle").textContent = "Edit Schedule";
        $("scheduleName").value = schedule.name;
        $("scheduleTime").value = schedule.time;
        $("scheduleAction").value = schedule.action;

        // Select days
        $$(".day-btn").forEach(btn => {
            btn.classList.toggle("selected", schedule.days.includes(parseInt(btn.dataset.day)));
        });

        renderPinSelector("schedulePinSelector", schedule.pins);
    } else {
        $("scheduleModalTitle").textContent = "Create Schedule";
        $("scheduleName").value = "";
        $("scheduleTime").value = "06:00";
        $("scheduleAction").value = "on";

        // Default to weekdays
        $$(".day-btn").forEach(btn => {
            const day = parseInt(btn.dataset.day);
            btn.classList.toggle("selected", day >= 1 && day <= 5);
        });

        renderPinSelector("schedulePinSelector", []);
    }

    openModal("scheduleModal");
}

function saveSchedule() {
    const name = $("scheduleName").value.trim();
    if (!name) {
        showToast("Please enter a schedule name", "error");
        return;
    }

    const time = $("scheduleTime").value;
    const action = $("scheduleAction").value;
    const days = Array.from($$(".day-btn.selected")).map(btn => parseInt(btn.dataset.day));
    const pins = Array.from($$("#schedulePinSelector .pin-selector-btn.selected"))
        .map(btn => parseInt(btn.dataset.index));

    if (days.length === 0) {
        showToast("Please select at least one day", "error");
        return;
    }

    if (pins.length === 0) {
        showToast("Please select at least one pin", "error");
        return;
    }

    if (editingScheduleId) {
        const schedule = schedules.find(s => s.id === editingScheduleId);
        schedule.name = name;
        schedule.time = time;
        schedule.action = action;
        schedule.days = days;
        schedule.pins = pins;
    } else {
        schedules.push({
            id: Date.now().toString(),
            name,
            time,
            action,
            days,
            pins,
            active: true
        });
    }

    saveLocalData();
    renderSchedules();
    closeModal("scheduleModal");
    showToast(editingScheduleId ? "Schedule updated" : "Schedule created", "success");
}

function toggleSchedule(id) {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
        schedule.active = !schedule.active;
        saveLocalData();
        renderSchedules();
        showToast(schedule.active ? "Schedule enabled" : "Schedule disabled", "success");
    }
}

function deleteSchedule(id) {
    if (!confirm("Delete this schedule?")) return;
    schedules = schedules.filter(s => s.id !== id);
    saveLocalData();
    renderSchedules();
    showToast("Schedule deleted", "success");
}

// Schedule Checker - runs every minute
function startScheduleChecker() {
    checkSchedules();
    setInterval(checkSchedules, 60000);
}

async function checkSchedules() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();

    for (const schedule of schedules) {
        if (!schedule.active) continue;
        if (!schedule.days.includes(currentDay)) continue;
        if (schedule.time !== currentTime) continue;

        // Check if we already executed this minute
        const lastExec = localStorage.getItem(`schedule_${schedule.id}_lastExec`);
        const execKey = `${currentDay}-${currentTime}`;
        if (lastExec === execKey) continue;

        // Execute schedule
        const state = schedule.action === "on" ? 1 : 0;
        schedule.pins.forEach(i => pinState[i] = state);

        localStorage.setItem(`schedule_${schedule.id}_lastExec`, execKey);
        renderLights();
        await syncToCloud();
        showToast(`Schedule "${schedule.name}" executed`, "success");
    }
}

function formatTime12h(time24) {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes}`;
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================
function openModal(modalId) {
    $(modalId).classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
    $(modalId).classList.remove("active");
    document.body.style.overflow = "";
}

// ==========================================
// CLOUD SYNC
// ==========================================
async function syncToCloud() {
    updateStatus("Saving...", "#f59e0b");

    try {
        await fetch(URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify({
                pins: pinState
            })
        });
        updateStatus("Online", "#22c55e");
    } catch (error) {
        console.error("Sync error:", error);
        updateStatus("Offline", "#ef4444");
    }
}

async function loadState() {
    updateStatus("Syncing...", "#3b82f6");

    try {
        const response = await fetch(`${URL}/latest`, {
            headers: {
                "X-Master-Key": API_KEY
            }
        });
        const data = await response.json();

        if (data.record?.pins) {
            pinState = data.record.pins;
            renderLights();
            updateStatus("Online", "#22c55e");
        }
    } catch (error) {
        console.error("Load error:", error);
        updateStatus("Offline", "#ef4444");
    }
}

function updateStatus(text, color) {
    statusText.textContent = text;
    statusDot.style.backgroundColor = color;
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = "success") {
    toastMessage.textContent = message;
    toastIcon.textContent = type === "success" ? "check_circle" : "error";
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}