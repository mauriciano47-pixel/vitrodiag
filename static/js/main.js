// VitroDiag NEXUS v2.0.0 — Punto de Entrada y Coordinador Principal
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
    startScannerCamera, 
    stopScannerCamera
} from './camera.js';
import { 
    calculateSopMs, 
    validateBdfTiming, 
    populateDefectSelector,
    loadBdfPreset,
    showDefectRemedy
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
} from './geminiVision.js';
import { 
    initDatasetUI,
    openSampleModal,
    closeSampleModal,
    updateSampleNotesFromModal,
    deleteSampleFromModal,
    analyzeSampleWithGeminiFromModal
} from './datasetManager.js';

// === NEXUS: Sistema de Inspección por Foto + Gemini IA ===

/**
 * Estado interno de la pantalla de inspección NEXUS.
 */
let nexusCurrentImageBase64 = null;

/**
 * Maneja la selección de imagen (captura o subida).
 * @param {Event} event 
 */
function nexusHandleImageSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Seleccione un archivo de imagen válido.', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        nexusCurrentImageBase64 = e.target.result;
        
        // Mostrar preview
        const previewImg = document.getElementById('nexusPreviewImg');
        const placeholder = document.getElementById('nexusPlaceholder');
        const bboxCanvas = document.getElementById('nexusBboxCanvas');
        const btnDiagnose = document.getElementById('btnNexusDiagnose');
        const resultCard = document.getElementById('nexusResultCard');
        
        if (previewImg) {
            previewImg.src = nexusCurrentImageBase64;
            previewImg.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (bboxCanvas) bboxCanvas.style.display = 'none';
        if (btnDiagnose) {
            btnDiagnose.disabled = false;
            btnDiagnose.style.opacity = '1';
        }
        if (resultCard) resultCard.style.display = 'none';
        
        showToast('📷 Imagen cargada. Presiona DIAGNOSTICAR para analizar.', 'success');
    };
    reader.readAsDataURL(file);
    
    // Resetear el input para permitir re-selección del mismo archivo
    event.target.value = '';
}

/**
 * Ejecuta el diagnóstico con Gemini 2.0 Flash sobre la imagen capturada.
 */
async function nexusDiagnoseWithAI() {
    if (!nexusCurrentImageBase64) {
        showToast('Primero toma o sube una foto del envase.', 'warning');
        return;
    }
    
    if (!state.geminiApiKey) {
        promptSaveGeminiApiKey();
        return;
    }

    const btnDiagnose = document.getElementById('btnNexusDiagnose');
    const resultCard = document.getElementById('nexusResultCard');
    
    if (btnDiagnose) {
        btnDiagnose.disabled = true;
        btnDiagnose.innerHTML = '⏳ Analizando con Gemini 2.0 Flash...';
        btnDiagnose.style.opacity = '0.6';
    }
    
    if (resultCard) resultCard.style.display = 'none';

    try {
        await runDeepDiagnosis(nexusCurrentImageBase64);
        
        // Mostrar la tarjeta de resultado
        if (resultCard) resultCard.style.display = 'block';
        
        // Dibujar bounding boxes sobre la preview
        const previewImg = document.getElementById('nexusPreviewImg');
        const bboxCanvas = document.getElementById('nexusBboxCanvas');
        if (previewImg && bboxCanvas && state.lastGeminiResult) {
            bboxCanvas.width = previewImg.naturalWidth || previewImg.width;
            bboxCanvas.height = previewImg.naturalHeight || previewImg.height;
            bboxCanvas.style.display = 'block';
            drawDefectBoundingBoxes(bboxCanvas, state.lastGeminiResult);
        }
    } catch (err) {
        console.error('[NEXUS] Error en diagnóstico IA:', err);
        showToast('Error al conectar con Gemini. Verifica tu conexión a internet y API Key.', 'danger');
    } finally {
        if (btnDiagnose) {
            btnDiagnose.disabled = false;
            btnDiagnose.innerHTML = '⚡ DIAGNOSTICAR CON IA (GEMINI 2.0)';
            btnDiagnose.style.opacity = '1';
        }
    }
}

/**
 * Guarda el último resultado de inspección en la bitácora.
 */
function nexusSaveToBitacora() {
    showToast('Resultado guardado en la bitácora del turno.', 'success');
    // Cambiar a la vista de herramientas y abrir la bitácora
    switchView('tools');
    if (window.switchToolTab) window.switchToolTab('log');
}

/**
 * Guarda la imagen inspeccionada en el Banco IA para Few-Shot RAG.
 */
function nexusSaveToDataset() {
    switchView('dataset');
    showToast('Navega al Banco IA para etiquetar y guardar esta muestra.', 'info');
}

// Exponer funciones NEXUS al ámbito global
window.nexusHandleImageSelect = nexusHandleImageSelect;
window.nexusDiagnoseWithAI = nexusDiagnoseWithAI;
window.nexusSaveToBitacora = nexusSaveToBitacora;
window.nexusSaveToDataset = nexusSaveToDataset;

// Exponer funciones de módulos existentes al ámbito global
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

window.validateBdfTiming = validateBdfTiming;
window.calculateSopMs = calculateSopMs;
window.loadBdfPreset = loadBdfPreset;
window.showDefectRemedy = showDefectRemedy;

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

window.saveGeminiApiKey = saveGeminiApiKey;
window.clearGeminiApiKey = clearGeminiApiKey;
window.runDeepDiagnosis = runDeepDiagnosis;
window.showToast = showToast;

// Configurar manejador global para promesas rechazadas
window.addEventListener('unhandledrejection', function(event) {
    console.error("[NEXUS] Promesa rechazada no manejada:", event.reason);
    if (event.reason && (event.reason.message || '').includes('Failed to fetch')) {
        console.warn("Posible pérdida de conexión de red. Evitando colapso.");
        event.preventDefault();
    }
});

// Inicialización NEXUS cuando el DOM está listo
window.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar módulos base
    try { setupLogEventListeners(); } catch (e) { console.warn("[NEXUS] Log:", e); }
    try { initSwabModule(); } catch (e) { console.warn("[NEXUS] Swab:", e); }
    try { loadGeminiApiKey(); } catch (e) { console.warn("[NEXUS] Gemini:", e); }
    try { initConnectivityMonitor(); } catch (e) { console.warn("[NEXUS] Net:", e); }
    try { initDatasetUI(); } catch (e) { console.warn("[NEXUS] Dataset:", e); }

    // 2. Inicializar directorio de defectos y artículos
    try { renderDefectsList(DEFECTOS_DB); } catch (e) { console.warn("[NEXUS] Defects:", e); }
    try { initArticles(); } catch (e) { console.warn("[NEXUS] Articles:", e); }
    try { populateDefectSelector(); populateLogDefectSelect(); } catch (e) { console.warn("[NEXUS] Selects:", e); }
    try { loadBitacoraFromStorage(); } catch (e) { console.warn("[NEXUS] Bitacora:", e); }

    // 3. Configurar inputs de captura NEXUS
    const captureInput = document.getElementById('nexusCaptureInput');
    const uploadInput = document.getElementById('nexusUploadInput');
    if (captureInput) captureInput.addEventListener('change', nexusHandleImageSelect);
    if (uploadInput) uploadInput.addEventListener('change', nexusHandleImageSelect);

    // 4. Registrar Service Worker PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log("[NEXUS PWA] Service Worker registrado.");
            try { reg.update(); } catch(e) {}
        }).catch(err => {
            console.warn("[NEXUS PWA] Error al registrar SW:", err);
        });
    }

    console.log("[NEXUS] VitroDiag NEXUS v2.0.0 inicializado correctamente.");
});
