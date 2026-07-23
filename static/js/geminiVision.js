// Módulo de Análisis de Defectos con Gemini Vision API
// Motor principal de detección inteligente para VitroDiag (Opción D - Híbrido)
import { state } from './state.js';
import { showToast } from './ui.js';

// Configuración del endpoint de Gemini Vision API
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Cooldown entre análisis automáticos (ms)
const AUTO_ANALYSIS_COOLDOWN_MS = 6000;

// Timestamp del último análisis exitoso
let lastAnalysisTimestamp = 0;

// Prompt de ingeniería especializado en defectos de vidrio NNPB
const GLASS_DEFECT_PROMPT = `Eres un inspector de control de calidad experto en envases de vidrio para la industria vidriera (proceso NNPB / Blow-Blow).

Analiza esta imagen de una botella de vidrio. La imagen muestra contornos/bordes procesados de la botella (silueta naranja sobre fondo negro), o puede ser una foto directa.

Debes identificar TODOS los defectos visibles. Los defectos comunes en botellas de vidrio incluyen:

**Defectos Geométricos (Forma):**
- Cuello Torcido: el cuello no está alineado con el eje central del cuerpo
- Ovalamiento: el cuerpo no es circular, es elíptico u ovalado
- Hundimiento: deformación cóncava en una zona del cuerpo
- Hombro Caído: asimetría en la zona de transición entre cuello y cuerpo
- Fondo Inclinado: la base no es plana o está desplazada
- Boca Incompleta: la corona/boca tiene irregularidades o falta material

**Defectos de Superficie:**
- Rotura / Grieta: fractura visible en el vidrio
- Burbuja: inclusión gaseosa visible como un punto brillante o hueco
- Rebaba: exceso de vidrio en la costura del molde o en la corona
- Costura Marcada: línea de unión del molde excesivamente visible
- Inclusión: partícula extraña atrapada en el vidrio

**Defectos de Distribución:**
- Pared Delgada: zona del vidrio con espesor visiblemente menor
- Vidrio Grueso: acumulación excesiva de material en una zona

Responde EXCLUSIVAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "defectos_encontrados": true/false,
  "cantidad_defectos": número,
  "analisis": [
    {
      "defecto": "nombre del defecto",
      "zona": "corona|cuello|hombro|cuerpo|fondo",
      "gravedad": "critico|mayor|menor",
      "confianza": número 0-100,
      "descripcion": "descripción breve de lo observado",
      "accion_correctiva": "ajuste sugerido para la máquina IS o el molde"
    }
  ],
  "estado_general": "aceptable|rechazo",
  "resumen": "resumen breve del diagnóstico en una oración"
}

Si la botella se ve perfecta o no puedes identificar defectos claros, responde con defectos_encontrados: false y estado_general: "aceptable".
Si la imagen no muestra una botella o no es analizable, indica cantidad_defectos: 0 y un resumen explicando la situación.`;

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

/**
 * Recupera la API Key almacenada en localStorage.
 * @returns {string|null}
 */
export function loadGeminiApiKey() {
    try {
        const key = localStorage.getItem('vitrodiag_gemini_key');
        if (key) {
            state.geminiApiKey = key;
            updateGeminiStatusUI(true);
        }
        return key;
    } catch (e) {
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
 * Envía una imagen a Gemini Vision API y obtiene el análisis de defectos.
 * @param {HTMLCanvasElement} canvas - Canvas con la imagen procesada
 * @param {HTMLVideoElement} [videoElement] - Video original para captura directa
 * @returns {Promise<object|null>} Resultado del análisis o null si falla
 */
export async function analyzeWithGemini(canvas, videoElement) {
    const apiKey = state.geminiApiKey;

    if (!apiKey) {
        showToast("Configura tu API Key de Gemini para usar el diagnóstico con IA.", "warning");
        return null;
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

    // Información contextual del artículo activo
    const articleName = state.activeArticle ? state.activeArticle.nombre : "Artículo genérico";
    const contextPrompt = `\nContexto: El artículo en inspección es "${articleName}". Analiza la imagen considerando las tolerancias estándar de producción vidriera NNPB.\n`;

    state.geminiAnalyzing = true;
    updateAnalyzingUI(true);

    try {
        const requestBody = {
            contents: [{
                parts: [
                    { text: GLASS_DEFECT_PROMPT + contextPrompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
            console.error("[GeminiVision] Error de API:", errorMsg);

            if (response.status === 401 || response.status === 403) {
                showToast("API Key de Gemini inválida o sin permisos. Verifica tu clave.", "danger");
            } else if (response.status === 429) {
                showToast("Límite de solicitudes alcanzado. Espera unos segundos.", "warning");
            } else {
                showToast(`Error de Gemini API: ${errorMsg}`, "danger");
            }
            return null;
        }

        const data = await response.json();

        // Extraer el texto de respuesta de Gemini
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            console.warn("[GeminiVision] Respuesta vacía de Gemini.");
            return null;
        }

        // Parsear JSON de la respuesta (Gemini a veces envuelve en ```json ... ```)
        const result = parseGeminiResponse(rawText);

        if (result) {
            state.lastGeminiResult = result;
            lastAnalysisTimestamp = Date.now();
            console.log("[GeminiVision] Análisis completado:", result);
        }

        return result;

    } catch (e) {
        console.error("[GeminiVision] Error en análisis:", e);
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
            state.isOnline = false;
            showToast("Sin conexión a internet. Usando motor algorítmico offline.", "warning");
        }
        return null;
    } finally {
        state.geminiAnalyzing = false;
        updateAnalyzingUI(false);
    }
}

/**
 * Análisis bajo demanda (botón "Diagnóstico Profundo").
 * Ignora cooldown y fuerza un nuevo análisis.
 */
export async function runDeepDiagnosis() {
    const canvas = document.getElementById('canvasOutput');
    const video = document.getElementById('webcam');

    if (!state.geminiApiKey) {
        showToast("Primero configura tu API Key de Gemini en el Panel de IA.", "warning");
        return null;
    }

    // Resetear cooldown para forzar análisis fresco
    lastAnalysisTimestamp = 0;

    showToast("Ejecutando diagnóstico profundo con Gemini Vision...", "info");
    const result = await analyzeWithGemini(canvas, video);

    if (result) {
        renderGeminiResult(result);
    } else {
        showToast("No se pudo completar el diagnóstico con IA. Verifica conexión y API Key.", "warning");
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

/**
 * Renderiza el resultado de Gemini en el panel de diagnóstico.
 * @param {object} result - Resultado parseado del análisis
 */
export function renderGeminiResult(result) {
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');
    const tfjsStatus = document.getElementById('tfjsStatus');
    const cursorText = document.querySelector('.cursor-text');
    const crosshairX = document.querySelector('.crosshair-x');
    const crosshairY = document.querySelector('.crosshair-y');

    if (!result || typeof result.defectos_encontrados === 'undefined') {
        return;
    }

    const articleName = state.activeArticle ? state.activeArticle.nombre : "Artículo";

    if (result.defectos_encontrados && result.analisis && result.analisis.length > 0) {
        // Defectos encontrados por Gemini
        const primaryDefect = result.analisis[0];
        const defectCount = result.cantidad_defectos || result.analisis.length;

        const defectTitle = defectCount > 1
            ? `❌ ${defectCount} Defectos Detectados (Gemini IA)`
            : `❌ Defecto: ${primaryDefect.defecto} (Gemini IA)`;

        if (diagTitulo) diagTitulo.innerText = defectTitle;
        if (diagGravedad) {
            const gravClass = primaryDefect.gravedad === 'critico' ? 'status-danger'
                : primaryDefect.gravedad === 'mayor' ? 'status-warning'
                : 'status-info';
            diagGravedad.className = `status-alert ${gravClass}`;
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = result.estado_general === 'rechazo' ? "Rechazo Inmediato" : "Revisar";
        }

        if (diagEstado) {
            let statusHtml = `<strong>Diagnóstico IA (Gemini Vision):</strong> ${result.resumen || ''}`;
            if (defectCount > 1) {
                statusHtml += '<br><strong>Defectos identificados:</strong>';
                result.analisis.forEach((d, i) => {
                    statusHtml += `<br>${i + 1}. <em>${d.defecto}</em> en zona ${d.zona} (${d.confianza}% confianza)`;
                });
            } else {
                statusHtml += `<br><strong>Zona:</strong> ${primaryDefect.zona} | <strong>Confianza:</strong> ${primaryDefect.confianza}%`;
            }
            diagEstado.innerHTML = statusHtml;
        }

        if (diagAcciones) {
            diagAcciones.innerHTML = result.analisis.map(d =>
                `<li><strong>${d.defecto} (${d.zona}):</strong> ${d.accion_correctiva}</li>`
            ).join('');
        }

        if (tfjsStatus) {
            tfjsStatus.innerText = `🧠 Gemini IA: ${primaryDefect.defecto} — ${primaryDefect.confianza}% confianza`;
            tfjsStatus.style.color = "#ef4444";
        }

        if (cursorText) {
            cursorText.innerText = `RECHAZO: ${primaryDefect.defecto.toUpperCase()}`;
            cursorText.style.color = '#ef4444';
            if (crosshairX) crosshairX.style.backgroundColor = '#ef4444';
            if (crosshairY) crosshairY.style.backgroundColor = '#ef4444';
        }

    } else {
        // Sin defectos — envase aceptable
        if (diagTitulo) diagTitulo.innerText = `✅ Envase Conforme (Gemini IA — ${articleName})`;
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) {
            diagEstado.innerHTML = `<strong>Diagnóstico IA (Gemini Vision):</strong> ${result.resumen || 'Sin defectos visibles detectados.'}`;
        }
        if (diagAcciones) {
            diagAcciones.innerHTML = `<li>El envase cumple con los estándares de calidad para ${articleName}.</li>
                <li>Mantener velocidad nominal de producción.</li>`;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `🧠 Gemini IA: Envase Aceptable (${articleName})`;
            tfjsStatus.style.color = "#10b981";
        }
        if (cursorText) {
            cursorText.innerText = 'CONFORME (GEMINI IA)';
            cursorText.style.color = '#10b981';
            if (crosshairX) crosshairX.style.backgroundColor = '#10b981';
            if (crosshairY) crosshairY.style.backgroundColor = '#10b981';
        }
    }
}

/**
 * Actualiza el indicador visual del estado de Gemini (configurado / no configurado).
 * @param {boolean} configured
 */
function updateGeminiStatusUI(configured) {
    const indicator = document.getElementById('geminiStatusIndicator');
    const statusText = document.getElementById('geminiStatusText');

    if (indicator) {
        indicator.className = configured ? 'gemini-indicator gemini-ready' : 'gemini-indicator gemini-off';
    }
    if (statusText) {
        statusText.innerText = configured
            ? '🧠 Gemini Vision: Conectado'
            : '⚪ Gemini Vision: Sin Configurar';
    }
}

/**
 * Actualiza la UI mientras Gemini está analizando.
 * @param {boolean} analyzing
 */
function updateAnalyzingUI(analyzing) {
    const btn = document.getElementById('btnDeepDiagnosis');
    const tfjsStatus = document.getElementById('tfjsStatus');

    if (btn) {
        btn.disabled = analyzing;
        btn.innerText = analyzing ? '🔄 Analizando...' : '🧠 Diagnóstico Profundo (IA)';
    }
    if (analyzing && tfjsStatus) {
        tfjsStatus.innerText = "🧠 Gemini Vision: Analizando imagen con IA...";
        tfjsStatus.style.color = "#a78bfa"; // Violeta para indicar procesamiento IA
    }
}

/**
 * Monitorea el estado de conectividad en tiempo real.
 */
export function initConnectivityMonitor() {
    // Verificación inicial
    checkConnectivity();

    // Eventos del navegador para cambios de conectividad
    window.addEventListener('online', () => {
        state.isOnline = true;
        updateConnectivityUI(true);
        console.log("[GeminiVision] Conexión restaurada.");
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;
        updateConnectivityUI(false);
        console.log("[GeminiVision] Sin conexión. Usando motor algorítmico offline.");
    });
}

/**
 * Actualiza el indicador visual de conectividad.
 * @param {boolean} online
 */
function updateConnectivityUI(online) {
    const badge = document.getElementById('connectivityBadge');
    if (badge) {
        badge.className = online ? 'connectivity-badge online' : 'connectivity-badge offline';
        badge.innerText = online ? '🌐 Online' : '📵 Offline';
    }
}
