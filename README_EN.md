# TimeLeft

🇬🇧 English version (versión en español arriba)

TimeLeft is a small web application to estimate how much time remains to complete a task based on real progress so far.

It is not a task manager nor a complex tracker — it is a simple visual tool to answer one question:

> “If I keep this pace, how much time is left?”

---

## ✨ What it does

- Lets you define a total amount of work (steps, units, tasks, etc.).
- Allows you to register progress over time.
- Calculates:
  - elapsed time
  - estimated total time
  - remaining time
  - **estimated completion date/time**
- Automatically saves state in the browser (LocalStorage).

---

## 🧠 How estimation works

The estimation is based on a simple rule:

```
estimated_total_time = elapsed_time / completed_steps * total_steps
```

From this, the remaining time and estimated completion date are calculated.

The app does not try to predict the future — it only extrapolates the current pace.

---

## 🧩 General structure

The app is built with plain JavaScript, no frameworks.

### `app.js`
Contains all the logic:

- state management
- persistence using `localStorage`
- time calculations
- UI rendering
- user interaction

### `feedback.js`
Simple visual effects (shake, pulse, messages).

---

## 💾 Persistence

State is automatically saved in `localStorage` under the key:

```
timeleft-state
```

It includes:

- start date  
- last progress update  
- total steps  
- completed steps  
- app state  

---

## 🧭 App states

The app has two main states:

### `SETUP`
Initial configuration (total steps, start date).

### `RUNNING`
Active progress tracking.

The state controls which UI sections are visible.

---

## ⚠️ Known limitations

- Does not support multiple tasks.
- No cross-device synchronization.
- Dates depend on the local system clock.
- It is not meant for long-term accuracy; it is an indicative tool.

---

## 🧪 Project status

Personal project, evolving over time, designed as a practical experiment and personal utility.

Code prioritizes clarity and maintainability over extreme optimization.

---

## 📄 License

Free to use. Modify, copy or adapt without restrictions.
