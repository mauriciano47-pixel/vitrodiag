# VitroDiag v1.0.58 — Propuesta Técnica Oficial y Documentación del Proyecto

**Desarrollador:** Mauricio Uribe Maldonado (mauriciano47-pixel)  
**Planta / Empresa Target:** Cristal Chile (Proceso NNPB, Soplo-Soplo y Prensado)  
**URL de Producción PWA:** [https://mauriciano47-pixel.github.io/vitrodiag/](https://mauriciano47-pixel.github.io/vitrodiag/)  
**Estado del Proyecto:** Prototipo Funcional Finalizado (v1.0.58)  


---

## 1. Filosofía y Objetivo del Proyecto

VitroDiag es una plataforma Progressive Web App (PWA) de precisión industrial diseñada para ser utilizada directamente en la planta caliente por el operador de máquina I.S. Su objetivo fundamental es proporcionar un diagnóstico óptico en tiempo real sobre la conformidad geométrica de los envases de vidrio recién soplados, permitiendo corregir a tiempo variaciones en la moldería, tiempos de soplado (SOP) y alineación antes de que el material ingrese al arca de recocido.

Diseñada bajo una arquitectura híbrida inteligente (Offline-First local + Gemini Vision API opcional en la nube), VitroDiag ejecuta todos sus motores de visión en el dispositivo móvil y permite diagnósticos profundos con IA multimodal cuando hay conexión activa.

---

## 2. Catálogo Completo de Funciones

1. **Visión Computacional de Contornos (Sobel/Fine):**
   Análisis óptico de detección de bordes y perfilado geométrico del cuello y cuerpo. Verifica la verticalidad, eje central y simetría de la botella a través de la cámara del smartphone.
2. **Filtro Anti-Falsas Lecturas (`isBottlePresent` & `maxContinuous`):**
   Verificación heurística de densidad de bordes verticales y continuidad espacial continua. Evita lecturas erróneas ante fondos vacíos, estructuras de planta o paredes, exigiendo la presencia real del envase.
3. **Motor Híbrido de Diagnóstico con Gemini Vision API:**
   Análisis profundo de imágenes por IA generativa multimodal (`Gemini 2.0 Flash`) para clasificación precisa de defectos complejos (cuello torcido, burbujas, rebabas, ovalamiento, hundimiento) con sugerencias de ajuste para máquina I.S.
4. **Agente Patronista1 & Clasificación Multizona por Ficha Técnica:**
   Evaluación técnica dividida por zonas anatómicas del envase (Corona, Cuello, Hombro, Cuerpo, Fondo) contrastada con especificaciones técnicas de moldería NNPB.
5. **Cerebro Neuronal CNN (TensorFlow.js):**
   Red neuronal convolucional ejecutada en WebGL/CPU local para clasificación de defectos offline directamente en la memoria del teléfono.
6. **Escáner OCR de Consolas (Tesseract.js):**
   Reconocimiento óptico de caracteres para digitalizar pantallas de control BDF. Convierte fotografías de consolas I.S. en datos numéricos editables de tiempos de soplo y enfriamiento.
7. **Calculadora SOP & Swabbing:**
   Algoritmo de cálculo de tiempos de soplo (SOP) según BPM, cavidades y peso. Sugiere intervalos óptimos de lubricación de moldes (swabbing) y previene sobrecalentamiento.
8. **Bitácora de Incidencias & WhatsApp:**
   Registro estructurado de paradas, defectos de moldeo y ajustes realizados. Exporta reportes formateados instantáneamente para ser enviados por WhatsApp a jefes de turno y mantenimiento.
9. **PWA Offline Autónomo (Service Worker v1.0.58):**
   Instalación de app nativa con caché inteligente HTML5 pura. Permite operar al 100% de capacidad en zonas ciegas sin cobertura de red o Wi-Fi en el área caliente.

---

## 3. Arquitectura del Sistema

- **Frontend Core:** HTML5, CSS3 vanila de alto rendimiento con animaciones fluídas y glassmorphism industrial, JavaScript ES6+ estructurado modularmente (`camera.js`, `vision.js`, `ai.js`, `geminiVision.js`, `db.js`, `timing.js`, `swab.js`, `ocr.js`, `ui.js`, `log.js`, `main.js`, `state.js`, `geometry.js`).
- **Backend / Django Server (Opcional Local):** Django 5.x con `django-axes` para protección contra fuerza bruta y configuraciones de ciberseguridad industrial (`settings.py`).
- **Persistencia Local:** `IndexedDB` y `LocalStorage` para operación 100% sin conexión.
- **Service Worker:** `sw.js` v1.0.58 con estrategia Cache First para assets y Offline Fallback.

---

## 4. Ventajas Competitivas e Industriales

- **Autonomía Operativa Total (Cero Latencia):** Inferencia local en GPU/CPU en < 50ms sin depender de servidores remotos.
- **Reducción de Merma en Línea Caliente:** Detección temprana de defectos minutos antes de llegar a la línea fría.
- **Estandarización del Criterio de Operación:** Guía interactiva con sugerencias de ajuste de máquina I.S.
- **Despliegue Multi-Plataforma:** Compatible con Android, iOS (Safari) y computadores sin tiendas de apps.

---

## 5. Visión a Futuro y Hoja de Ruta (Roadmap)

- **Fase 1 (Actual - v1.0.58):** Prototipo PWA offline con visión por contornos, inferencia TensorFlow.js local, OCR de consolas, integración Gemini 2.0 Flash y calculadora SOP.
- **Fase 2 — Integración Térmica Infrarroja:** Compatibilidad con sensores infrarrojos portátiles (Flir One/Seek Thermal) para mapas de temperatura en gotas de vidrio y moldes.
- **Fase 3 — Dataset Cuantizado de Cristal Chile:** Recolección y entrenamiento de miles de imágenes de defectos reales de planta.
- **Fase 4 — Conexión IoT & SCADA:** Integración opcional vía WebSockets con consolas de máquina I.S.

---

## 6. Aviso Legal y Políticas de Privacidad

- **Margen de Error y Responsabilidad:** Prototipo funcional experimental. No sustituye el juicio técnico del operador especializado ni los instrumentos metrológicos de laboratorio.
- **Privacidad de Datos:** Procesamiento local en memoria RAM del dispositivo. Ninguna foto ni video se almacena externamente sin consentimiento.
