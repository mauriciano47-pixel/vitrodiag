# VitroDiag NEXUS v2.2.1 — Always-Live Architecture

Inspección Asistida por IA & Moldería I.S. para Operador de Cristal Chile.

## 🚀 Novedades v2.2.1: Defectos Calcinados & Filtros Ópticos de Planta

- **Familia Completa de Defectos Calcinados (111 Defectos en Total):** Incorporación de calcinado en boca, cuello, hombro, cuerpo, fondo y pintas negras de grafito quemado/swabbing.
- **Barra de Filtros Ópticos para Alta Iluminación:** Selector rápido en el visor con modos *Normal*, *🕶️ Silueta / Polarizado (Mitiga reflejos ambientales)*, *⚫ Calcinados / Inclusiones (Realce de carbón y pintas)* y *⚡ Micro-Fisuras (Inversión de alta frecuencia)*.
- **Estrategia IA en Dos Niveles:** Detección directa de defectos notorios con Gemini 2.0 y calibración de defectos minuciosos/específicos mediante el **Banco IA (Few-Shot RAG)**.
- **Arquitectura Always-Live (Zero-Cache Shield):** Carga instantánea de módulos con hash dinámico en caliente (`version.json`) y auto-desinstalación de Service Workers.

## Flujo Principal

1. 📸 **Visor Óptico & Filtros de Planta** — Selección de filtro óptico según la iluminación del turno y retícula anatómica de encuadre por zonas.
2. ⚡ **Diagnosticar con IA** — Gemini 2.0 Flash Vision API analiza la imagen contra el catálogo pre-renderizado de 111 defectos industriales.
3. 📋 **Resultado** — Defecto identificado, zona, gravedad, confianza, Bounding Boxes 2D y acciones correctivas para la máquina I.S.

## Herramientas Complementarias

- ⚙️ Calculadora SOP (Tiempos de Soplado NNPB/Blow-Blow) & Swabbing
- 📡 Escáner OCR de Consolas BDF (Tesseract.js)
- 📋 Bitácora de Turno + Exportación a WhatsApp
- 📸 Banco IA (Few-Shot RAG en IndexedDB para calibración de Gemini)
- 📖 Catálogo Oficial de 111 Defectos Industriales (Pre-renderizado en HTML5 estático, filtrable por Zona y Gravedad)

## URL de Producción

<https://mauriciano47-pixel.github.io/vitrodiag/>
