# VitroDiag v1.1.1

Muestreo Rápido NNPB y Reconocimiento de Defectos para Operador I.S. de Cristal Chile.

## Descripción

VitroDiag es una plataforma Progressive Web App (PWA) de asistencia óptica, control de moldería y diagnóstico inteligente de envases de vidrio en tiempo real utilizando la cámara del smartphone.

## Características

- 📱 **Visión en Vivo:** Acceso a cámara del smartphone con guías dinámicas de moldería según ficha técnica.
- 🧠 **MotorVision v1.1.1:** Inferencia de IA multimodal con Gemini 2.0 Flash inyectado con el **catálogo oficial de 96 defectos** vidrieros.
- 🎯 **Clasificación Multizona de Precisión:** Diagnóstico automático por zona anatómica (Boca, Cuello, Hombro, Cuerpo, Fondo) y severidad (Crítico, Mayor, Menor).
- ⚙️ **Acciones Correctivas I.S.:** Mapeo instantáneo con los ajustes sugeridos de máquina I.S. y moldes.
- ⚡ **Filtrado Anti-Falsas Lecturas:** Algoritmo continuo `maxContinuous` y `isBottlePresent`.
- 📵 **Resiliencia Offline PWA:** Funcionalidad offline-first mediante análisis de contorno de moldería local.

## Cómo usar

1. Abre la app en tu celular desde [VitroDiag PWA](https://mauriciano47-pixel.github.io/vitrodiag/).
2. Permite acceso a la cámara.
3. Selecciona el artículo activo en producción (ej. SSP 296, Cerveza 330, Vino Bordelesa 750).
4. Configura tu API Key de Gemini en el panel de IA para análisis profundo multimodal.
5. Obtén diagnósticos visuales instantáneos con acciones para la máquina I.S.

## Catálogo de 96 Defectos Detectados

- **Boca (18 defectos):** Rebaba en Boca, Boca Incompleta, Grieta en Boca, Rosca Partida, Boca Hinchada, Línea sobre Boca, etc.
- **Cuello (13 defectos):** Cuello Doblado, Costura Alta, Estrías, Cuello Obstruido, Pliegue de Cuello, Cuello Estirado, etc.
- **Cuerpo (24 defectos):** Columpio/Birdswing, Pared Delgada, Burbujas, Piedras, Hombro Hundido, Vidrio Sucio, Cuerpo Ovalado, etc.
- **Fondo (16 defectos):** Fondo Delgado, Grieta en Base, Asiento Desparejo, Pico de Base, Fondo Abombado, Fisura en Talón, etc.
- **Generales (25 defectos):** Botella Deformada, Marcas de Empujador, Vidrio Frío, Temperatura Descompensada, etc.

---

**Desarrollador:** Mauricio Uribe Maldonado (mauriciano47-pixel)
