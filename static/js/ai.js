import { state } from './state.js';
import { showToast } from './ui.js';
import { processFrame } from './vision.js';
import { DEFECTOS_DB, getDefectsByZone, getDefectById } from './db.js';


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
            tfjsStatus.innerText = "Motor de Visión: Análisis de Contornos Activo (Algorítmico)";
            tfjsStatus.style.color = "#06b6d4";
        }
        return;
    }

    try {
        await tf.setBackend('webgl');
        console.log("Backend TFJS activo:", tf.getBackend());
    } catch (e) {
        try {
            await tf.setBackend('cpu');
            console.log("Backend TFJS CPU activo:", tf.getBackend());
        } catch (cpuErr) {
            console.warn("Backend WebGL/CPU no disponible, usando defecto:", cpuErr);
        }
    }

    const possiblePaths = [
        'static/model/model.json',
        './static/model/model.json',
        '/static/model/model.json'
    ];

    let loadedModel = null;
    for (const path of possiblePaths) {
        try {
            console.log(`[TFJS] Probando modelo en: ${path}`);
            loadedModel = await tf.loadLayersModel(path);
            if (loadedModel) {
                console.log(`[TFJS] Modelo cargado con éxito desde: ${path}`);
                state.tfModel = loadedModel;
                break;
            }
        } catch (e) {
            // Continuar al siguiente path de fallback
        }
    }

    if (state.tfModel) {
        await warmUpModel(state.tfModel);
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor IA: Red Neuronal CNN cargada offline";
            tfjsStatus.style.color = "#10b981"; // Verde (Success)
        }
    } else {
        console.log("[TFJS] Modelo CNN personalizado no encontrado. Usando diagnóstico de contornos algorítmico.");
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
            if (borders[y * width + x] > 0) {
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
    const percentDeviation = (maxDeviation / avgBodyWidth) * 200;

    // --- EVALUACIÓN MULTIZONA (patronista1) DE DEFECTOS ESPECÍFICOS SEGÚN FICHA TÉCNICA ---
    const activeArticle = state.activeArticle;
    const articleName = activeArticle ? activeArticle.nombre : "Artículo Patrón";

    // 1. ZONA 1: CORONA / BOCA (0% a 15% de la botella)
    const startMouthY = Math.floor(bottleTopY);
    const endMouthY = Math.floor(bottleTopY + bottleHeight * 0.15);
    let mouthLayers = 0;
    let mouthAsymmetrySum = 0;
    
    for (let y = startMouthY; y < endMouthY; y += 2) {
        let leftX = -1, rightX = -1;
        for (let x = 0; x < width; x++) { if (borders[y * width + x] > 0) { leftX = x; break; } }
        for (let x = width - 1; x >= 0; x--) { if (borders[y * width + x] > 0) { rightX = x; break; } }
        if (leftX !== -1 && rightX !== -1) {
            const mouthCenter = (leftX + rightX) / 2;
            mouthAsymmetrySum += Math.abs(mouthCenter - avgBodyCenter);
            mouthLayers++;
        }
    }
    const avgMouthDev = mouthLayers > 0 ? (mouthAsymmetrySum / mouthLayers) : 0;
    const mouthDevPercent = (avgMouthDev / avgBodyWidth) * 200;

    // 2. ZONA 3: HOMBRO (40% a 55% de la botella)
    const startShoulderY = Math.floor(bottleTopY + bottleHeight * 0.40);
    const endShoulderY = Math.floor(bottleTopY + bottleHeight * 0.55);
    let shoulderLayers = 0;
    let shoulderAsymmetrySum = 0;

    for (let y = startShoulderY; y < endShoulderY; y += 2) {
        let leftX = -1, rightX = -1;
        for (let x = 0; x < width; x++) { if (borders[y * width + x] > 0) { leftX = x; break; } }
        for (let x = width - 1; x >= 0; x--) { if (borders[y * width + x] > 0) { rightX = x; break; } }
        if (leftX !== -1 && rightX !== -1) {
            const shoulderCenter = (leftX + rightX) / 2;
            shoulderAsymmetrySum += Math.abs(shoulderCenter - avgBodyCenter);
            shoulderLayers++;
        }
    }
    const avgShoulderDev = shoulderLayers > 0 ? (shoulderAsymmetrySum / shoulderLayers) : 0;
    const shoulderDevPercent = (avgShoulderDev / avgBodyWidth) * 200;

    // 3. ZONA 5: FONDO / BASE (85% a 100% de la botella)
    const startBaseY = Math.floor(bottleTopY + bottleHeight * 0.85);
    const endBaseY = Math.floor(bottleBottomY);
    let baseLayers = 0;
    let baseAsymmetrySum = 0;

    for (let y = startBaseY; y < endBaseY; y += 2) {
        let leftX = -1, rightX = -1;
        for (let x = 0; x < width; x++) { if (borders[y * width + x] > 0) { leftX = x; break; } }
        for (let x = width - 1; x >= 0; x--) { if (borders[y * width + x] > 0) { rightX = x; break; } }
        if (leftX !== -1 && rightX !== -1) {
            const baseCenter = (leftX + rightX) / 2;
            baseAsymmetrySum += Math.abs(baseCenter - avgBodyCenter);
            baseLayers++;
        }
    }
    const avgBaseDev = baseLayers > 0 ? (baseAsymmetrySum / baseLayers) : 0;
    const baseDevPercent = (avgBaseDev / avgBodyWidth) * 200;

    const sliderVal = document.getElementById('sliderTolerance') ? document.getElementById('sliderTolerance').value : 5;
    const toleranceLimit = parseInt(sliderVal) || 5;

    console.log(`[Patrón Moldería patronista1] ${articleName} | H: ${bottleHeight}px | Cuello: ${percentDeviation.toFixed(1)}% | Corona: ${mouthDevPercent.toFixed(1)}% | Hombro: ${shoulderDevPercent.toFixed(1)}% | Base: ${baseDevPercent.toFixed(1)}%`);

    const cursorText = document.querySelector('.cursor-text');
    const crosshairX = document.querySelector('.crosshair-x');
    const crosshairY = document.querySelector('.crosshair-y');

    // Detección nombrada del defecto específico según zona anatómica consultada en DEFECTOS_DB
    let detectedDefectObj = null;
    let defectZone = null;
    let defectDev = 0;

    if (mouthDevPercent > (toleranceLimit * 1.3)) {
        detectedDefectObj = getDefectById("bajo_boca") || getDefectById("rebaba_boca") || getDefectsByZone("boca")[0];
        defectZone = "Corona (0-15%)";
        defectDev = mouthDevPercent;
    } else if (percentDeviation > toleranceLimit) {
        detectedDefectObj = getDefectById("boca_inclinada") || getDefectsByZone("cuello")[0] || {
            nombre: "Cuello Torcido / Pliegue de Cuello",
            gravedad: "Crítico",
            descripcion: "Desviación angular o asimetría grave en la zona de cuello.",
            acciones: ["Ajustar pinza de transferencia y brazo de soplado.", "Inspeccionar encaje del anillo de cuello."]
        };
        defectZone = "Cuello (15-40%)";
        defectDev = percentDeviation;
    } else if (shoulderDevPercent > (toleranceLimit * 1.2)) {
        detectedDefectObj = getDefectsByZone("hombro")[0] || {
            nombre: "Hombro Caído / Deformación de Hombro",
            gravedad: "Mayor",
            descripcion: "Variación de perfil en la zona de hombro.",
            acciones: ["Ajustar tiempo de enfriamiento de preforma.", "Limpiar ventilación de molde."]
        };
        defectZone = "Hombro (40-55%)";
        defectDev = shoulderDevPercent;
    } else if (baseDevPercent > (toleranceLimit * 1.2)) {
        detectedDefectObj = getDefectsByZone("fondo")[0] || {
            nombre: "Fondo Inclinado / Base Desplazada",
            gravedad: "Mayor",
            descripcion: "Desplazamiento o falta de planitud en el asiento del envase.",
            acciones: ["Inspeccionar mecanismo de expulsión (take-out).", "Verificar planitud de fondo."]
        };
        defectZone = "Fondo (85-100%)";
        defectDev = baseDevPercent;
    }

    if (detectedDefectObj) {
        const detectedName = detectedDefectObj.nombre;
        const defectActions = (detectedDefectObj.acciones || []).map(a => `<li>${a}</li>`).join('');

        // Defecto Específico Confirmado desde DEFECTOS_DB
        if (diagTitulo) diagTitulo.innerText = `❌ Defecto Crítico: ${detectedName}`;
        if (diagGravedad) {
            const gClass = detectedDefectObj.gravedad === "Crítico" ? "status-danger" : "status-warning";
            diagGravedad.className = `status-alert ${gClass}`;
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = `Rechazo (${detectedDefectObj.gravedad || 'Crítico'})`;
        }
        if (diagEstado) diagEstado.innerText = `Desviación observada en ${defectZone}: ${defectDev.toFixed(1)}% (Límite: ${toleranceLimit}%). Ficha: ${articleName}. ${detectedDefectObj.descripcion || ''}`;
        if (diagAcciones) diagAcciones.innerHTML = defectActions;
        
        if (tfjsStatus) {
            tfjsStatus.innerText = `Patrón Moldería: ${detectedName} (${defectDev.toFixed(1)}%)`;
            tfjsStatus.style.color = "#ef4444";
        }
        
        if (cursorText) {
            cursorText.innerText = `RECHAZO: ${detectedName.toUpperCase().split('/')[0]}`;
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

        // Conforme con Ficha Técnica
        if (diagTitulo) diagTitulo.innerText = `✅ Silueta Conforme (${articleName})`;
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) diagEstado.innerText = `Silueta en las 5 zonas dentro de los parámetros de moldería patrón: ${percentDeviation.toFixed(1)}% desvío max.`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>El envase cumple con las especificaciones de moldería para ${articleName}.</li>
                <li>Mantener velocidad nominal de producción.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Patrón Moldería: Envase Conforme (${articleName})`;
            tfjsStatus.style.color = "#10b981";
        }

        if (cursorText) {
            cursorText.innerText = 'CONFORME CON PATRÓN';
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

    // Retícula central de inspección: 15% a 85% X, 10% a 90% Y
    const minX = Math.floor(width * 0.15);
    const maxX = Math.floor(width * 0.85);
    const minY = Math.floor(height * 0.10);
    const maxY = Math.floor(height * 0.90);

    let validBottleRows = 0;
    let prevLeftX = -1;
    let prevRightX = -1;
    
    let maxContinuous = 0;
    let currentContinuous = 0;

    for (let y = minY; y < maxY; y++) {
        let leftEdgeX = -1;
        let rightEdgeX = -1;

        // 1. Buscar contorno izquierdo fuerte (>= 128)
        for (let x = minX; x < maxX; x++) {
            if (borders[y * width + x] >= 128) {
                leftEdgeX = x;
                break;
            }
        }

        // 2. Buscar contorno derecho fuerte (>= 128)
        for (let x = maxX - 1; x >= minX; x--) {
            if (borders[y * width + x] >= 128) {
                rightEdgeX = x;
                break;
            }
        }

        // 3. Validar si la fila contiene un par de bordes simétricos con ancho válido de envase
        const bottleWidth = rightEdgeX - leftEdgeX;
        const minWidth = Math.floor(width * 0.15); // Ancho mínimo del envase (15% de pantalla)
        const maxWidth = Math.floor(width * 0.82); // Ancho máximo del envase (82% de pantalla)

        if (leftEdgeX !== -1 && rightEdgeX !== -1 && bottleWidth >= minWidth && bottleWidth <= maxWidth) {
            validBottleRows++;

            // 4. Comprobar continuidad vertical con la fila anterior (borde continuo de envase)
            if (prevLeftX !== -1 && Math.abs(leftEdgeX - prevLeftX) <= 8 && Math.abs(rightEdgeX - prevRightX) <= 8) {
                currentContinuous++;
            } else {
                currentContinuous = 1;
            }
            
            if (currentContinuous > maxContinuous) {
                maxContinuous = currentContinuous;
            }
            
            prevLeftX = leftEdgeX;
            prevRightX = rightEdgeX;
        } else {
            prevLeftX = -1;
            prevRightX = -1;
            currentContinuous = 0;
        }
    }

    // Un envase REAL requiere:
    // 1. Al menos 30% de las filas de la pantalla con contornos válidos de envase (para H=180, ~54 filas).
    // 2. Un segmento continuo de contorno vertical de al menos 18% de la pantalla (para H=180, ~32 filas).
    const minRowsRequired = Math.floor(height * 0.30);
    const minContinuousRequired = Math.floor(height * 0.18);

    return (validBottleRows >= minRowsRequired && maxContinuous >= minContinuousRequired);
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
        } catch (e) {
            console.error("Error en inferencia TFJS en tiempo real:", e);
            fallbackAlgorithmicDiagnosis();
        }
    } else {
        fallbackAlgorithmicDiagnosis();
    }
}

export { updateConfidenceThresholdDisplay, loadCustomUploadedModel, loadTensorFlowModel };
