// VitroDiag NEXUS v2.2.4 — Punto de Entrada y Coordinador Principal Always-Live
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
    toggleCameraFacingMode,
    toggleNexusCameraStream,
    captureCurrentVideoFrameBase64,
    updateCameraControlsUI,
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
    openAcopioLightboxModal,
    closeAcopioLightboxModal,
    analyzeActiveLightboxWithGemini,
    transferActiveLightboxToDataset,
    deleteAcopioPhoto,
    clearAllAcopioPhotos
} from './acopioManager.js';

// === NEXUS: Sistema de Inspección por Foto + Gemini IA ===

/**
 * Estado interno de la pantalla de inspección NEXUS.
 */
let nexusCurrentImageBase64 = null;
let lastSavedAcopioRecord = null;

// Exponer state globalmente
if (typeof window !== 'undefined') {
    window.state = state;
}

/**
 * Dispara una captura instantánea desde el video de cámara en vivo o inicia el stream.
 */
export function nexusSnapLiveWebcam() {
    const video = document.getElementById('webcam');
    if (state.diagnosticStream && video && video.readyState >= 2 && video.videoWidth > 0) {
        nexusCurrentImageBase64 = captureCurrentVideoFrameBase64();
        if (nexusCurrentImageBase64) {
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
            updateCameraControlsUI();
            showToast('📸 Foto capturada del visor en vivo y guardada en el acopio.', 'success');
            return;
        }
    }
    
    // Si la cámara no estaba encendida, encenderla
    startDiagnosticCamera(true);
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
        const frame = captureCurrentVideoFrameBase64();
        if (frame) {
            nexusCurrentImageBase64 = frame;
            window.nexusCurrentImageBase64 = frame;
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
        
        // Actualizar registro en Acopio con el defecto detectado
        if (state.lastGeminiResult && state.lastGeminiResult.analisis && state.lastGeminiResult.analisis.length > 0) {
            const topDef = state.lastGeminiResult.analisis[0];
            savePhotoToAcopio({
                fotoBase64: nexusCurrentImageBase64,
                articuloId: state.activeArticle ? state.activeArticle.id : 'ssp_296',
                defectoId: topDef.defecto_id,
                defectoNombre: topDef.nombre_comun || topDef.defecto_id,
                gravedad: topDef.gravedad || 'Mayor',
                zona: topDef.zona_afectada || 'general',
                confianza: topDef.confianza_porcentaje || 90,
                bbox: topDef.coordenadas_bbox || null
            });
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
    if (nexusCurrentImageBase64) {
        window.tempCapturedBase64 = nexusCurrentImageBase64;
        const previewContainer = document.getElementById('datasetPreviewContainer');
        const previewImg = document.getElementById('datasetPreviewImg');
        if (previewImg && previewContainer) {
            previewImg.src = nexusCurrentImageBase64;
            previewContainer.style.display = 'block';
        }
        if (state.lastGeminiResult && state.lastGeminiResult.analisis && state.lastGeminiResult.analisis.length > 0) {
            const defId = state.lastGeminiResult.analisis[0].defecto_id;
            const select = document.getElementById('datasetDefectSelect');
            if (select && defId) select.value = defId;
        }
    }
    switchView('dataset');
    showToast('Foto cargada en el Banco IA. Asigna la etiqueta y presiona Guardar Muestra.', 'success');
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
window.toggleNexusCameraStream = toggleNexusCameraStream;
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
window.toggleCameraFacingMode = toggleCameraFacingMode;
window.updateCameraControlsUI = updateCameraControlsUI;

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

    // 4. Actualizar estado visual de controles de cámara
    try {
        updateCameraControlsUI();
    } catch (e) {
        console.warn("[NEXUS] Update Camera UI:", e);
    }

    // 5. Modo Always-Live (Zero-SW / Zero-Cache)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            for (let reg of regs) reg.unregister();
        }).catch(() => {});
    }

    console.log("[NEXUS] VitroDiag v2.2.4 inicializado correctamente en modo Always-Live.");
}

// Inicialización defensiva independiente del estado de carga del documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNexusApp);
} else {
    initNexusApp();
}
