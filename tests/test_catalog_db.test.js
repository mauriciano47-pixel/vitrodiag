import test from 'node:test';
import assert from 'node:assert/strict';

import {
    ARTICULOS_DEFAULT,
    DEFECTOS_DB,
    generateDefectIllustration,
    getDefectsByZone,
    getDefectById,
    getDefectCatalogSummary,
    findDefectByIdOrFuzzy
} from '../static/js/db.js';

import {
    saveGeminiApiKey,
    loadGeminiApiKey,
    clearGeminiApiKey,
    extractCleanGeminiKey,
    isValidGeminiKeySyntax,
    clearGeminiModalKeyInput,
    promptSaveGeminiApiKey,
    openGeminiConfigModal,
    closeGeminiConfigModal,
    testGeminiApiKey,
    generateLocalExpertDiagnosis
} from '../static/js/geminiVision.js';

import {
    initArticles,
    normalizeArticleRecord,
    persistCampaignMemory,
    changeActiveArticle,
    closeAllModals
} from '../static/js/ui.js';
import { state } from '../static/js/state.js';

test('1. Catálogo de Artículos Industriales: Modelos de envases de vidrio cargados correctamente', () => {
    assert.ok(Array.isArray(ARTICULOS_DEFAULT), 'ARTICULOS_DEFAULT debe ser un array');
    assert.ok(ARTICULOS_DEFAULT.length >= 8, 'Debe haber al menos 8 modelos industriales configurados');
    
    const ssp = ARTICULOS_DEFAULT.find(a => a.id === 'ssp_296');
    assert.ok(ssp, 'Debe existir la botella SSP 296cc NNPB');
    assert.equal(ssp.proceso, 'NNPB');
    assert.equal(ssp.bpm, 396);
});

test('2. Catálogo Multimodal de Defectos: Ensamble completo sin pérdida de datos', () => {
    assert.ok(Array.isArray(DEFECTOS_DB), 'DEFECTOS_DB debe ser un array');
    assert.ok(DEFECTOS_DB.length >= 140, `Debe contener al menos 140 defectos industriales (actual: ${DEFECTOS_DB.length})`);
    
    // Validar que cada defecto tenga campos requeridos
    for (const d of DEFECTOS_DB) {
        assert.ok(d.id, 'Cada defecto debe tener ID');
        assert.ok(d.nombre, `El defecto ${d.id} debe tener nombre`);
        assert.ok(d.zona, `El defecto ${d.id} debe tener zona`);
        assert.ok(d.gravedad, `El defecto ${d.id} debe tener gravedad`);
        assert.ok(Array.isArray(d.causas), `El defecto ${d.id} debe tener array de causas`);
        assert.ok(Array.isArray(d.acciones), `El defecto ${d.id} debe tener array de acciones correctivas`);
    }
});

test('3. Distribución Anatómica de Zonas del Envase de Vidrio', () => {
    const zonas = ['boca', 'cuello', 'cuerpo', 'fondo', 'general'];
    for (const z of zonas) {
        const defectosZona = getDefectsByZone(z);
        assert.ok(defectosZona.length > 0, `La zona ${z} debe contener defectos catalogados`);
    }
});

test('4. Búsqueda y Resolución de Defectos por ID', () => {
    const calcinado = getDefectById('calcinado_boca');
    assert.ok(calcinado, 'Debe encontrar calcinado_boca');
    assert.equal(calcinado.zona, 'boca');
    assert.equal(calcinado.gravedad, 'Crítico');

    const inexistente = getDefectById('defecto_fantasma_123');
    assert.equal(inexistente, null);
});

test('5. Búsqueda Fuzzy e Inclusión para Asistente Gemini Vision', () => {
    const matchFuzzy = findDefectByIdOrFuzzy('calcinado en boca');
    assert.ok(matchFuzzy, 'Debe encontrar coincidencia difusa para calcinado en boca');
    assert.equal(matchFuzzy.id, 'calcinado_boca');

    const matchIdParcial = findDefectByIdOrFuzzy('rebaba_boca');
    assert.ok(matchIdParcial, 'Debe encontrar coincidencia por ID');
    assert.equal(matchIdParcial.zona, 'boca');
});

test('6. Generación de Prompt Resumen para Visión por Computadora', () => {
    const summary = getDefectCatalogSummary();
    assert.ok(typeof summary === 'string', 'El resumen debe ser una cadena');
    assert.ok(summary.includes('calcinado_boca'), 'El resumen debe incluir calcinado_boca');
    assert.ok(summary.length > 1000, 'El resumen debe abarcar el catálogo completo');
});

test('7. Motor de Planos Técnicos CAD Vectoriales: Generación SVG para los 147 defectos', () => {
    for (const d of DEFECTOS_DB) {
        const svg = generateDefectIllustration(d);
        assert.ok(svg.includes('<svg viewBox="0 0 150 202"'), `Defecto ${d.id} debe generar plano CAD 150x202`);
        assert.ok(svg.includes('CAD MOLDERÍA I.S.'), `Defecto ${d.id} debe incluir cabezal CAD`);
    }
});

test('8. Módulo Gemini Vision y Controladores del Modal de Configuración IA', () => {
    assert.equal(typeof saveGeminiApiKey, 'function');
    assert.equal(typeof loadGeminiApiKey, 'function');
    assert.equal(typeof clearGeminiApiKey, 'function');
    assert.equal(typeof isValidGeminiKeySyntax, 'function');
    assert.equal(typeof clearGeminiModalKeyInput, 'function');
    assert.equal(typeof promptSaveGeminiApiKey, 'function');
    assert.equal(typeof openGeminiConfigModal, 'function');
    assert.equal(typeof closeGeminiConfigModal, 'function');
    assert.equal(typeof testGeminiApiKey, 'function');
    assert.equal(typeof generateLocalExpertDiagnosis, 'function');

    // Validar que claves revocadas antiguas o contraseñas genéricas sean rechazadas
    const revokedLegacy = Buffer.from('QUl6YVN5RGw2SmRFVlM4bnhPdEhhcTl5dnpFblpPVlZ3R2xR', 'base64').toString('utf8');
    assert.equal(isValidGeminiKeySyntax(revokedLegacy), false, 'Debe rechazar la clave histórica revocada');
    assert.equal(isValidGeminiKeySyntax('miPassword123456'), false, 'Debe rechazar contraseñas autocompletadas que no inicien con AIza');
    assert.equal(isValidGeminiKeySyntax('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q'), true, 'Debe aceptar sintaxis válida AIzaSy de 39 caracteres');

    // Validar que extractCleanGeminiKey separe y rescate la clave nueva aunque se haya pegado encima de los 39 puntos antiguos
    const newValidKey = 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q';
    assert.equal(extractCleanGeminiKey(revokedLegacy + newValidKey), newValidKey, 'Debe extraer la nueva clave limpia cuando se pega sobre la anterior');
    assert.equal(extractCleanGeminiKey(revokedLegacy), '', 'Debe limpiar por completo la clave antigua revocada');
});

test('9. Memoria Permanente de Fichas Técnicas y Futuras Campañas de Envases', () => {
    const store = {};
    globalThis.localStorage = {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };

    initArticles();
    assert.ok(state.articulosList.length >= 14, 'Debe inicializar los 14 artículos base');

    // Simular agregado de una nueva ficha técnica personalizada para futuras campañas
    const nuevoEnvase = normalizeArticleRecord({
        id: 'camp_vino_gran_reserva_999',
        nombre: 'Botella Vino Gran Reserva 750ml',
        codigoMolde: 'M-GR-750-C26',
        capacidadMl: 750,
        pesoGramos: 580,
        bpm: 95,
        secciones: 10,
        cavidades: 2,
        swabInterval: 15,
        altura: 315.5,
        diametroCuerpo: 81.2,
        diametroBoca: 29.5,
        proceso: 'Blow-Blow',
        isCustom: true,
        isModified: true,
        defaultParams: {
            plungerUp: 76,
            plungerDown: 144,
            blankOpen: 186,
            invertStart: 194,
            blowClose: 239,
            neckRingOpen: 247,
            blowOn: 269,
            blowOff: 327
        }
    });

    state.articulosList.push(nuevoEnvase);
    persistCampaignMemory(state.articulosList, nuevoEnvase.id);

    // Simular cierre de app y reinicio en futura campaña (incluso si vitrodiag_articulos se resetea pero el cofre persiste)
    delete store['vitrodiag_articulos'];
    initArticles();

    const recuperado = state.articulosList.find(a => a.id === 'camp_vino_gran_reserva_999');
    assert.ok(recuperado, 'El envase personalizado debe recuperarse intacto desde el cofre de campañas futuras');
    assert.equal(recuperado.codigoMolde, 'M-GR-750-C26');
    assert.equal(recuperado.pesoGramos, 580);
    assert.equal(recuperado.altura, 315.5);
    assert.equal(recuperado.defaultParams.plungerDown, 144);
    assert.equal(recuperado.defaultParams.blowOff, 327);

    changeActiveArticle('camp_vino_gran_reserva_999');
    assert.equal(state.activeArticle.id, 'camp_vino_gran_reserva_999');
    assert.equal(state.activeArticle.nombre, 'Botella Vino Gran Reserva 750ml');
});

test('10. Auditoría Exhaustiva de Defectos Críticos Oficiales (Cristalerías de Chile S.A. & Bucher Emhart Glass v2.5.4)', () => {
    assert.equal(DEFECTOS_DB.length, 165, 'El catálogo consolidado debe contar con los 165 defectos industriales');
    const criticos = DEFECTOS_DB.filter(d => d.gravedad === 'Crítico');
    assert.equal(criticos.length, 58, 'Debe haber exactamente 58 defectos clasificados como Crítico (AQL 0.0%)');

    const officialCriticalIds = [
        'calcinado_hilos',
        'calcinado_platina',
        'boca_estrellada',
        'aleta_doblez_boca',
        'vidrio_pegado_macho',
        'mala_distribucion_cuello',
        'bullon_boca',
        'calcinado_fisura_hombro',
        'calcinado_costura',
        'calcinado_caliente_presion',
        'bullon_cuerpo',
        'cuerpo_fino',
        'columpio_fondo',
        'calcinado_fisura_fondo',
        'calcinado_talon',
        'calcinado_crecent',
        'calcinado_costura_fondo',
        'fondo_fino',
        'roto_archa'
    ];

    for (const id of officialCriticalIds) {
        const def = getDefectById(id);
        assert.ok(def, `El defecto crítico oficial "${id}" debe existir en DEFECTOS_DB`);
        assert.equal(def.gravedad, 'Crítico', `El defecto "${id}" debe tener gravedad Crítico`);
        assert.ok(Array.isArray(def.causas) && def.causas.length >= 2, `El defecto "${id}" debe documentar causas de máquina I.S.`);
        assert.ok(Array.isArray(def.acciones) && def.acciones.length >= 2, `El defecto "${id}" debe documentar acciones correctivas SOP`);
    }
});

test('11. Ergonomía Form Shield y Anti-Modal Jail: Cierre universal de modales (Escape / Backdrop)', () => {
    assert.equal(typeof closeAllModals, 'function', 'closeAllModals debe ser una función exportada');
    assert.doesNotThrow(() => {
        closeAllModals();
    }, 'closeAllModals debe ejecutarse de forma segura y defensiva');
});
