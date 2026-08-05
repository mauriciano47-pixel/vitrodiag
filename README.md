# VitroDiag NEXUS v2.0.2

Inspección Asistida por IA — Moldería I.S. para Operador de Cristal Chile.

## Concepto

**NEXUS** = El punto de conexión inteligente entre el operador I.S., la inteligencia artificial de Gemini 2.0 Flash y la planta de producción. Inspección asistida, no automática: el operador captura, la IA diagnostica.

## Flujo Principal

1. 📸 **Tomar Foto** del envase con la cámara nativa del celular (1-clic sin desplazarse)
2. ⚡ **Diagnosticar con IA** — Gemini 2.0 Flash analiza la imagen contra el catálogo de 96 defectos industriales
3. 📋 **Resultado** — Defecto identificado, zona, gravedad, confianza y acciones correctivas para la máquina I.S.

## Herramientas Complementarias

- ⚙️ Calculadora SOP (Tiempos de Soplado NNPB/Blow-Blow) & Swabbing
- 📡 Escáner OCR de Consolas BDF (Tesseract.js)
- 📋 Bitácora de Turno + Exportación a WhatsApp
- 📸 Banco IA (Few-Shot RAG en IndexedDB para calibración de Gemini)
- 📖 Catálogo Oficial de 96 Defectos Industriales (Filtrable por Zona y Gravedad)

## Arquitectura y Tecnologías

- PWA Offline-First (HTML5, CSS3 vanilla sin estilos inline, JS ES6+)
- Gemini 2.0 Flash Vision API (Inspección Multimodal con Bounding Boxes)
- IndexedDB + Few-Shot RAG
- Tesseract.js (OCR de pantalla BDF)
- Service Worker v2.0.2 autónomo con autopurga de versiones previas

## URL de Producción

<https://mauriciano47-pixel.github.io/vitrodiag/>
