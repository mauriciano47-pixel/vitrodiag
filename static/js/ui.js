// Interfaz de Usuario, Gestión de Estados DOM y Memoria Permanente de Campañas de Envases (VitroDiag UI Engine)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
import { state } from './state.js';
import { ARTICULOS_DEFAULT, DEFECTOS_DB, renderDefectsList } from './db.js';
import { startDiagnosticCamera } from './camera.js';
import { calculateSopMs } from './timing.js';
import { renderDatasetGallery, populateDatasetSelect } from './datasetManager.js';
import { setSafeHTML } from './domUtils.js';

const CAMPAIGNS_STORAGE_KEY = 'vitrodiag_articulos';
const CUSTOM_VAULT_KEY = 'vitrodiag_custom_campaigns_v1';
const ACTIVE_ARTICLE_KEY = 'vitrodiag_active_article_id';
const CAMPAIGNS_IDB_NAME = 'VitroDiag_CampaignsDB';
const CAMPAIGNS_IDB_STORE = 'fichas_tecnicas';

const DEFAULT_BDF_PARAMS = {
    plungerUp: 80,
    plungerDown: 150,
    blankOpen: 190,
    invertStart: 195,
    blowClose: 240,
    neckRingOpen: 245,
    blowOn: 270,
    blowOff: 325
};

function normalizeArticleRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const defMatch = ARTICULOS_DEFAULT.find(d => d.id === raw.id);
    const baseParams = (defMatch && defMatch.defaultParams) ? defMatch.defaultParams : DEFAULT_BDF_PARAMS;
    const rawParams = (raw.defaultParams && typeof raw.defaultParams === 'object') ? raw.defaultParams : {};

    return {
        id: String(raw.id || `envase_${Date.now()}`).trim(),
        nombre: String(raw.nombre || 'Envase Personalizado').trim(),
        codigoMolde: String(raw.codigoMolde || (defMatch ? defMatch.codigoMolde : 'M-CUSTOM')).trim(),
        capacidadMl: parseFloat(raw.capacidadMl) || (defMatch ? defMatch.capacidadMl : 330),
        pesoGramos: parseFloat(raw.pesoGramos) || (defMatch ? defMatch.pesoGramos : 200),
        bpm: parseFloat(raw.bpm) || 120,
        secciones: parseInt(raw.secciones, 10) || 8,
        cavidades: parseInt(raw.cavidades, 10) || 2,
        swabInterval: parseInt(raw.swabInterval, 10) || 20,
        altura: parseFloat(raw.altura) || 200,
        diametroCuerpo: parseFloat(raw.diametroCuerpo) || 70,
        diametroBoca: parseFloat(raw.diametroBoca) || 26,
        proceso: raw.proceso || 'NNPB',
        isCustom: Boolean(raw.isCustom || !defMatch),
        isModified: Boolean(raw.isModified),
        updatedAt: raw.updatedAt || null,
        defaultParams: {
            plungerUp: Number.isFinite(Number(rawParams.plungerUp)) ? Number(rawParams.plungerUp) : baseParams.plungerUp,
            plungerDown: Number.isFinite(Number(rawParams.plungerDown)) ? Number(rawParams.plungerDown) : baseParams.plungerDown,
            blankOpen: Number.isFinite(Number(rawParams.blankOpen)) ? Number(rawParams.blankOpen) : baseParams.blankOpen,
            invertStart: Number.isFinite(Number(rawParams.invertStart)) ? Number(rawParams.invertStart) : baseParams.invertStart,
            blowClose: Number.isFinite(Number(rawParams.blowClose)) ? Number(rawParams.blowClose) : baseParams.blowClose,
            neckRingOpen: Number.isFinite(Number(rawParams.neckRingOpen)) ? Number(rawParams.neckRingOpen) : baseParams.neckRingOpen,
            blowOn: Number.isFinite(Number(rawParams.blowOn)) ? Number(rawParams.blowOn) : baseParams.blowOn,
            blowOff: Number.isFinite(Number(rawParams.blowOff)) ? Number(rawParams.blowOff) : baseParams.blowOff
        }
    };
}

function mirrorCampaignsToIndexedDB(articulosList, activeId) {
    try {
        if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) return;
        const req = window.indexedDB.open(CAMPAIGNS_IDB_NAME, 1);
        req.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(CAMPAIGNS_IDB_STORE)) {
                db.createObjectStore(CAMPAIGNS_IDB_STORE, { keyPath: 'key' });
            }
        };
        req.onsuccess = function(e) {
            try {
                const db = e.target.result;
                const tx = db.transaction(CAMPAIGNS_IDB_STORE, 'readwrite');
                const store = tx.objectStore(CAMPAIGNS_IDB_STORE);
                store.put({
                    key: 'campaigns_snapshot',
                    articulosList: JSON.parse(JSON.stringify(articulosList || [])),
                    activeId: activeId || 'ssp_296',
                    savedAt: new Date().toISOString()
                });
            } catch (txErr) {}
        };
    } catch (err) {}
}

function restoreCampaignsFromIndexedDBIfNeeded() {
    try {
        if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) return;
        const req = window.indexedDB.open(CAMPAIGNS_IDB_NAME, 1);
        req.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(CAMPAIGNS_IDB_STORE)) {
                db.createObjectStore(CAMPAIGNS_IDB_STORE, { keyPath: 'key' });
            }
        };
        req.onsuccess = function(e) {
            try {
                const db = e.target.result;
                const tx = db.transaction(CAMPAIGNS_IDB_STORE, 'readonly');
                const store = tx.objectStore(CAMPAIGNS_IDB_STORE);
                const getReq = store.get('campaigns_snapshot');
                getReq.onsuccess = function() {
                    const snap = getReq.result;
                    if (snap && Array.isArray(snap.articulosList) && snap.articulosList.length > 0) {
                        let mergedCount = 0;
                        snap.articulosList.forEach(savedArt => {
                            const norm = normalizeArticleRecord(savedArt);
                            if (!norm) return;
                            const existingIdx = state.articulosList.findIndex(a => a.id === norm.id);
                            if (existingIdx === -1) {
                                state.articulosList.push(norm);
                                mergedCount++;
                            } else if ((norm.isCustom || norm.isModified) && !state.articulosList[existingIdx].isModified) {
                                state.articulosList[existingIdx] = norm;
                                mergedCount++;
                            }
                        });
                        if (mergedCount > 0) {
                            persistCampaignMemory(state.articulosList, state.activeArticle ? state.activeArticle.id : snap.activeId);
                            populateArticleSelects();
                            applyActiveArticleParams();
                        }
                    }
                };
            } catch (txErr) {}
        };
    } catch (err) {}
}

function persistCampaignMemory(articulosList, activeId) {
    const cleanList = (articulosList || []).map(normalizeArticleRecord).filter(Boolean);
    state.articulosList = cleanList;
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(cleanList));
            const customOrModified = cleanList.filter(a => a.isCustom || a.isModified);
            localStorage.setItem(CUSTOM_VAULT_KEY, JSON.stringify(customOrModified));
            if (activeId) {
                localStorage.setItem(ACTIVE_ARTICLE_KEY, activeId);
            }
        } catch (e) {
            console.warn('[NEXUS Memory] Advertencia guardando en localStorage:', e);
        }
    }
    mirrorCampaignsToIndexedDB(cleanList, activeId);
    updateMemoryCounterBadge();
}

function updateMemoryCounterBadge() {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('articlesMemoryBadge');
    if (!badge || !Array.isArray(state.articulosList)) return;
    const total = state.articulosList.length;
    const customCount = state.articulosList.filter(a => a.isCustom || a.isModified).length;
    badge.textContent = customCount > 0
        ? `🟢 Memoria Activa: ${total} envases (${customCount} campañas propias/ajustadas)`
        : `🟢 Memoria Activa: ${total} envases registrados`;
}

function showToast(message, type = 'info', duration = 3000) {
    if (typeof document === 'undefined') {
        return;
    }
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    setSafeHTML(toast, `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `);

    container.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}

function initArticles() {
    let loadedList = [];
    if (typeof localStorage !== 'undefined') {
        try {
            const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) loadedList = parsed;
            }
        } catch (e) {}
    }

    if (loadedList.length > 0) {
        state.articulosList = loadedList.map(normalizeArticleRecord).filter(Boolean);

        // Actualizar ssp_296 si estaba guardado con valores antiguos sin haber sido modificado manualmente
        const savedSsp = state.articulosList.find(a => a.id === 'ssp_296');
        if (savedSsp && savedSsp.cavidades === 2 && !savedSsp.isModified) {
            savedSsp.bpm = 396;
            savedSsp.cavidades = 3;
        }

        // Asegurar que todos los artículos base de fábrica estén presentes
        ARTICULOS_DEFAULT.forEach(defArt => {
            if (!state.articulosList.some(a => a.id === defArt.id)) {
                state.articulosList.push(normalizeArticleRecord(defArt));
            }
        });
    } else {
        state.articulosList = ARTICULOS_DEFAULT.map(normalizeArticleRecord);
    }

    // Fusionar cofre de campañas personalizadas/modificadas para garantía de cero pérdida
    if (typeof localStorage !== 'undefined') {
        try {
            const rawVault = localStorage.getItem(CUSTOM_VAULT_KEY);
            if (rawVault) {
                const vaultList = JSON.parse(rawVault);
                if (Array.isArray(vaultList)) {
                    vaultList.forEach(customArt => {
                        const norm = normalizeArticleRecord(customArt);
                        if (!norm) return;
                        const idx = state.articulosList.findIndex(a => a.id === norm.id);
                        if (idx === -1) {
                            state.articulosList.push(norm);
                        } else {
                            state.articulosList[idx] = norm;
                        }
                    });
                }
            }
        } catch (e) {}
    }

    let savedActiveId = (typeof localStorage !== 'undefined') ? localStorage.getItem(ACTIVE_ARTICLE_KEY) : null;
    if (!savedActiveId || savedActiveId === 'cerveza_330') {
        savedActiveId = 'ssp_296';
    }
    state.activeArticle = state.articulosList.find(a => a.id === savedActiveId) || state.articulosList[0];

    persistCampaignMemory(state.articulosList, state.activeArticle ? state.activeArticle.id : 'ssp_296');
    restoreCampaignsFromIndexedDBIfNeeded();

    populateArticleSelects();
    applyActiveArticleParams();
}

function populateArticleSelects() {
    if (typeof document === 'undefined') return;
    const selectActive = document.getElementById('activeArticleSelect');
    const selectModal = document.getElementById('modalSelectArticle');

    if (selectActive && Array.isArray(state.articulosList)) {
        setSafeHTML(selectActive, state.articulosList.map(a => {
            const prefix = a.isCustom ? '⭐ ' : (a.isModified ? '💾 ' : '');
            const moldeTag = a.codigoMolde ? ` [${a.codigoMolde}]` : '';
            const isSel = (state.activeArticle && a.id === state.activeArticle.id) ? 'selected' : '';
            return `<option value="${a.id}" ${isSel}>${prefix}${a.nombre}${moldeTag} (${a.proceso})</option>`;
        }).join(''));
    }
    if (selectModal && Array.isArray(state.articulosList)) {
        const optionsHtml = [
            `<option value="__new__">➕ Agregar Nueva Ficha Técnica / Nuevo Envase...</option>`,
            ...state.articulosList.map(a => {
                const prefix = a.isCustom ? '⭐ [Campaña Propia] ' : (a.isModified ? '💾 [Ajustado] ' : '');
                return `<option value="${a.id}">${prefix}${a.nombre} (${a.proceso})</option>`;
            })
        ].join('');
        setSafeHTML(selectModal, optionsHtml);
    }
    updateMemoryCounterBadge();
}

function applyActiveArticleParams() {
    if (!state.activeArticle || typeof document === 'undefined') return;

    const art = normalizeArticleRecord(state.activeArticle);
    state.activeArticle = art;

    // 1. Calculadora SOP: Cargar BPM, Secciones, Cavidades y los 8 Grados BDF guardados en la ficha
    const calcBpm = document.getElementById('calcBpm');
    const calcSections = document.getElementById('calcSections');
    const calcCavities = document.getElementById('calcCavities');
    if (calcBpm) calcBpm.value = art.bpm;
    if (calcSections) calcSections.value = art.secciones;
    if (calcCavities) calcCavities.value = art.cavidades;

    if (art.defaultParams) {
        const dp = art.defaultParams;
        const setDeg = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };
        setDeg('valPlungerUp', dp.plungerUp);
        setDeg('valPlungerDown', dp.plungerDown);
        setDeg('valBlankOpen', dp.blankOpen);
        setDeg('valInvertStart', dp.invertStart);
        setDeg('valBlowClose', dp.blowClose);
        setDeg('valNeckOpen', dp.neckRingOpen);
        setDeg('valBlowOn', dp.blowOn);
        setDeg('valBlowOff', dp.blowOff);
    }

    if (typeof calculateSopMs === 'function') calculateSopMs();

    // 2. Temporizador Swabbing: Cargar intervalo
    const swabInterval = document.getElementById('swabInterval');
    if (swabInterval) swabInterval.value = art.swabInterval;

    // 3. Etiqueta de campaña activa en Escáner OCR
    const scannerBadge = document.getElementById('scannerArticleBadge');
    if (scannerBadge) scannerBadge.innerText = art.nombre;

    // 4. Guías de la Cámara: Ajustar ancho y alto en píxeles basado en las cotas reales de la ficha
    const guideNeck = document.querySelector('.guide-neck');
    const guideBody = document.querySelector('.guide-body');

    if (guideNeck && guideBody) {
        const scale = 1.1;
        const neckWidthPx = art.diametroBoca * scale * 2.3;
        const neckHeightPx = (art.altura * 0.3) * scale;
        const bodyWidthPx = art.diametroCuerpo * scale * 2.1;
        const bodyHeightPx = (art.altura * 0.7) * scale;

        guideNeck.style.width = `${Math.round(neckWidthPx)}px`;
        guideNeck.style.height = `${Math.round(neckHeightPx)}px`;

        guideBody.style.width = `${Math.round(bodyWidthPx)}px`;
        guideBody.style.height = `${Math.round(bodyHeightPx)}px`;
    }
}

function changeActiveArticle(id) {
    const article = state.articulosList.find(a => a.id === id);
    if (article) {
        state.activeArticle = normalizeArticleRecord(article);
        persistCampaignMemory(state.articulosList, state.activeArticle.id);
        applyActiveArticleParams();
        showToast(`📦 Campaña cargada desde memoria: ${state.activeArticle.nombre}`, 'success');
    }
}

function openArticlesModal() {
    if (typeof document === 'undefined') return;
    document.getElementById('articlesModal')?.classList?.add('active');
    populateArticleSelects();
    const selectModal = document.getElementById('modalSelectArticle');
    if (selectModal && state.activeArticle) {
        selectModal.value = state.activeArticle.id;
        loadArticleInModal(state.activeArticle.id);
    }
}

function closeArticlesModal() {
    if (typeof document === 'undefined') return;
    document.getElementById('articlesModal')?.classList?.remove('active');
}

function prepareNewArticleInModal() {
    if (typeof document === 'undefined') return;
    const selectModal = document.getElementById('modalSelectArticle');
    if (selectModal) selectModal.value = '__new__';

    const titleEl = document.getElementById('modalFormTitle');
    if (titleEl) titleEl.textContent = '➕ Registrar Nueva Ficha Técnica (Se grabará para Futuras Campañas)';

    const deleteBtn = document.getElementById('btnDeleteCustomArticle');
    if (deleteBtn) deleteBtn.classList.add('d-none');

    const setVal = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    // Tomar valores actuales de la calculadora como base inicial conveniente
    const curPlungerUp = parseFloat(document.getElementById('valPlungerUp')?.value) || 80;
    const curPlungerDown = parseFloat(document.getElementById('valPlungerDown')?.value) || 150;
    const curBlankOpen = parseFloat(document.getElementById('valBlankOpen')?.value) || 190;
    const curInvertStart = parseFloat(document.getElementById('valInvertStart')?.value) || 195;
    const curBlowClose = parseFloat(document.getElementById('valBlowClose')?.value) || 240;
    const curNeckOpen = parseFloat(document.getElementById('valNeckOpen')?.value) || 245;
    const curBlowOn = parseFloat(document.getElementById('valBlowOn')?.value) || 270;
    const curBlowOff = parseFloat(document.getElementById('valBlowOff')?.value) || 325;

    setVal('artId', '__new__');
    setVal('artNombre', '');
    setVal('artCodigoMolde', '');
    setVal('artCapacidad', 330);
    setVal('artPeso', 200);
    setVal('artBpm', 280);
    setVal('artSecciones', 10);
    setVal('artCavidades', 2);
    setVal('artSwab', 20);
    setVal('artProceso', 'NNPB');
    setVal('artAltura', 220);
    setVal('artCuerpo', 60);
    setVal('artBoca', 26);

    setVal('artPlungerUp', curPlungerUp);
    setVal('artPlungerDown', curPlungerDown);
    setVal('artBlankOpen', curBlankOpen);
    setVal('artInvertStart', curInvertStart);
    setVal('artBlowClose', curBlowClose);
    setVal('artNeckRingOpen', curNeckOpen);
    setVal('artBlowOn', curBlowOn);
    setVal('artBlowOff', curBlowOff);

    const nameInput = document.getElementById('artNombre');
    if (nameInput && typeof nameInput.focus === 'function') {
        nameInput.focus();
    }
}

function loadArticleInModal(id) {
    if (id === '__new__') {
        prepareNewArticleInModal();
        return;
    }
    const rawArticle = state.articulosList.find(a => a.id === id);
    if (!rawArticle) return;
    const article = normalizeArticleRecord(rawArticle);

    const titleEl = document.getElementById('modalFormTitle');
    if (titleEl) {
        titleEl.textContent = article.isCustom
            ? `⭐ Editar Ficha de Campaña Propia: ${article.nombre}`
            : `✏️ Editar Ficha Técnica: ${article.nombre}`;
    }

    const deleteBtn = document.getElementById('btnDeleteCustomArticle');
    if (deleteBtn) {
        if (article.isCustom) {
            deleteBtn.classList.remove('d-none');
        } else {
            deleteBtn.classList.add('d-none');
        }
    }

    const setVal = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    const dp = article.defaultParams || DEFAULT_BDF_PARAMS;

    setVal('artId', article.id);
    setVal('artNombre', article.nombre);
    setVal('artCodigoMolde', article.codigoMolde || '');
    setVal('artCapacidad', article.capacidadMl || 330);
    setVal('artPeso', article.pesoGramos || 200);
    setVal('artBpm', article.bpm);
    setVal('artSecciones', article.secciones);
    setVal('artCavidades', article.cavidades);
    setVal('artSwab', article.swabInterval);
    setVal('artProceso', article.proceso);
    setVal('artAltura', article.altura);
    setVal('artCuerpo', article.diametroCuerpo);
    setVal('artBoca', article.diametroBoca);

    setVal('artPlungerUp', dp.plungerUp);
    setVal('artPlungerDown', dp.plungerDown);
    setVal('artBlankOpen', dp.blankOpen);
    setVal('artInvertStart', dp.invertStart);
    setVal('artBlowClose', dp.blowClose);
    setVal('artNeckRingOpen', dp.neckRingOpen);
    setVal('artBlowOn', dp.blowOn);
    setVal('artBlowOff', dp.blowOff);
}

function saveActiveArticleForm() {
    const rawId = (document.getElementById('artId')?.value || '').trim();
    const rawName = (document.getElementById('artNombre')?.value || '').trim();

    if (!rawName) {
        showToast('⚠️ Ingresa el nombre del envase (ej: Botella Vino Reserva 750ml) para grabarlo en memoria.', 'warning');
        const nameInput = document.getElementById('artNombre');
        if (nameInput && typeof nameInput.focus === 'function') nameInput.focus();
        return null;
    }

    const codigoMolde = (document.getElementById('artCodigoMolde')?.value || '').trim() || 'M-CAMPAÑA';
    const capacidadMl = parseFloat(document.getElementById('artCapacidad')?.value) || 330;
    const pesoGramos = parseFloat(document.getElementById('artPeso')?.value) || 200;
    const bpm = parseFloat(document.getElementById('artBpm')?.value) || 120;
    const secciones = parseInt(document.getElementById('artSecciones')?.value, 10) || 8;
    const cavidades = parseInt(document.getElementById('artCavidades')?.value, 10) || 2;
    const swabInterval = parseInt(document.getElementById('artSwab')?.value, 10) || 20;
    const proceso = document.getElementById('artProceso')?.value || 'NNPB';
    const altura = parseFloat(document.getElementById('artAltura')?.value) || 200;
    const diametroCuerpo = parseFloat(document.getElementById('artCuerpo')?.value) || 70;
    const diametroBoca = parseFloat(document.getElementById('artBoca')?.value) || 26;

    const defaultParams = {
        plungerUp: parseFloat(document.getElementById('artPlungerUp')?.value) || 80,
        plungerDown: parseFloat(document.getElementById('artPlungerDown')?.value) || 150,
        blankOpen: parseFloat(document.getElementById('artBlankOpen')?.value) || 190,
        invertStart: parseFloat(document.getElementById('artInvertStart')?.value) || 195,
        blowClose: parseFloat(document.getElementById('artBlowClose')?.value) || 240,
        neckRingOpen: parseFloat(document.getElementById('artNeckRingOpen')?.value) || 245,
        blowOn: parseFloat(document.getElementById('artBlowOn')?.value) || 270,
        blowOff: parseFloat(document.getElementById('artBlowOff')?.value) || 325
    };

    let targetArticle = (rawId && rawId !== '__new__')
        ? state.articulosList.find(a => a.id === rawId)
        : null;

    let isNewRecord = false;
    if (!targetArticle) {
        isNewRecord = true;
        const slug = rawName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 28) || 'envase';
        const newId = `camp_${slug}_${Date.now().toString().slice(-4)}`;
        targetArticle = {
            id: newId,
            isCustom: true
        };
        state.articulosList.push(targetArticle);
    }

    targetArticle.nombre = rawName;
    targetArticle.codigoMolde = codigoMolde;
    targetArticle.capacidadMl = capacidadMl;
    targetArticle.pesoGramos = pesoGramos;
    targetArticle.bpm = bpm;
    targetArticle.secciones = secciones;
    targetArticle.cavidades = cavidades;
    targetArticle.swabInterval = swabInterval;
    targetArticle.proceso = proceso;
    targetArticle.altura = altura;
    targetArticle.diametroCuerpo = diametroCuerpo;
    targetArticle.diametroBoca = diametroBoca;
    targetArticle.defaultParams = defaultParams;
    targetArticle.isModified = true;
    targetArticle.updatedAt = new Date().toISOString();

    state.activeArticle = normalizeArticleRecord(targetArticle);
    const idx = state.articulosList.findIndex(a => a.id === state.activeArticle.id);
    if (idx !== -1) state.articulosList[idx] = state.activeArticle;

    persistCampaignMemory(state.articulosList, state.activeArticle.id);
    populateArticleSelects();
    applyActiveArticleParams();

    const modalSel = document.getElementById('modalSelectArticle');
    if (modalSel) modalSel.value = state.activeArticle.id;

    showToast(
        isNewRecord
            ? `✅ Nuevo envase "${state.activeArticle.nombre}" grabado en memoria permanente para futuras campañas.`
            : `💾 Ficha técnica de "${state.activeArticle.nombre}" actualizada en memoria para futuras campañas.`,
        'success',
        4000
    );
    closeArticlesModal();
    return state.activeArticle;
}

function saveCurrentCalculatorToArticleMemory() {
    if (!state.activeArticle) return null;
    const art = state.articulosList.find(a => a.id === state.activeArticle.id) || state.activeArticle;

    const bpm = parseFloat(document.getElementById('calcBpm')?.value) || art.bpm;
    const secciones = parseInt(document.getElementById('calcSections')?.value, 10) || art.secciones;
    const cavidades = parseInt(document.getElementById('calcCavities')?.value, 10) || art.cavidades;
    const swabInterval = parseInt(document.getElementById('swabInterval')?.value, 10) || art.swabInterval;

    art.bpm = bpm;
    art.secciones = secciones;
    art.cavidades = cavidades;
    art.swabInterval = swabInterval;
    art.defaultParams = {
        plungerUp: parseFloat(document.getElementById('valPlungerUp')?.value) || 80,
        plungerDown: parseFloat(document.getElementById('valPlungerDown')?.value) || 150,
        blankOpen: parseFloat(document.getElementById('valBlankOpen')?.value) || 190,
        invertStart: parseFloat(document.getElementById('valInvertStart')?.value) || 195,
        blowClose: parseFloat(document.getElementById('valBlowClose')?.value) || 240,
        neckRingOpen: parseFloat(document.getElementById('valNeckOpen')?.value) || 245,
        blowOn: parseFloat(document.getElementById('valBlowOn')?.value) || 270,
        blowOff: parseFloat(document.getElementById('valBlowOff')?.value) || 325
    };
    art.isModified = true;
    art.updatedAt = new Date().toISOString();

    state.activeArticle = normalizeArticleRecord(art);
    const idx = state.articulosList.findIndex(a => a.id === state.activeArticle.id);
    if (idx !== -1) state.articulosList[idx] = state.activeArticle;

    persistCampaignMemory(state.articulosList, state.activeArticle.id);
    populateArticleSelects();

    showToast(`💾 Ciclo BDF y velocidad grabados en la ficha de "${state.activeArticle.nombre}" para futuras campañas.`, 'success', 4000);
    return state.activeArticle;
}

function deleteCustomArticleFromModal() {
    const id = document.getElementById('artId')?.value;
    if (!id || id === '__new__') return;
    const target = state.articulosList.find(a => a.id === id);
    if (!target || !target.isCustom) {
        showToast('Los envases base de fábrica no se eliminan; puedes editarlos o restaurarlos.', 'info');
        return;
    }
    if (typeof confirm === 'function' && !confirm(`¿Eliminar el envase personalizado "${target.nombre}" de la memoria?`)) {
        return;
    }
    state.articulosList = state.articulosList.filter(a => a.id !== id);
    state.activeArticle = state.articulosList[0] || normalizeArticleRecord(ARTICULOS_DEFAULT[0]);
    persistCampaignMemory(state.articulosList, state.activeArticle.id);
    populateArticleSelects();
    applyActiveArticleParams();
    loadArticleInModal(state.activeArticle.id);
    showToast(`🗑️ Envase "${target.nombre}" eliminado de la memoria.`, 'info');
}

function exportArticlesMemoryJson() {
    try {
        const payload = {
            app: 'VitroDiag NEXUS',
            exportedAt: new Date().toISOString(),
            totalArticles: state.articulosList.length,
            activeArticleId: state.activeArticle ? state.activeArticle.id : 'ssp_296',
            articulos: state.articulosList
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fichas_Tecnicas_Campanas_VitroDiag_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('📥 Respaldo de fichas técnicas descargado con éxito.', 'success');
    } catch (e) {
        console.error('[NEXUS Export] Error exportando fichas:', e);
    }
}

function importArticlesMemoryJson(inputElement) {
    try {
        if (!inputElement || !inputElement.files || inputElement.files.length === 0) return;
        const file = inputElement.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                const incoming = Array.isArray(data) ? data : (Array.isArray(data.articulos) ? data.articulos : []);
                if (incoming.length === 0) {
                    showToast('⚠️ El archivo no contiene fichas técnicas válidas.', 'warning');
                    return;
                }
                let importedCount = 0;
                incoming.forEach(item => {
                    const norm = normalizeArticleRecord(item);
                    if (!norm) return;
                    const idx = state.articulosList.findIndex(a => a.id === norm.id);
                    if (idx === -1) {
                        state.articulosList.push(norm);
                    } else {
                        state.articulosList[idx] = norm;
                    }
                    importedCount++;
                });
                persistCampaignMemory(state.articulosList, state.activeArticle ? state.activeArticle.id : 'ssp_296');
                populateArticleSelects();
                applyActiveArticleParams();
                if (state.activeArticle) loadArticleInModal(state.activeArticle.id);
                showToast(`📤 ${importedCount} fichas técnicas importadas y grabadas en memoria permanente.`, 'success');
            } catch (parseErr) {
                showToast('⚠️ Error al leer el archivo JSON de fichas técnicas.', 'danger');
            } finally {
                inputElement.value = '';
            }
        };
        reader.readAsText(file);
    } catch (err) {
        console.error('[NEXUS Import] Error importando fichas:', err);
    }
}

function resetArticlesDefault() {
    if (confirm("¿Deseas restaurar los valores de fábrica de los 14 envases estándar? (Tus envases personalizados creados para campañas propias se conservarán en memoria).")) {
        const customCreated = state.articulosList.filter(a => a.isCustom);
        state.articulosList = [
            ...ARTICULOS_DEFAULT.map(normalizeArticleRecord),
            ...customCreated
        ];
        state.activeArticle = state.articulosList.find(a => a.id === (state.activeArticle && state.activeArticle.id)) || state.articulosList[0];
        persistCampaignMemory(state.articulosList, state.activeArticle.id);

        populateArticleSelects();
        applyActiveArticleParams();
        loadArticleInModal(state.activeArticle.id);
        showToast("Fichas estándar restauradas (tus campañas personalizadas fueron preservadas)", "info");
        closeArticlesModal();
    }
}

function toggleDefectCard(headerElement) {
    const item = headerElement.parentElement;
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.defect-item.open').forEach(el => {
        if (el !== item) el.classList.remove('open');
    });

    if (isOpen) {
        item.classList.remove('open');
    } else {
        item.classList.add('open');
    }
}

function setFilter(zone, buttonElement) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');

    state.currentFilterZone = zone;
    filterDefects();
}

function filterDefects() {
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

    const filtered = DEFECTOS_DB.filter(defect => {
        const matchesSearch = !searchVal ||
            defect.nombre.toLowerCase().includes(searchVal) ||
            defect.descripcion.toLowerCase().includes(searchVal) ||
            defect.gravedad.toLowerCase().includes(searchVal);

        const effectiveZone = (defect.nombre && defect.nombre.toLowerCase().includes('hombro') && defect.zona === 'cuerpo')
            ? 'hombro'
            : defect.zona;
        const matchesZone = state.currentFilterZone === "todo" || effectiveZone === state.currentFilterZone || defect.zona === state.currentFilterZone;

        return matchesSearch && matchesZone;
    });

    renderDefectsList(filtered);
}

async function switchView(viewName) {
    try {
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
            const clickAttr = btn.getAttribute('onclick');
            return clickAttr && clickAttr.includes(viewName);
        });
        if (targetBtn) targetBtn.classList.add('active');

        const targetView = document.getElementById(viewName + 'View');
        if (targetView) {
            targetView.classList.add('active');
        }

        if (viewName === 'live') {
            try {
                startDiagnosticCamera();
                if (window.renderAcopioReel) window.renderAcopioReel();
            } catch (camErr) {
                console.warn("[NEXUS] Error reactivando cámara:", camErr);
            }
        } else if (viewName === 'directory') {
            renderDefectsList(DEFECTOS_DB);
        } else if (viewName === 'dataset') {
            try {
                populateDatasetSelect();
                renderDatasetGallery();
                if (window.renderAcopioReel) window.renderAcopioReel();
            } catch (dsErr) {
                console.error("[NEXUS] Error cargando Banco IA:", dsErr);
            }
        }
    } catch (err) {
        console.error("[NEXUS] Error en transición de vista:", err);
    }
}

export function switchToolTab(tabName) {
    try {
        const subtabs = document.querySelectorAll('.tool-subtab');
        subtabs.forEach(tab => {
            const onclickAttr = tab.getAttribute('onclick') || '';
            if (onclickAttr.includes(`'${tabName}'`)) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const contents = document.querySelectorAll('.tool-content');
        contents.forEach(content => {
            const targetId = `tool${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Content`;
            if (content.id.toLowerCase() === targetId.toLowerCase() || content.id === `${tabName}Content`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    } catch (err) {
        console.error("[NEXUS] Error cambiando subpestaña de herramientas:", err);
    }
}

if (typeof window !== 'undefined') {
    window.switchView = switchView;
    window.switchToolTab = switchToolTab;
    window.renderDefectsList = renderDefectsList;
    window.DEFECTOS_DB = DEFECTOS_DB;
    window.toggleDefectCard = toggleDefectCard;
    window.setFilter = setFilter;
    window.filterDefects = filterDefects;
    window.openArticlesModal = openArticlesModal;
    window.closeArticlesModal = closeArticlesModal;
    window.openModal = function(modalId) {
        if (typeof modalId === 'string' && modalId) {
            const m = document.getElementById(modalId);
            if (m) m.classList.add('active');
        } else {
            openArticlesModal();
        }
    };
    window.closeModal = function(modalId) {
        if (typeof modalId === 'string' && modalId) {
            const m = document.getElementById(modalId);
            if (m) m.classList.remove('active');
        } else {
            closeArticlesModal();
        }
    };
    window.prepareNewArticleInModal = prepareNewArticleInModal;
    window.loadArticleInModal = loadArticleInModal;
    window.saveActiveArticleForm = saveActiveArticleForm;
    window.saveCurrentCalculatorToArticleMemory = saveCurrentCalculatorToArticleMemory;
    window.deleteCustomArticleFromModal = deleteCustomArticleFromModal;
    window.exportArticlesMemoryJson = exportArticlesMemoryJson;
    window.importArticlesMemoryJson = importArticlesMemoryJson;
    window.resetArticlesDefault = resetArticlesDefault;
    window.changeActiveArticle = changeActiveArticle;
    window.populateArticleSelects = populateArticleSelects;
    window.applyActiveArticleParams = applyActiveArticleParams;
    window.showToast = showToast;
}

export {
    showToast,
    initArticles,
    normalizeArticleRecord,
    persistCampaignMemory,
    populateArticleSelects,
    applyActiveArticleParams,
    changeActiveArticle,
    openArticlesModal,
    closeArticlesModal,
    prepareNewArticleInModal,
    loadArticleInModal,
    saveActiveArticleForm,
    saveCurrentCalculatorToArticleMemory,
    deleteCustomArticleFromModal,
    exportArticlesMemoryJson,
    importArticlesMemoryJson,
    resetArticlesDefault,
    toggleDefectCard,
    setFilter,
    filterDefects,
    switchView
};
