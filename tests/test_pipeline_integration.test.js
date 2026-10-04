// scratch/test_pipeline_integration.js — Prueba de integración completa Macro + Defectos Finos (Calcinados)
const assert = require('assert');

async function runIntegrationTest() {
    console.log('🧪 Iniciando prueba de integración Macro (Plomada) + Fine Defects (Calcinados)...\n');

    const { analyzeImageGeometricDefects } = await import('../static/js/geometry.js');
    const { detectFineDefects } = await import('../static/js/fineDefects.js');

    const w = 400, h = 600;
    const data = new Uint8ClampedArray(w * h * 4);
    data.fill(245); // Fondo claro

    // 1. Dibujar botella sintética recta (eje en X=200)
    for (let y = 60; y < 540; y++) {
        let halfW = 55;
        if (y < 160) halfW = 24; // boca / cuello
        else if (y < 230) halfW = 24 + (y - 160) * (31 / 70); // hombro

        const left = 200 - halfW;
        const right = 200 + halfW;
        for (let x = left; x <= right; x++) {
            const idx = (y * w + x) * 4;
            data[idx] = 160; data[idx+1] = 160; data[idx+2] = 160; data[idx+3] = 255;
        }
    }

    // 2. Agregar defecto fino: Calcinado oscuro en el cuerpo (X=200, Y=380)
    for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            const idx = ((380 + dy) * w + (200 + dx)) * 4;
            data[idx] = 20; data[idx+1] = 20; data[idx+2] = 20; data[idx+3] = 255;
        }
    }

    // Ejecutar análisis geométrico
    const macroResult = await analyzeImageGeometricDefects({ width: w, height: h, data });
    console.log('1. Análisis Geométrico:', {
        conformeInicial: macroResult.conforme,
        anguloTorcido: macroResult.metricas.anguloTorcidoEje,
        simetria: macroResult.metricas.simetriaGeneral,
        desviacionCuello: macroResult.metricas.desviacionCuelloVsCuerpo
    });

    assert.strictEqual(macroResult.metricas.anguloTorcidoEje < 1.5, true, 'El eje debe ser recto');

    // Ejecutar detección de calcinados
    const fineResult = detectFineDefects(
        { width: w, height: h, data },
        macroResult.datosPlomada
    );
    console.log('2. Detección de Calcinados:', {
        detected: fineResult.detected,
        count: fineResult.count,
        primerDefecto: fineResult.defects[0]?.nombre,
        zona: fineResult.defects[0]?.zona
    });

    assert.strictEqual(fineResult.detected, true, 'Debe detectar el calcinado');
    assert.strictEqual(fineResult.defects[0].zona, 'cuerpo', 'Zona debe ser cuerpo');

    // Fusionar resultados en el pipeline (simulando nexusRunMacroInspection)
    if (fineResult.detected && fineResult.defects.length > 0) {
        macroResult.defectos.push(...fineResult.defects);
        macroResult.conforme = false;
        macroResult.detected = true;
        macroResult.cantidadDefectos = macroResult.defectos.length;
        macroResult.calcinados = fineResult;
    }

    console.log('3. Resultado Consolidado:', {
        conformeFinal: macroResult.conforme,
        totalDefectos: macroResult.cantidadDefectos,
        nombresDefectos: macroResult.defectos.map(d => d.nombre)
    });

    assert.strictEqual(macroResult.conforme, false, 'El envase debe quedar rechazado por el calcinado');
    assert.strictEqual(macroResult.defectos.length, 1, 'Debe haber exactamente 1 defecto consolidado');

    console.log('\n✅ Prueba de integración exitosa: Pipeline Macro + Defectos Finos operando al 100%.');
}

runIntegrationTest().catch(e => {
    console.error('❌ Error en prueba de integración:', e);
    process.exit(1);
});
