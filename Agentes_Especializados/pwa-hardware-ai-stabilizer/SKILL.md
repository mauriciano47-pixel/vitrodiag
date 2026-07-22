---
name: pwa-hardware-ai-stabilizer
description: >-
  Audita, depura y estabiliza Progressive Web Apps (PWAs) enfocadas en Hardware (Cámara, Audio) e Inteligencia Artificial offline (TensorFlow.js, Tesseract.js). Evita bloqueos de hardware, fugas de memoria y errores silenciosos.
---

# PWA Hardware & AI Stabilizer

## Overview
Este talento proporciona un conjunto de directrices y flujos de trabajo estrictos para solucionar la inestabilidad en aplicaciones web que utilizan recursos pesados en el navegador (IA, cámaras, Web Workers) y arquitecturas ES Modules. Úsalo cuando el usuario reporte que una PWA "se congela", "la cámara no suelta el hardware", "arroja errores silenciosos de Promises" o "los módulos no encuentran las funciones".

## Dependencies
No depende de otros talentos instalados, pero requiere herramientas estándar de lectura y búsqueda de archivos (`view_file`, `grep_search`).

## Workflow

Sigue estos pasos sistemáticos al recibir la tarea de auditar o reparar una aplicación PWA con Hardware/IA:

### 1. Auditoría del Ciclo de Vida del Hardware (Cámaras y Micrófonos)
- **Problema Común:** Congelamientos de UI cuando se cambia de cámara o de pestaña porque el hardware previo no fue liberado, o el navegador bloquea el hilo principal.
- **Acción:** 
  - Busca todas las instancias de `getUserMedia` y asegúrate de que exista una función que llame a `stream.getTracks().forEach(track => track.stop())` antes de reasignar o apagar.
  - Verifica que las transiciones de hardware tengan un "tiempo de gracia" asíncrono (ej. `await new Promise(res => setTimeout(res, 350))`) entre apagar un stream y encender otro, especialmente en móviles.

### 2. Estabilización de Promises y Asincronía Competitiva
- **Problema Común:** Patrones `Promise.race` (usados para timeouts en OCR o descargas) donde la promesa perdedora eventualmente falla y lanza un `UnhandledPromiseRejection`, ensuciando logs o bloqueando flujos futuros.
- **Acción:**
  - Identifica promesas de larga duración (Tesseract.js OCR, descargas `fetch`).
  - Si compiten contra un timeout, encadena un `.catch(() => {})` a la promesa de trabajo pesado original para silenciar las excepciones residuales si ocurre un timeout.
  - Asegúrate de que `window.addEventListener('unhandledrejection')` filtre correctamente errores como "Failed to fetch" usando cadenas serializadas adecuadamente.

### 3. Fugas de Memoria en IA (TensorFlow.js)
- **Problema Común:** Los tensores acumulados agotan la memoria WebGL en pocos segundos, crasheando el navegador. Modelos ausentes detienen la app silenciosamente.
- **Acción:**
  - Verifica que todo modelo importado (`loadLayersModel`) apunte a rutas absolutas seguras (ej. `/static/model/model.json`) y que los archivos físicos existan para evitar colapsos de red.
  - En inferencia continua (bucle `requestAnimationFrame`), audita que todo procesamiento TFJS ocurra estrictamente dentro de un bloque `tf.tidy(() => { ... })` o implemente `tensor.dispose()` manual.

### 4. Estricta Integridad de ES Modules
- **Problema Común:** Módulos que intentan acceder al DOM directamente a través de IDs (variables mágicas globales) fallan porque ES Modules aplica `use strict` y no mapea IDs al scope global.
- **Acción:**
  - Reemplaza cualquier acceso implícito como `miElementoDOM.value` por `document.getElementById('miElementoDOM').value`.
  - Asegura que las funciones expuestas a `onclick` en HTML estén explícitamente registradas en el ámbito global (ej. `window.miFuncion = miFuncion`) **solo** si es estrictamente necesario, prefiriendo siempre listeners (`addEventListener`) internos.

### 5. Prevención de Pérdida de Estado PWA (Caché y Service Workers)
- **Problema Común:** La PWA carga versiones antiguas en caché o falla sin red.
- **Acción:** 
  - Durante desarrollo/estabilización, incluye un mecanismo para limpiar programáticamente cachés huérfanas (`caches.keys().then(k => k.forEach(c => caches.delete(c)))`) o desregistrar Service Workers si el usuario reporta que sus cambios no se reflejan.

## Common Mistakes
1. **Confiar en que Tesseract.js liberará memoria solo:** Olvidar hacer `await worker.terminate()` cuando ya no se necesite el OCR.
2. **Uso de cat en consola:** Intentar reparar archivos JS usando comandos `cat` o `sed` en la terminal en lugar de usar las herramientas especializadas `replace_file_content`.
3. **No verificar referencias cruzadas:** Asumir que un `import` funciona sin auditar si el archivo de origen contiene un `export` real de esa constante/función.
