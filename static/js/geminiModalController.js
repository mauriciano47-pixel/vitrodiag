// Controlador de Modal de Configuración, Renderizado de Diagnóstico y Captura IA (Gemini Vision)
import { state } from './state.js';
import { showToast } from './ui.js';
import { findDefectByIdOrFuzzy } from './db.js';
import { setSafeHTML } from './domUtils.js';
import {
    updateGeminiStatusUI,
    drawDefectBoundingBoxes,
    preprocessGlassImage
} from './geminiUI.js';
import {
    extractCleanGeminiKey,
    saveGeminiApiKey,
    clearGeminiApiKey,
    testGeminiApiKey,
    runDeepDiagnosis
} from './geminiVision.js';

/**
 * Renderiza el resultado de Gemini en el panel de diagnóstico.
 * @param {object} result - Resultado parseado del análisis
 */
export function renderGeminiResult(result) {
    const diagTitulos = document.querySelectorAll('#diagTitulo, #nexusDiagTitulo');
    const diagGravedades = document.querySelectorAll('#diagGravedad, #nexusDiagGravedad');
    const diagEstados = document.querySelectorAll('#diagEstado, #nexusDiagEstado');
    const diagAccionesAll = document.querySelectorAll('#diagAcciones, #nexusDiagAcciones');
    const tfjsStatus = document.getElementById('tfjsStatus');
    const cursorText = document.querySelector('.cursor-text');
    const crosshairX = document.querySelector('.crosshair-x');
    const crosshairY = document.querySelector('.crosshair-y');

    if (!result || typeof result.defectos_encontrados === 'undefined') {
        return;
    }

    const articleName = state.activeArticle ? state.activeArticle.nombre : "Artículo";

    if (result.defectos_encontrados && result.analisis && result.analisis.length > 0) {
        // Enriquecer análisis buscando coincidencias en la base de datos oficial DEFECTOS_DB
        result.analisis.forEach(item => {
            const match = findDefectByIdOrFuzzy(item.defecto_id || item.defecto_nombre || item.defecto);
            if (match) {
                item.matchedDefect = match;
                item.defecto_nombre = match.nombre;
                item.zona = match.zona;
                item.gravedad = match.gravedad.toLowerCase();
                item.official_acciones = match.acciones;
                item.official_causas = match.causas;
            }
        });

        const primary = result.analisis[0];
        const primaryName = primary.defecto_nombre || primary.defecto || "Defecto Vidrio";
        const defectCount = result.cantidad_defectos || result.analisis.length;

        const defectTitle = defectCount > 1
            ? `🚨 ${defectCount} Defectos Detectados — Gemini IA (96 Catálogo)`
            : `🚨 Defecto: ${primaryName} (Gemini IA)`;

        diagTitulos.forEach(el => { el.innerText = defectTitle; });

        const gravClass = primary.gravedad === 'critico' ? 'status-danger'
            : primary.gravedad === 'mayor' ? 'status-warning'
            : 'status-info';
        const gravText = result.estado_general === 'rechazo' ? `Rechazo (${primary.gravedad.toUpperCase()})` : "Revisar";

        diagGravedades.forEach(el => {
            el.className = `status-alert ${gravClass}`;
            el.style.display = "inline-block";
            el.innerText = gravText;
        });

        let statusHtml = `<strong>Diagnóstico Gemini Vision (96 Defectos):</strong> ${result.resumen || ''}`;
        if (defectCount > 1) {
            statusHtml += '<br><strong>Defectos identificados:</strong>';
            result.analisis.forEach((d, i) => {
                const name = d.defecto_nombre || d.defecto;
                statusHtml += `<br>${i + 1}. <strong>${name}</strong> [Zona ${d.zona.toUpperCase()}] (${d.confianza}% conf.) — ${d.descripcion}`;
            });
        } else {
            statusHtml += `<br><strong>Ubicación:</strong> Zona ${primary.zona.toUpperCase()} | <strong>Confianza:</strong> ${primary.confianza}%<br><strong>Detalle:</strong> ${primary.descripcion}`;
        }
        diagEstados.forEach(el => { setSafeHTML(el, statusHtml); });

        let actionsHtml = '';
        result.analisis.forEach(d => {
            const name = d.defecto_nombre || d.defecto;
            if (d.official_acciones && d.official_acciones.length > 0) {
                actionsHtml += `<li><strong>Ajustes Máquina I.S. para "${name}":</strong><ul>${d.official_acciones.map(a => `<li>${a}</li>`).join('')}</ul></li>`;
            } else if (d.accion_correctiva) {
                actionsHtml += `<li><strong>${name}:</strong> ${d.accion_correctiva}</li>`;
            }
        });
        diagAccionesAll.forEach(el => { setSafeHTML(el, actionsHtml); });

        if (tfjsStatus) {
            tfjsStatus.innerText = `🧠 Gemini IA (96 Catálogo): ${primaryName} — ${primary.confianza}% confianza`;
            tfjsStatus.style.color = "#ef4444";
        }

        if (cursorText) {
            cursorText.innerText = `RECHAZO: ${primaryName.toUpperCase()}`;
            cursorText.style.color = '#ef4444';
            if (crosshairX) crosshairX.style.backgroundColor = '#ef4444';
            if (crosshairY) crosshairY.style.backgroundColor = '#ef4444';
        }
    } else {
        // Sin defectos — envase aceptable
        const successTitle = `✅ Envase Conforme (Gemini IA — ${articleName})`;
        diagTitulos.forEach(el => { el.innerText = successTitle; });

        diagGravedades.forEach(el => {
            el.className = "status-alert status-success";
            el.style.display = "inline-block";
            el.innerText = "Aceptable";
        });

        const successSummary = `<strong>Diagnóstico IA (Gemini Vision):</strong> ${result.resumen || 'Sin defectos visibles detectados.'}`;
        diagEstados.forEach(el => { setSafeHTML(el, successSummary); });

        const successActions = `<li>El envase cumple con los estándares de calidad para ${articleName}.</li>
            <li>Mantener velocidad nominal de producción.</li>`;
        diagAccionesAll.forEach(el => { setSafeHTML(el, successActions); });

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

function getGeminiModalEls() {
    if (typeof document === 'undefined') return null;
    return {
        modal: document.getElementById('geminiConfigModal'),
        input: document.getElementById('geminiModalKeyInput'),
        feedback: document.getElementById('geminiModalTestFeedback'),
        badge: document.getElementById('geminiModalStatusBadge')
    };
}

/**
 * Solicita interactivamente la API Key al usuario mediante el modal de configuración.
 */
export function openGeminiConfigModal() {
    const els = getGeminiModalEls();
    if (!els) return;
    const { modal, input, feedback, badge } = els;

    let rawStored = extractCleanGeminiKey(state.geminiApiKey || localStorage.getItem('vitrodiag_gemini_key') || '');
    if (!rawStored || rawStored.length < 10) {
        try { localStorage.removeItem('vitrodiag_gemini_key'); } catch (_) {}
        state.geminiApiKey = null;
        updateGeminiStatusUI(false);
        rawStored = '';
    }

    if (input) {
        input.value = rawStored;
        input.onpaste = (e) => {
            try {
                const pasted = (e.clipboardData || window.clipboardData).getData('text');
                if (pasted) {
                    e.preventDefault();
                    input.value = extractCleanGeminiKey(pasted);
                }
            } catch (_) {}
        };
    }
    if (feedback) {
        feedback.textContent = rawStored
            ? '🟢 Clave registrada y activa en este equipo. Puedes pegar una nueva o pulsar Cerrar.'
            : '🟠 Campo limpio y listo: pega tu clave "AIzaSy..." arriba y pulsa "Registrar y Activar Clave".';
        feedback.className = 'gemini-modal-feedback';
    }
    if (badge) {
        badge.textContent = rawStored
            ? '🟢 Clave Registrada y Activa'
            : '🟠 Modo Local Experto SOP';
    }

    if (modal) {
        modal.classList.add('active');
        setTimeout(() => {
            try {
                if (input) {
                    input.focus();
                    if (typeof input.select === 'function') input.select();
                }
            } catch (_) {}
        }, 80);
    }
}

export function closeGeminiConfigModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('geminiConfigModal');
    if (modal) modal.classList.remove('active');
}

export function toggleGeminiKeyVisibility() {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('geminiModalKeyInput');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

export function clearGeminiModalKeyInput() {
    const els = getGeminiModalEls();
    if (!els) return;
    const { input, feedback, badge } = els;
    try { localStorage.removeItem('vitrodiag_gemini_key'); } catch (_) {}
    state.geminiApiKey = null;
    updateGeminiStatusUI(false);
    if (input) {
        input.value = '';
        input.focus();
    }
    if (badge) badge.textContent = '🟠 Modo Local Experto SOP';
    if (feedback) {
        feedback.textContent = '🧹 Campo limpiado. Pega tu nueva clave en el recuadro y pulsa "Registrar y Activar Clave".';
    }
}

export async function pasteAndRegisterGeminiKey() {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        try {
            const clipText = await navigator.clipboard.readText();
            const input = document.getElementById('geminiModalKeyInput');
            if (input && clipText) {
                input.value = extractCleanGeminiKey(clipText);
            }
        } catch (_) {}
    }
    await saveAndTestGeminiModalKey();
}

export async function saveAndTestGeminiModalKey() {
    const els = getGeminiModalEls();
    if (!els) return;
    const { input, feedback, badge } = els;
    const cleanKey = extractCleanGeminiKey(input ? input.value : '');

    if (!cleanKey || cleanKey.length < 10) {
        clearGeminiApiKey();
        if (feedback) {
            feedback.textContent = '⚠️ El campo está vacío o incompleto. Pega tu clave primero o pulsa "Operar SIN Clave".';
        }
        if (badge) badge.textContent = '🟠 Modo Local Experto SOP';
        return;
    }

    if (input) input.value = cleanKey;
    saveGeminiApiKey(cleanKey);
    if (badge) badge.textContent = '🟢 Clave Registrada y Activa';
    if (feedback) {
        feedback.textContent = '✅ Clave registrada en el sistema. Verificando enlace con Google AI Studio...';
    }

    const testResult = await testGeminiApiKey(cleanKey);
    if (testResult.valid) {
        if (feedback) {
            feedback.textContent = '✅ Clave registrada y conectada en línea con Google AI Studio.';
        }
        if (badge) badge.textContent = '🟢 Cloud AI Conectado';
        setTimeout(() => closeGeminiConfigModal(), 750);
    } else {
        if (feedback) {
            feedback.textContent = '✅ Clave registrada y guardada (Motor Híbrido Cloud + Experto Local Cristalerías de Chile Activo).';
        }
        if (badge) badge.textContent = '🟢 Clave Registrada (Híbrido)';
        setTimeout(() => closeGeminiConfigModal(), 900);
    }
}

export function activateLocalExpertModeFromModal() {
    clearGeminiApiKey();
    const els = getGeminiModalEls();
    if (els) {
        if (els.input) els.input.value = '';
        if (els.feedback) {
            els.feedback.textContent = '🛡️ Modo Local Experto Cristalerías de Chile activado (sin necesidad de clave externa).';
        }
        if (els.badge) els.badge.textContent = '🟠 Modo Local Experto SOP';
    }
    showToast("🟠 Modo Local Experto Cristalerías de Chile activo.", "info");
    setTimeout(() => closeGeminiConfigModal(), 650);
}

export async function promptSaveGeminiApiKey() {
    if (typeof document !== 'undefined' && document.getElementById('geminiConfigModal')) {
        openGeminiConfigModal();
        return;
    }
    const currentKey = state.geminiApiKey || '';
    const key = prompt("🔑 Ingresa tu API Key de Gemini (o deja vacío para Modo Local Experto):", currentKey);
    if (key !== null) {
        const trimmed = key.trim();
        if (trimmed.length >= 10) saveGeminiApiKey(trimmed);
        else if (trimmed === '') clearGeminiApiKey();
    }
}

/**
 * Función principal bajo demanda 1-Clic: Captura foto en alta resolución, aplica pre-procesamiento óptico para vidrio y analiza con Gemini Vision.
 */
export async function captureAndAnalyzeWithAI() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvasOutput');

    if (!state.geminiApiKey) {
        showToast("🛡️ Ejecutando diagnóstico con Motor Local Experto Cristalerías de Chile...", "info");
    }

    const source = (video && video.readyState >= 2 && video.videoWidth > 0) ? video : canvas;
    if (!source || (source.width === 0 && source.videoWidth === 0)) {
        showToast("Encienda la cámara o cargue una foto desde archivo antes de analizar.", "warning");
        return;
    }

    showToast("📸 Capturando foto HD y aplicando pre-procesamiento óptico para vidrio...", "info");

    try {
        const processedB64 = preprocessGlassImage(source);
        if (!processedB64) {
            showToast("No se pudo procesar la imagen de la cámara.", "danger");
            return;
        }

        const img = new Image();
        img.onload = async () => {
            if (canvas) {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0);
                canvas.classList.remove('d-none');
            }

            const result = await runDeepDiagnosis(processedB64);
            if (result) {
                if (canvas) drawDefectBoundingBoxes(canvas, result);
                showToast("Análisis IA completado con éxito.", "success");
            }
        };
        img.src = processedB64;
    } catch (err) {
        console.error("[GeminiVision] Error en captureAndAnalyzeWithAI:", err);
        showToast(`Error al analizar imagen con IA: ${err.message}`, "danger");
    }
}

/**
 * Activa el selector de archivos para cargar una foto desde el celular/PC.
 */
export function triggerDeepAnalysisFileUpload() {
    const input = document.getElementById('deepAnalysisFileInput');
    if (input) input.click();
}

/**
 * Maneja la selección de archivo de imagen cargado para análisis IA.
 * @param {Event} event
 */
export function handleDeepAnalysisFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Por favor seleccione una imagen válida (JPG, PNG, WEBP).', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('canvasOutput');
            if (canvas) {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.classList.remove('d-none');
            }
            captureAndAnalyzeWithAI();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
