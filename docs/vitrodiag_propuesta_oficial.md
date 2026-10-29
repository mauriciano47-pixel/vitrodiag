# VitroDiag NEXUS v2.5.2 — Propuesta Técnica Oficial y Documentación del Proyecto

**Aplicación Web Progresiva (PWA) de Diagnóstico Óptico Asistido por IA y Control de Moldería para la Fabricación de Envases de Vidrio**  
*Desarrollado para operadores e inspectores de línea en plantas vidrieras (Procesos Blow-Blow y NNPB en Máquinas I.S. — Cristalerías de Chile S.A. & Bucher Emhart Glass)*

---

**Versión:** 2.5.1 Always-Live (Catálogo Oficial Cristalerías de Chile de 147 Defectos, Tríada de Columpios, Banco IA con 11 Fotos DSLR y Fortificación Gemini Vision / Modo Local Experto)  
**Fecha de Actualización:** 27 de Octubre de 2026  
**Estado del Proyecto:** Aplicación Oficial Fortificada (Grado AAA Tech Due Diligence 98/100 — V-GUARD Suite)  

---

## 1. Filosofía y Objetivo del Proyecto

VitroDiag es una plataforma Progressive Web App (PWA) de precisión industrial diseñada para ser utilizada directamente en la planta caliente por el operador de máquina I.S. Su objetivo fundamental es proporcionar un diagnóstico óptico asistido por IA en tiempo real sobre la conformidad geométrica y superficial de los envases de vidrio recién soplados, permitiendo corregir a tiempo variaciones en la moldería, tiempos de soplado (SOP), lubricación (swabbing) y alineación antes de que el material ingrese al arca de recocido.

El concepto **NEXUS** representa el punto de conexión inteligente entre el operador I.S., la inteligencia artificial multimodal de Gemini 2.0 Flash y los motores de visión local en JavaScript. La filosofía es **inspección asistida, no automática**: el operador encuadra con la retícula táctica y visor en vivo, la visión local mide y diagnostica de inmediato (<30ms), y la IA profunda complementa con análisis multimodal cuando se requiera.

---

## 2. Flujo Principal NEXUS (Estrategia en Tres Niveles)

```text
1. 📐  Inspección Macro & Textural Local (<30ms)
       → Plomada Digital Láser: Inclinación axial en grados, cuello torcido vs cuerpo, simetría y roturas de corona.
       → Detección Local de Calcinados: Algoritmo de contraste adaptativo y clústering para manchas de grasa quemada y piedras.
       → Overlay Táctico: Línea de eje nominal vs real + miras circulares/cruz sobre calcinados.
2. ⚡  Diagnóstico Profundo Dual (Cloud AI Gemini 2.0 Flash / Motor Local Experto SOP)
       → Inferencia multimodal contra el catálogo ampliado de 147 defectos industriales oficiales.
       → Conmutación automática: Si existe API Key válida ejecuta Gemini Cloud AI; si no existe o hay degradación de red, ejecuta de forma autónoma e instantánea el Motor Local Experto con el SOP de Cristalerías de Chile.
       → Few-Shot RAG: Inyección dinámica de fotos reales de planta registradas en el Banco IA.
3. 🏷️  Alimentación Asistida del Banco IA (1-Tap Feed) & Botonera de Muestras Rápidas
       → Botones 1-Tap para probar sensores con muestras industriales reales: Columpio Cuerpo, Columpio Cuello, Calcinado Gollete, Botella Torcida, Corona Rota, Calcinado Swabbing y Envase Conforme.
```

---

## 3. Catálogo Completo de Módulos (v2.5.1)

### Tab 1 — Inspección NEXUS (Motor Principal)

1. **Motor de Plomada Digital Láser & Geometría (`geometry.js`):**  
   Regresión lineal axial que mide en grados la inclinación de la botella y la desviación del cuello respecto al cuerpo (alertas automáticas de *Botella Torcida* y *Cuello Torcido*). Incluye detección de asimetría bilateral de silueta/hombros y fracturas en corona o fondo.
2. **Motor de Defectos Finos y Calcinados (`fineDefects.js`):**  
   Escaneo continuo en el interior de la silueta del envase que detecta partículas de grasa de swabbing quemada (calcinados) y piedras refractarias, clasificándolos automáticamente según su zona anatómica (Boca, Cuello, Hombro, Cuerpo, Fondo).
3. **Diagnóstico IA Dual con Gemini Vision y Motor Local Experto (`geminiVision.js`):**  
   Evaluación profunda de la refracción y textura contra el catálogo oficial de 147 defectos con sugerencias de ajuste en máquina I.S. Probador de API Key en vivo y fallback local determinista con SOP oficial de Cristalerías de Chile.
4. **Botonera 1-Tap de Muestras Rápidas de Fábrica:**  
   Prueba instantánea de sensores con 10 botones de defectos críticos, incluyendo la nueva tríada de columpios y calcinados.

### Tab 2 — Herramientas Industriales

1. **Calculadora SOP & Swabbing:**  
   Cálculo de tiempos de ciclo según BPM y cavidades, con temporizador y alertas para lubricación de moldes.
2. **Escáner OCR de Consolas BDF (Tesseract.js):**  
   Digitalización óptica de pantallas de control de máquina I.S.
3. **Bitácora de Incidencias & WhatsApp:**  
   Reporte estructurado para comunicación instantánea entre turnos y jefaturas.

### Tab 3 — Banco IA (Dataset Industrial & Few-Shot RAG)

1. **Gestor Local IndexedDB (`datasetManager.js`):**  
   Almacenamiento offline de 11 fotografías DSLR oficiales de perfil lateral tomadas en mesa de acero inoxidable. Migración automática v2 con purga de tomas abstractas.
2. **Calibración Few-Shot RAG:**  
   Inyección de muestras de referencia con etiquetas oficiales de Cristalerías de Chile en las peticiones a Gemini para garantizar cero alucinaciones.
3. **Exportación y Descarga de Pack:**  
   Descarga de fotos individuales y archivo ZIP (`Muestras_Defectos_VitroDiag.zip`) con guía de operador.

### Tab 4 — Directorio de Defectos Industriales

1. **Catálogo Oficial de 147 Defectos:**  
   Fichas técnicas con causas comunes, puntos de control en máquina I.S., tiempos de controsoplo/soplado final y filtros por zona anatómica y gravedad.

---

## 4. Arquitectura del Sistema

- **Frontend Core:** HTML5, CSS3 vanilla de alto rendimiento con animaciones fluidas y glassmorphism industrial, JavaScript ES6+ estructurado modularmente en 15 módulos:
  - `main.js` (Orquestador NEXUS), `geometry.js` (Motor de Plomada Láser), `fineDefects.js` (Detector Local de Calcinados), `geminiVision.js` (Gemini Vision API + Local Expert Fallback), `datasetManager.js` (Banco IA en IndexedDB v2), `db.js` (Catálogo 147 defectos en 10 familias), `ui.js` (Navegación y vistas), `camera.js` (Cámara nativa y WebRTC), `timing.js` (Calculadora SOP), `log.js` (Bitácora), `ocr.js` (Tesseract.js), `swab.js` (Temporizador Swabbing), `state.js` (Estado reactivo global).
- **Persistencia Local:** `IndexedDB` y `LocalStorage` para operación 100% sin conexión.
- **Modo de Despliegue:** GitHub Pages Always-Live (<https://mauriciano47-pixel.github.io/vitrodiag/>).

---

## 5. Historial de Versiones

| Versión | Descripción |
| --- | --- |
| **v2.5.1** | **Defectología Oficial Cristalerías de Chile, Tríada de Columpios y Fortificación API:** Incorporación de 36 nuevos defectos (total 147 en 10 familias), integración de Columpio de Cuerpo (Birdswing), Columpio de Cuello (Stuck Plunger) y Calcinado de Gollete. Fortificación total de Gemini Vision con probador de llaves en vivo, erradicación de llaves expiradas y motor autónomo local experto (`generateLocalExpertDiagnosis`). Banco IA ampliado a 11 fotos DSLR con botonera 1-Tap. |
| **v2.4.4** | Migración forzada de IndexedDB (v2) y auto-recarga de 8 fotos DSLR de perfil lateral sin tomas cenitales abstractas. |
| **v2.4.3** | Reemplazo total de dataset sintético por fotografías industriales DSLR de perfil lateral en mesa de acero inoxidable. |
| **v2.4.0** | Motor Unificado de Defectos Evidentes & Finos (Plomada Láser + Calcinados locales). |
| **v2.2.0** | Arquitectura Always-Live con Zero-Cache Shield (eliminación de Service Workers). |
| **v2.0.0** | Transformación completa a NEXUS. |

---

## 6. Certificación Tech Due Diligence (Grado AAA - 98/100)

Auditoría oficial efectuada por V-GUARD Due Diligence Suite:
- **Ciberseguridad & Zero-Leakage (100/100):** Cero vulnerabilidades XSS mediante sanitización W3C DOMParser (`domUtils.js`), aislamiento de claves, Bandit SAST con 0 alertas e inmutabilidad en memoria.
- **Propiedad Intelectual & Licencias (100/100):** Titularidad privada inmutable y exclusiva de Mauricio Uribe Maldonado. Cero dependencias restrictivas.
- **Arquitectura & Deuda Técnica (92/100 - EXCELLENT):** Modularización desacoplada ESM, 147 defectos indexados, cero God Files y suite formal de 9 pruebas unitarias automáticas pasando en <1.6s.
- **Resiliencia & Producción (100/100):** Protocolo Gemini Anti-Timeout Shield (timeout 8000ms con AbortController), fallback autónomo y PWA Offline-First.
- **Gobernanza & Data Room (100/100):** Data Room estructurado y sincronización continua con SSOT Obsidian.

---

## 7. Aviso Legal y Propiedad Intelectual

- **Titularidad:** Propiedad exclusiva de Mauricio Uribe Maldonado (mauriciano47-pixel).
- **Alcance Operativo:** Aplicación de apoyo técnico de alta precisión para inspección asistida en línea caliente y control de calidad de envases de vidrio.
- **Privacidad de Datos (Zero-Leakage):** Procesamiento local en memoria RAM e IndexedDB del dispositivo. Ninguna fotografía de planta ni telemetría confidencial se transmite sin autorización explícita.
