/**
 * datasetManager.js — Módulo de Gestión de Banco de Imágenes de Entrenamiento (VitroDiag)
 * Permite capturar, etiquetar, almacenar en IndexedDB y exportar datasets de defectos reales.
 * Ofrece soporte Few-Shot RAG para inyectar muestras de calibración en Gemini Vision API.
 */

import { showToast } from './ui.js';
import { DEFECTOS_DB } from './db.js';

const DB_NAME = 'VitroDiag_DatasetDB';
const DB_VERSION = 1;
const STORE_SAMPLES = 'samples';

let dbInstance = null;

/**
 * Inicializa la base de datos IndexedDB para el Banco de Entrenamiento.
 * @returns {Promise<IDBDatabase>}
 */
export function initDatasetDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_SAMPLES)) {
                const store = db.createObjectStore(STORE_SAMPLES, { keyPath: 'id' });
                store.createIndex('defectoId', 'defectoId', { unique: false });
                store.createIndex('zona', 'zona', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            console.log('[DatasetManager] IndexedDB inicializada correctamente.');
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('[DatasetManager] Error al abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Guarda una nueva muestra de foto defectuosa en la base de datos local.
 * @param {Object} sampleData - { fotoBase64, defectoId, notas, articuloId }
 * @returns {Promise<Object>}
 */
export async function saveSample(sampleData) {
    try {
        const db = await initDatasetDB();
        const defectoInfo = DEFECTOS_DB.find(d => d.id === sampleData.defectoId) || {
            nombre: 'Defecto Personalizado',
            zona: 'general',
            gravedad: 'Mayor'
        };

        const newSample = {
            id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: Date.now(),
            fechaRegistro: new Date().toLocaleString('es-CL'),
            defectoId: sampleData.defectoId,
            defectoNombre: defectoInfo.nombre,
            zona: defectoInfo.zona || 'general',
            gravedad: defectoInfo.gravedad || 'Mayor',
            articuloId: sampleData.articuloId || 'ssp_296',
            fotoBase64: sampleData.fotoBase64,
            notas: sampleData.notas || ''
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_SAMPLES, 'readwrite');
            const store = tx.objectStore(STORE_SAMPLES);
            const req = store.add(newSample);

            req.onsuccess = () => {
                showToast(`Muestra guardada: ${defectoInfo.nombre}`, 'success');
                resolve(newSample);
            };

            req.onerror = (e) => {
                console.error('[DatasetManager] Error guardando muestra:', e.target.error);
                showToast('Error al guardar la muestra de imagen.', 'danger');
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error('[DatasetManager] Error en saveSample:', err);
        throw err;
    }
}

/**
 * Obtiene todas las muestras registradas en el banco de entrenamiento.
 * @returns {Promise<Array>}
 */
export async function getAllSamples() {
    try {
        const db = await initDatasetDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_SAMPLES, 'readonly');
            const store = tx.objectStore(STORE_SAMPLES);
            const req = store.getAll();

            req.onsuccess = () => {
                const samples = req.result || [];
                // Ordenar por fecha descendente
                samples.sort((a, b) => b.timestamp - a.timestamp);
                resolve(samples);
            };

            req.onerror = (e) => {
                console.error('[DatasetManager] Error obteniendo muestras:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error('[DatasetManager] Error en getAllSamples:', err);
        return [];
    }
}

/**
 * Elimina una muestra del banco por su ID.
 * @param {string} sampleId
 * @returns {Promise<boolean>}
 */
export async function deleteSample(sampleId) {
    try {
        const db = await initDatasetDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_SAMPLES, 'readwrite');
            const store = tx.objectStore(STORE_SAMPLES);
            const req = store.delete(sampleId);

            req.onsuccess = () => {
                showToast('Muestra eliminada del banco.', 'info');
                resolve(true);
            };

            req.onerror = (e) => {
                console.error('[DatasetManager] Error eliminando muestra:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error('[DatasetManager] Error en deleteSample:', err);
        return false;
    }
}

/**
 * Exporta el conjunto completo de muestras en un archivo JSON descargable.
 */
export async function exportDatasetJSON() {
    try {
        const samples = await getAllSamples();
        if (samples.length === 0) {
            showToast('No hay muestras en el banco de entrenamiento para exportar.', 'warning');
            return;
        }

        const datasetPayload = {
            metadata: {
                app: 'VitroDiag',
                version: '2.0.0',
                fechaExportacion: new Date().toISOString(),
                totalMuestras: samples.length,
                empresa: 'Cristal Chile (Planta Caliente / Fría)'
            },
            muestras: samples
        };

        const jsonStr = JSON.stringify(datasetPayload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `VitroDiag_Dataset_CristalChile_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`Dataset exportado con éxito (${samples.length} muestras).`, 'success');
    } catch (err) {
        console.error('[DatasetManager] Error exportando dataset:', err);
        showToast('Error al generar archivo de exportación.', 'danger');
    }
}

/**
 * Obtiene ejemplos de referencia (Few-Shot) para inyectar en el prompt de Gemini Vision.
 * @param {string} [defectoId]
 * @param {number} [limit=2]
 * @returns {Promise<Array>}
 */
export async function getFewShotExamplesForDefect(defectoId = null, limit = 2) {
    try {
        const samples = await getAllSamples();
        if (!samples || samples.length === 0) return [];

        let filtered = samples;
        if (defectoId) {
            filtered = samples.filter(s => s.defectoId === defectoId);
        }

        if (filtered.length === 0) {
            filtered = samples; // Fallback a cualquier muestra de la base
        }

        return filtered.slice(0, limit);
    } catch (err) {
        console.error('[DatasetManager] Error obteniendo Few-Shot examples:', err);
        return [];
    }
}

let tempCapturedBase64 = null;

/**
 * Puebla el selector de defectos del Banco de Entrenamiento con el catálogo de 96 defectos.
 */
export function populateDatasetSelect() {
    const select = document.getElementById('datasetDefectSelect');
    if (!select) return;

    select.innerHTML = '';
    DEFECTOS_DB.forEach(def => {
        const opt = document.createElement('option');
        opt.value = def.id;
        opt.textContent = `[${def.zona.toUpperCase()}] ${def.nombre} (${def.gravedad})`;
        select.appendChild(opt);
    });
}

let currentActiveSampleId = null;

/**
 * Renderiza la galería de muestras registradas en el banco local.
 */
export async function renderDatasetGallery() {
    const container = document.getElementById('datasetGalleryContainer');
    const badge = document.getElementById('datasetCountBadge');
    if (!container) return;

    try {
        const samples = await getAllSamples();
        if (badge) badge.innerText = samples.length;

        if (samples.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">Aún no hay muestras registradas en el banco. Captura o sube fotos de defectos para comenzar.</div>`;
            return;
        }

        container.innerHTML = samples.map(sample => `
            <div onclick="window.openSampleModal('${sample.id}')" style="background:rgba(15,23,42,0.6); border:1px solid var(--border-color); border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px; cursor:pointer; transition:transform 0.15s, border-color 0.15s;" onmouseover="this.style.borderColor='var(--accent-color)'; this.style.transform='scale(1.02)';" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='scale(1)';" title="Haga clic para ver detalles, editar notas o diagnosticar con Gemini IA">
                <img src="${sample.fotoBase64}" alt="${sample.defectoNombre}" style="width:100%; height:95px; object-fit:cover; border-radius:4px;" />
                <div style="font-weight:bold; font-size:0.75rem; color:var(--accent-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${sample.defectoNombre}</div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${sample.fechaRegistro}</div>
                ${sample.notas ? `<div style="font-size:0.65rem; color:var(--text-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📝 ${sample.notas}</div>` : ''}
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; pt-4;">
                    <span style="font-size:0.65rem; color:var(--primary);">🔍 Ver detalle</span>
                    <button class="filter-btn" onclick="event.stopPropagation(); window.deleteDatasetSample('${sample.id}')" style="font-size:0.65rem; padding:2px 6px; background:rgba(239,68,68,0.2); color:#ef4444; border-color:rgba(239,68,68,0.4);" title="Eliminar muestra">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('[DatasetManager] Error renderizando galería:', err);
    }
}

/**
 * Captura la foto activa desde la cámara de diagnóstico o activa el selector directo de imagen.
 */
export function captureDatasetFromCamera() {
    const canvas = document.getElementById('canvasOutput');
    const video = document.getElementById('webcam');
    const previewContainer = document.getElementById('datasetPreviewContainer');
    const previewImg = document.getElementById('datasetPreviewImg');

    let base64 = null;

    if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        base64 = tempCanvas.toDataURL('image/jpeg', 0.85);
    } else if (canvas && canvas.width > 0) {
        base64 = canvas.toDataURL('image/jpeg', 0.85);
    }

    if (!base64 || base64 === 'data:,') {
        showToast('Abriendo selector de cámara/galería del sistema...', 'info');
        triggerDatasetFileSelect();
        return;
    }

    tempCapturedBase64 = base64;
    if (previewImg && previewContainer) {
        previewImg.src = tempCapturedBase64;
        previewContainer.style.display = 'block';
    }
    showToast('Foto capturada de la cámara. Seleccione el defecto y guarde la muestra.', 'success');
}

/**
 * Activa la selección de archivo de imagen desde el sistema del usuario.
 */
export function triggerDatasetFileSelect() {
    const input = document.getElementById('datasetFileInput');
    if (input) input.click();
}

/**
 * Maneja la selección de archivo de imagen cargado por el usuario.
 * @param {Event} event 
 */
export function handleDatasetFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP).', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        tempCapturedBase64 = e.target.result;
        const previewContainer = document.getElementById('datasetPreviewContainer');
        const previewImg = document.getElementById('datasetPreviewImg');
        if (previewImg && previewContainer) {
            previewImg.src = tempCapturedBase64;
            previewContainer.style.display = 'block';
        }
        showToast('Imagen cargada correctamente desde archivo.', 'success');
    };
    reader.readAsDataURL(file);
}

/**
 * Guarda la muestra capturada en la base de datos local IndexedDB.
 */
export async function handleSaveDatasetSample() {
    if (!tempCapturedBase64) {
        showToast('Seleccione o capture primero una imagen con el botón de cámara o archivo.', 'warning');
        return;
    }

    const defectoSelect = document.getElementById('datasetDefectSelect');
    const notesInput = document.getElementById('datasetNotes');
    const previewContainer = document.getElementById('datasetPreviewContainer');

    const defectoId = defectoSelect ? defectoSelect.value : 'rebaba_boca';
    const notas = notesInput ? notesInput.value.trim() : '';

    await saveSample({
        fotoBase64: tempCapturedBase64,
        defectoId: defectoId,
        notas: notas
    });

    tempCapturedBase64 = null;
    if (previewContainer) previewContainer.style.display = 'none';
    if (notesInput) notesInput.value = '';

    renderDatasetGallery();
}

/**
 * Abre el modal interactivo para inspeccionar una muestra registrada.
 * @param {string} sampleId 
 */
export async function openSampleModal(sampleId) {
    try {
        const samples = await getAllSamples();
        const sample = samples.find(s => s.id === sampleId);
        if (!sample) return;

        currentActiveSampleId = sampleId;
        const modal = document.getElementById('sampleModal');
        const modalImg = document.getElementById('sampleModalImg');
        const modalTitle = document.getElementById('sampleModalTitle');
        const modalDefect = document.getElementById('sampleModalDefectName');
        const modalMeta = document.getElementById('sampleModalMeta');
        const modalNotes = document.getElementById('sampleModalNotes');

        if (modalImg) modalImg.src = sample.fotoBase64;
        if (modalTitle) modalTitle.innerText = `📸 Muestra: ${sample.defectoNombre}`;
        if (modalDefect) modalDefect.innerText = `[ZONA: ${sample.zona.toUpperCase()}] ${sample.defectoNombre} (${sample.gravedad})`;
        if (modalMeta) modalMeta.innerText = `Registrado el: ${sample.fechaRegistro} | Artículo: ${sample.articuloId}`;
        if (modalNotes) modalNotes.value = sample.notas || '';

        if (modal) modal.classList.add('active');
    } catch (err) {
        console.error('[DatasetManager] Error al abrir modal de muestra:', err);
    }
}

/**
 * Cierra el modal de inspección de muestra.
 */
export function closeSampleModal() {
    const modal = document.getElementById('sampleModal');
    if (modal) modal.classList.remove('active');
    currentActiveSampleId = null;
}

/**
 * Actualiza las notas de la muestra activa desde el modal.
 */
export async function updateSampleNotesFromModal() {
    if (!currentActiveSampleId) return;

    const modalNotes = document.getElementById('sampleModalNotes');
    const newNotes = modalNotes ? modalNotes.value.trim() : '';

    try {
        const db = await initDatasetDB();
        const tx = db.transaction(STORE_SAMPLES, 'readwrite');
        const store = tx.objectStore(STORE_SAMPLES);
        const req = store.get(currentActiveSampleId);

        req.onsuccess = () => {
            const sample = req.result;
            if (sample) {
                sample.notas = newNotes;
                store.put(sample);
                showToast('Notas de la muestra actualizadas.', 'success');
                renderDatasetGallery();
                closeSampleModal();
            }
        };
    } catch (err) {
        console.error('[DatasetManager] Error actualizando notas:', err);
    }
}

/**
 * Elimina la muestra activa desde el modal.
 */
export async function deleteSampleFromModal() {
    if (!currentActiveSampleId) return;

    if (confirm('¿Estás seguro de eliminar esta muestra del banco?')) {
        await deleteSample(currentActiveSampleId);
        closeSampleModal();
        renderDatasetGallery();
    }
}

/**
 * Inyecta la muestra seleccionada directamente a Gemini Vision IA para un diagnóstico instantáneo.
 */
export async function analyzeSampleWithGeminiFromModal() {
    if (!currentActiveSampleId) return;

    try {
        const samples = await getAllSamples();
        const sample = samples.find(s => s.id === currentActiveSampleId);
        if (!sample || !sample.fotoBase64) return;

        closeSampleModal();
        
        // Cambiar a la vista de diagnóstico en vivo e invocar el diagnóstico IA con la imagen
        if (typeof window.switchView === 'function') {
            await window.switchView('live');
        }

        showToast('Enviando muestra del banco a Gemini Vision IA para análisis profundo...', 'info');

        if (typeof window.runDeepDiagnosis === 'function') {
            window.runDeepDiagnosis(sample.fotoBase64);
        }
    } catch (err) {
        console.error('[DatasetManager] Error diagnosticando muestra:', err);
    }
}

/**
 * Inicializa los controladores de UI y eventos globales para la gestión del banco de entrenamiento.
 */
export function initDatasetUI() {
    populateDatasetSelect();
    renderDatasetGallery();

    // Exponer funciones al ámbito global (window) para compatibilidad con eventos inline del HTML
    window.captureDatasetFromCamera = captureDatasetFromCamera;
    window.triggerDatasetFileSelect = triggerDatasetFileSelect;
    window.handleDatasetFileSelect = handleDatasetFileSelect;
    window.saveDatasetSample = handleSaveDatasetSample;
    window.exportDatasetJSON = exportDatasetJSON;
    window.openSampleModal = openSampleModal;
    window.closeSampleModal = closeSampleModal;
    window.updateSampleNotesFromModal = updateSampleNotesFromModal;
    window.deleteSampleFromModal = deleteSampleFromModal;
    window.analyzeSampleWithGeminiFromModal = analyzeSampleWithGeminiFromModal;

    window.deleteDatasetSample = async (sampleId) => {
        await deleteSample(sampleId);
        renderDatasetGallery();
    };

    console.log('[DatasetManager] Módulo Banco de Entrenamiento IA inicializado correctamente.');
}


