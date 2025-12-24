// feedback.js

const el = document.getElementById("feedback");
let timeoutId = null;

function show(message, type = "info", duration = 1200) {
    if (!el) return;

    clearTimeout(timeoutId);

    el.textContent = message;
    el.className = `feedback ${type} show`;

    if (type === "error") {
        el.classList.add("shake");
    }

    timeoutId = setTimeout(() => {
        el.classList.remove("show", "shake");
    }, duration);
}

/* =========================
   PUBLIC FEEDBACK MESSAGES
========================= */

export function error(msg) {
    show(msg, "error", 1400);
}

export function success(msg) {
    show(msg, "success", 900);
}

export function info(msg) {
    show(msg, "info", 1000);
}

/* =========================
   MICRO FEEDBACK (VISUAL)
========================= */

export function pulse(el) {
    if (!el) return;

    el.classList.remove("pulse");
    void el.offsetWidth; // force reflow
    el.classList.add("pulse");
}

export function shake(el) {
    if (!el) return;

    el.classList.add("shake", "error-flash");

    setTimeout(() => {
        el.classList.remove("shake", "error-flash");
    }, 300);
}
