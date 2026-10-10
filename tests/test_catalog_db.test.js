import test from 'node:test';
import assert from 'node:assert/strict';

import {
    ARTICULOS_DEFAULT,
    DEFECTOS_DB,
    getDefectsByZone,
    getDefectById,
    getDefectCatalogSummary,
    findDefectByIdOrFuzzy
} from '../static/js/db.js';

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
    assert.ok(DEFECTOS_DB.length >= 100, `Debe contener al menos 100 defectos industriales (actual: ${DEFECTOS_DB.length})`);
    
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
