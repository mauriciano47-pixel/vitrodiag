// Módulo de Análisis de Defectos con Gemini Vision API
// Motor principal de detección inteligente para VitroDiag (Opción D - Híbrido)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
import { state } from './state.js';
import { showToast } from './ui.js';
import { DEFECTOS_DB, findDefectByIdOrFuzzy } from './db.js';
import { getFewShotExamplesForDefect } from './datasetManager.js';
import {
    renderGeminiResult,
    openGeminiConfigModal,
    closeGeminiConfigModal,
    toggleGeminiKeyVisibility,
    clearGeminiModalKeyInput,
    pasteAndRegisterGeminiKey,
    saveAndTestGeminiModalKey,
    activateLocalExpertModeFromModal,
    promptSaveGeminiApiKey,
    captureAndAnalyzeWithAI,
    triggerDeepAnalysisFileUpload,
    handleDeepAnalysisFileSelect
} from './geminiModalController.js';
import { 
    updateGeminiStatusUI, 
    updateAnalyzingUI, 
    updateConnectivityUI, 
    initConnectivityMonitor, 
    drawDefectBoundingBoxes,
    preprocessGlassImage,
    buildGlassDefectPrompt
} from './geminiUI.js';

export { preprocessGlassImage };

// Configuración del endpoint de Gemini Vision API
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Cooldown entre análisis automáticos (ms)
const AUTO_ANALYSIS_COOLDOWN_MS = 6000;

// Timestamp del último análisis exitoso
let lastAnalysisTimestamp = 0;



/**
 * Guarda la API Key de Gemini en localStorage de forma segura.
 * @param {string} key - La API Key de Google AI Studio
 */
export function saveGeminiApiKey(key) {
    if (!key || key.trim().length < 10) {
        showToast("API Key inválida. Debe tener al menos 10 caracteres.", "warning");
        return false;
    }
    try {
        localStorage.setItem('vitrodiag_gemini_key', key.trim());
        state.geminiApiKey = key.trim();
        showToast("API Key de Gemini guardada correctamente.", "success");
        updateGeminiStatusUI(true);
        return true;
    } catch (e) {
        console.error("[GeminiVision] Error guardando API Key:", e);
        showToast("Error al guardar la API Key.", "danger");
        return false;
    }
}

// 🛡️ GESTIÓN TRANSPARENTE DE API KEY (Zero Dead-Key Standard)
// Purga automática de claves revocadas antiguas o contraseñas autocompletadas por error.
const REVOKED_LEGACY_KEY_B64 = "QUl6YVN5RGw2SmRFVlM4bnhPdEhhcTl5dnpFblpPVlZ3R2xR";

export function extractCleanGeminiKey(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let cleaned = raw.trim();
    try {
        const legacyRevoked = typeof atob === 'function'
            ? atob(REVOKED_LEGACY_KEY_B64)
            : Buffer.from(REVOKED_LEGACY_KEY_B64, 'base64').toString('utf8');
        if (legacyRevoked) {
            cleaned = cleaned.split(legacyRevoked).join('').trim();
        }
    } catch (_) {}
    // Si el usuario pegó una clave encima de otra (concatenación en input password), extraer el último token AIza...
    const matches = cleaned.match(/AIza[0-9A-Za-z_-]{30,45}/g);
    if (matches && matches.length > 0) {
        return matches[matches.length - 1].trim();
    }
    return cleaned.replace(/['"\s]+/g, '');
}

export function isValidGeminiKeySyntax(key) {
    if (!key || typeof key !== 'string') return false;
    const trimmed = key.trim();
    if (!trimmed.startsWith('AIza') || trimmed.length < 20 || trimmed.length > 60) return false;
    try {
        const legacyRevoked = typeof atob === 'function'
            ? atob(REVOKED_LEGACY_KEY_B64)
            : Buffer.from(REVOKED_LEGACY_KEY_B64, 'base64').toString('utf8');
        if (trimmed === legacyRevoked) return false;
    } catch (_) {}
    return true;
}

/**
 * Recupera la API Key almacenada en localStorage, purgando automáticamente la clave histórica revocada.
 * @returns {string|null}
 */
export function loadGeminiApiKey() {
    try {
        const customKey = localStorage.getItem('vitrodiag_gemini_key');
        if (customKey) {
            const clean = extractCleanGeminiKey(customKey);
            if (clean && clean.length >= 10) {
                if (clean !== customKey) {
                    localStorage.setItem('vitrodiag_gemini_key', clean);
                }
                state.geminiApiKey = clean;
                updateGeminiStatusUI(true);
                return state.geminiApiKey;
            } else {
                localStorage.removeItem('vitrodiag_gemini_key');
            }
        }

        // Modo Local Experto (Sin clave externa)
        state.geminiApiKey = null;
        updateGeminiStatusUI(false);
        return null;
    } catch (e) {
        state.geminiApiKey = null;
        updateGeminiStatusUI(false);
        return null;
    }
}

/**
 * Elimina la API Key almacenada.
 */
export function clearGeminiApiKey() {
    try {
        localStorage.removeItem('vitrodiag_gemini_key');
        state.geminiApiKey = null;
        updateGeminiStatusUI(false);
        showToast("API Key de Gemini eliminada.", "info");
    } catch (e) {
        console.error("[GeminiVision] Error eliminando API Key:", e);
    }
}

/**
 * Comprueba si hay conectividad a internet.
 * @returns {Promise<boolean>}
 */
export async function checkConnectivity() {
    if (!navigator.onLine) {
        state.isOnline = false;
        return false;
    }

    try {
        // Ping ligero al endpoint de Gemini para verificar conectividad real
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://generativelanguage.googleapis.com/', {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        state.isOnline = true;
        return true;
    } catch (e) {
        // Si falla el fetch pero navigator.onLine es true, probamos con un fallback
        state.isOnline = navigator.onLine;
        return navigator.onLine;
    }
}

/**
 * Captura el frame actual del canvas como Base64 JPEG.
 * @param {HTMLCanvasElement} canvas - El canvas con la imagen a analizar
 * @param {HTMLVideoElement} [videoElement] - El video original para captura directa
 * @returns {string|null} Base64 de la imagen (sin prefijo data:...)
 */
function captureFrameAsBase64(canvas, videoElement) {
    try {
        // Preferir captura directa del video para obtener la imagen real (no los contornos)
        if (videoElement && videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
            const captureCanvas = document.createElement('canvas');
            captureCanvas.width = Math.min(videoElement.videoWidth, 640);
            captureCanvas.height = Math.round(captureCanvas.width * (videoElement.videoHeight / videoElement.videoWidth));
            const captureCtx = captureCanvas.getContext('2d');
            captureCtx.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height);
            const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.85);
            return dataUrl.split(',')[1]; // Remover el prefijo "data:image/jpeg;base64,"
        }

        // Fallback: usar el canvas de contornos
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            return dataUrl.split(',')[1];
        }

        return null;
    } catch (e) {
        console.error("[GeminiVision] Error capturando frame:", e);
        return null;
    }
}

/**
 * Realiza la llamada a Gemini API probando una cascada de modelos para máxima tolerancia a fallos.
 * @param {object} requestBody 
 * @param {string} apiKey 
 * @returns {Promise<object|null>}
 */
async function executeGeminiApiFetch(requestBody, apiKey) {
    const endpoints = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    ];

    let lastErrorMsg = null;

    for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s anti-timeout per protocol

        try {
            const response = await fetch(`${endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));

            if (response.ok) {
                const data = await response.json();
                return data;
            }

            const errorData = await response.json().catch(() => ({}));
            lastErrorMsg = errorData?.error?.message || `HTTP ${response.status}`;
            console.warn(`[GeminiVision] Fallo en endpoint ${endpoint}:`, lastErrorMsg);

            // Si es error de clave o cuota (400 / 401 / 403 / 429), romper el bucle sin borrar la clave del usuario y conmutar silenciosamente al Motor Experto Local
            const isKeyOrQuotaIssue = response.status === 401 || response.status === 403 || response.status === 429 ||
                (response.status === 400 && /API key not valid|API_KEY_INVALID/i.test(lastErrorMsg));
            if (isKeyOrQuotaIssue) {
                lastErrorMsg = null;
                break;
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.warn(`[GeminiVision] Timeout 8s en endpoint ${endpoint}. Intentando siguiente...`);
            } else {
                console.warn(`[GeminiVision] Error de red en ${endpoint}:`, err);
            }
        }
    }

    return null;
}

/**
 * Envía una imagen a Gemini Vision API y obtiene el análisis de defectos.
 * @param {HTMLCanvasElement} canvas - Canvas con la imagen procesada
 * @param {HTMLVideoElement} [videoElement] - Video original para captura directa
 * @returns {Promise<object|null>} Resultado del análisis o null si falla
 */

/**
 * Prueba una API Key de Gemini contra la API de Google para verificar validez en tiempo real.
 * @param {string} apiKey
 * @returns {Promise<{valid: boolean, message: string}>}
 */
export async function testGeminiApiKey(apiKey) {
    if (!apiKey || apiKey.trim().length < 10) {
        return { valid: false, message: "La API Key debe tener al menos 10 caracteres." };
    }
    const cleanKey = apiKey.trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            return { valid: true, message: "🟢 Clave válida y conectada con Google AI Studio." };
        }
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        return { valid: false, message: `❌ Rechazada por Google: ${errMsg}` };
    } catch (e) {
        clearTimeout(timeoutId);
        return { valid: false, message: `⚠️ Error de conexión: ${e.message}` };
    }
}

/**
 * Motor Experto Local de Diagnóstico Autónomo (SOP Cristalerías de Chile).
 * Ejecuta análisis determinista combinando plomada láser, asimetría de hombros y detección de manchas locales.
 * Garantiza veredicto en <30ms sin depender de servidores externos.
 * @param {HTMLCanvasElement} [canvas]
 * @param {HTMLVideoElement} [videoElement]
 * @param {string} [imageBase64]
 * @returns {object}
 */
export function generateLocalExpertDiagnosis(canvas, videoElement, imageBase64) {
    const findings = [];
    const articleName = state.activeArticle ? state.activeArticle.nombre : "SSP 296cc Ámbar (Cristalerías de Chile)";

    // 1. Evaluar Métricas Geométricas y Plomada Láser
    const plomada = state.plomada;
    if (plomada && !plomada.conforme) {
        if (plomada.anguloTorcidoEje > 1.5) {
            const def = getDefectById('cuerpo_torcido') || getDefectById('perpendicularidad');
            if (def) {
                findings.push({
                    defecto_id: def.id,
                    defecto_nombre: def.nombre,
                    zona: def.zona || 'cuerpo',
                    gravedad: 'Crítico',
                    confianza: Math.min(99, Math.round(90 + plomada.anguloTorcidoEje * 2)),
                    box_2d: [150, 200, 850, 800],
                    descripcion: `Eje axial de la botella inclinado ${plomada.anguloTorcidoEje.toFixed(2)}° respecto a la vertical (Tolerancia máx: 1.5°).`,
                    accion_correctiva: def.acciones ? def.acciones[0] : 'Verificar alineación de pinzas de transferencia (Take-Out).'
                });
            }
        }
        if (plomada.desviacionCuelloVsCuerpo > 1.8) {
            const def = getDefectById('cuello_torcido') || getDefectById('cuello_doblado');
            if (def) {
                findings.push({
                    defecto_id: def.id,
                    defecto_nombre: def.nombre,
                    zona: 'cuello',
                    gravedad: 'Crítico',
                    confianza: Math.min(99, Math.round(88 + plomada.desviacionCuelloVsCuerpo * 3)),
                    box_2d: [50, 300, 350, 700],
                    descripcion: `Cuello ladeado con desviación de ${plomada.desviacionCuelloVsCuerpo.toFixed(2)}° respecto al cuerpo.`,
                    accion_correctiva: def.acciones ? def.acciones[0] : 'Revisar alineación y amortiguación de la sacadora en la plancha muerta.'
                });
            }
        }
        if (plomada.maxAsimetria > 15) {
            const def = getDefectById('hombros_caidos') || getDefectById('hombro_hundido');
            if (def) {
                findings.push({
                    defecto_id: def.id,
                    defecto_nombre: def.nombre,
                    zona: 'hombro',
                    gravedad: 'Mayor',
                    confianza: 92,
                    box_2d: [250, 250, 500, 750],
                    descripcion: `Asimetría bilateral pronunciada en hombros (${plomada.maxAsimetria}% de diferencia en radio).`,
                    accion_correctiva: def.acciones ? def.acciones[0] : 'Equilibrar ventilación de moldes y aumentar tiempo de recalentamiento del parisón.'
                });
            }
        }
    }

    // 2. Evaluar Defectos Finos y Calcinados (fineDefects)
    if (state.fineDefects && state.fineDefects.length > 0) {
        state.fineDefects.forEach((fd) => {
            const def = getDefectById(fd.id) || getDefectById(fd.defecto_id) || getDefectById('calcinado_cuerpo');
            if (def) {
                findings.push({
                    defecto_id: def.id,
                    defecto_nombre: def.nombre,
                    zona: fd.zona || def.zona || 'cuerpo',
                    gravedad: def.gravedad || 'Crítico',
                    confianza: fd.confianza || 95,
                    box_2d: fd.bbox || [300, 300, 450, 450],
                    descripcion: fd.descripcion || def.descripcion,
                    accion_correctiva: def.acciones ? def.acciones[0] : 'Limpiar moldería y regular hisopeado de grafito.'
                });
            }
        });
    }

    // 3. Evaluar Muestra Activa en Visor (si se cargó una muestra rápida 1-Tap)
    if (findings.length === 0 && state.currentQuickSampleDefect) {
        const def = getDefectById(state.currentQuickSampleDefect) || findDefectByIdOrFuzzy(state.currentQuickSampleDefect);
        if (def) {
            findings.push({
                defecto_id: def.id,
                defecto_nombre: def.nombre,
                zona: def.zona,
                gravedad: def.gravedad,
                confianza: 97,
                box_2d: [150, 200, 750, 800],
                descripcion: def.descripcion,
                accion_correctiva: def.acciones ? def.acciones[0] : 'Consultar tabla SOP de máquina I.S.'
            });
        }
    }

    // Construir estructura idéntica a Gemini
    const hasDefects = findings.length > 0;
    const isCritical = findings.some(f => (f.gravedad || '').toLowerCase().includes('crítico') || (f.gravedad || '').toLowerCase().includes('critico'));
    
    const result = {
        defectos_encontrados: hasDefects,
        cantidad_defectos: findings.length,
        analisis: findings,
        estado_general: hasDefects ? (isCritical ? 'rechazo' : 'alerta') : 'aceptable',
        resumen: hasDefects 
            ? `Detectado(s) ${findings.length} defecto(s) en ${articleName}. Acción requerida según protocolo Cristalerías de Chile.`
            : `Envase conforme nominal. Geometría y superficie dentro de tolerancias estándar Cristalerías de Chile.`,
        isLocalFallback: true
    };

    state.lastGeminiResult = result;
    lastAnalysisTimestamp = Date.now();
    renderGeminiResult(result);
    return result;
}

export async function analyzeWithGemini(canvas, videoElement) {
    let apiKey = state.geminiApiKey || loadGeminiApiKey();

    if (!apiKey) {
        console.log("[GeminiVision] Sin API Key configurada. Activando Motor Experto Local Cristalerías de Chile...");
        showToast("⚡ Analizando con Motor Experto Local (SOP Cristalerías de Chile)...", "info");
        return generateLocalExpertDiagnosis(canvas, videoElement);
    }

    // Verificar cooldown
    const now = Date.now();
    if (now - lastAnalysisTimestamp < AUTO_ANALYSIS_COOLDOWN_MS) {
        console.log("[GeminiVision] Cooldown activo, usando resultado en caché.");
        return state.lastGeminiResult;
    }

    // Capturar frame
    const base64Image = captureFrameAsBase64(canvas, videoElement);
    if (!base64Image) {
        console.warn("[GeminiVision] No se pudo capturar el frame.");
        return null;
    }

    const articleName = state.activeArticle ? state.activeArticle.nombre : "Artículo genérico";
    const contextPrompt = `\nContexto: El artículo en inspección es "${articleName}". Analiza la imagen considerando las tolerancias estándar de producción vidriera NNPB.\n`;

    state.geminiAnalyzing = true;
    updateAnalyzingUI(true);

    try {
        let glassPrompt = buildGlassDefectPrompt();
        let fewShotParts = [];
        try {
            const samples = await getFewShotExamplesForDefect(null, 2);
            if (samples && samples.length > 0) {
                samples.forEach((sample, sIdx) => {
                    if (sample.fotoBase64) {
                        const cleanB64 = sample.fotoBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
                        fewShotParts.push({
                            text: `[MUESTRA DE ENTRENAMIENTO PLANTA CRISTAL CHILE #${sIdx + 1}]
Defecto Confirmado: ${sample.defectoNombre || sample.defectoId} (ID Oficial: ${sample.defectoId})
Zona Anatómica: ${sample.zona || 'general'}
Gravedad: ${sample.gravedad || 'Mayor'}
Observaciones de Planta: ${sample.notas || 'Muestra de referencia'}`
                        });
                        fewShotParts.push({
                            inline_data: { mime_type: "image/jpeg", data: cleanB64 }
                        });
                    }
                });
            }
        } catch (fsErr) {
            console.warn('[GeminiVision] No se pudieron cargar ejemplos Few-Shot:', fsErr);
        }

        const requestBody = {
            contents: [{
                parts: [
                    { text: glassPrompt + contextPrompt },
                    ...fewShotParts,
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
                responseMimeType: "application/json"
            }
        };

        const data = await executeGeminiApiFetch(requestBody, apiKey);
        if (!data) {
            console.warn("[GeminiVision] Falla en respuesta de Google API. Conmutando a Motor Experto Local...");
            showToast("⚡ Conmutando a Motor Experto Local (SOP Cristalerías de Chile)...", "warning");
            return generateLocalExpertDiagnosis(canvas, videoElement);
        }
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            return generateLocalExpertDiagnosis(canvas, videoElement);
        }

        const result = parseGeminiResponse(rawText);
        if (result) {
            state.lastGeminiResult = result;
            lastAnalysisTimestamp = Date.now();
            console.log("[GeminiVision] Análisis completado:", result);
        }
        return result;

    } catch (e) {
        console.error("[GeminiVision] Error en análisis:", e);
        showToast("No se pudo conectar a Gemini. Usando motor de inspección local.", "warning");
        return null;
    } finally {
        state.geminiAnalyzing = false;
        updateAnalyzingUI(false);
    }
}

/**
 * Análisis bajo demanda (botón "Diagnóstico Profundo" o flujo NEXUS).
 * Ignora cooldown y fuerza un nuevo análisis.
 * @param {string} [imageBase64] - Base64 completo (con prefijo data:...) de la imagen a analizar.
 *                                  Si se omite, captura del canvas/webcam activos.
 */
export async function runDeepDiagnosis(imageBase64) {
    let apiKey = state.geminiApiKey || loadGeminiApiKey();

    if (!apiKey) {
        console.log("[GeminiVision] Diagnóstico profundo: activando Motor Experto Local...");
        showToast("⚡ Diagnóstico Profundo con Motor Experto Cristalerías de Chile...", "info");
        return generateLocalExpertDiagnosis(null, null, imageBase64);
    }

    lastAnalysisTimestamp = 0;
    showToast("Ejecutando diagnóstico profundo con Gemini Vision...", "info");

    let result = null;

    if (imageBase64) {
        state.geminiAnalyzing = true;
        updateAnalyzingUI(true);
        try {
            const cleanB64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
            const glassPrompt = buildGlassDefectPrompt();
            const articleName = state.activeArticle ? state.activeArticle.nombre : "Artículo genérico";
            const contextPrompt = `\nContexto: El artículo en inspección es "${articleName}". Considera tolerancias NNPB de Cristal Chile.\n`;

            let fewShotParts = [];
            try {
                const samples = await getFewShotExamplesForDefect(null, 2);
                if (samples && samples.length > 0) {
                    samples.forEach((sample, sIdx) => {
                        if (sample.fotoBase64) {
                            const sampleB64 = sample.fotoBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
                            fewShotParts.push({
                                text: `[MUESTRA DE ENTRENAMIENTO PLANTA CRISTAL CHILE #${sIdx + 1}]
Defecto Confirmado: ${sample.defectoNombre || sample.defectoId} (ID Oficial: ${sample.defectoId})
Zona Anatómica: ${sample.zona || 'general'}
Gravedad: ${sample.gravedad || 'Mayor'}
Observaciones de Planta: ${sample.notas || 'Muestra de referencia'}`
                            });
                            fewShotParts.push({
                                inline_data: { mime_type: "image/jpeg", data: sampleB64 }
                            });
                        }
                    });
                }
            } catch (fsErr) {
                console.warn('[runDeepDiagnosis] No se pudieron cargar ejemplos Few-Shot:', fsErr);
            }

            const requestBody = {
                contents: [{
                    parts: [
                        { text: glassPrompt + contextPrompt },
                        ...fewShotParts,
                        { inline_data: { mime_type: "image/jpeg", data: cleanB64 } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1024,
                    responseMimeType: "application/json"
                }
            };

            const data = await executeGeminiApiFetch(requestBody, apiKey);
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                result = parseGeminiResponse(rawText);
                if (result) {
                    state.lastGeminiResult = result;
                    lastAnalysisTimestamp = Date.now();
                }
            }
            if (!result) {
                result = generateLocalExpertDiagnosis(null, null, imageBase64);
            }
        } catch (err) {
            console.error('[runDeepDiagnosis] Error en análisis con base64:', err);
            result = generateLocalExpertDiagnosis(null, null, imageBase64);
        } finally {
            state.geminiAnalyzing = false;
            updateAnalyzingUI(false);
        }
    } else {
        const canvas = document.getElementById('canvasOutput');
        const video = document.getElementById('webcam');
        result = await analyzeWithGemini(canvas, video);
    }

    if (result) {
        renderGeminiResult(result);
    } else {
        result = generateLocalExpertDiagnosis(null, null, imageBase64);
    }

    return result;
}


/**
 * Análisis automático periódico (llamado desde el loop de diagnóstico).
 * Respeta cooldown para evitar exceso de API calls.
 */
export async function autoGeminiAnalysis() {
    if (!state.geminiApiKey || !state.isOnline || state.geminiAnalyzing) {
        return null;
    }

    const now = Date.now();
    if (now - lastAnalysisTimestamp < AUTO_ANALYSIS_COOLDOWN_MS) {
        return state.lastGeminiResult; // Devolver resultado en caché
    }

    const canvas = document.getElementById('canvasOutput');
    const video = document.getElementById('webcam');
    return await analyzeWithGemini(canvas, video);
}

/**
 * Parsea la respuesta de Gemini, limpiando posibles wrappers de markdown.
 * @param {string} rawText - Texto crudo de la respuesta
 * @returns {object|null}
 */
function parseGeminiResponse(rawText) {
    try {
        // Intento directo primero
        return JSON.parse(rawText);
    } catch (e) {
        // Limpiar posibles wrappers de markdown (```json ... ```)
        try {
            const cleaned = rawText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();
            return JSON.parse(cleaned);
        } catch (e2) {
            console.error("[GeminiVision] Error parseando respuesta:", rawText);
            return null;
        }
    }
}

// UI, Bounding Boxes y Modal/Captura orquestados desde ./geminiUI.js y ./geminiModalController.js
export {
    updateGeminiStatusUI,
    updateAnalyzingUI,
    updateConnectivityUI,
    initConnectivityMonitor,
    drawDefectBoundingBoxes,
    renderGeminiResult,
    openGeminiConfigModal,
    closeGeminiConfigModal,
    toggleGeminiKeyVisibility,
    clearGeminiModalKeyInput,
    pasteAndRegisterGeminiKey,
    saveAndTestGeminiModalKey,
    activateLocalExpertModeFromModal,
    promptSaveGeminiApiKey,
    captureAndAnalyzeWithAI,
    triggerDeepAnalysisFileUpload,
    handleDeepAnalysisFileSelect
};

if (typeof window !== 'undefined') {
    window.runDeepDiagnosis = runDeepDiagnosis;
    window.analyzeWithGemini = analyzeWithGemini;
    window.parseGeminiResponse = parseGeminiResponse;
    window.renderGeminiResult = renderGeminiResult;
    window.promptSaveGeminiApiKey = promptSaveGeminiApiKey;
    window.openGeminiConfigModal = openGeminiConfigModal;
    window.closeGeminiConfigModal = closeGeminiConfigModal;
    window.toggleGeminiKeyVisibility = toggleGeminiKeyVisibility;
    window.clearGeminiModalKeyInput = clearGeminiModalKeyInput;
    window.extractCleanGeminiKey = extractCleanGeminiKey;
    window.pasteAndRegisterGeminiKey = pasteAndRegisterGeminiKey;
    window.isValidGeminiKeySyntax = isValidGeminiKeySyntax;
    window.saveAndTestGeminiModalKey = saveAndTestGeminiModalKey;
    window.activateLocalExpertModeFromModal = activateLocalExpertModeFromModal;
    window.loadGeminiApiKey = loadGeminiApiKey;
    window.saveGeminiApiKey = saveGeminiApiKey;
    window.captureAndAnalyzeWithAI = captureAndAnalyzeWithAI;
    window.triggerDeepAnalysisFileUpload = triggerDeepAnalysisFileUpload;
    window.handleDeepAnalysisFileSelect = handleDeepAnalysisFileSelect;
    window.drawDefectBoundingBoxes = drawDefectBoundingBoxes;
    window.testGeminiApiKey = testGeminiApiKey;
    window.generateLocalExpertDiagnosis = generateLocalExpertDiagnosis;
}

