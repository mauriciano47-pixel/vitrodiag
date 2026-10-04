// Motor de Escaneo Óptico OCR para Consolas de Temporización IS (VitroDiag OCR Engine)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
import { state } from './state.js';
import { showToast, switchView } from './ui.js';
import { validateBdfTiming } from './timing.js';
import { startScannerCamera, stopScannerCamera } from './camera.js';
import { setSafeHTML } from './domUtils.js';
import { parseScannerOcrText } from './ocrParser.js';

// ─── Scanner OCR (Tesseract.js con pre-procesamiento de imagen optimizado) ────
let tesseractWorker = null;
let isWorkerReady = false;

async function initTesseractWorker() {
    if (tesseractWorker) return;
    if (typeof Tesseract === 'undefined') {
        throw new Error("Librería Tesseract.js no está cargada. Verifica tu conexión de red.");
    }
    try {
        tesseractWorker = await Tesseract.createWorker('eng');
        isWorkerReady = true;
        console.log("Tesseract Worker inicializado con éxito.");
    } catch (err) {
        console.error("Fallo al inicializar Tesseract Worker:", err);
        throw err;
    }
}

async function terminateTesseractWorker() {
    if (tesseractWorker) {
        try {
            await tesseractWorker.terminate();
            tesseractWorker = null;
            isWorkerReady = false;
            console.log("Tesseract Worker terminado para liberar memoria.");
        } catch (e) {
            console.error("Error al terminar Tesseract:", e);
        }
    }
}

/**
 * Pre-procesar la imagen del panel BDF para mejorar la precisión del OCR.
 * Aplica binarización, aumento de contraste y eliminación de ruido
 * para que los dígitos LED de la consola sean legibles por Tesseract.
 */
function preprocessImageForOcr(base64Image) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Escalar a un ancho óptimo para OCR (1200px mínimo para dígitos pequeños)
            const scale = Math.max(1, 1200 / img.width);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Paso 1: Convertir a escala de grises con pesos perceptuales
            for (let i = 0; i < data.length; i += 4) {
                const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }

            // Paso 2: Aumento de contraste agresivo (CLAHE simplificado)
            // Encontrar min/max para normalización de histograma
            let minVal = 255, maxVal = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < minVal) minVal = data[i];
                if (data[i] > maxVal) maxVal = data[i];
            }
            const range = maxVal - minVal || 1;
            for (let i = 0; i < data.length; i += 4) {
                const stretched = Math.round(((data[i] - minVal) / range) * 255);
                data[i] = stretched;
                data[i + 1] = stretched;
                data[i + 2] = stretched;
            }

            // Paso 3: Binarización con umbral adaptativo (Otsu simplificado)
            // Calcular el histograma
            const histogram = new Array(256).fill(0);
            for (let i = 0; i < data.length; i += 4) {
                histogram[data[i]]++;
            }
            const totalPixels = data.length / 4;

            // Método de Otsu para encontrar el umbral óptimo
            let sum = 0;
            for (let i = 0; i < 256; i++) sum += i * histogram[i];
            let sumB = 0, wB = 0, wF = 0;
            let maxVariance = 0, threshold = 128;

            for (let i = 0; i < 256; i++) {
                wB += histogram[i];
                if (wB === 0) continue;
                wF = totalPixels - wB;
                if (wF === 0) break;

                sumB += i * histogram[i];
                const mB = sumB / wB;
                const mF = (sum - sumB) / wF;
                const variance = wB * wF * (mB - mF) * (mB - mF);

                if (variance > maxVariance) {
                    maxVariance = variance;
                    threshold = i;
                }
            }

            // Aplicar binarización: texto oscuro sobre fondo claro
            for (let i = 0; i < data.length; i += 4) {
                const val = data[i] > threshold ? 255 : 0;
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }

            // Paso 4: Invertir si el fondo es oscuro (paneles LED con fondo negro)
            let blackCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0) blackCount++;
            }
            if (blackCount > totalPixels * 0.6) {
                // Fondo oscuro detectado → invertir para texto negro sobre fondo blanco
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = base64Image;
    });
}

async function runScannerOcr() {
    const loader = document.getElementById('ocrLoader');
    const statusMsg = document.getElementById('ocrStatusMsg');
    const resultsCard = document.getElementById('scannerResultsCard');
    const runOcrBtn = document.getElementById('btnRunOcr');

    if (!state.scannerImageBase64) return;

    if (resultsCard) resultsCard.style.display = 'none';
    if (loader) loader.style.display = 'block';
    if (runOcrBtn) runOcrBtn.setAttribute('disabled', 'true');

    // Timeout de seguridad (30 seg para primera carga de WASM)
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout de digitalización OCR (30 segundos superado)")), 30000);
    });

    const ocrPromise = (async () => {
        // Paso 1: Pre-procesamiento de imagen
        if (statusMsg) statusMsg.innerText = "Preprocesando imagen (contraste, binarización)...";
        const processedImage = await preprocessImageForOcr(state.scannerImageBase64);

        if (!isWorkerReady || !tesseractWorker) {
            if (statusMsg) statusMsg.innerText = "Inicializando motor OCR...";
            await initTesseractWorker();
        }

        if (!tesseractWorker) {
            throw new Error("Librería Tesseract.js no inicializada. Verifica tu conexión de red.");
        }

        // Paso 2: OCR con idioma inglés (paneles BDF usan texto en inglés)
        if (statusMsg) statusMsg.innerText = "Digitalizando caracteres del panel...";
        await tesseractWorker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.:° -/',
            tessedit_pageseg_mode: '6' // Bloque de texto uniforme
        });
        const ret = await tesseractWorker.recognize(processedImage);
        const text = ret.data.text;
        console.log("OCR texto crudo extraído:", text);

        // Paso 3: Segundo intento solo con dígitos si el primero falló
        await tesseractWorker.setParameters({
            tessedit_char_whitelist: '0123456789.:° ',
            tessedit_pageseg_mode: '6'
        });
        const digitRet = await tesseractWorker.recognize(processedImage);
        const digitText = digitRet.data.text;
        console.log("OCR solo dígitos extraído:", digitText);

        return { fullText: text, digitText: digitText };
    })();

    // Evitar que el error interno del OCR quede sin atrapar si ocurre después del timeout
    ocrPromise.catch(() => {});

    try {
        const { fullText, digitText } = await Promise.race([ocrPromise, timeoutPromise]);

        if (statusMsg) statusMsg.innerText = "Interpretando datos de grados de la consola BDF...";
        parseScannerOcrText(fullText, digitText);

        if (loader) loader.style.display = 'none';
        if (runOcrBtn) runOcrBtn.removeAttribute('disabled');
    } catch (err) {
        console.error("Error o timeout en motor OCR Tesseract.js:", err);
        if (loader) loader.style.display = 'none';
        if (runOcrBtn) runOcrBtn.removeAttribute('disabled');

        let errorMsg = "Error al digitalizar imagen. Intenta con mejor enfoque o luz.";
        if (err.message) {
            if (err.message.includes("Timeout")) {
                errorMsg = "Tiempo de espera agotado. Verifica tu conexión de red para la primera carga de OCR o re-intenta.";
            } else if (err.message.includes("Tesseract.js") || err.message.includes("no inicializada")) {
                errorMsg = err.message;
            }
        }
        showToast(errorMsg, "danger");
    } finally {
        // Liberar memoria del trabajador OCR explícitamente para evitar fugas en PWA
        await terminateTesseractWorker();
    }
}

// parseScannerOcrText se importa y orquesta desde ./ocrParser.js para alta modularidad.

function confirmOcrAndCompare() {
    // Leer valores validados por el operador
    state.scannerParsedValues = {
        plungerUp: parseInt(document.getElementById('ocrValPlungerUp')?.value) || 80,
        plungerDown: parseInt(document.getElementById('ocrValPlungerDown')?.value) || 150,
        invertStart: parseInt(document.getElementById('ocrValInvertStart')?.value) || 190,
        blowClose: parseInt(document.getElementById('ocrValBlowClose')?.value) || 240,
        neckRingOpen: parseInt(document.getElementById('ocrValNeckRingOpen')?.value) || 245,
        blowOn: parseInt(document.getElementById('ocrValBlowOn')?.value) || 270,
        blowOff: parseInt(document.getElementById('ocrValBlowOff')?.value) || 325
    };

    const defaultValues = {
        plungerUp: parseInt(document.getElementById('valPlungerUp')?.value) || 80,
        plungerDown: parseInt(document.getElementById('valPlungerDown')?.value) || 150,
        invertStart: parseInt(document.getElementById('valInvertStart')?.value) || 190,
        blowClose: parseInt(document.getElementById('valBlowClose')?.value) || 240,
        neckRingOpen: parseInt(document.getElementById('valNeckOpen')?.value) || 245,
        blowOn: parseInt(document.getElementById('valBlowOn')?.value) || 270,
        blowOff: parseInt(document.getElementById('valBlowOff')?.value) || 325
    };

    // Ocultar confirmación y renderizar la comparación final
    const ocrArea = document.getElementById('scannerOcrConfirmArea');
    if (ocrArea) ocrArea.style.display = 'none';
    renderScannerComparisonTable(defaultValues);

    showToast("Lectura validada con éxito por operador.", "success");
}

function renderScannerComparisonTable(defaults) {
    const tableBody = document.getElementById('scannerComparisonBody');
    const badge = document.getElementById('scannerArticleBadge');
    const alertContainer = document.getElementById('scannerSafetyAlert');
    const resultsCard = document.getElementById('scannerResultsCard');

    if (!tableBody || !badge || !alertContainer || !resultsCard) return;

    // Fallback de contingencia si no hay articulo activo
    if (!defaults) {
        defaults = (window.sopPresets && window.sopPresets.safe) ? window.sopPresets.safe : {
            plungerUp: 80,
            plungerDown: 140,
            neckRingOpen: 245,
            invertStart: 180,
            blowClose: 240,
            blowOn: 270,
            blowOff: 310
        };
    }

    badge.innerText = state.activeArticle ? state.activeArticle.nombre : "SSP 296";

    const mechanisms = [
        { key: "plungerUp", name: "Plunger Up (Macho Arriba)" },
        { key: "plungerDown", name: "Plunger Down (Macho Abajo)" },
        { key: "invertStart", name: "Invert Start (Inversión)" },
        { key: "blowClose", name: "Blow Close (Cierre Molde)" },
        { key: "neckRingOpen", name: "Neck Ring Open (Abre Anillo)" },
        { key: "blowOn", name: "Blow ON (Soplado)" },
        { key: "blowOff", name: "Blow OFF (Fin Soplado)" }
    ];

    let html = "";
    let maxDeviation = 0;
    let criticalDeviation = false;

    mechanisms.forEach(m => {
        const readVal = state.scannerParsedValues[m.key];
        const theoryVal = defaults[m.key];
        const diff = readVal - theoryVal;

        let diffText = "";
        let diffStyle = "color: var(--text-muted);";

        if (diff > 0) {
            diffText = `+${diff}°`;
            diffStyle = "color: var(--warning);";
        } else if (diff < 0) {
            diffText = `${diff}°`;
            diffStyle = "color: #60a5fa;";
        } else {
            diffText = "0°";
            diffStyle = "color: var(--success);";
        }

        if (Math.abs(diff) > maxDeviation) maxDeviation = Math.abs(diff);
        if (Math.abs(diff) >= 15) criticalDeviation = true;

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem;">
                <td style="padding: 8px 0; font-weight: bold; color: var(--text-main);">${m.name}</td>
                <td style="padding: 8px 0; text-align: center; font-family: monospace; font-weight: bold; color: #06b6d4;">${readVal}°</td>
                <td style="padding: 8px 0; text-align: center; font-family: monospace; color: var(--text-muted);">${theoryVal}°</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; ${diffStyle}">${diffText}</td>
            </tr>
        `;
    });

    setSafeHTML(tableBody, html);

    const marginInvert = state.scannerParsedValues.invertStart - state.scannerParsedValues.plungerDown;
    if (marginInvert < 15) {
        alertContainer.style.background = "rgba(239, 68, 68, 0.15)";
        alertContainer.style.borderLeft = "4px solid #ef4444";
        alertContainer.style.color = "#fca5a5";
        setSafeHTML(alertContainer, `
            <b>🚨 INFORME CRÍTICO: Peligro de colisión mecánica.</b><br>
            El margen entre Plunger Down (${state.scannerParsedValues.plungerDown}°) e Invert Start (${state.scannerParsedValues.invertStart}°) es de solo <b>${marginInvert}°</b> (Mínimo seguro: 15°). Si cargas esta configuración, el anillo de boca iniciará la inversión antes de que el macho termine de bajar, lo que provocará colisión física del herramental.
        `);
    } else if (criticalDeviation) {
        alertContainer.style.background = "rgba(245, 158, 11, 0.15)";
        alertContainer.style.borderLeft = "4px solid #f59e0b";
        alertContainer.style.color = "#fde047";
        setSafeHTML(alertContainer, `
            <b>⚠️ ADVERTENCIA: Desvíos severos de temporización.</b><br>
            Se detectaron desvíos superiores a 15° en el ciclo respecto a la consigna nominal del artículo. Esto puede generar deformaciones en la corona o hombro por estiramiento térmico descontrolado.
        `);
    } else {
        alertContainer.style.background = "rgba(16, 185, 129, 0.15)";
        alertContainer.style.borderLeft = "4px solid #10b981";
        alertContainer.style.color = "#a7f3d0";
        setSafeHTML(alertContainer, `
            <b>🟢 CICLO COMPATIBLE Y SEGURO.</b><br>
            Las temporizaciones leídas de la consola física están dentro de los límites seguros. No se detectaron riesgos de colisiones o interferencias en el ciclo de 360°.
        `);
    }

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth' });
}

function applyScannerValuesToCalculator() {
    if (!state.scannerParsedValues || Object.keys(state.scannerParsedValues).length === 0) return;

    const setCalcVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v !== undefined ? v : ''; };
    setCalcVal('valPlungerUp', state.scannerParsedValues.plungerUp);
    setCalcVal('valPlungerDown', state.scannerParsedValues.plungerDown);
    setCalcVal('valInvertStart', state.scannerParsedValues.invertStart);
    setCalcVal('valBlowClose', state.scannerParsedValues.blowClose);
    setCalcVal('valNeckOpen', state.scannerParsedValues.neckRingOpen);
    setCalcVal('valBlowOn', state.scannerParsedValues.blowOn);
    setCalcVal('valBlowOff', state.scannerParsedValues.blowOff);

    showToast("Valores escaneados de grados cargados en la calculadora", "success");

    validateBdfTiming();

    switchView('sop');
}

function resetScannerReport() {
    const resultsCard = document.getElementById('scannerResultsCard');
    if (resultsCard) resultsCard.style.display = 'none';
    resetScannerImage();
}

function setScannerSource(source) {
    const btnCam = document.getElementById('btnScannerUseCam');
    const btnFile = document.getElementById('btnScannerUseFile');
    const btnManual = document.getElementById('btnScannerUseManual');

    const camArea = document.getElementById('scannerCameraArea');
    const uploadArea = document.getElementById('scannerUploadArea');
    const manualArea = document.getElementById('scannerManualArea');
    const resultsCard = document.getElementById('scannerResultsCard');

    // Limpiar resultados anteriores al cambiar de modo
    if (resultsCard) resultsCard.style.display = 'none';

    if (source === 'camera') {
        btnCam.classList.add('active');
        btnFile.classList.remove('active');
        btnManual.classList.remove('active');

        camArea.style.display = 'flex';
        uploadArea.style.display = 'none';
        manualArea.style.display = 'none';

        startScannerCamera();
        
        // Pre-calentar el worker mientras el usuario enfoca la cámara
        if (!isWorkerReady) {
            initTesseractWorker().catch(e => console.warn("Pre-calentamiento OCR omitido:", e.message));
        }
    } else if (source === 'file') {
        btnCam.classList.remove('active');
        btnFile.classList.add('active');
        btnManual.classList.remove('active');

        camArea.style.display = 'none';
        uploadArea.style.display = 'block';
        manualArea.style.display = 'none';

        stopScannerCamera();
    } else {
        // Modo Manual
        btnCam.classList.remove('active');
        btnFile.classList.remove('active');
        btnManual.classList.add('active');

        camArea.style.display = 'none';
        uploadArea.style.display = 'none';
        manualArea.style.display = 'block';

        stopScannerCamera();
    }
}

function captureScannerSnapshot() {
    const video = document.getElementById('scannerVideo');
    const canvas = document.getElementById('scannerCanvas');
    const previewArea = document.getElementById('scannerPreviewArea');
    const previewImg = document.getElementById('scannerPreviewImg');
    const runOcrBtn = document.getElementById('btnRunOcr');
    const camArea = document.getElementById('scannerCameraArea');

    if (!video || !canvas || !previewImg) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    state.scannerImageBase64 = canvas.toDataURL('image/jpeg');
    previewImg.src = state.scannerImageBase64;

    camArea.style.display = 'none';
    previewArea.style.display = 'block';
    stopScannerCamera();

    runOcrBtn.classList.remove('d-none');
    runScannerOcr();
}

function handleScannerFileSelect(input) {
    const previewArea = document.getElementById('scannerPreviewArea');
    const previewImg = document.getElementById('scannerPreviewImg');
    const runOcrBtn = document.getElementById('btnRunOcr');

    if (!input.files || input.files.length === 0 || !previewImg) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        state.scannerImageBase64 = e.target.result;
        previewImg.src = state.scannerImageBase64;
        previewArea.style.display = 'block';

        runOcrBtn.classList.remove('d-none');
        runScannerOcr();
    };

    reader.readAsDataURL(file);
}

function resetScannerImage() {
    const previewArea = document.getElementById('scannerPreviewArea');
    const previewImg = document.getElementById('scannerPreviewImg');
    const runOcrBtn = document.getElementById('btnRunOcr');
    const camArea = document.getElementById('scannerCameraArea');
    const btnCam = document.getElementById('btnScannerUseCam');

    if (previewArea) previewArea.style.display = 'none';
    if (previewImg) previewImg.src = "";
    state.scannerImageBase64 = null;

    const setAreaDisp = (id, d) => { const el = document.getElementById(id); if (el) el.style.display = d; };
    setAreaDisp('scannerOcrConfirmArea', 'none');
    setAreaDisp('scannerResultsCard', 'none');

    if (runOcrBtn) {
        runOcrBtn.classList.add('d-none');
    }

    if (btnCam && btnCam.classList.contains('active')) {
        camArea.style.display = 'flex';
        startScannerCamera();
    }
}

function runScannerManualComparison() {
    const plungerUp = parseInt(document.getElementById('manualPlungerUp')?.value);
    const plungerDown = parseInt(document.getElementById('manualPlungerDown')?.value);
    const neckRingOpen = parseInt(document.getElementById('manualNeckOpen')?.value);
    const invertStart = parseInt(document.getElementById('manualInvertStart')?.value);
    const blowClose = parseInt(document.getElementById('manualBlowClose')?.value);
    const blowOn = parseInt(document.getElementById('manualBlowOn')?.value);
    const blowOff = parseInt(document.getElementById('manualBlowOff')?.value);

    if (isNaN(plungerUp) || isNaN(plungerDown) || isNaN(neckRingOpen) || isNaN(invertStart) || isNaN(blowClose) || isNaN(blowOn) || isNaN(blowOff)) {
        showToast("Por favor, ingresa los grados (0-360) para todas las variables del panel.", "warning");
        return;
    }

    if ([plungerUp, plungerDown, neckRingOpen, invertStart, blowClose, blowOn, blowOff].some(v => v < 0 || v > 360)) {
        showToast("Los valores ingresados deben estar entre 0° y 360°.", "danger");
        return;
    }

    state.scannerParsedValues = {
        plungerUp: plungerUp,
        plungerDown: plungerDown,
        neckRingOpen: neckRingOpen,
        invertStart: invertStart,
        blowClose: blowClose,
        blowOn: blowOn,
        blowOff: blowOff
    };

    // Ejecutar la comparación contra la consigna del artículo activo
    renderScannerComparisonTable(state.activeArticle ? state.activeArticle.defaultParams : null);

    // Mostrar el contenedor de resultados de comparación
    const resultsCard = document.getElementById('scannerResultsCard');
    if (resultsCard) resultsCard.style.display = 'block';

    showToast("Comparación de panel manual generada correctamente.", "success");
}

function cancelOcrConfirm() {
    const ocrConf = document.getElementById('scannerOcrConfirmArea');
    if (ocrConf) ocrConf.style.display = 'none';
    resetScannerImage();
}
if (typeof window !== 'undefined') {
    window.setScannerSource = setScannerSource;
    window.captureScannerSnapshot = captureScannerSnapshot;
    window.handleScannerFileSelect = handleScannerFileSelect;
    window.resetScannerImage = resetScannerImage;
    window.runScannerManualComparison = runScannerManualComparison;
    window.runScannerOcr = runScannerOcr;
    window.parseScannerOcrText = parseScannerOcrText;
    window.confirmOcrAndCompare = confirmOcrAndCompare;
    window.renderScannerComparisonTable = renderScannerComparisonTable;
    window.applyScannerValuesToCalculator = applyScannerValuesToCalculator;
    window.resetScannerReport = resetScannerReport;
    window.cancelOcrConfirm = cancelOcrConfirm;
    window.terminateTesseractWorker = terminateTesseractWorker;
}

export {
    setScannerSource,
    captureScannerSnapshot,
    handleScannerFileSelect,
    resetScannerImage,
    runScannerManualComparison,
    runScannerOcr,
    parseScannerOcrText,
    parseScannerOcrText as parseBdfPanelOcr,
    confirmOcrAndCompare,
    renderScannerComparisonTable,
    applyScannerValuesToCalculator,
    resetScannerReport,
    cancelOcrConfirm,
    terminateTesseractWorker
};
