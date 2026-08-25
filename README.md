# VitroDiag NEXUS v2.2.7 — Always-Live Architecture

Inspección Asistida por IA & Moldería I.S. para Operador de Cristal Chile.

## 🚀 Novedades v2.2.7: Estabilización Integral del Motor de Visión, Bounding Boxes Adaptativos y Cero-Lag

- **Sincronización Inmediata de Hardware & Loop de Visión:** Vinculación directa de `startProcessing()` y `stopProcessing()` al ciclo de vida de `getUserMedia`, eliminando la latencia del watchdog y asegurando 0ms de retardo al iniciar o alternar cámaras.
- **Renderizado Adaptativo de Bounding Boxes (`nexusBboxCanvas`):** Proyección visual garantizada de los recuadros de defectos con soporte dual de escalas normalizadas (0-1000 y 0.0-1.0) sobre la foto capturada.
- **Filtros Ópticos Industriales Vinculados:** Variable global sincronizada para aplicar polarizado, calcinados y micro-fisuras directamente en el procesamiento de fotogramas y envíos a Gemini IA.
- **Inferencia Robusta con Validación de Dimensiones Canvas:** Prevención de excepciones WebGL en TensorFlow.js y cascada tolerante de endpoints de Gemini con timeout anti-congelamiento de 8s.

## URL de Producción

<https://mauriciano47-pixel.github.io/vitrodiag/>
