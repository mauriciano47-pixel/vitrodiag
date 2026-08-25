// VitroDiag NEXUS v2.2.2 — Punto de Entrada y Coordinador Principal Always-Live
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
    switchToolTab
} from './ui.js';
import { 
    startDiagnosticCamera,
    stopDiagnosticCamera,
    startScannerCamera, 
    stopScannerCamera,
    openCameraPermissionModal,
    closeCameraPermissionModal,
    retryCameraPermissions,
    checkCameraPermissions,
    requestCameraPermissionDirectly
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
    analyzeSampleWithGeminiFromModal,
    renderDatasetGallery,
    populateDatasetSelect
} from './datasetManager.js';
import {
    initAcopioUI,
    savePhotoToAcopio,
    renderAcopioReel,
    loadAcopioPhotoToInspection,
    deleteAcopioPhoto,
    clearAllAcopioPhotos
} from './acopioManager.js';

// === NEXUS: Sistema de Inspección por Foto + Gemini IA ===

/**
 * Estado interno de la pantalla de inspección NEXUS.
 */
let nexusCurrentImageBase64 = null;
let lastSavedAcopioRecord = null;

/**
 * Dispara una captura instantánea desde el video de cámara en vivo o abre el selector de archivo.
 */
export function nexusSnapLiveWebcam() {
    const video = document.getElementById('webcam');
    if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const capCanvas = document.createElement('canvas');
        capCanvas.width = video.videoWidth;
        capCanvas.height = video.videoHeight;
        const ctx = capCanvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, capCanvas.width, capCanvas.height);
            nexusCurrentImageBase64 = capCanvas.toDataURL('image/jpeg', 0.85);
            window.nexusCurrentImageBase64 = nexusCurrentImageBase64;
            
            // Auto-guardar inmediatamente en Acopio
            savePhotoToAcopio({
                fotoBase64: nexusCurrentImageBase64,
                articuloId: state.activeArticle ? state.activeArticle.id : 'ssp_296',
                notas: 'Captura instantánea de visor en vivo'
            }).then(rec => {
                lastSavedAcopioRecord = rec;
            });

            // Mostrar preview
            const previewImg = document.getElementById('nexusPreviewImg');
            const placeholder = document.getElementById('nexusPlaceholder');
            const btnDiagnose = document.getElementById('btnRunDiagnosis') || document.getElementById('btnNexusDiagnose');
            const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');
            const bboxCanvas = document.getElementById('nexusBboxCanvas');
            
            if (video) video.style.display = 'none';
            if (previewImg) {
                previewImg.src = nexusCurrentImageBase64;
                previewImg.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            if (bboxCanvas) bboxCanvas.style.display = 'none';
            if (resultCard) resultCard.style.display = 'none';
            if (btnDiagnose) {
                btnDiagnose.disabled = false;
                btnDiagnose.style.opacity = '1';
            }
            showToast('📸 Foto capturada del visor en vivo y guardada en el acopio.', 'success');
            return;
        }
    }
    
    // Fallback si no hay stream activo
    const captureInput = document.getElementById('nexusCaptureInput');
    if (captureInput) captureInput.click();
}

/**
 * Maneja la selección de imagen (captura nativa o subida de archivo).
 * @param {Event} event 
 */
export function nexusHandleImageSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Seleccione un archivo de imagen válido.', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        nexusCurrentImageBase64 = e.target.result;
        window.nexusCurrentImageBase64 = nexusCurrentImageBase64;
        
        // Auto-guardar inmediatamente en el Acopio de Galería
        try {
            lastSavedAcopioRecord = await savePhotoToAcopio({
                fotoBase64: nexusCurrentImageBase64,
                articuloId: state.activeArticle ? state.activeArticle.id : 'ssp_296',
                notas: 'Foto capturada en inspección NEXUS'
            });
        } catch (acErr) {
            console.warn('[NEXUS] Auto-acopio:', acErr);
        }
        
        // Mostrar preview
        const previewImg = document.getElementById('nexusPreviewImg') || document.getElementById('scannerPreviewImg');
        const placeholder = document.getElementById('nexusPlaceholder');
        const webcamVideo = document.getElementById('webcam');
        const bboxCanvas = document.getElementById('nexusBboxCanvas');
        const btnDiagnose = document.getElementById('btnRunDiagnosis') || document.getElementById('btnNexusDiagnose');
        const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');
        
        if (webcamVideo) webcamVideo.style.display = 'none';
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
        
        showToast('📷 Fotografía capturada y acopiada. Presiona DIAGNOSTICAR.', 'success');
    };
    reader.readAsDataURL(file);
    
    // Resetear el input para permitir re-selección del mismo archivo
    event.target.value = '';
}

/**
 * Ejecuta el diagnóstico con Gemini 2.0 Flash sobre la imagen capturada.
 */
export async function nexusDiagnoseWithAI() {
    // Si no hay imagen cargada explícitamente, intentar capturar del canvas / webcam en vivo
    if (!nexusCurrentImageBase64) {
        const canvas = document.getElementById('canvasOutput');
        const video = document.getElementById('webcam');
        if (canvas && canvas.width > 0) {
            nexusCurrentImageBase64 = canvas.toDataURL('image/jpeg', 0.85);
        } else if (video && video.readyState >= 2 && video.videoWidth > 0) {
            const capCanvas = document.createElement('canvas');
            capCanvas.width = Math.min(video.videoWidth, 800);
            capCanvas.height = Math.round(capCanvas.width * (video.videoHeight / video.videoWidth));
            const ctx = capCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, capCanvas.width, capCanvas.height);
                nexusCurrentImageBase64 = capCanvas.toDataURL('image/jpeg', 0.85);
            }
        }
    }

    if (!nexusCurrentImageBase64) {
        showToast('Primero toma o sube una foto del envase.', 'warning');
        return;
    }
    
    // Cargar API Key si no está en estado
    if (!state.geminiApiKey) {
        loadGeminiApiKey();
    }

    if (!state.geminiApiKey) {
        promptSaveGeminiApiKey();
        return;
    }

    const btnDiagnose = document.getElementById('btnRunDiagnosis') || document.getElementById('btnNexusDiagnose');
    const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');
    
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
        const previewImg = document.getElementById('nexusPreviewImg') || document.getElementById('scannerPreviewImg');
        const bboxCanvas = document.getElementById('nexusBboxCanvas');
        if (previewImg && bboxCanvas && state.lastGeminiResult) {
            bboxCanvas.width = previewImg.naturalWidth || previewImg.width;
            bboxCanvas.height = previewImg.naturalHeight || previewImg.height;
            bboxCanvas.style.display = 'block';
            drawDefectBoundingBoxes(bboxCanvas, state.lastGeminiResult);
        }

        // Actualizar registro en acopio con el defecto detectado
        if (lastSavedAcopioRecord && state.lastGeminiResult && state.lastGeminiResult.analisis && state.lastGeminiResult.analisis.length > 0) {
            const firstDef = state.lastGeminiResult.analisis[0];
            lastSavedAcopioRecord.defectoId = firstDef.defecto_id;
            lastSavedAcopioRecord.defectoNombre = firstDef.defecto_nombre;
            lastSavedAcopioRecord.gravedad = firstDef.gravedad === 'critico' ? 'Crítico' : 'Mayor';
            lastSavedAcopioRecord.zona = firstDef.zona;
            lastSavedAcopioRecord.confianza = firstDef.confianza;
            renderAcopioReel();
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
export function nexusSaveToBitacora() {
    showToast('Resultado guardado en la bitácora del turno.', 'success');
    switchView('tools');
    if (window.switchToolTab) window.switchToolTab('log');
}

/**
 * Guarda la imagen inspeccionada en el Banco IA para Few-Shot RAG.
 */
export function nexusSaveToDataset() {
    switchView('dataset');
    showToast('Navega al Banco IA para etiquetar y guardar esta muestra.', 'info');
}

// Exponer funciones globales a window para compatibilidad estricta con eventos inline
window.nexusHandleImageSelect = nexusHandleImageSelect;
window.handleNexusCaptureSelect = nexusHandleImageSelect;
window.handleNexusUploadSelect = nexusHandleImageSelect;
window.nexusSnapLiveWebcam = nexusSnapLiveWebcam;
window.nexusDiagnoseWithAI = nexusDiagnoseWithAI;
window.triggerNexusDiagnosis = nexusDiagnoseWithAI;
window.nexusSaveToBitacora = nexusSaveToBitacora;
window.nexusSaveToDataset = nexusSaveToDataset;
window.openCameraPermissionModal = openCameraPermissionModal;
window.closeCameraPermissionModal = closeCameraPermissionModal;
window.retryCameraPermissions = retryCameraPermissions;
window.checkCameraPermissions = checkCameraPermissions;
window.requestCameraPermissionDirectly = requestCameraPermissionDirectly;

// Exponer funciones UI y Artículos
window.switchView = switchView;
window.switchToolTab = switchToolTab;
window.changeActiveArticle = changeActiveArticle;
window.openArticlesModal = openArticlesModal;
window.closeArticlesModal = closeArticlesModal;
window.loadArticleInModal = loadArticleInModal;
window.saveActiveArticleForm = saveActiveArticleForm;
window.resetArticlesDefault = resetArticlesDefault;
window.toggleDefectCard = toggleDefectCard;
window.setFilter = setFilter;
window.filterDefects = filterDefects;
window.showToast = showToast;
window.startDiagnosticCamera = startDiagnosticCamera;
window.stopDiagnosticCamera = stopDiagnosticCamera;

// Exponer funciones SOP y Scanner
window.calculateSopMs = calculateSopMs;
window.validateBdfTiming = validateBdfTiming;
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

// Exponer funciones Banco IA & Dataset
window.openSampleModal = openSampleModal;
window.closeSampleModal = closeSampleModal;
window.updateSampleNotesFromModal = updateSampleNotesFromModal;
window.deleteSampleFromModal = deleteSampleFromModal;
window.analyzeSampleWithGeminiFromModal = analyzeSampleWithGeminiFromModal;

// Configurar manejador global para promesas rechazadas
window.addEventListener('unhandledrejection', function(event) {
    console.error("[NEXUS] Promesa rechazada no manejada:", event.reason);
    if (event.reason && (event.reason.message || '').includes('Failed to fetch')) {
        console.warn("Posible pérdida de conexión de red. Evitando colapso.");
        event.preventDefault();
    }
});

/**
 * Función Maestra de Inicialización VitroDiag NEXUS
 */
export function initNexusApp() {
    console.log("[NEXUS] Ejecutando función maestra de inicialización...");

    // 1. Inicializar módulos base
    try { setupLogEventListeners(); } catch (e) { console.warn("[NEXUS] Log:", e); }
    try { initSwabModule(); } catch (e) { console.warn("[NEXUS] Swab:", e); }
    try { loadGeminiApiKey(); } catch (e) { console.warn("[NEXUS] Gemini:", e); }
    try { initConnectivityMonitor(); } catch (e) { console.warn("[NEXUS] Net:", e); }
    try { initDatasetUI(); } catch (e) { console.warn("[NEXUS] Dataset:", e); }
    try { initAcopioUI(); } catch (e) { console.warn("[NEXUS] Acopio:", e); }

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

    // 4. Iniciar cámara de diagnóstico en vivo si estamos en liveView
    try {
        startDiagnosticCamera();
    } catch (e) {
        console.warn("[NEXUS] AutoStart Camera:", e);
    }

    // 5. Modo Always-Live (Zero-SW / Zero-Cache)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            for (let reg of regs) reg.unregister();
        }).catch(() => {});
    }

    console.log("[NEXUS] VitroDiag v2.2.2 inicializado correctamente en modo Always-Live.");
}

// Inicialización defensiva independiente del estado de carga del documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNexusApp);
} else {
    // Si el DOM ya está listo (debido a la inyección asíncrona del bootstrapper), inicializar de inmediato
    initNexusApp();
}
