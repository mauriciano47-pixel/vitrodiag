# VitroDiag NEXUS v2.2.0 — Propuesta Técnica Oficial y Documentación del Proyecto

**Desarrollador:** Mauricio Uribe Maldonado (mauriciano47-pixel)  
**Planta / Empresa Target:** Cristal Chile (Proceso NNPB, Soplo-Soplo y Prensado)  
**URL de Producción PWA:** <https://mauriciano47-pixel.github.io/vitrodiag/>  
**Estado del Proyecto:** Prototipo Funcional Finalizado (v2.2.0 — Arquitectura Always-Live & Zero-Cache Shield)  

---

## 1. Filosofía y Objetivo del Proyecto

VitroDiag es una plataforma Progressive Web App (PWA) de precisión industrial diseñada para ser utilizada directamente en la planta caliente por el operador de máquina I.S. Su objetivo fundamental es proporcionar un diagnóstico óptico asistido por IA en tiempo real sobre la conformidad geométrica de los envases de vidrio recién soplados, permitiendo corregir a tiempo variaciones en la moldería, tiempos de soplado (SOP) y alineación antes de que el material ingrese al arca de recocido.

El concepto **NEXUS** representa el punto de conexión inteligente entre el operador I.S., la inteligencia artificial de Gemini 2.0 Flash y la planta de producción. La filosofía es **inspección asistida, no automática**: el operador encuadra con la retícula táctica y visor en vivo, la IA diagnostica, el operador decide.

Diseñada bajo una arquitectura híbrida inteligente (Offline-First local + Gemini 2.0 Flash Vision API en la nube con catálogo pre-renderizado de 104 defectos industriales), VitroDiag ejecuta todos sus motores de visión en el dispositivo móvil y permite diagnósticos profundos con IA multimodal cuando hay conexión activa.

---

## 2. Flujo Principal NEXUS

```text
1. 📸  Visor & Retícula  →  El operador encuadra el envase con la retícula táctica por zonas anatómicas
2. ⚡  Diagnosticar      →  Gemini 2.0 Flash Vision analiza contra el catálogo de 104 defectos industriales
3. 📋  Resultado        →  Defecto · Zona · Gravedad · Confianza · Bounding Boxes 2D · Acciones correctivas I.S.
```

---

## 3. Catálogo Completo de Funciones (v2.0.2)

### Tab 1 — Inspección NEXUS (Motor Principal)

1. **Diagnóstico IA Multimodal Fotográfico con Gemini 2.0 Flash:**  
   El operador toma o sube una foto del envase. Gemini 2.0 Flash evalúa la textura, transparencia y refracción contra el **catálogo oficial de 96 defectos industriales** y devuelve: defecto detectado, zona anatómica (Corona, Cuello, Hombro, Cuerpo, Fondo), nivel de gravedad, confianza y acciones correctivas específicas para la máquina I.S.

2. **Bounding Boxes sobre la imagen:**  
   Superposición de recuadros delimitadores 2D sobre la foto del envase indicando la zona exacta del defecto.

3. **Few-Shot RAG con Banco IA:**  
   Inyección opcional de muestras reales etiquetadas en planta como contexto adicional a Gemini para maximizar la precisión en defectos minuciosos.

### Tab 2 — Herramientas Industriales

1. **Calculadora SOP & Swabbing:**  
   Algoritmo de cálculo de tiempos de soplo (SOP) según BPM, cavidades y peso. Sugiere intervalos óptimos de lubricación de moldes (swabbing) y previene sobrecalentamiento.

2. **Escáner OCR de Consolas BDF (Tesseract.js):**  
   Reconocimiento óptico de caracteres para digitalizar pantallas de control BDF. Convierte fotografías de consolas I.S. en datos numéricos editables de tiempos de soplo y enfriamiento.

3. **Bitácora de Incidencias & WhatsApp:**  
   Registro estructurado de paradas, defectos de moldeo y ajustes realizados. Exporta reportes formateados instantáneamente para ser enviados por WhatsApp a jefes de turno y mantenimiento.

### Tab 3 — Catálogo de 96 Defectos Industriales

1. **Directorio filtrable de defectos:**  
   Base de conocimiento con los 96 defectos estándar de la industria vidriera, clasificados por zona, gravedad y tipo (geométrico, superficial, distribución de vidrio). Con tarjetas expandibles y buscador.

### Tab 4 — Banco IA (Few-Shot RAG)

1. **Módulo de Entrenamiento IA & Calibración Few-Shot RAG:**  
   Gestor en IndexedDB para capturar, etiquetar y exportar fotos de defectos reales en planta. Inyecta muestras reales de calibración en la API de Gemini Vision para máxima certeza.

### Sistema Base

1. **PWA Offline Autónomo (Service Worker v2.0.2):**  
   Instalación de app nativa con caché inteligente HTML5 pura. Purga automática de caché de versiones anteriores. Permite operar al 100% de capacidad en zonas ciegas sin cobertura de red o Wi-Fi.

2. **Interfaz de Usuario Limpia y Cero Errores:**  
   Arquitectura de CSS modular sin estilos inline, optimizada para un renderizado ultra-rápido en dispositivos móviles de planta.

---

## 4. Arquitectura del Sistema

- **Frontend Core:** HTML5, CSS3 vanilla de alto rendimiento con animaciones fluidas y glassmorphism industrial, JavaScript ES6+ estructurado modularmente en 14 módulos:
  - `main.js` (Orquestador NEXUS), `geminiVision.js` (Gemini 2.0 Flash API + Bounding Boxes), `db.js` (96 defectos + IndexedDB), `ai.js` (motor diagnóstico), `datasetManager.js` (Banco IA Few-Shot RAG), `ui.js` (navegación y modales), `camera.js` (cámara nativa), `vision.js` (visión contornos), `timing.js` (Calculadora SOP), `log.js` (Bitácora), `ocr.js` (Tesseract.js), `swab.js` (Swabbing), `state.js` (estado global), `geometry.js` (detector geométrico).
- **Backend / Django Server (Opcional Local):** Django 5.x con `django-axes` para protección contra fuerza bruta.
- **Persistencia Local:** `IndexedDB` y `LocalStorage` para operación 100% sin conexión.
- **Service Worker:** `sw.js` v2.0.2 con estrategia Cache First y purga automática de versiones anteriores.

---

## 5. Ventajas Competitivas e Industriales

- **Reconocimiento de los 96 Defectos de la Industria Vidriera:** Identificación inmediata con diagnósticos y ajustes en máquina I.S.
- **Autonomía Operativa Total (Cero Latencia Local):** PWA offline funcional en zonas ciegas de planta.
- **Flujo Simplificado:** Foto → Diagnóstico en 3 pasos. Sin configuraciones complejas para el operador.
- **Reducción de Merma en Línea Caliente:** Detección temprana de defectos minutos antes de llegar a la línea fría.
- **Estandarización del Criterio de Operación:** Guía interactiva con sugerencias de ajuste de máquina I.S.
- **Despliegue Multi-Plataforma:** Compatible con Android, iOS (Safari) y computadores sin tiendas de apps.

---

## 6. Historial de Versiones

| Versión | Descripción |
| --- | --- |
| **v2.2.0** | Implementación de Arquitectura Always-Live con Zero-Cache Shield: eliminación total de Service Workers y CacheStorage, micro-bootstrapper dinámico y detector de actualizaciones en caliente. |
| **v2.1.4** | Validación integral con suite de pruebas `mecanico1` y estabilización de visor de cámara. |
| **v2.1.2** | Encendido automático de visor, retícula táctica activa y catálogo pre-renderizado de 104 defectos industriales. |
| **v2.0.3** | Despliegue de PWA Cache Shield con autopurga de versiones previas. |
| **v2.0.2** | Extracción total de estilos inline a CSS modular, limpieza completa de advertencias del linter y optimización PWA. |
| v2.0.1 | Refactorización de UI/CSS e integración de modal de diagnóstico de cámara WebRTC. |
| **v2.0.0** | Transformación completa a NEXUS. Flujo Foto→Gemini→Diagnóstico. 4 tabs limpias. Eliminación de código muerto CNN/calibración. |
| v1.3.1 | Fix bucle infinito de Service Worker. |
| v1.3.0 | Solución integral de cámara móvil con panel físico de botones. |
| v1.2.3 | Fix bloqueo del botón de encendido de cámara. |
| v1.2.2 | Estabilización en smartphones. |
| v1.2.1 | Fix parpadeo MotorVision, Directorio 96 e interactividad modal Banco IA. |

---

## 7. Visión a Futuro y Hoja de Ruta (Roadmap)

- **Fase 1 (Actual — v2.0.3):** Inspector NEXUS con Gemini 2.0 Flash, 4 tabs, 96 defectos, OCR de consolas, calculadora SOP, Banco IA y PWA Cache Shield.
- **Fase 2 — Integración Térmica Infrarroja:** Compatibilidad con sensores infrarrojos portátiles (Flir One/Seek Thermal) para mapas de temperatura en gotas de vidrio y moldes.
- **Fase 3 — Dataset Cuantizado de Cristal Chile:** Recolección y entrenamiento de miles de imágenes de defectos reales de planta.
- **Fase 4 — Conexión IoT & SCADA:** Integración opcional vía WebSockets con consolas de máquina I.S.

---

## 8. Aviso Legal y Políticas de Privacidad

- **Margen de Error y Responsabilidad:** Prototipo funcional experimental. No sustituye el juicio técnico del operador especializado ni los instrumentos metrológicos de laboratorio.
- **Privacidad de Datos:** Procesamiento local en memoria RAM del dispositivo. Ninguna foto ni video se almacena externamente sin consentimiento.
