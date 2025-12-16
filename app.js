// ================================
// Storage
// ================================

const STORAGE_KEY = "processTimeEstimatorState";

function saveState(state) {
    const serializableState = {
        startDate: state.startDate.toISOString(),
        lastMeasurementDate: state.lastMeasurementDate.toISOString(),
        totalSteps: state.totalSteps,
        completedSteps: state.completedSteps
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        const data = JSON.parse(raw);
        return {
            startDate: new Date(data.startDate),
            lastMeasurementDate: new Date(data.lastMeasurementDate),
            totalSteps: Number(data.totalSteps),
            completedSteps: Number(data.completedSteps)
        };
    } catch {
        return null;
    }
}

// ================================
// State
// ================================

const nowAtLoad = new Date();

const defaultState = {
    startDate: new Date(nowAtLoad),
    lastMeasurementDate: new Date(nowAtLoad),
    totalSteps: 100,
    completedSteps: 0
};

const state = loadState() ?? defaultState;

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
    if (ms < 0) return "-";

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad = (n) => String(n).padStart(2, "0");

    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}

function toLocalDateTimeInputValue(date) {
    const pad = (n) => String(n).padStart(2, "0");

    return (
        date.getFullYear() + "-" +
        pad(date.getMonth() + 1) + "-" +
        pad(date.getDate()) + "T" +
        pad(date.getHours()) + ":" +
        pad(date.getMinutes()) + ":" +
        pad(date.getSeconds())
    );
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

    if (!estimation) {
        document.getElementById("elapsedDuration").textContent = "-";
        document.getElementById("totalDuration").textContent = "-";
        document.getElementById("remainingSteps").textContent = "-";
        document.getElementById("remainingDuration").textContent = "-";
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
const totalStepsInput = document.getElementById("totalStepsInput");
const completedStepsInput = document.getElementById("completedStepsInput");

const setStartNowButton = document.getElementById("setStartNowButton");
const measureNowButton = document.getElementById("measureNowButton");

// ================================
// Sync helpers
// ================================

function syncInputsFromState() {
    startDateInput.value = toLocalDateTimeInputValue(state.startDate);
    totalStepsInput.value = state.totalSteps;
    completedStepsInput.value = state.completedSteps;
}

// ================================
// Event handlers
// ================================

startDateInput.addEventListener("change", () => {
    state.startDate = new Date(startDateInput.value);
    saveState(state);
    render();
});

totalStepsInput.addEventListener("input", () => {
    state.totalSteps = Number(totalStepsInput.value);
    saveState(state);
    render();
});

completedStepsInput.addEventListener("input", () => {
    state.completedSteps = Number(completedStepsInput.value);
    state.lastMeasurementDate = new Date();
    saveState(state);
    render();
});

setStartNowButton.addEventListener("click", () => {
    state.startDate = new Date();
    syncInputsFromState();
    saveState(state);
    render();
});

measureNowButton.addEventListener("click", () => {
    state.lastMeasurementDate = new Date();
    saveState(state);
    render();
});

// ================================
// Initial load
// ================================

syncInputsFromState();
render();
