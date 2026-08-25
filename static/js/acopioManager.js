/**
 * acopioManager.js — Galería Receptora y Acopio de Imágenes de Inspección (VitroDiag)
 * Almacena de forma persistente y automática en IndexedDB cada fotografía tomada o subida
 * durante las inspecciones en planta, permitiendo su revisión, re-diagnóstico y exportación.
 */

import { showToast } from './ui.js';
import { state } from './state.js';
import { DEFECTOS_DB } from './db.js';

const ACOPIO_DB_NAME = 'VitroDiag_AcopioDB';
const ACOPIO_DB_VERSION = 1;
const STORE_ACOPIO = 'acopio_photos';

let acopioDbInstance = null;

/**
 * Inicializa la base de datos IndexedDB para el Acopio de Fotos.
 * @returns {Promise<IDBDatabase>}
 */
export function initAcopioDB() {
    return new Promise((resolve, reject) => {
        if (acopioDbInstance) {
            resolve(acopioDbInstance);
            return;
        }

        const request = indexedDB.open(ACOPIO_DB_NAME, ACOPIO_DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_ACOPIO)) {
                const store = db.createObjectStore(STORE_ACOPIO, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('defectoId', 'defectoId', { unique: false });
                store.createIndex('articuloId', 'articuloId', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            acopioDbInstance = event.target.result;
            console.log('[AcopioManager] IndexedDB Acopio inicializada correctamente.');
            resolve(acopioDbInstance);
        };

        request.onerror = (event) => {
            console.error('[AcopioManager] Error al abrir IndexedDB Acopio:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Guarda automáticamente una foto tomada/inspeccionada en el acopio local.
 * @param {Object} data - { fotoBase64, defectoId, defectoNombre, gravedad, zona, confianza, articuloId, notas }
 * @returns {Promise<Object>}
 */
export async function savePhotoToAcopio(data) {
    if (!data || !data.fotoBase64) return null;

    try {
        const db = await initAcopioDB();
        const activeArt = state.activeArticle ? state.activeArticle.id : 'ssp_296';
        
        const record = {
            id: 'acopio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: Date.now(),
            fechaRegistro: new Date().toLocaleString('es-CL'),
            horaRegistro: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            fotoBase64: data.fotoBase64,
            articuloId: data.articuloId || activeArt,
            defectoId: data.defectoId || null,
            defectoNombre: data.defectoNombre || 'Sin diagnosticar',
            gravedad: data.gravedad || 'Pendiente',
            zona: data.zona || 'general',
            confianza: data.confianza || null,
            notas: data.notas || '',
            bbox: data.bbox || null
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ACOPIO, 'readwrite');
            const store = tx.objectStore(STORE_ACOPIO);
            const req = store.add(record);

            req.onsuccess = () => {
                renderAcopioReel();
                resolve(record);
            };

            req.onerror = (e) => {
                console.error('[AcopioManager] Error guardando foto en acopio:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error('[AcopioManager] Error en savePhotoToAcopio:', err);
        return null;
    }
}

/**
 * Obtiene todas las fotografías del acopio ordenadas por fecha descendente.
 * @returns {Promise<Array>}
 */
export async function getAllAcopioPhotos() {
    try {
        const db = await initAcopioDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ACOPIO, 'readonly');
            const store = tx.objectStore(STORE_ACOPIO);
            const req = store.getAll();

            req.onsuccess = () => {
                const list = req.result || [];
                list.sort((a, b) => b.timestamp - a.timestamp);
                resolve(list);
            };

            req.onerror = (e) => {
                console.error('[AcopioManager] Error obteniendo acopio:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error('[AcopioManager] Error en getAllAcopioPhotos:', err);
        return [];
    }
}

/**
 * Elimina una foto específica del acopio.
 * @param {string} id 
 */
export async function deleteAcopioPhoto(id) {
    try {
        const db = await initAcopioDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ACOPIO, 'readwrite');
            const store = tx.objectStore(STORE_ACOPIO);
            const req = store.delete(id);

            req.onsuccess = () => {
                showToast('Foto eliminada del acopio.', 'info');
                renderAcopioReel();
                resolve(true);
            };

            req.onerror = (e) => {
                reject(e.target.error);
            };
        });
    } catch (err) {
        console.error('[AcopioManager] Error eliminando foto:', err);
        return false;
    }
}

/**
 * Vacía completamente el acopio de fotos.
 */
export async function clearAllAcopioPhotos() {
    if (!confirm('¿Deseas vaciar todas las fotos del acopio de inspección?')) return;
    try {
        const db = await initAcopioDB();
        const tx = db.transaction(STORE_ACOPIO, 'readwrite');
        const store = tx.objectStore(STORE_ACOPIO);
        store.clear();
        tx.oncomplete = () => {
            showToast('Acopio de fotos vaciado.', 'info');
            renderAcopioReel();
        };
    } catch (err) {
        console.error('[AcopioManager] Error vaciando acopio:', err);
    }
}

/**
 * Carga una foto del acopio directamente al visor de inspección principal.
 * @param {string} id 
 */
export async function loadAcopioPhotoToInspection(id) {
    try {
        const photos = await getAllAcopioPhotos();
        const photo = photos.find(p => p.id === id);
        if (!photo || !photo.fotoBase64) return;

        window.nexusCurrentImageBase64 = photo.fotoBase64;
        
        const previewImg = document.getElementById('nexusPreviewImg') || document.getElementById('scannerPreviewImg');
        const placeholder = document.getElementById('nexusPlaceholder');
        const webcamVideo = document.getElementById('webcam');
        const bboxCanvas = document.getElementById('nexusBboxCanvas');
        const btnDiagnose = document.getElementById('btnRunDiagnosis');
        
        if (webcamVideo) webcamVideo.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        if (bboxCanvas) bboxCanvas.style.display = 'none';
        
        if (previewImg) {
            previewImg.src = photo.fotoBase64;
            previewImg.style.display = 'block';
        }
        
        if (btnDiagnose) {
            btnDiagnose.disabled = false;
            btnDiagnose.style.opacity = '1';
        }

        // Si ya tenía diagnóstico, mostrarlo
        const resultCard = document.getElementById('resultadoCard');
        const diagTitulo = document.getElementById('diagTitulo');
        const diagGravedad = document.getElementById('diagGravedad');
        const diagEstado = document.getElementById('diagEstado');
        
        if (photo.defectoId && photo.defectoNombre && resultCard) {
            if (diagTitulo) diagTitulo.innerText = `🔍 ${photo.defectoNombre}`;
            if (diagGravedad) {
                diagGravedad.innerText = photo.gravedad || 'Mayor';
                diagGravedad.className = `status-alert ${photo.gravedad === 'Crítico' ? 'critico' : 'mayor'}`;
            }
            if (diagEstado) {
                diagEstado.innerText = `[ZONA: ${(photo.zona || 'general').toUpperCase()}] Registrado: ${photo.fechaRegistro}. Confianza: ${photo.confianza || 90}%.`;
            }
            resultCard.style.display = 'block';
        }

        showToast(`Foto cargada desde el acopio (${photo.horaRegistro}). Lista para diagnosticar.`, 'success');
        
        // Scroll suave hacia el visor
        const visor = document.getElementById('nexusPreviewArea');
        if (visor) visor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
        console.error('[AcopioManager] Error cargando foto al visor:', err);
    }
}

/**
 * Renderiza el carrusel/rejilla de fotos de acopio en la vista de Inspección y Banco IA.
 */
export async function renderAcopioReel() {
    const containerLive = document.getElementById('acopioGalleryContainer');
    const badgeLive = document.getElementById('acopioCountBadge');
    
    try {
        const photos = await getAllAcopioPhotos();
        
        if (badgeLive) badgeLive.innerText = photos.length;

        if (containerLive) {
            if (photos.length === 0) {
                containerLive.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:18px; color:var(--text-muted); font-size:0.8rem; border:1px dashed var(--border-color); border-radius:8px;">
                        📸 Aún no hay fotos en el acopio. Toma una foto con '📸 FOTO INSTANTÁNEA' o sube desde '📁 GALERÍA' para comenzar a acopiar.
                    </div>
                `;
            } else {
                containerLive.innerHTML = photos.map(photo => {
                    const isCritico = photo.gravedad === 'Crítico';
                    const isMayor = photo.gravedad === 'Mayor';
                    const badgeColor = isCritico ? '#ef4444' : (isMayor ? '#f59e0b' : '#10b981');
                    
                    return `
                        <div class="acopio-card" onclick="window.loadAcopioPhotoToInspection('${photo.id}')" title="Toca para cargar en el visor de diagnóstico">
                            <div class="acopio-img-wrap">
                                <img src="${photo.fotoBase64}" alt="${photo.defectoNombre}" class="acopio-thumb" loading="lazy" />
                                <span class="acopio-time-badge">${photo.horaRegistro}</span>
                                ${photo.defectoId ? `<span class="acopio-defect-tag" style="background:${badgeColor};">${photo.defectoNombre}</span>` : ''}
                            </div>
                            <div class="acopio-card-meta">
                                <span class="acopio-art-name">${photo.articuloId}</span>
                                <button class="acopio-btn-del" onclick="event.stopPropagation(); window.deleteAcopioPhoto('${photo.id}')" title="Eliminar foto">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('[AcopioManager] Error renderizando acopio:', err);
    }
}

/**
 * Inicializa la UI y expone las funciones globales de acopio.
 */
export function initAcopioUI() {
    initAcopioDB().then(() => {
        renderAcopioReel();
    }).catch(() => {});

    if (typeof window !== 'undefined') {
        window.loadAcopioPhotoToInspection = loadAcopioPhotoToInspection;
        window.deleteAcopioPhoto = deleteAcopioPhoto;
        window.clearAllAcopioPhotos = clearAllAcopioPhotos;
        window.savePhotoToAcopio = savePhotoToAcopio;
        window.renderAcopioReel = renderAcopioReel;
    }
}

if (typeof window !== 'undefined') {
    window.loadAcopioPhotoToInspection = loadAcopioPhotoToInspection;
    window.deleteAcopioPhoto = deleteAcopioPhoto;
    window.clearAllAcopioPhotos = clearAllAcopioPhotos;
    window.savePhotoToAcopio = savePhotoToAcopio;
    window.renderAcopioReel = renderAcopioReel;
}
