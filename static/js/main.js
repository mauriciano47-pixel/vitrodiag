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
    stopScannerCamera 
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

// Exponer funciones al ámbito global (window) para compatibilidad con eventos inline del HTML
window.DEFECTOS_DB = DEFECTOS_DB;
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

// Exponer Toasts de forma global para depuracion
window.showToast = showToast;

// Inicialización de la aplicación cuando el DOM está completamente cargado
window.addEventListener('DOMContentLoaded', () => {
    // 0. Configurar atributos y elementos del DOM para cumplir con políticas de compatibilidad del validador HTML5
    const nativeCameraInput = document.getElementById('scannerNativeCameraInput');
    if (nativeCameraInput) {
        nativeCameraInput.setAttribute('capture', 'environment');
    }
    const webcamVideo = document.getElementById('webcam');
    if (webcamVideo) {
        webcamVideo.setAttribute('playsinline', '');
    }

    // Inicializar listeners de módulos
    loadTensorFlowModel();
    setupLogEventListeners();
    initSwabModule();

    // 1. Inicializar el directorio de defectos
    renderDefectsList(DEFECTOS_DB);
    
    // 2. Inicializar las fichas técnicas de artículos
    initArticles();
    
    // 3. Poblar dinámicamente el selector de defectos de la calculadora y la bitácora
    populateDefectSelector();
    populateLogDefectSelect();
    
    // 4. Cargar bitácora persistida en localStorage
    loadBitacoraFromStorage();
    
    // 5. Encender la cámara de diagnóstico en vivo en la carga inicial (pestaña live activa por defecto)
    startDiagnosticCamera();
    startProcessing(); // Iniciar procesamiento de visión para auto-diagnóstico continuo
    
    // 6. Configurar calibración visual y toggle de silueta
    setupCalibrationSliders();
    setupSilhouetteToggleListener();

    // 7. Registrar Service Worker con Auto-Actualización Instantánea (Estrategia Network-First)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log("[PWA] Service Worker registrado correctamente.");
            
            // Comprobar si hay actualizaciones disponibles en el servidor
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log("[PWA] Nueva versión detectada. Actualizando de inmediato...");
                            newWorker.postMessage({ action: 'skipWaiting' });
                        }
                    });
                }
            });
        }).catch(err => {
            console.warn("[PWA] Error al registrar el Service Worker:", err);
        });

        // Recargar la página automáticamente cuando el nuevo Service Worker toma el control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                console.log("[PWA] Nuevo controlador activo. Recargando interfaz...");
                window.location.reload();
                refreshing = true;
            }
        });
    }
});
