import { state } from './state.js';
import { showToast } from './ui.js';
import { processFrame } from './vision.js';

// ⚠️ FIX #4: Referencias DOM obtenidas de forma lazy dentro de las funciones
// para evitar crash cuando el módulo se importa antes de DOMContentLoaded.
function getTfjsStatus() { return document.getElementById('tfjsStatus'); }
function getBtnDiagnosticar() { return document.getElementById('btnDiagnosticar'); }
function getBtnReanudar() { return document.getElementById('btnReanudarCamara'); }
function getCard() { return document.getElementById('resultadoCard'); }
function getCanvas() { return document.getElementById('canvasOutput'); }

function updateConfidenceThresholdDisplay(val) {
            state.confidenceThreshold = parseInt(val);
            const badge = document.getElementById('iaConfidenceBadge');
            if (badge) badge.innerText = `Filtro: >${state.confidenceThreshold}%`;
        }

async function warmUpModel(model) {
    if (!model || typeof tf === 'undefined') return;
    const tfjsStatus = getTfjsStatus();
    try {
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor de Visión: Calibrando modelo local (Warm-up)...";
            tfjsStatus.style.color = "#fbbf24";
        }
        tf.tidy(() => {
            const dummy = tf.zeros([1, 224, 224, 3]);
            const prediction = model.predict(dummy);
            prediction.dataSync(); // Fuerza la ejecución sincrona para compilar shaders
        });
        console.log("TFJS: Warm-up completado.");
    } catch (e) {
        console.warn("TFJS: Warm-up omitido o fallido: ", e);
    }
}

async function loadCustomUploadedModel() {
            const jsonInput = document.getElementById('uploadModelJson');
            const binInput = document.getElementById('uploadModelBin');
            const tfjsStatus = getTfjsStatus();

            if (!jsonInput || !binInput || jsonInput.files.length === 0 || binInput.files.length === 0) {
                showToast("Debes seleccionar el archivo model.json y sus pesos (.bin)", "warning");
                return;
            }

            const modelJsonFile = jsonInput.files[0];
            const weightsFiles = Array.from(binInput.files);

            if (tfjsStatus) {
                tfjsStatus.innerText = "Cargando modelo personalizado en GPU local...";
                tfjsStatus.style.color = "#fbbf24";
            }

            try {
                // Carga dinámica local usando IndexedDB y FileReader en TF.js
                state.tfModel = await tf.loadLayersModel(tf.io.browserFiles([modelJsonFile, ...weightsFiles]));
                await warmUpModel(state.tfModel);
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Motor IA: Red Neuronal Personalizada cargada con éxito";
                    tfjsStatus.style.color = "#10b981";
                }
                showToast("Modelo de IA personalizado conectado con éxito", "success");
            } catch (err) {
                console.error("Error al cargar modelo subido:", err);
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Error: Fallo al cargar los archivos de la Red Neuronal";
                    tfjsStatus.style.color = "#ef4444";
                }
                showToast("Error al procesar modelo. Asegúrate que correspondan a TensorFlow.js", "danger");
            }
        }

async function loadTensorFlowModel() {
            const tfjsStatus = getTfjsStatus();
            if (typeof tf === 'undefined') {
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Visión: Librerías de red neuronal no cargadas";
                    tfjsStatus.style.color = "#ef4444";
                }
                return;
            }
            try {
                await tf.setBackend('webgl'); // Forzar explícitamente backend de GPU si está disponible
                console.log("Backend TFJS activo:", tf.getBackend());
            } catch (e) {
                console.warn("Backend WebGL no disponible, usando defecto:", e);
            }

            try {
                const isGithubPages = window.location.hostname.includes('github.io') || window.location.pathname.includes('/vitrodiag');
                const modelPath = isGithubPages ? 'model/model.json' : '/static/model/model.json';
                if (tfjsStatus) {
                    tfjsStatus.innerText = `Buscando modelo en ${modelPath}...`;
                }
                // Carga asíncrona del modelo guardado localmente en la PWA
                state.tfModel = await tf.loadLayersModel(modelPath);
                await warmUpModel(state.tfModel);
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Motor IA: Red Neuronal CNN cargada offline";
                    tfjsStatus.style.color = "#10b981"; // Verde (Success)
                }
            } catch (err) {
                console.log("No se encontró un modelo entrenado en /static/model/model.json. Usando diagnóstico de contornos.");
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Motor de Visión: Análisis de Contornos Activo (Algorítmico)";
                    tfjsStatus.style.color = "#06b6d4"; // Cyan
                }
            }
        }

let lastDiagStatus = 'alineando'; // Estado de diagnóstico anterior: 'alineando', 'aceptable', 'rechazo'
let audioCtx = null;

// Inicializa o reanuda el AudioContext global de forma controlada
function initAudioContext() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.log("Error al reanudar AudioContext:", e));
        }
        return audioCtx;
    }
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
        console.log("[Audio] AudioContext global instanciado.");
    } catch (e) {
        console.warn("[Audio] Navegador no soporta Web Audio API:", e);
    }
    return audioCtx;
}

// Desbloquear audio con el primer toque en pantalla
function unlockAudio() {
    const ctx = initAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
            console.log("[Audio] AudioContext desbloqueado y reanudado.");
        });
    }
    // Confirmar audio en Safari con un pulso silencioso
    if (ctx) {
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(0);
            osc.stop(0.05);
        } catch(e){}
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
}
document.addEventListener('click', unlockAudio);
document.addEventListener('touchstart', unlockAudio);

function playBeep(type) {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.log("Error reanudando en play:", e));
    }

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
            // Tono corto y agudo (Aceptable)
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'danger') {
            // Tono doble de advertencia (Rechazo)
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            osc.start(ctx.currentTime);
            
            setTimeout(() => {
                try {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.setValueAtTime(700, ctx.currentTime);
                    gain2.gain.setValueAtTime(0.35, ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.25);
                } catch(e){}
            }, 120);

            osc.stop(ctx.currentTime + 0.1);
        }
    } catch (e) {
        console.warn("Fallo al reproducir audio web:", e);
    }
}

function triggerVibration(type) {
    if ('vibrate' in navigator) {
        try {
            if (type === 'success') {
                navigator.vibrate(150);
            } else if (type === 'danger') {
                navigator.vibrate([150, 80, 150]);
            }
        } catch(e){}
    }
}

function fallbackAlgorithmicDiagnosis() {
    const tfjsStatus = getTfjsStatus();
    if (tfjsStatus) {
        tfjsStatus.innerText = "Motor OpenCV: Analizando eje dinámico del cuello...";
        tfjsStatus.style.color = "#06b6d4";
    }
    
    const borders = state.lastProcessedBorders;
    const width = state.lastBordersWidth;
    const height = state.lastBordersHeight;

    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');

    if (!borders || width === 0 || height === 0) {
        lastDiagStatus = 'alineando';
        if (diagTitulo) diagTitulo.innerText = "⚠️ SILUETA NO DETECTADA";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Inconcluso";
        }
        if (diagEstado) diagEstado.innerText = "El sistema no detecta suficientes bordes para realizar la comparación geométrica.";
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>Comprobar alineación de la botella respecto al molde patrón.</li>
                <li>Asegurarse de activar el 'Modo Contorno / Silueta'.</li>
            `;
        }
        return;
    }

    // 1. Localización Altitudinal Dinámica (Buscar dónde empieza y termina la botella en el eje vertical)
    const rowCounts = new Array(height).fill(0);
    const validRows = [];

    for (let y = 0; y < height; y++) {
        let count = 0;
        for (let x = 0; x < width; x++) {
            if (borders[y * width + x] > 128) {
                count++;
            }
        }
        rowCounts[y] = count;
        if (count >= 3) { // Al menos 3 píxeles de contorno en la fila
            validRows.push(y);
        }
    }

    // Si la botella no ocupa al menos un 15% del visor vertical, se considera alineando
    if (validRows.length < (height * 0.15)) {
        lastDiagStatus = 'alineando';
        if (diagTitulo) diagTitulo.innerText = "📷 Alineando Envase...";
        if (diagGravedad) {
            diagGravedad.style.display = "none";
        }
        if (diagEstado) diagEstado.innerText = "Buscando envase... Coloca el cuerpo y cuello de la botella en las guías.";
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>Centra la botella en la pantalla.</li>
                <li>Verifica que el contraste sea suficiente para delimitar los bordes.</li>
            `;
        }
        return;
    }

    const bottleTopY = validRows[0];
    const bottleBottomY = validRows[validRows.length - 1];
    const bottleHeight = bottleBottomY - bottleTopY;

    // 2. Segmentación Relativa
    // Cuerpo (Base): del 55% al 85% de la botella real
    const bodyCenters = [];
    const bodyWidths = [];
    const startBodyY = Math.floor(bottleTopY + bottleHeight * 0.55);
    const endBodyY = Math.min(height - 1, Math.floor(bottleTopY + bottleHeight * 0.85));

    for (let y = startBodyY; y < endBodyY; y += 3) {
        let leftX = -1;
        let rightX = -1;

        for (let x = 0; x < width; x++) {
            if (borders[y * width + x] > 128) {
                leftX = x;
                break;
            }
        }

        for (let x = width - 1; x >= 0; x--) {
            if (borders[y * width + x] > 128) {
                rightX = x;
                break;
            }
        }

        if (leftX !== -1 && rightX !== -1 && (rightX - leftX) > (width * 0.12)) {
            bodyCenters.push((leftX + rightX) / 2);
            bodyWidths.push(rightX - leftX);
        }
    }

    if (bodyCenters.length < 4) {
        lastDiagStatus = 'alineando';
        if (diagTitulo) diagTitulo.innerText = "⚠️ DETECCIÓN INESTABLE";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Alineando";
        }
        if (diagEstado) diagEstado.innerText = "No se puede establecer el eje central del cuerpo de la botella. Evita reflejos.";
        return;
    }

    const avgBodyCenter = bodyCenters.reduce((sum, val) => sum + val, 0) / bodyCenters.length;
    const avgBodyWidth = bodyWidths.reduce((sum, val) => sum + val, 0) / bodyWidths.length;

    // Cuello: del 5% al 42% de la botella real (excluye la boca que puede tener rebabas)
    const neckDeviations = [];
    const startNeckY = Math.floor(bottleTopY + bottleHeight * 0.05);
    const endNeckY = Math.floor(bottleTopY + bottleHeight * 0.42);
    let validNeckLayers = 0;

    for (let y = startNeckY; y < endNeckY; y += 3) {
        let leftX = -1;
        let rightX = -1;

        for (let x = 0; x < width; x++) {
            if (borders[y * width + x] > 128) {
                leftX = x;
                break;
            }
        }

        for (let x = width - 1; x >= 0; x--) {
            if (borders[y * width + x] > 128) {
                rightX = x;
                break;
            }
        }

        if (leftX !== -1 && rightX !== -1 && (rightX - leftX) > (width * 0.04)) {
            const neckCenter = (leftX + rightX) / 2;
            const deviation = Math.abs(neckCenter - avgBodyCenter);
            neckDeviations.push(deviation);
            validNeckLayers++;
        }
    }

    if (validNeckLayers < 3) {
        runLegacyPixelCountDiagnosis(borders, width, height, avgBodyCenter);
        return;
    }

    const maxDeviation = Math.max(...neckDeviations);
    // Multiplicamos por 200 en lugar de 100 para duplicar la sensibilidad, ya que el cuello torcido simple a veces no se detectaba
    const percentDeviation = (maxDeviation / avgBodyWidth) * 200;

    const sliderVal = document.getElementById('sliderTolerance') ? document.getElementById('sliderTolerance').value : 5;
    const toleranceLimit = parseInt(sliderVal) || 5;

    console.log(`[Eje Dinámico v1.0.51] Altura: ${bottleHeight}px | Top: ${bottleTopY} | Base: ${bottleBottomY} | Desvío: ${percentDeviation.toFixed(2)}% | Límite: ${toleranceLimit}%`);

    const cursorText = document.querySelector('.cursor-text');
    const crosshairX = document.querySelector('.crosshair-x');
    const crosshairY = document.querySelector('.crosshair-y');

    if (percentDeviation > toleranceLimit) {
        // Cuello torcido confirmado
        if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico: Cuello Torcido / Deformado";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Rechazo Inmediato";
        }
        if (diagEstado) diagEstado.innerText = `Desviación del eje del cuello detectada: ${percentDeviation.toFixed(1)}% (Límite: ${toleranceLimit}%).`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li><strong>Mecanismo IS:</strong> Ajustar alineación de la pinza de transferencia y brazo de soplado.</li>
                <li><strong>Moldería:</strong> Inspeccionar corona y encaje del anillo de cuello.</li>
                <li><strong>Proceso:</strong> Revisar distribución de vidrio en el parison y enfriamiento del macho.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Cuello Desviado (${percentDeviation.toFixed(1)}% / Límite ${toleranceLimit}%)`;
            tfjsStatus.style.color = "#ef4444";
        }
        
        // Actualizar cursor visual
        if (cursorText) {
            cursorText.innerText = 'RECHAZO: CUELLO TORCIDO';
            cursorText.style.color = '#ef4444';
            if (crosshairX) crosshairX.style.backgroundColor = '#ef4444';
            if (crosshairY) crosshairY.style.backgroundColor = '#ef4444';
        }

        // Tono y vibración de aviso "Diagnóstico Listo - Rechazo"
        if (lastDiagStatus !== 'rechazo') {
            playBeep('danger');
            triggerVibration('danger');
            lastDiagStatus = 'rechazo';
        }
    } else {
        // Aceptable
        if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) diagEstado.innerText = `Simetría dentro de los parámetros: ${percentDeviation.toFixed(1)}% de desvío (Límite: ${toleranceLimit}%).`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>El envase cumple con los parámetros geométricos del artículo.</li>
                <li>Mantener velocidad nominal de producción.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Envase Aceptable (Desvío: ${percentDeviation.toFixed(1)}%)`;
            tfjsStatus.style.color = "#10b981";
        }

        // Actualizar cursor visual
        if (cursorText) {
            cursorText.innerText = 'ACEPTABLE';
            cursorText.style.color = '#10b981';
            if (crosshairX) crosshairX.style.backgroundColor = '#10b981';
            if (crosshairY) crosshairY.style.backgroundColor = '#10b981';
        }

        // Tono y vibración de aviso "Diagnóstico Listo - Aceptable"
        if (lastDiagStatus !== 'aceptable') {
            playBeep('success');
            triggerVibration('success');
            lastDiagStatus = 'aceptable';
        }
    }
}

function runLegacyPixelCountDiagnosis(borders, width, height, avgBodyCenter) {
    const tfjsStatus = getTfjsStatus();
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');
    
    let leftCount = 0;
    let rightCount = 0;
    let totalPixels = 0;

    const startY = Math.floor(height * 0.25);
    const endY = Math.floor(height * 0.75);
    const startX = Math.floor(width * 0.15);
    const endX = Math.floor(width * 0.85);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (borders[y * width + x] > 128) {
                totalPixels++;
                if (x < avgBodyCenter) {
                    leftCount++;
                } else {
                    rightCount++;
                }
            }
        }
    }

    const pixelDiff = Math.abs(leftCount - rightCount) / (totalPixels || 1);
    const sliderVal = document.getElementById('sliderTolerance') ? document.getElementById('sliderTolerance').value : 8;
    const tolerancePercent = (parseInt(sliderVal) || 8) / 100;

    const cursorText = document.querySelector('.cursor-text');
    const crosshairX = document.querySelector('.crosshair-x');
    const crosshairY = document.querySelector('.crosshair-y');

    if (pixelDiff > tolerancePercent) {
        if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico (Algorítmico): Cuello Torcido";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Rechazo Inmediato";
        }
        if (diagEstado) diagEstado.innerText = `Asimetría geométrica por densidad: ${(pixelDiff * 200).toFixed(1)}% (Límite: ${(tolerancePercent * 200).toFixed(1)}%).`;
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Defecto detectado (Desvío: ${(pixelDiff * 200).toFixed(1)}%)`;
            tfjsStatus.style.color = "#ef4444";
        }

        if (cursorText) {
            cursorText.innerText = 'RECHAZO: ASIMETRÍA';
            cursorText.style.color = '#ef4444';
            if (crosshairX) crosshairX.style.backgroundColor = '#ef4444';
            if (crosshairY) crosshairY.style.backgroundColor = '#ef4444';
        }

        if (lastDiagStatus !== 'rechazo') {
            playBeep('danger');
            triggerVibration('danger');
            lastDiagStatus = 'rechazo';
        }
    } else {
        if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) diagEstado.innerText = `Simetría dentro de tolerancias por densidad: ${(pixelDiff * 200).toFixed(1)}% (Límite: ${(tolerancePercent * 200).toFixed(1)}%).`;
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Envase Aceptable (Desvío: ${(pixelDiff * 200).toFixed(1)}%)`;
            tfjsStatus.style.color = "#10b981";
        }

        if (cursorText) {
            cursorText.innerText = 'ACEPTABLE';
            cursorText.style.color = '#10b981';
            if (crosshairX) crosshairX.style.backgroundColor = '#10b981';
            if (crosshairY) crosshairY.style.backgroundColor = '#10b981';
        }

        if (lastDiagStatus !== 'aceptable') {
            playBeep('success');
            triggerVibration('success');
            lastDiagStatus = 'aceptable';
        }
    }
}

export function isBottlePresent(borders, width, height) {
    if (!borders || width === 0 || height === 0) return false;

    let edgePixelCount = 0;
    const validRows = [];
    const minX = Math.floor(width * 0.05);
    const maxX = Math.floor(width * 0.95);
    const minY = Math.floor(height * 0.05);
    const maxY = Math.floor(height * 0.95);

    for (let y = minY; y < maxY; y++) {
        let rowEdges = 0;
        for (let x = minX; x < maxX; x++) {
            if (borders[y * width + x] > 128) {
                rowEdges++;
                edgePixelCount++;
            }
        }
        if (rowEdges >= 1) {
            validRows.push(y);
        }
    }

    const minVerticalSpan = Math.floor(height * 0.12); // Al menos 12% de la altura de la imagen
    const minEdgePixels = 25; // Al menos 25 píxeles de contorno acumulado

    return (validRows.length >= minVerticalSpan && edgePixelCount >= minEdgePixels);
}

export function runLiveDiagnosis() {
    const canvas = getCanvas();
    const tfjsStatus = getTfjsStatus();
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');
    const cursorText = document.querySelector('.cursor-text');
    const crosshairX = document.querySelector('.crosshair-x');
    const crosshairY = document.querySelector('.crosshair-y');

    const borders = state.lastProcessedBorders;
    const width = state.lastBordersWidth;
    const height = state.lastBordersHeight;

    // 🛑 FILTRO ANTI-FALSAS LECTURAS:
    // Verificar rigurosamente la presencia física del envase dentro de la retícula antes de calificar la silueta.
    if (!borders || width === 0 || height === 0 || !isBottlePresent(borders, width, height)) {
        lastDiagStatus = 'alineando';
        if (diagTitulo) diagTitulo.innerText = "📷 Buscando Envase...";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-warning";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Sin Envase";
        }
        if (diagEstado) diagEstado.innerText = "Coloque el envase de vidrio centrado dentro de las guías de la cámara para iniciar el diagnóstico en tiempo real.";
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>Alinee el cuello y cuerpo de la botella dentro de la retícula de disparo.</li>
                <li>Asegúrese de contar con iluminación o contraste adecuados.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor de Visión: Esperando Envase en Guías...";
            tfjsStatus.style.color = "#fbbf24";
        }
        if (cursorText) {
            cursorText.innerText = 'ESPERANDO ENVASE';
            cursorText.style.color = '#fbbf24';
            if (crosshairX) crosshairX.style.backgroundColor = '#fbbf24';
            if (crosshairY) crosshairY.style.backgroundColor = '#fbbf24';
        }
        return;
    }

    // Ejecutar diagnóstico en caliente
    if (typeof tf !== 'undefined' && state.tfModel && canvas) {
        try {
            const prob = tf.tidy(() => {
                const img = tf.browser.fromPixels(canvas);
                const resized = tf.image.resizeBilinear(img, [224, 224]);
                const normalized = resized.div(255.0);
                const inputTensor = normalized.expandDims(0);
                
                const prediction = state.tfModel.predict(inputTensor);
                const data = prediction.dataSync();
                return data[0];
            });

            const confThreshold = state.confidenceThreshold / 100;

            if (prob > confThreshold) {
                if (tfjsStatus) {
                    tfjsStatus.innerText = `⚠️ Motor IA: Defecto Confirmado (Confianza ${(prob*100).toFixed(1)}%)`;
                    tfjsStatus.style.color = "#ef4444";
                }
                
                if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico: Cuello Torcido";
                if (diagGravedad) {
                    diagGravedad.className = "status-alert status-danger";
                    diagGravedad.style.display = "inline-block";
                    diagGravedad.innerText = "Rechazo Inmediato";
                }
                if (diagEstado) diagEstado.innerText = "El motor de visión artificial ha detectado una asimetría estructural grave.";
                if (diagAcciones) {
                    diagAcciones.innerHTML = `
                        <li><strong>Motor IS:</strong> Revisar alineación de mecanismos de cuello.</li>
                        <li><strong>Molde:</strong> Inspeccionar estado de los anillos de cuello.</li>
                        <li><strong>Preforma:</strong> Verificar distribución de masa en zona superior.</li>
                    `;
                }
            } else {
                if (tfjsStatus) {
                    tfjsStatus.innerText = `✅ Motor IA: Silueta Normal (Confianza ${(prob*100).toFixed(1)}%)`;
                    tfjsStatus.style.color = "#10b981";
                }
                
                if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
                if (diagGravedad) {
                    diagGravedad.className = "status-alert status-success";
                    diagGravedad.style.display = "inline-block";
                    diagGravedad.innerText = "Aceptable";
                }
                if (diagEstado) diagEstado.innerText = "El modelo no ha detectado malformaciones críticas.";
                if (diagAcciones) {
                    diagAcciones.innerHTML = `
                        <li>El envase cumple con la simetría básica estructural.</li>
                    `;
                }
            }
        } catch (e) {
            console.error("Error en inferencia TFJS en tiempo real:", e);
            fallbackAlgorithmicDiagnosis();
        }
    } else {
        fallbackAlgorithmicDiagnosis();
    }
}

export { updateConfidenceThresholdDisplay, loadCustomUploadedModel, loadTensorFlowModel };
