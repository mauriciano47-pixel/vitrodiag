// Controlador de Modal CRUD y Respaldo JSON para Campañas de Envases (VitroDiag NEXUS)
import { state } from './state.js';
import { ARTICULOS_DEFAULT } from './db.js';
import {
    DEFAULT_BDF_PARAMS,
    normalizeArticleRecord,
    persistCampaignMemory,
    populateArticleSelects,
    applyActiveArticleParams,
    showToast
} from './ui.js';

function setInputValue(elId, val) {
    const el = document.getElementById(elId);
    if (el) el.value = val !== undefined && val !== null ? val : '';
}

function setInputValues(entries) {
    Object.entries(entries).forEach(([id, val]) => setInputValue(id, val));
}

function getNumValue(id, fallback, isInt = false) {
    const raw = document.getElementById(id)?.value;
    const parsed = isInt ? parseInt(raw, 10) : parseFloat(raw);
    return Number.isFinite(parsed) && parsed !== 0 ? parsed : (parsed || fallback);
}

function readBdfParams(prefix) {
    const neckId = prefix === 'val' ? 'valNeckOpen' : `${prefix}NeckRingOpen`;
    return {
        plungerUp: getNumValue(`${prefix}PlungerUp`, DEFAULT_BDF_PARAMS.plungerUp),
        plungerDown: getNumValue(`${prefix}PlungerDown`, DEFAULT_BDF_PARAMS.plungerDown),
        blankOpen: getNumValue(`${prefix}BlankOpen`, DEFAULT_BDF_PARAMS.blankOpen),
        invertStart: getNumValue(`${prefix}InvertStart`, DEFAULT_BDF_PARAMS.invertStart),
        blowClose: getNumValue(`${prefix}BlowClose`, DEFAULT_BDF_PARAMS.blowClose),
        neckRingOpen: getNumValue(neckId, DEFAULT_BDF_PARAMS.neckRingOpen),
        blowOn: getNumValue(`${prefix}BlowOn`, DEFAULT_BDF_PARAMS.blowOn),
        blowOff: getNumValue(`${prefix}BlowOff`, DEFAULT_BDF_PARAMS.blowOff)
    };
}

function writeModalBdfInputs(dp) {
    setInputValues({
        artPlungerUp: dp.plungerUp,
        artPlungerDown: dp.plungerDown,
        artBlankOpen: dp.blankOpen,
        artInvertStart: dp.invertStart,
        artBlowClose: dp.blowClose,
        artNeckRingOpen: dp.neckRingOpen,
        artBlowOn: dp.blowOn,
        artBlowOff: dp.blowOff
    });
}

export function openArticlesModal() {
    if (typeof document === 'undefined') return;
    document.getElementById('articlesModal')?.classList?.add('active');
    populateArticleSelects();
    const selectModal = document.getElementById('modalSelectArticle');
    if (selectModal && state.activeArticle) {
        selectModal.value = state.activeArticle.id;
        loadArticleInModal(state.activeArticle.id);
    }
}

export function closeArticlesModal() {
    if (typeof document === 'undefined') return;
    document.getElementById('articlesModal')?.classList?.remove('active');
}

export function prepareNewArticleInModal() {
    if (typeof document === 'undefined') return;
    const selectModal = document.getElementById('modalSelectArticle');
    if (selectModal) selectModal.value = '__new__';

    const titleEl = document.getElementById('modalFormTitle');
    if (titleEl) titleEl.textContent = '➕ Registrar Nueva Ficha Técnica (Se grabará para Futuras Campañas)';

    document.getElementById('btnDeleteCustomArticle')?.classList.add('d-none');

    setInputValues({
        artId: '__new__',
        artNombre: '',
        artCodigoMolde: '',
        artCapacidad: 330,
        artPeso: 200,
        artBpm: 280,
        artSecciones: 10,
        artCavidades: 2,
        artSwab: 20,
        artProceso: 'NNPB',
        artAltura: 220,
        artCuerpo: 60,
        artBoca: 26
    });
    writeModalBdfInputs(readBdfParams('val'));

    const nameInput = document.getElementById('artNombre');
    if (nameInput && typeof nameInput.focus === 'function') {
        nameInput.focus();
    }
}

export function loadArticleInModal(id) {
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
        deleteBtn.classList.toggle('d-none', !article.isCustom);
    }

    setInputValues({
        artId: article.id,
        artNombre: article.nombre,
        artCodigoMolde: article.codigoMolde || '',
        artCapacidad: article.capacidadMl || 330,
        artPeso: article.pesoGramos || 200,
        artBpm: article.bpm,
        artSecciones: article.secciones,
        artCavidades: article.cavidades,
        artSwab: article.swabInterval,
        artProceso: article.proceso,
        artAltura: article.altura,
        artCuerpo: article.diametroCuerpo,
        artBoca: article.diametroBoca
    });
    writeModalBdfInputs(article.defaultParams || DEFAULT_BDF_PARAMS);
}

function commitNormalizedArticle(targetArticle) {
    state.activeArticle = normalizeArticleRecord(targetArticle);
    const idx = state.articulosList.findIndex(a => a.id === state.activeArticle.id);
    if (idx !== -1) state.articulosList[idx] = state.activeArticle;
    persistCampaignMemory(state.articulosList, state.activeArticle.id);
    populateArticleSelects();
}

export function saveActiveArticleForm() {
    const rawId = (document.getElementById('artId')?.value || '').trim();
    const rawName = (document.getElementById('artNombre')?.value || '').trim();

    if (!rawName) {
        showToast('⚠️ Ingresa el nombre del envase (ej: Botella Vino Reserva 750ml) para grabarlo en memoria.', 'warning');
        const nameInput = document.getElementById('artNombre');
        if (nameInput && typeof nameInput.focus === 'function') nameInput.focus();
        return null;
    }

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
        targetArticle = { id: `camp_${slug}_${Date.now().toString().slice(-4)}`, isCustom: true };
        state.articulosList.push(targetArticle);
    }

    Object.assign(targetArticle, {
        nombre: rawName,
        codigoMolde: (document.getElementById('artCodigoMolde')?.value || '').trim() || 'M-CAMPAÑA',
        capacidadMl: getNumValue('artCapacidad', 330),
        pesoGramos: getNumValue('artPeso', 200),
        bpm: getNumValue('artBpm', 120),
        secciones: getNumValue('artSecciones', 8, true),
        cavidades: getNumValue('artCavidades', 2, true),
        swabInterval: getNumValue('artSwab', 20, true),
        proceso: document.getElementById('artProceso')?.value || 'NNPB',
        altura: getNumValue('artAltura', 200),
        diametroCuerpo: getNumValue('artCuerpo', 70),
        diametroBoca: getNumValue('artBoca', 26),
        defaultParams: readBdfParams('art'),
        isModified: true,
        updatedAt: new Date().toISOString()
    });

    commitNormalizedArticle(targetArticle);
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

export function saveCurrentCalculatorToArticleMemory() {
    if (!state.activeArticle) return null;
    const art = state.articulosList.find(a => a.id === state.activeArticle.id) || state.activeArticle;

    art.bpm = getNumValue('calcBpm', art.bpm);
    art.secciones = getNumValue('calcSections', art.secciones, true);
    art.cavidades = getNumValue('calcCavities', art.cavidades, true);
    art.swabInterval = getNumValue('swabInterval', art.swabInterval, true);
    art.defaultParams = readBdfParams('val');
    art.isModified = true;
    art.updatedAt = new Date().toISOString();

    commitNormalizedArticle(art);

    showToast(`💾 Ciclo BDF y velocidad grabados en la ficha de "${state.activeArticle.nombre}" para futuras campañas.`, 'success', 4000);
    return state.activeArticle;
}

export function deleteCustomArticleFromModal() {
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

export function exportArticlesMemoryJson() {
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

export function importArticlesMemoryJson(inputElement) {
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
                    if (idx === -1) state.articulosList.push(norm);
                    else state.articulosList[idx] = norm;
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

export function resetArticlesDefault() {
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
