// ================================
// Storage
// ================================

const STATE_VERSION = 0.72;
const STORAGE_KEY = "timeleft-state";

const APP_STATE = {
    SETUP: "setup",      // configuring start + totalSteps
    RUNNING: "running",  // tracking completed steps
};

function saveState(state) {
    const payload = {
        version: STATE_VERSION,
        state: {
            startDate: state.startDate ? state.startDate.toISOString() : null,
            lastMeasurementDate: state.lastMeasurementDate ? state.lastMeasurementDate.toISOString() : null,
            totalSteps: state.totalSteps,
            completedSteps: state.completedSteps,
            appState: state.appState
        }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function createDefaultState() {
    return {
        startDate: null,
        lastMeasurementDate: null,
        totalSteps: 0,
        completedSteps: 0,
        appState: APP_STATE.SETUP
    };
}

function loadOrInitState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return createDefaultState();
    }

    try {
        const parsed = JSON.parse(raw);
        if (parsed.version !== STATE_VERSION) {
            return createDefaultState();
        }

        return {
            startDate: parsed.state.startDate ? new Date(parsed.state.startDate) : null,
            lastMeasurementDate: parsed.state.lastMeasurementDate ? new Date(parsed.state.lastMeasurementDate) : null,
            totalSteps: parsed.state.totalSteps,
            completedSteps: parsed.state.completedSteps,
            appState: parsed.state.appState
        };
    } catch {
        return createDefaultState();
    }
}

// ================================
// State
// ================================

const state = loadOrInitState();

// ================================
// Pure logic
// ================================

function calculateEstimation(state) {
    try {
        const isValidState = 
            state.totalSteps > 0 && 
            state.completedSteps > 0 && 
            state.completedSteps < state.totalSteps && 
            state.startDate < state.lastMeasurementDate;

        if (!isValidState) {
            return null;
        }

        const elapsedDurationMs = state.lastMeasurementDate - state.startDate;
        const totalDurationMs = state.totalSteps * elapsedDurationMs / state.completedSteps;
        const remainingSteps = state.totalSteps - state.completedSteps;
        const remainingDurationMs = totalDurationMs - elapsedDurationMs;
        const estimatedEndDate = new Date(state.lastMeasurementDate.getTime() + remainingDurationMs);

        return {
            elapsedDurationMs,
            totalDurationMs,
            remainingSteps,
            remainingDurationMs,
            estimatedEndDate
        };
    } catch {
        return null;
    }
}

function updateSteps(field, delta) {
    if (field === "total") {
        state.totalSteps = state.totalSteps + delta;
        state.totalSteps = Math.max(state.totalSteps, 0)
    }

    if (field === "completed") {
        state.completedSteps = state.completedSteps + delta;
        state.completedSteps = Math.max(state.completedSteps, 0)
        state.completedSteps = Math.min(state.completedSteps, state.totalSteps)
        state.lastMeasurementDate = new Date();
    }
}


// ================================
// Formatting
// ================================

function formatDuration(ms) {
    if (ms < 0) return "⏱ —";

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad = (n) => String(n).padStart(2, "0");

    return `⏱ ${hours}:${pad(minutes)}:${pad(seconds)}`;
}

function formatDateForInput(date) {
    const pad = (n) => String(n).padStart(2, "0");

    return (
        date.getFullYear() + "-" +
        pad(date.getMonth() + 1) + "-" +
        pad(date.getDate())
    );
}

function formatTimeForInput(date) {
    const pad = (n) => String(n).padStart(2, "0");

    return (
        pad(date.getHours()) + ":" +
        pad(date.getMinutes()) + ":" +
        pad(date.getSeconds())
    );
}

function combineDateAndTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}`);
}

// ================================
// Render
// ================================

function updateUIState() {
    const isSetup = state.appState === APP_STATE.SETUP;
    document.body.classList.toggle("is-setup", isSetup);
    document.body.classList.toggle("is-running", !isSetup);
}

function renderDateTime(containerId, date) {
    const container = document.getElementById(containerId);

    if (!date) {
        container.querySelector(".time").textContent = "-";
        container.querySelector(".date").textContent = "";
        return;
    }

    container.querySelector(".time").textContent =
        date.toLocaleTimeString(undefined, { hour12: false });

    container.querySelector(".date").textContent =
        date.toLocaleDateString();
}

function render() {
    const estimation = calculateEstimation(state);
    updateUIState();
    saveState(state);

    if (!estimation) {
        document.getElementById("elapsedDuration").textContent = "⏱ —";
        document.getElementById("totalDuration").textContent = "⏱ —";
        document.getElementById("remainingSteps").textContent = "—";
        document.getElementById("remainingDuration").textContent = "⏱ —";
        renderDateTime("lastMeasurementDate", null);
        renderDateTime("estimatedEndDate", null);
        return;
    }

    document.getElementById("totalDuration").textContent =
        formatDuration(estimation.totalDurationMs);

    document.getElementById("elapsedDuration").textContent =
        formatDuration(estimation.elapsedDurationMs);

    document.getElementById("remainingSteps").textContent =
        estimation.remainingSteps;

    document.getElementById("remainingDuration").textContent =
        formatDuration(estimation.remainingDurationMs);

    renderDateTime("lastMeasurementDate", state.lastMeasurementDate);
    renderDateTime("estimatedEndDate", estimation.estimatedEndDate);
}

// ================================
// Inputs wiring
// ================================

const startDateInput = document.getElementById("startDateInput");

const totalStepsValue = document.getElementById("totalStepsValue")
const totalStepsInput = document.getElementById("totalStepsInput");
const addTotalStepsButton = document.getElementById("addTotalStepsButton");
const subTotalStepsButton = document.getElementById("subTotalStepsButton");
const resetTotalStepsButton = document.getElementById("resetTotalStepsButton");
const incTotalSteps = document.getElementById("incTotalSteps");
const completedStepsValue = document.getElementById("completedStepsValue");
const completedStepsInput = document.getElementById("completedStepsInput");
const addCompletedStepsButton = document.getElementById("addCompletedStepsButton");
const subCompletedStepsButton = document.getElementById("subCompletedStepsButton");
const resetCompletedStepsButton = document.getElementById("resetCompletedStepsButton");
const incCompletedSteps = document.getElementById("incCompletedSteps");

const measureNowButton = document.getElementById("measureNowButton");

const startProcessButton = document.getElementById("startProcessButton");
const resetProcessButton = document.getElementById("resetProcessButton");

// ================================
// Sync helpers
// ================================

function syncInputsFromState() {
    if (state.startDate) {
        startDateInput.value = state.startDate
            .toISOString()
            .slice(0, 16); // yyyy-MM-ddTHH:mm
    } else {
        startDateInput.value = "";
    }

    totalStepsValue.textContent = state.totalSteps;
    completedStepsValue.textContent = state.completedSteps;

    totalStepsInput.value = state.totalSteps;
    completedStepsInput.value = state.completedSteps;
}

function updateStartDateFromInputs() {
    const combined = combineDateAndTime(
        startDateInput.value,
        startTimeInput.value
    );

    if (!combined || isNaN(combined)) {
        return;
    }

    state.startDate = combined;
}

// ================================
// Autorepeat helper
// ================================

function attachRepeatingPress(
    button,
    callback,
    {
        initialDelay = 400,   // starts slowly
        repeatDelay = 200,    // initial repeat rate
        minDelay = 60,        // maximum speed
        acceleration = 0.85  // acceleration factor
    } = {}
) {
    let timeoutId = null;
    let currentDelay = repeatDelay;

    const step = () => {
        callback();
        currentDelay = Math.max(minDelay, currentDelay * acceleration);
        timeoutId = setTimeout(step, currentDelay);
    };

    const start = (e) => {
        e.preventDefault();

        // reset speed for each press
        currentDelay = repeatDelay;

        // immediate first action
        callback();

        // start repeating after the initial delay
        timeoutId = setTimeout(step, initialDelay);
    };

    const stop = () => {
        clearTimeout(timeoutId);
        timeoutId = null;
    };

    button.addEventListener("mousedown", start);
    button.addEventListener("touchstart", start, { passive: false });

    button.addEventListener("mouseup", stop);
    button.addEventListener("mouseleave", stop);
    button.addEventListener("touchend", stop);
}

// ================================
// Event handlers
// ================================

startDateInput.addEventListener("change", () => {
    if (!startDateInput.value) {
        state.startDate = null;
        return;
    }

    const selectedDate = new Date(startDateInput.value);

    if (isNaN(selectedDate.getTime())) {
        state.startDate = null;
        return;
    }

    state.startDate = selectedDate;
    syncInputsFromState();
    render();
});

totalStepsInput.addEventListener("input", () => {
    const value = Number(totalStepsInput.value);
    state.totalSteps = value;
    syncInputsFromState();
    render();
});

completedStepsInput.addEventListener("input", () => {
    const value = Number(completedStepsInput.value);
    state.completedSteps = value;
    state.lastMeasurementDate = new Date();
    syncInputsFromState();
    render();
});

attachRepeatingPress(addTotalStepsButton, () => {
    updateSteps("total", Number(incTotalSteps.value));
    syncInputsFromState();
    render();
});

attachRepeatingPress(subTotalStepsButton, () => {
    updateSteps("total", - Number(incTotalSteps.value));
    syncInputsFromState();
    render();
});

resetTotalStepsButton.addEventListener("click", () => {
    state.totalSteps = 0;
    state.completedSteps = 0;
    state.lastMeasurementDate = new Date();
    syncInputsFromState();
    render();
});

attachRepeatingPress(addCompletedStepsButton, () => {
    updateSteps("completed", Number(incCompletedSteps.value));
    syncInputsFromState();
    render();
});

attachRepeatingPress(subCompletedStepsButton, () => {
    updateSteps("completed", - Number(incCompletedSteps.value));
    syncInputsFromState();
    render();
});

resetCompletedStepsButton.addEventListener("click", () => {
    state.completedSteps = 0;
    state.lastMeasurementDate = new Date();
    syncInputsFromState();
    render();
});

measureNowButton.addEventListener("click", () => {
    state.lastMeasurementDate = new Date();
    syncInputsFromState();
    render();
});

startProcessButton.addEventListener("click", () => {
    if (state.totalSteps < 1) return;

    const now = Date.now();

    if (!state.startDate) {
        state.startDate = new Date(now);
    }

    if (state.startDate.getTime() > now) return;

    state.appState = APP_STATE.RUNNING;
    state.lastMeasurementDate = new Date(now);
    syncInputsFromState();
    render();
});

resetProcessButton.addEventListener("click", () => {
    state.appState = APP_STATE.SETUP;
    state.completedSteps = 0;
    state.totalSteps = 0;
    state.startDate = null;
    syncInputsFromState();
    render();
});


// ================================
// Initial load
// ================================

syncInputsFromState();
render();

document.getElementById("appVersion").textContent = STATE_VERSION;
