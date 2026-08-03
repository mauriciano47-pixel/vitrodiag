// Punto de Entrada y Coordinador Principal — Versión centralizada en VERSION.txt
import { state } from './state.js';
import { DEFECTOS_DB, renderDefectsList } from './db.js';
import { 
    showToast, 
    initArticles, 
    populateArticleSelects, 
    applyActiveArticleParams, 
    changeActiveArticle, 
    openArticlesModal, 
    closeArticlesModal, 
    loadArticleInModal, 
    saveActiveArticleForm, 
    resetArticlesDefault, 
    toggleDefectCard, 
    setFilter, 
    filterDefects, 
    switchView,
    setupSilhouetteToggleListener
} from './ui.js';
import { 
    startDiagnosticCamera, 
    stopDiagnosticCamera, 
    startScannerCamera, 
    stopScannerCamera,
    forceRetryCamera,
    triggerLiveNativeFileSelect,
    handleLiveNativeFileSelect
} from './camera.js';
import { 
    startProcessing, 
    stopProcessing, 
    setVisionMode,
    setupCalibrationSliders
} from './vision.js';
import { 
    calculateSopMs, 
    validateBdfTiming, 
    populateDefectSelector 
} from './timing.js';
import { 
    setScannerSource, 
    captureScannerSnapshot, 
    handleScannerFileSelect, 
    resetScannerImage, 
    runScannerManualComparison, 
    runScannerOcr, 
    confirmOcrAndCompare, 
    applyScannerValuesToCalculator, 
    resetScannerReport,
    cancelOcrConfirm
} from './ocr.js';
import { 
    updateConfidenceThresholdDisplay, 
    loadCustomUploadedModel,
    loadTensorFlowModel
} from './ai.js';
import { 
    populateLogDefectSelect, 
    loadBitacoraFromStorage, 
    renderBitacoraList,
    setupLogEventListeners
} from './log.js';
import { initSwabModule } from './swab.js';
import { 
    saveGeminiApiKey, 
    loadGeminiApiKey, 
    clearGeminiApiKey, 
    promptSaveGeminiApiKey,
    runDeepDiagnosis, 
    initConnectivityMonitor,
    captureAndAnalyzeWithAI,
    triggerDeepAnalysisFileUpload,
    handleDeepAnalysisFileSelect,
    drawDefectBoundingBoxes
import { 
    initDatasetUI,
    openSampleModal,
    closeSampleModal,
    updateSampleNotesFromModal,
    deleteSampleFromModal,
    analyzeSampleWithGeminiFromModal
} from './datasetManager.js';

// Exponer funciones al ámbito global (window) para compatibilidad con eventos inline del HTML
window.DEFECTOS_DB = DEFECTOS_DB;
window.openSampleModal = openSampleModal;
window.closeSampleModal = closeSampleModal;
window.updateSampleNotesFromModal = updateSampleNotesFromModal;
window.deleteSampleFromModal = deleteSampleFromModal;
window.analyzeSampleWithGeminiFromModal = analyzeSampleWithGeminiFromModal;
window.promptSaveGeminiApiKey = promptSaveGeminiApiKey;
window.captureAndAnalyzeWithAI = captureAndAnalyzeWithAI;
window.triggerDeepAnalysisFileUpload = triggerDeepAnalysisFileUpload;
window.handleDeepAnalysisFileSelect = handleDeepAnalysisFileSelect;
window.drawDefectBoundingBoxes = drawDefectBoundingBoxes;
window.switchView = switchView;
window.changeActiveArticle = changeActiveArticle;
window.openArticlesModal = openArticlesModal;
window.closeArticlesModal = closeArticlesModal;
window.loadArticleInModal = loadArticleInModal;
window.saveActiveArticleForm = saveActiveArticleForm;
window.resetArticlesDefault = resetArticlesDefault;
window.toggleDefectCard = toggleDefectCard;
window.setFilter = setFilter;
window.filterDefects = filterDefects;

window.setVisionMode = setVisionMode;
window.startDiagnosticCamera = startDiagnosticCamera;
window.forceRetryCamera = forceRetryCamera;
window.startProcessing = startProcessing;
window.triggerLiveNativeFileSelect = triggerLiveNativeFileSelect;
window.handleLiveNativeFileSelect = handleLiveNativeFileSelect;

window.validateBdfTiming = validateBdfTiming;
window.calculateSopMs = calculateSopMs;

window.setScannerSource = setScannerSource;
window.captureScannerSnapshot = captureScannerSnapshot;
window.handleScannerFileSelect = handleScannerFileSelect;
window.resetScannerImage = resetScannerImage;
window.runScannerManualComparison = runScannerManualComparison;
window.runScannerOcr = runScannerOcr;
window.confirmOcrAndCompare = confirmOcrAndCompare;
window.applyScannerValuesToCalculator = applyScannerValuesToCalculator;
window.resetScannerReport = resetScannerReport;
window.cancelOcrConfirm = cancelOcrConfirm;

window.updateConfidenceThresholdDisplay = updateConfidenceThresholdDisplay;
window.loadCustomUploadedModel = loadCustomUploadedModel;

// Exponer funciones de Gemini Vision al ámbito global
window.saveGeminiApiKey = saveGeminiApiKey;
window.clearGeminiApiKey = clearGeminiApiKey;
window.runDeepDiagnosis = runDeepDiagnosis;

// Exponer Toasts de forma global para depuracion
window.showToast = showToast;

// Configurar manejador global para promesas rechazadas ("Fugas silenciosas" como fetch fallidos o timeouts)
window.addEventListener('unhandledrejection', function(event) {
    console.error("[Estabilidad] Promesa rechazada no manejada capturada:", event.reason);
    if (event.reason && (event.reason.message || '').includes('Failed to fetch')) {
        console.warn("Posible pérdida de conexión de red interceptada. Evitando colapso global.");
        event.preventDefault();
    }
});

// Inicialización de la aplicación cuando el DOM está completamente cargado
window.addEventListener('DOMContentLoaded', () => {
    // 0. Configurar atributos de compatibilidad HTML5
    try {
        const nativeCameraInput = document.getElementById('scannerNativeCameraInput');
        if (nativeCameraInput) nativeCameraInput.setAttribute('capture', 'environment');
        const webcamVideo = document.getElementById('webcam');
        if (webcamVideo) webcamVideo.setAttribute('playsinline', '');
    } catch (e) { console.warn("[Init] Error en paso 0:", e); }

    // 1. Inicializar módulos base
    try { loadTensorFlowModel(); } catch (e) { console.warn("[Init] TFJS:", e); }
    try { setupLogEventListeners(); } catch (e) { console.warn("[Init] Log:", e); }
    try { initSwabModule(); } catch (e) { console.warn("[Init] Swab:", e); }
    try { loadGeminiApiKey(); } catch (e) { console.warn("[Init] Gemini:", e); }
    try { initConnectivityMonitor(); } catch (e) { console.warn("[Init] Net:", e); }
    try { initDatasetUI(); } catch (e) { console.warn("[Init] Dataset:", e); }

    // 2. Inicializar directorio de defectos y artículos
    try { renderDefectsList(DEFECTOS_DB); } catch (e) { console.warn("[Init] Defects:", e); }
    try { initArticles(); } catch (e) { console.warn("[Init] Articles:", e); }
    try { populateDefectSelector(); populateLogDefectSelect(); } catch (e) { console.warn("[Init] Selects:", e); }
    try { loadBitacoraFromStorage(); } catch (e) { console.warn("[Init] Bitacora:", e); }
    
    // 3. Configurar calibración visual y silueta
    try { setupCalibrationSliders(); setupSilhouetteToggleListener(); } catch (e) { console.warn("[Init] Calib:", e); }

    // 4. Iniciar cámara de diagnóstico de forma asíncrona no bloqueante
    setTimeout(() => {
        try {
            startDiagnosticCamera();
            startProcessing();
        } catch (camErr) {
            console.warn("[Init] No se pudo arrancar la cámara automáticamente:", camErr);
        }
    }, 150);

    // 5. Registrar Service Worker PWA de forma limpia (sin recargas en bucle)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log("[PWA] Service Worker registrado correctamente.");
            try { reg.update(); } catch(e) {}
        }).catch(err => {
            console.warn("[PWA] Error al registrar el Service Worker:", err);
        });
    }
});
