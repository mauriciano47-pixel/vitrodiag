# VitroDiag NEXUS v2.4.0 — Propuesta Técnica Oficial y Documentación del Proyecto

**Aplicación Web Progresiva (PWA) de Diagnóstico Óptico Asistido por IA y Control de Moldería para la Fabricación de Envases de Vidrio**  
*Desarrollado para operadores e inspectores de línea en plantas vidrieras (Procesos Blow-Blow y NNPB en Máquinas I.S.)*

---

**Versión:** 2.4.0 Always-Live (Motor Unificado de Defectos Evidentes & Finos: Plomada Digital Láser + Detección Local de Calcinados y Banco IA Asistido)  
**Fecha de Actualización:** 8 de Septiembre de 2026  
**Estado del Proyecto:** Prototipo Funcional Operativo (v2.4.0 — Motor Geométrico y Textural Local <30ms + Diagnóstico Profundo Gemini IA)  

---

## 1. Filosofía y Objetivo del Proyecto

VitroDiag es una plataforma Progressive Web App (PWA) de precisión industrial diseñada para ser utilizada directamente en la planta caliente por el operador de máquina I.S. Su objetivo fundamental es proporcionar un diagnóstico óptico asistido por IA en tiempo real sobre la conformidad geométrica y superficial de los envases de vidrio recién soplados, permitiendo corregir a tiempo variaciones en la moldería, tiempos de soplado (SOP), lubricación (swabbing) y alineación antes de que el material ingrese al arca de recocido.

El concepto **NEXUS** representa el punto de conexión inteligente entre el operador I.S., la inteligencia artificial multimodal de Gemini 2.0 Flash y los motores de visión local en JavaScript. La filosofía es **inspección asistida, no automática**: el operador encuadra con la retícula táctica y visor en vivo, la visión local mide y diagnostica de inmediato (<30ms), y la IA profunda complementa con análisis multimodal cuando se requiera.

---

## 2. Flujo Principal NEXUS (Estrategia en Dos Niveles)

```text
1. 📐  Inspección Macro & Textural Local (<30ms)
       → Plomada Digital Láser: Inclinación axial en grados, cuello torcido vs cuerpo, simetría y roturas de corona.
       → Detección Local de Calcinados: Algoritmo de contraste adaptativo y clústering para manchas de grasa quemada y piedras.
       → Overlay Táctico: Línea de eje nominal vs real + miras circulares/cruz sobre calcinados.
2. ⚡  Diagnóstico Profundo con Gemini 2.0 Flash Vision
       → Inferencia multimodal contra el catálogo de 111 defectos industriales.
       → Few-Shot RAG: Inyección dinámica de fotos reales de planta registradas en el Banco IA.
3. 🏷️  Alimentación Asistida del Banco IA (1-Tap Feed)
       → El operador guarda cualquier defecto detectado con 1 clic en IndexedDB para calibrar a Gemini.
```

---

## 3. Catálogo Completo de Módulos (v2.4.0)

### Tab 1 — Inspección NEXUS (Motor Principal)

1. **Motor de Plomada Digital Láser & Geometría (`geometry.js`):**  
   Regresión lineal axial que mide en grados la inclinación de la botella y la desviación del cuello respecto al cuerpo (alertas automáticas de *Botella Torcida* y *Cuello Torcido*). Incluye detección de asimetría bilateral de silueta/hombros y fracturas en corona o fondo.
2. **Motor de Defectos Finos y Calcinados (`fineDefects.js`):**  
   Escaneo continuo en el interior de la silueta del envase que detecta partículas de grasa de swabbing quemada (calcinados) y piedras refractarias, clasificándolos automáticamente según su zona anatómica (Boca, Cuello, Hombro, Cuerpo, Fondo).
3. **Diagnóstico IA Multimodal Fotográfico con Gemini 2.0 Flash (`geminiVision.js`):**  
   Evaluación profunda de la refracción y textura contra el catálogo oficial de defectos industriales con sugerencias de ajuste en máquina I.S.
4. **Alimentación Asistida 1-Tap al Banco IA:**  
   Botón directo en cada tarjeta de defecto detectado que transfiere la imagen al Banco de Entrenamiento con la etiqueta técnica pre-cargada.

### Tab 2 — Herramientas Industriales

1. **Calculadora SOP & Swabbing:**  
   Cálculo de tiempos de ciclo según BPM y cavidades, con temporizador y alertas para lubricación de moldes.
2. **Escáner OCR de Consolas BDF (Tesseract.js):**  
   Digitalización óptica de pantallas de control de máquina I.S.
3. **Bitácora de Incidencias & WhatsApp:**  
   Reporte estructurado para comunicación instantánea entre turnos y jefaturas.

### Tab 3 — Banco IA (Dataset Industrial & Few-Shot RAG)

1. **Gestor Local IndexedDB (`datasetManager.js`):**  
   Almacenamiento offline de fotografías de envases clasificados por defecto, zona y notas del operador.
2. **Calibración Few-Shot RAG:**  
   Inyección de muestras de referencia con etiquetas oficiales de Cristal Chile en las peticiones a Gemini para garantizar cero alucinaciones.
3. **Exportación JSON:**  
   Descarga del dataset para entrenamiento centralizado.

### Tab 4 — Directorio de Defectos Industriales

1. **Catálogo de 111 Defectos:**  
   Fichas técnicas con causas comunes, puntos de control en máquina I.S. y filtros por zona anatómica y gravedad.

---

## 4. Arquitectura del Sistema

- **Frontend Core:** HTML5, CSS3 vanilla de alto rendimiento con animaciones fluidas y glassmorphism industrial, JavaScript ES6+ estructurado modularmente en 15 módulos:
  - `main.js` (Orquestador NEXUS), `geometry.js` (Motor de Plomada Láser y Defectos Evidentes), `fineDefects.js` (Detector Local de Calcinados y Defectos Finos), `geminiVision.js` (Gemini 2.0 Flash Vision API + Few-Shot RAG), `datasetManager.js` (Banco IA en IndexedDB), `db.js` (Catálogo 111 defectos), `ui.js` (Navegación y vistas), `camera.js` (Cámara nativa y WebRTC), `timing.js` (Calculadora SOP), `log.js` (Bitácora), `ocr.js` (Tesseract.js), `swab.js` (Temporizador Swabbing), `state.js` (Estado reactivo global).
- **Persistencia Local:** `IndexedDB` y `LocalStorage` para operación 100% sin conexión.
- **Modo de Despliegue:** GitHub Pages Always-Live (<https://mauriciano47-pixel.github.io/vitrodiag/>).

---

## 5. Historial de Versiones

| Versión | Descripción |
| --- | --- |
| **v2.4.0** | **Motor Unificado de Defectos Evidentes & Finos (Fase 1 y Fase 2):** Integración de Plomada Digital Láser (<30ms) con cálculo angular en grados para botellas torcidas, detector de discontinuidades en corona (boca rota) y asimetría de hombros, sumado al nuevo motor local de detección de calcinados/pintas de grafito quemado (`fineDefects.js`) con retículas tácticas y botón de alimentación asistida 1-Tap al Banco IA para calibración Few-Shot RAG en Gemini 2.0 Flash. |
| **v2.3.0** | Implementación del Motor de Detección de Defectos Evidentes (Fase 1): Plomada Digital Láser instantánea (<30ms) con cálculo angular en grados para botellas torcidas y cuellos desviados, detector de discontinuidades en corona (anillo de boca) y talón, inspector de asimetría bilateral de silueta/hombros, y botón de doble veredicto. |
| **v2.2.7** | Estabilización integral del motor de visión por cámara y sincronización instantánea del loop de procesamiento con `getUserMedia`. |
| **v2.2.6** | Compresión y normalización óptica en cliente (JPEG 1280px en 30ms). |
| **v2.2.5** | Independencia total de permisos WebRTC: Modo Foto Directa Nativa (Zero-Permisos) como estándar predeterminado en planta. |
| **v2.2.0** | Arquitectura Always-Live con Zero-Cache Shield: eliminación total de Service Workers y CacheStorage, micro-bootstrapper dinámico y detector de actualizaciones en caliente. |
| **v2.0.0** | Transformación completa a NEXUS. Flujo Foto→Gemini→Diagnóstico. 4 tabs limpias. |

---

## 6. Aviso Legal

- **Margen de Error y Responsabilidad:** Prototipo funcional experimental. No sustituye el juicio técnico del operador especializado ni los instrumentos metrológicos de laboratorio.
- **Privacidad de Datos:** Procesamiento local en memoria RAM del dispositivo. Ninguna foto ni video se almacena externamente sin consentimiento.
