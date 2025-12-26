// app.js

// ================================
// Storage
// ================================

import * as feedback from "./feedback.js";

const STATE_VERSION = 1.0;
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
            lastProgressUpdate: state.lastProgressUpdate ? state.lastProgressUpdate.toISOString() : null,
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
        lastProgressUpdate: null,
        totalSteps: 0,
        completedSteps: 0,
        appState: APP_STATE.SETUP
    };
}

/**
 * Loads the persisted application state from localStorage.
 * If the stored version does not match the current STATE_VERSION,
 * or if parsing fails, a fresh default state is returned.
 *
 * @returns {Object} Application state object.
 */
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
            lastProgressUpdate: parsed.state.lastProgressUpdate ? new Date(parsed.state.lastProgressUpdate) : null,
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

/**
 * Calculates time estimations based on current progress.
 *
 * Returns null if the state is invalid (e.g. no progress yet,
 * missing dates, or inconsistent values).
 *
 * @param {Object} state - Current application state.
 * @returns {Object|null} Estimation data:
 *  - elapsedDurationMs
 *  - totalDurationMs
 *  - remainingSteps
 *  - remainingDurationMs
 *  - estimatedEndDate
 */
function calculateEstimation(state) {
    try {
        const isValidState = 
            state.totalSteps > 0 && 
            state.completedSteps > 0 && 
            state.completedSteps < state.totalSteps && 
            state.startDate < state.lastProgressUpdate;

        if (!isValidState) {
            return null;
        }

        const elapsedDurationMs = state.lastProgressUpdate - state.startDate;
        const totalDurationMs = state.totalSteps * elapsedDurationMs / state.completedSteps;
        const remainingSteps = state.totalSteps - state.completedSteps;
        const remainingDurationMs = totalDurationMs - elapsedDurationMs;
        const estimatedEndDate = new Date(state.lastProgressUpdate.getTime() + remainingDurationMs);

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

/**
 * Updates totalSteps by a delta value.
 * Ensures the value never goes below zero and provides visual feedback.
 *
 * @param {HTMLElement} btnElem - Button triggering the update.
 * @param {number} delta - Amount to add (or subtract).
 */
function updateTotalSteps(btnElem, delta) {
    const prev_value = state.totalSteps;
    state.totalSteps = state.totalSteps + delta;
    state.totalSteps = Math.max(state.totalSteps, 0);
    if (prev_value != state.totalSteps) {
        feedback.pulse(btnElem);
    } else {
        feedback.shake(btnElem);
    }
}

/**
 * Updates completedSteps by a delta value.
 * Ensures the value stays within [0, totalSteps] and updates
 * the last progress timestamp.
 *
 * @param {HTMLElement} btnElem - Button triggering the update.
 * @param {number} delta - Amount to add (or subtract).
 */
function updateCompletedSteps(btnElem, delta) {
    const prev_value = state.completedSteps;
    state.completedSteps = state.completedSteps + delta;
    state.completedSteps = Math.max(state.completedSteps, 0);
    state.completedSteps = Math.min(state.completedSteps, state.totalSteps);
    state.lastProgressUpdate = new Date();
    if (prev_value != state.completedSteps) {
        feedback.pulse(btnElem);
    } else {
        feedback.shake(btnElem);
    }
}


// ================================
// Formatting
// ================================

/**
 * Formats a duration in milliseconds into HH:MM:SS format.
 *
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted duration or placeholder if invalid.
 */
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

/**
 * Parses a datetime-local input value into a Date object.
 *
 * @param {string} value - Value from a datetime-local input.
 * @returns {Date|null} Parsed Date or null if empty.
 */
function parseLocalDateTime(value) {
    if (!value) return null;

    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    return new Date(year, month - 1, day, hour, minute);
}

/**
 * Formats a Date object for use in a datetime-local input.
 *
 * @param {Date|null} date
 * @returns {string} Formatted datetime string or empty string.
 */
function formatForDatetimeLocal(date) {
    if (!date) return "";

    const pad = n => String(n).padStart(2, "0");

    return (
        date.getFullYear() + "-" +
        pad(date.getMonth() + 1) + "-" +
        pad(date.getDate()) + "T" +
        pad(date.getHours()) + ":" +
        pad(date.getMinutes())
    );
}

// ================================
// Render
// ================================

/**
 * Updates global UI mode by toggling CSS classes on <body>.
 *
 * The UI has two mutually exclusive modes:
 * - "setup": initial configuration screen
 * - "running": active progress tracking
 *
 * Visual changes are handled entirely via CSS using
 * `.is-setup` and `.is-running` classes.
 */
function updateUIState() {
    const isSetup = state.appState === APP_STATE.SETUP;
    document.body.classList.toggle("is-setup", isSetup);
    document.body.classList.toggle("is-running", !isSetup);
}

/**
 * Renders a date and time inside a container element.
 *
 * @param {string} containerId - Element id containing .date and .time nodes.
 * @param {Date|null} date - Date to render.
 */
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

function syncInputsFromState() {

    startDateInput.value = formatForDatetimeLocal(state.startDate);

    totalStepsValue.textContent = state.totalSteps;
    completedStepsValue.textContent = state.completedSteps;

    totalStepsInput.value = state.totalSteps;
    completedStepsInput.value = state.completedSteps;

}

/**
 * Renders the entire UI based on the current state.
 * Includes saving state, updating metrics and refreshing UI elements.
 */
function render() {
    const estimation = calculateEstimation(state);
    updateUIState();
    saveState(state);

    syncInputsFromState();

    if (!estimation) {
        document.getElementById("elapsedDuration").textContent = "⏱ —";
        document.getElementById("totalDuration").textContent = "⏱ —";
        document.getElementById("remainingSteps").textContent = "—";
        document.getElementById("remainingDuration").textContent = "⏱ —";
        renderDateTime("lastProgressUpdate", null);
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

    renderDateTime("lastProgressUpdate", state.lastProgressUpdate);
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

const markProgressButton = document.getElementById("markProgressButton");

const startProcessButton = document.getElementById("startProcessButton");
const resetProcessButton = document.getElementById("resetProcessButton");

// ================================
// helpers
// ================================

/**
 * Attaches a press-and-hold behavior to a button.
 * The callback is triggered repeatedly with acceleration
 * while the button is pressed.
 *
 * @param {HTMLElement} button
 * @param {Function} callback
 * @param {Object} options
 * @param {number} options.initialDelay - Delay before repeating starts.
 * @param {number} options.repeatDelay - Initial repeat interval.
 * @param {number} options.minDelay - Fastest allowed interval.
 * @param {number} options.acceleration - Speed multiplier per step.
 */
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
    state.startDate = parseLocalDateTime(startDateInput.value);
    render();
});

totalStepsInput.addEventListener("input", () => {
    const value = Number(totalStepsInput.value);
    state.totalSteps = value;
    render();
});

completedStepsInput.addEventListener("input", () => {
    const value = Number(completedStepsInput.value);
    state.completedSteps = value;
    state.lastProgressUpdate = new Date();
    render();
});

attachRepeatingPress(addTotalStepsButton, () => {
    updateTotalSteps(addTotalStepsButton, Number(incTotalSteps.value));
    render();
});

attachRepeatingPress(subTotalStepsButton, () => {
    updateTotalSteps(subTotalStepsButton, -Number(incTotalSteps.value));
    render();
});

resetTotalStepsButton.addEventListener("click", () => {
    state.totalSteps = 0;
    state.completedSteps = 0;
    state.lastProgressUpdate = new Date();
    feedback.pulse(resetTotalStepsButton);
    render();
});

attachRepeatingPress(addCompletedStepsButton, () => {
    updateCompletedSteps(addCompletedStepsButton, Number(incCompletedSteps.value));
    render();
});

attachRepeatingPress(subCompletedStepsButton, () => {
    updateCompletedSteps(subCompletedStepsButton, -Number(incCompletedSteps.value));
    render();
});

resetCompletedStepsButton.addEventListener("click", () => {
    state.completedSteps = 0;
    state.lastProgressUpdate = new Date();
    feedback.pulse(resetCompletedStepsButton);
    render();
});

markProgressButton.addEventListener("click", () => {
    state.lastProgressUpdate = new Date();
    feedback.pulse(markProgressButton);
    render();
});

startProcessButton.addEventListener("click", () => {
    if (state.totalSteps < 1) {
        feedback.shake(startProcessButton);
        feedback.error("Set total work first");
        return;
    }

    const now = Date.now();

    if (!state.startDate) {
        state.startDate = new Date(now);
    }

    if (state.startDate.getTime() > now) {
        feedback.shake(startProcessButton);
        feedback.error("Start date cannot be in the future!");
        return;
    }

    state.appState = APP_STATE.RUNNING;
    state.lastProgressUpdate = new Date(now);
    feedback.pulse(startProcessButton);
    feedback.success("Process started");
    render();
});

resetProcessButton.addEventListener("click", () => {
    state.appState = APP_STATE.SETUP;
    state.completedSteps = 0;
    state.totalSteps = 0;
    state.startDate = null;
    feedback.pulse(resetProcessButton);
    feedback.info("New process");
    render();
});


// ================================
// Initial load
// ================================

syncInputsFromState();
render();

document.getElementById("appVersion").textContent = STATE_VERSION;
