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
    setVisionMode 
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
    loadCustomUploadedModel 
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
    
    // 6. Registrar Service Worker para PWA Offline con autodetección y recarga automática
    if ('serviceWorker' in navigator) {
        let refreshing = false;
        
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log("[PWA] Nuevo Service Worker tomó el control. Recargando app...");
                window.location.reload();
            }
        });

        // Desregistrar workers antiguos de forma transparente para forzar la actualización limpia
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister().then(() => {
                    console.log("[PWA] Service Worker antiguo removido.");
                });
            }
        }).catch(err => console.warn("Error al limpiar workers previos:", err));

        // Registrar directamente sin query string para evitar conflictos MIME de servidores estáticos
        navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            console.log('Service Worker de VitroDiag registrado con éxito.', reg);
            
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log("[PWA] Actualización detectada. Activando...");
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    }
                });
            });
        })
        .catch(err => console.error('Error al registrar Service Worker: ', err));
    }
});
