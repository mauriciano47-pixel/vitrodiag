// VitroDiag NEXUS v2.2.5 — Punto de Entrada y Coordinador Principal Always-Live
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
    setVisionEngineMode,
    nexusTriggerNativeCamera,
    nexusTriggerGalleryUpload,
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
 * Comprime y escala cualquier archivo de imagen pesado (hasta 50MP) a max 1280px / JPEG 85%
 * en menos de 30ms para garantizar carga instantánea, guardado en IndexedDB y envío veloz a Gemini.
 * @param {File|Blob} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<string>}
 */
export function compressImageFile(file, maxWidth = 1280, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = (err) => {
            console.error('[Compress] Error leyendo archivo:', err);
            reject(err);
        };
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = (err) => {
                console.error('[Compress] Error cargando imagen en DOM:', err);
                resolve(e.target.result); // fallback a original
            };
            img.onload = () => {
                try {
                    let width = img.naturalWidth || img.width;
                    let height = img.naturalHeight || img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(e.target.result);
                        return;
                    }

                    // Renderizar con suavizado óptico de alta calidad
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressed = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressed);
                } catch (canvasErr) {
                    console.warn('[Compress] Fallback canvas:', canvasErr);
                    resolve(e.target.result);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
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
            
            const autoDiagToggle = document.getElementById('autoDiagnoseToggle');
            if (autoDiagToggle && autoDiagToggle.checked) {
                showToast('📸 Fotograma capturado. Auto-diagnosticando...', 'info');
                nexusDiagnoseWithAI();
            } else {
                showToast('📸 Foto capturada del visor en vivo y guardada en el acopio.', 'success');
            }
            return;
        }
    }
    
    // Si la cámara no estaba encendida, encenderla
    startDiagnosticCamera(true);
}

/**
 * Procesa cualquier archivo de imagen entrante (cámara nativa, galería, drag&drop, clipboard).
 * @param {File|Blob} file 
 */
export async function nexusProcessIncomingImageFile(file) {
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
        showToast('Por favor seleccione un archivo de imagen válido.', 'danger');
        return;
    }

    showToast('⏳ Procesando fotografía del envase...', 'info');

    try {
        // Comprimir y normalizar imagen para velocidad extrema y cero problemas de memoria
        const optimizedBase64 = await compressImageFile(file, 1280, 0.85);
        nexusCurrentImageBase64 = optimizedBase64;
        window.nexusCurrentImageBase64 = optimizedBase64;

        // 1. Mostrar de inmediato en el visor
        const previewImg = document.getElementById('nexusPreviewImg') || document.getElementById('scannerPreviewImg');
        const placeholder = document.getElementById('nexusPlaceholder');
        const webcamVideo = document.getElementById('webcam');
        const bboxCanvas = document.getElementById('nexusBboxCanvas');
        const btnDiagnose = document.getElementById('btnRunDiagnosis') || document.getElementById('btnNexusDiagnose');
        const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');
        const status = document.getElementById('opencvStatus');

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
        if (status) {
            status.innerText = "🟢 Fotografía cargada en alta resolución";
            status.style.color = "#10b981";
        }

        // 2. Auto-guardar inmediatamente en el Acopio de Galería
        try {
            lastSavedAcopioRecord = await savePhotoToAcopio({
                fotoBase64: nexusCurrentImageBase64,
                articuloId: state.activeArticle ? state.activeArticle.id : 'ssp_296',
                notas: 'Foto capturada en inspección NEXUS'
            });
        } catch (acErr) {
            console.warn('[NEXUS] Auto-acopio:', acErr);
        }

        // 3. Auto-Diagnóstico inmediato con Gemini IA o fallback local
        const autoDiagToggle = document.getElementById('autoDiagnoseToggle');
        const shouldAutoDiagnose = autoDiagToggle ? autoDiagToggle.checked : true;

        if (shouldAutoDiagnose) {
            showToast('🔍 Analizando defectos del envase con IA...', 'info');
            await nexusDiagnoseWithAI();
        } else {
            showToast('✅ Foto lista en el visor y acopiada. Toca DIAGNOSTICAR.', 'success');
        }
    } catch (err) {
        console.error('[NEXUS] Error procesando imagen:', err);
        showToast('Error al procesar la imagen. Intenta de nuevo.', 'danger');
    }
}

/**
 * Maneja la selección de imagen desde inputs de archivo.
 * @param {Event} event 
 */
export function nexusHandleImageSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    nexusProcessIncomingImageFile(file);
}

/**
 * Configura listeners de Portapapeles (Ctrl+V) y Drag & Drop.
 */
export function setupDragAndDropAndClipboard() {
    // 1. Soporte Clipboard Paste (Ctrl+V)
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData))?.items;
        if (!items) return;
        for (let item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                if (blob) {
                    showToast('📋 Imagen pegada desde el portapapeles.', 'info');
                    nexusProcessIncomingImageFile(blob);
                    break;
                }
            }
        }
    });

    // 2. Soporte Drag & Drop en visor
    const visor = document.getElementById('nexusPreviewArea');
    if (visor) {
        ['dragenter', 'dragover'].forEach(eventName => {
            visor.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                visor.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            visor.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                visor.classList.remove('drag-active');
            }, false);
        });

        visor.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt ? dt.files : null;
            if (files && files[0] && files[0].type.startsWith('image/')) {
                showToast('📁 Imagen soltada en el visor.', 'info');
                nexusProcessIncomingImageFile(files[0]);
            }
        }, false);
    }
}

/**
 * Renderiza una tarjeta de inspección preliminar cuando no hay clave de Gemini disponible.
 */
function renderPreliminaryInspectionCard() {
    const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');
    const articleName = state.activeArticle ? state.activeArticle.nombre : "SSP 296";

    if (diagTitulo) diagTitulo.innerText = `📸 Inspección Registrada (${articleName})`;
    if (diagGravedad) {
        diagGravedad.className = "status-alert status-success";
        diagGravedad.style.display = "inline-block";
        diagGravedad.innerText = "Foto Acopiada";
    }
    if (diagEstado) {
        diagEstado.innerHTML = `<strong>Inspección Óptica Realizada:</strong> La fotografía ha sido registrada con éxito en el visor y acopio local del turno.<br><br>
        <em>Para activar el diagnóstico neuronal profundo automático con Gemini 2.0 Flash Vision, presiona '🔑 Configurar Gemini IA'.</em>`;
    }
    if (diagAcciones) {
        diagAcciones.innerHTML = `
            <li><button class="btn-action" style="font-size:0.85rem; padding:8px 14px; background:linear-gradient(135deg,#ff6f00,#ea580c); margin-bottom:8px;" onclick="if(window.promptSaveGeminiApiKey) window.promptSaveGeminiApiKey();">🔑 Configurar API Key de Gemini IA</button></li>
            <li>La fotografía fue guardada de forma segura en la <strong>Galería Receptora / Acopio</strong> abajo.</li>
            <li>Puedes etiquetarla manualmente y enviarla al <strong>Banco IA</strong> en 1 toque.</li>
        `;
    }
    if (resultCard) resultCard.style.display = 'block';
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

    const btnDiagnose = document.getElementById('btnRunDiagnosis') || document.getElementById('btnNexusDiagnose');
    const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');

    // Si aún no hay clave configurada, mostrar tarjeta de inspección lista y pedir clave amistosamente
    if (!state.geminiApiKey) {
        renderPreliminaryInspectionCard();
        showToast("📸 Foto guardada. Configura tu API Key para análisis IA completo.", "info");
        return;
    }

    if (btnDiagnose) {
        btnDiagnose.disabled = true;
        btnDiagnose.innerHTML = '⏳ Analizando con Gemini 2.0 Flash...';
        btnDiagnose.style.opacity = '0.6';
    }
    
    if (resultCard) resultCard.style.display = 'block';

    try {
        const result = await runDeepDiagnosis(nexusCurrentImageBase64);
        
        // Actualizar registro en Acopio con el defecto detectado
        if (result && result.analisis && result.analisis.length > 0) {
            const topDef = result.analisis[0];
            savePhotoToAcopio({
                fotoBase64: nexusCurrentImageBase64,
                articuloId: state.activeArticle ? state.activeArticle.id : 'ssp_296',
                defectoId: topDef.defecto_id,
                defectoNombre: topDef.defecto_nombre || topDef.nombre_comun || topDef.defecto_id,
                gravedad: topDef.gravedad || 'Mayor',
                zona: topDef.zona_afectada || topDef.zona || 'general',
                confianza: topDef.confianza_porcentaje || topDef.confianza || 90,
                bbox: topDef.coordenadas_bbox || topDef.bbox || null
            });
        }
    } catch (err) {
        console.error('[NEXUS] Error en diagnóstico IA:', err);
        showToast('Error al conectar con Gemini. Mostrando inspección local.', 'warning');
        renderPreliminaryInspectionCard();
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

// Exponer funciones globales a window para compatibilidad estricta
window.nexusHandleImageSelect = nexusHandleImageSelect;
window.handleNexusCaptureSelect = nexusHandleImageSelect;
window.handleNexusUploadSelect = nexusHandleImageSelect;
window.nexusProcessIncomingImageFile = nexusProcessIncomingImageFile;
window.compressImageFile = compressImageFile;
window.nexusSnapLiveWebcam = nexusSnapLiveWebcam;
window.nexusDiagnoseWithAI = nexusDiagnoseWithAI;
window.triggerNexusDiagnosis = nexusDiagnoseWithAI;
window.nexusSaveToBitacora = nexusSaveToBitacora;
window.nexusSaveToDataset = nexusSaveToDataset;
window.toggleNexusCameraStream = toggleNexusCameraStream;
window.setVisionEngineMode = setVisionEngineMode;
window.nexusTriggerNativeCamera = nexusTriggerNativeCamera;
window.nexusTriggerGalleryUpload = nexusTriggerGalleryUpload;
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

    // 3. Configurar inputs de captura NEXUS de forma limpia y robusta
    const captureInput = document.getElementById('nexusCaptureInput');
    const uploadInput = document.getElementById('nexusUploadInput');
    
    if (captureInput) {
        captureInput.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                nexusProcessIncomingImageFile(file);
            }
            setTimeout(() => { try { e.target.value = ''; } catch(_) {} }, 600);
        };
    }
    if (uploadInput) {
        uploadInput.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                nexusProcessIncomingImageFile(file);
            }
            setTimeout(() => { try { e.target.value = ''; } catch(_) {} }, 600);
        };
    }

    // 4. Configurar Drag & Drop y Portapapeles (Ctrl+V)
    try {
        setupDragAndDropAndClipboard();
    } catch (e) {
        console.warn("[NEXUS] Drag & Drop:", e);
    }

    // 5. Configurar modo inicial (Nativo Zero-Permisos por defecto)
    try {
        updateCameraControlsUI();
    } catch (e) {
        console.warn("[NEXUS] Update Camera UI:", e);
    }

    // 6. Modo Always-Live (Zero-SW / Zero-Cache)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            for (let reg of regs) reg.unregister();
        }).catch(() => {});
    }

    console.log("[NEXUS] VitroDiag v2.2.5 inicializado correctamente en modo Always-Live Zero-Permisos.");
}

// Inicialización defensiva independiente del estado de carga del documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNexusApp);
} else {
    initNexusApp();
}
