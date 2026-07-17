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

    // 7. Sistema de actualización forzada y registro del Service Worker
    if ('serviceWorker' in navigator) {
        let refreshing = false;

        // Cuando el nuevo SW toma el control, recargar para aplicar los cambios
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log("[PWA] Nuevo SW activo. Recargando...");
                window.location.reload();
            }
        });

        // ─── SISTEMA DE DETECCIÓN DE VERSIÓN (bypasea el caché del SW) ───────────
        // Busca version.json DIRECTAMENTE en el servidor (no pasa por el SW).
        // Si la versión del servidor es distinta a la guardada localmente,
        // limpia TODOS los caches y fuerza una recarga completa.
        const checkAndForceUpdate = async () => {
            try {
                const res = await fetch('./version.json', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                const serverVersion = data.v;
                const localVersion = localStorage.getItem('vitrodiag-version');

                console.log(`[PWA] Versión local: ${localVersion} | Versión servidor: ${serverVersion}`);

                if (serverVersion && serverVersion !== localVersion) {
                    console.log('[PWA] ¡Nueva versión detectada! Borrando caches y recargando...');
                    // Borrar absolutamente todos los caches del SW
                    const cacheKeys = await caches.keys();
                    await Promise.all(cacheKeys.map(key => caches.delete(key)));
                    // Desregistrar el SW viejo para que se instale el nuevo limpiamente
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(r => r.unregister()));
                    // Guardar la nueva versión
                    localStorage.setItem('vitrodiag-version', serverVersion);
                    // Recargar la página forzando descarga desde servidor
                    window.location.reload(true);
                } else if (!localVersion && serverVersion) {
                    // Primera vez que se instala: guardar la versión actual
                    localStorage.setItem('vitrodiag-version', serverVersion);
                }
            } catch (e) {
                console.log('[PWA] Sin conexión o error al verificar versión:', e.message);
            }
        };

        // Ejecutar la verificación de versión inmediatamente
        checkAndForceUpdate();

        // ─── REGISTRO DEL SERVICE WORKER ──────────────────────────────────────────
        navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            console.log('[PWA] Service Worker registrado. Estado:', reg.active ? 'Activo' : 'Instalando...');

            // Forzar verificación de actualización del SW en cada carga
            reg.update().catch(err => console.warn("[PWA] No se pudo verificar actualización del SW:", err));

            // Si ya hay un SW nuevo esperando (sesión anterior), activarlo ya
            if (reg.waiting) {
                console.log("[PWA] SW nuevo en cola. Activando inmediatamente...");
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log("[PWA] Nueva versión del SW instalada. Activando...");
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
            });
        })
        .catch(err => console.error('[PWA] Error al registrar Service Worker:', err));
    }
});
