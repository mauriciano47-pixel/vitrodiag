# VitroDiag NEXUS v2.2.2 — Always-Live Architecture

Inspección Asistida por IA & Moldería I.S. para Operador de Cristal Chile.

## 🚀 Novedades v2.2.2: Galería Receptora, Acopio de Fotos & Descongelamiento Total

- **Galería Receptora & Acopio de Fotos (IndexedDB):** Toda foto tomada con el visor en vivo, cámara nativa o cargada desde galería se almacena automáticamente en el almacén local persistente con miniaturas, hora exacta de toma, artículo y diagnóstico.
- **Descongelamiento y Corrección de Ciclo de Vida:** Inicialización defensiva de módulos ante carga asíncrona (`document.readyState`), garantizando que todos los controladores de eventos, base de datos y botones funcionen instantáneamente sin bloqueos.
- **Visor de Cámara en Vivo & Captura Instantánea:** Activación fluida de streaming WebRTC con botón táctil directo `📸 CAPTURAR VISOR` y botón secundario `📷 FOTO NATIVA`.
- **Catálogo Oficial de 111 Defectos Industriales:** Incluye la familia completa de calcinados de moldería y swabbing, con filtros ópticos para alta iluminación en planta.

## Flujo Principal

1. 🎥 **Visor Óptico & Cámara en Vivo** — Encuadre con retícula HUD, selección de filtro óptico para mitigar reflejos y captura instantánea a 1 clic.
2. ⚡ **Diagnosticar con IA** — Gemini 2.0 Flash Vision API analiza la imagen contra el catálogo pre-renderizado de 111 defectos industriales.
3. 📸 **Galería Receptora & Acopio** — Historial visual de fotos del turno para re-inspección o guardado en el Banco IA.
4. 📋 **Ajustes de Máquina I.S.** — Acciones correctivas inmediatas para el operador en línea caliente.

## URL de Producción

<https://mauriciano47-pixel.github.io/vitrodiag/>
