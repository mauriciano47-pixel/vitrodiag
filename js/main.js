// Punto de Entrada y Coordinador Principal (VitroDiag v47)
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
    switchView 
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
    resetScannerReport 
} from './ocr.js';
import { 
    updateConfidenceThresholdDisplay, 
    loadCustomUploadedModel,
    setupAiEventListeners
} from './ai.js';
import { 
    populateLogDefectSelect, 
    loadBitacoraFromStorage, 
    renderBitacoraList 
} from './log.js';

// Exponer funciones al ámbito global (window) para compatibilidad con eventos inline del HTML
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

window.updateConfidenceThresholdDisplay = updateConfidenceThresholdDisplay;
window.loadCustomUploadedModel = loadCustomUploadedModel;

// Exponer Toasts de forma global para depuracion
window.showToast = showToast;

// Inicialización de la aplicación cuando el DOM está completamente cargado
window.addEventListener('DOMContentLoaded', () => {
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
    
    // 6. Configurar listeners de interfaz de IA y calibración visual que se perdieron en la refactorización
    setupCalibrationSliders();
    setupAiEventListeners();
    
    // 7. Registrar Service Worker para PWA Offline con actualización agresiva garantizada
    if ('serviceWorker' in navigator) {
        let refreshing = false;

        // Cuando el nuevo SW toma el control, recargar la página para aplicar los cambios
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log("[PWA] Nuevo Service Worker tomó el control. Recargando app...");
                window.location.reload();
            }
        });

        navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            console.log('[PWA] Service Worker registrado. Estado:', reg.active ? 'Activo' : 'Instalando...');

            // CLAVE: Forzar verificación activa de actualización en cada carga de la app.
            // Sin esto, el browser puede esperar hasta 24h para revisar si el SW cambió.
            reg.update().then(() => {
                console.log("[PWA] Verificación de actualizaciones forzada con éxito.");
            }).catch(err => console.warn("[PWA] No se pudo verificar actualización:", err));

            // Si ya hay un SW nuevo esperando activación (sesión anterior dejó uno pendiente), activarlo ya
            if (reg.waiting) {
                console.log("[PWA] SW nuevo en cola (waiting). Activando inmediatamente...");
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Escuchar nuevas instalaciones durante la sesión actual
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Ya existe un SW activo controlando la página → activar la nueva versión
                                console.log("[PWA] Nueva versión instalada. Forzando activación inmediata...");
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                        }
                    });
                }
            });
        })
        .catch(err => console.error('[PWA] Error al registrar Service Worker:', err));
    }
});
