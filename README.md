# VitroDiag NEXUS v2.1.2

Inspección Asistida por IA — Moldería I.S. para Operador de Cristal Chile.

## Concepto

**NEXUS** = El punto de conexión inteligente entre el operador I.S., la inteligencia artificial de Gemini 2.0 Flash y la planta de producción. Inspección asistida, no automática: el operador captura o encuadra con el visor en vivo, la IA diagnostica.

## Flujo Principal

1. 📸 **Visor en Vivo & Retícula Activa** — Flujo continuo de cámara nativa con guías de alineación anatómica por zonas del envase (Boca, Cuello, Hombro, Cuerpo, Fondo)
2. ⚡ **Diagnosticar con IA** — Gemini 2.0 Flash Vision API analiza la imagen contra el catálogo pre-renderizado de 104 defectos industriales
3. 📋 **Resultado** — Defecto identificado, zona, gravedad, confianza, Bounding Boxes 2D y acciones correctivas para la máquina I.S.

## Herramientas Complementarias

- ⚙️ Calculadora SOP (Tiempos de Soplado NNPB/Blow-Blow) & Swabbing
- 📡 Escáner OCR de Consolas BDF (Tesseract.js)
- 📋 Bitácora de Turno + Exportación a WhatsApp
- 📸 Banco IA (Few-Shot RAG en IndexedDB para calibración de Gemini)
- 📖 Catálogo Oficial de 104 Defectos Industriales (Pre-renderizado en HTML5, filtrable por Zona y Gravedad)

## Arquitectura y Tecnologías

- PWA Offline-First (HTML5, CSS3 vanilla sin estilos inline, JS ES6+)
- Gemini 2.0 Flash Vision API (Inspección Multimodal con Bounding Boxes 2D)
- Visor de cámara en streaming interactivo con Canvas Canvas2D Retícula Overlays
- Pre-renderizado estático HTML5 de los 104 defectos (cero dependencia de JS asíncrono para render inicial)
- IndexedDB + Few-Shot RAG
- Tesseract.js (OCR de pantalla BDF)
- Service Worker v2.1.2 autónomo con PWA Cache Shield y purga forzada de caché
- Agente `memorioso1` integrado para prevención activa de regresiones PWA

## URL de Producción

<https://mauriciano47-pixel.github.io/vitrodiag/>
