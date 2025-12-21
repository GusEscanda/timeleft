// ================================
// Storage
// ================================

const STATE_VERSION = 0.10;
const STORAGE_KEY = "timeleft-state";

function saveState(state) {
    const payload = {
        version: STATE_VERSION,
        state: {
            startDate: state.startDate.toISOString(),
            lastMeasurementDate: state.lastMeasurementDate.toISOString(),
            totalSteps: state.totalSteps,
            completedSteps: state.completedSteps
        }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function createDefaultState() {
    const now = new Date();

    return {
        startDate: now,
        lastMeasurementDate: now,
        totalSteps: 1,
        completedSteps: 0
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
            startDate: new Date(parsed.state.startDate),
            lastMeasurementDate: new Date(parsed.state.lastMeasurementDate),
            totalSteps: parsed.state.totalSteps,
            completedSteps: parsed.state.completedSteps
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
    if (state.completedSteps <= 0) {
        return null;
    }

    const elapsedDurationMs =
        state.lastMeasurementDate - state.startDate;

    if (elapsedDurationMs <= 0) {
        return null;
    }

    const totalDurationMs =
        (state.totalSteps * elapsedDurationMs) / state.completedSteps;

    const remainingSteps =
        state.totalSteps - state.completedSteps;

    const remainingDurationMs =
        totalDurationMs - elapsedDurationMs;

    const estimatedEndDate =
        new Date(state.lastMeasurementDate.getTime() + remainingDurationMs);

    return {
        elapsedDurationMs,
        totalDurationMs,
        remainingSteps,
        remainingDurationMs,
        estimatedEndDate
    };
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
    saveState(state);

    if (!estimation) {
        document.getElementById("elapsedDuration").textContent = "⏱ —";
        document.getElementById("totalDuration").textContent = "⏱ —";
        document.querySelector("#remainingSteps .value").textContent = "—";
        document.getElementById("remainingDuration").textContent = "⏱ —";
        renderDateTime("lastMeasurementDate", null);
        renderDateTime("estimatedEndDate", null);
        return;
    }

    document.getElementById("totalDuration").textContent =
        formatDuration(estimation.totalDurationMs);

    document.getElementById("elapsedDuration").textContent =
        formatDuration(estimation.elapsedDurationMs);

    document.querySelector("#remainingSteps .value").textContent =
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
const startTimeInput = document.getElementById("startTimeInput");

const totalStepsInput = document.getElementById("totalStepsInput");
const totalStepsRange = document.getElementById("totalStepsRange");
const completedStepsInput = document.getElementById("completedStepsInput");
const completedStepsRange = document.getElementById("completedStepsRange");

const setStartNowButton = document.getElementById("setStartNowButton");
const measureNowButton = document.getElementById("measureNowButton");

// ================================
// Sync helpers
// ================================

function syncInputsFromState() {
    startDateInput.value = formatDateForInput(state.startDate);
    startTimeInput.value = formatTimeForInput(state.startDate);

    totalStepsInput.value = state.totalSteps;
    completedStepsInput.value = state.completedSteps;

    totalStepsRange.value = state.totalSteps;
    completedStepsRange.value = state.completedSteps;
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
// Event handlers
// ================================

startDateInput.addEventListener("change", () => {
    updateStartDateFromInputs();
    render();
});

startTimeInput.addEventListener("change", () => {
    updateStartDateFromInputs();
    render();
});

totalStepsInput.addEventListener("input", () => {
    state.totalSteps = Number(totalStepsInput.value);
    totalStepsRange.value = state.totalSteps;
    render();
});

totalStepsRange.addEventListener("input", () => {
    state.totalSteps = Number(totalStepsRange.value);
    totalStepsInput.value = state.totalSteps;
    render();
});

completedStepsInput.addEventListener("input", () => {
    state.completedSteps = Number(completedStepsInput.value);
    completedStepsRange.value = state.completedSteps;
    state.lastMeasurementDate = new Date();
    render();
});

completedStepsRange.addEventListener("input", () => {
    state.completedSteps = Number(completedStepsRange.value);
    completedStepsInput.value = state.completedSteps;
    state.lastMeasurementDate = new Date();
    render();
});

setStartNowButton.addEventListener("click", () => {
    const now = new Date();
    state.startDate = now;
    state.lastMeasurementDate = now;
    syncInputsFromState();
    render();
});

measureNowButton.addEventListener("click", () => {
    state.lastMeasurementDate = new Date();
    render();
});

// ================================
// Initial load
// ================================

syncInputsFromState();
render();

document.getElementById("appVersion").textContent = STATE_VERSION;
