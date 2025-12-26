# TimeLeft

🇪🇸 Versión en español (English version below)

TimeLeft es una pequeña aplicación web para estimar cuánto tiempo queda para completar una tarea basada en el progreso real realizado hasta el momento.

No es un gestor de tareas ni un tracker complejo: es una herramienta visual y directa para responder una sola pregunta:

> “Si sigo a este ritmo, ¿cuánto falta?”

---

## ✨ Qué hace

- Permite definir una cantidad total de trabajo (por ejemplo: pasos, unidades, tareas).
- Permite registrar avances parciales a lo largo del tiempo.
- Calcula:
  - tiempo transcurrido
  - tiempo total estimado
  - tiempo restante
  - **fecha/hora estimada de finalización**
- Guarda automáticamente el estado en el navegador (LocalStorage).

---

## 🧠 Cómo funciona la estimación

La estimación se basa en una regla simple:

```
tiempo_total_estimado = tiempo_transcurrido / pasos_completados * pasos_totales
```

A partir de eso se calcula el tiempo restante y la fecha estimada de finalización.

La app no intenta predecir el futuro, solo extrapola el ritmo actual.

---

## 🧩 Estructura general

La app está hecha con JavaScript puro, sin frameworks.

### `app.js`
Contiene toda la lógica:

- manejo de estado
- persistencia en `localStorage`
- cálculo de tiempos
- renderizado de la UI
- interacción del usuario

### `feedback.js`
Efectos visuales simples (shake, pulse, mensajes).

---

## 💾 Persistencia

El estado se guarda automáticamente en `localStorage` bajo la clave:

```
timeleft-state
```

Incluye:

- fecha de inicio  
- último progreso registrado  
- total de pasos  
- pasos completados  
- estado de la app  

---

## 🧭 Estados de la app

La app tiene dos estados principales:

### `SETUP`
Configuración inicial (cantidad total de pasos, fecha de inicio).

### `RUNNING`
Seguimiento activo del progreso.

El estado controla qué partes de la interfaz están visibles.

---

## ⚠️ Limitaciones conocidas

- No maneja múltiples tareas.
- No sincroniza entre dispositivos.
- Las fechas dependen del reloj local del sistema.
- No intenta ser precisa a largo plazo: es una herramienta orientativa.

---

## 🧪 Estado del proyecto

Proyecto personal, en evolución, pensado como experimento práctico y herramienta de uso personal.

El código prioriza claridad y mantenibilidad antes que optimización extrema.

---

## 📄 Licencia

Uso libre. Modificá, copiá o adaptá sin restricciones.
