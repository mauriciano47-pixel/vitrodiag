// scratch/test_fine_defects.js — Pruebas unitarias para el detector de calcinados y defectos finos
const fs = require('fs');

async function testFineDefects() {
    console.log('🧪 Iniciando pruebas de detección de calcinados (fineDefects.js)...\n');

    const { detectFineDefects } = await import('../static/js/fineDefects.js');

    const w = 400, h = 600;
    const data = new Uint8ClampedArray(w * h * 4);
    data.fill(240); // Fondo claro

    // 1. Crear silueta de botella
    const rows = [];
    for (let row = 50; row < 550; row += 8) {
        let halfW = 60;
        if (row < 150) halfW = 25; // cuello
        else if (row < 230) halfW = 25 + (row - 150) * (35 / 80); // hombro

        const centerX = 200;
        const left = centerX - halfW;
        const right = centerX + halfW;

        for (let col = left; col <= right; col++) {
            const idx = (row * w + col) * 4;
            data[idx] = 180; data[idx+1] = 180; data[idx+2] = 180; data[idx+3] = 255; // Vidrio
        }

        rows.push({
            y: row,
            leftX: left,
            rightX: right,
            width: right - left
        });
    }

    const datosPlomada = {
        minBottleY: 50,
        maxBottleY: 550,
        bottleHeight: 500,
        rows: rows,
        canvasWidth: w,
        canvasHeight: h
    };

    // Caso A: Sin calcinados
    console.log('Test A: Botella limpia sin calcinados...');
    const resA = detectFineDefects({ width: w, height: h, data }, datosPlomada);
    console.log(`  Resultado A: Detectados=${resA.count} (esperado 0) -> ${resA.count === 0 ? '✅ Pasa' : '❌ Fallo'}`);

    // Caso B: Con calcinado en el cuerpo (X=200, Y=350, tamaño 8x8 px, color oscuro = 50)
    console.log('\nTest B: Botella con mancha de grafito/calcinado en cuerpo (X=200, Y=350)...');
    for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
            const idx = ((350 + dy) * w + (200 + dx)) * 4;
            data[idx] = 30; data[idx+1] = 30; data[idx+2] = 30; data[idx+3] = 255;
        }
    }

    const resB = detectFineDefects({ width: w, height: h, data }, datosPlomada);
    console.log(`  Resultado B: Detectados=${resB.count} (esperado >=1) -> ${resB.count >= 1 ? '✅ Pasa' : '❌ Fallo'}`);
    if (resB.count > 0) {
        const d = resB.defects[0];
        console.log(`    - Nombre: ${d.nombre}`);
        console.log(`    - Zona: ${d.zona}`);
        console.log(`    - Contraste: ${d.metricas.contraste} pts`);
        console.log(`    - Bounding Box:`, d.bbox);
    }

    // Caso C: Con calcinado en la boca/corona (X=200, Y=70)
    console.log('\nTest C: Botella con calcinado en boca/corona (X=200, Y=70)...');
    for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const idx = ((70 + dy) * w + (200 + dx)) * 4;
            data[idx] = 25; data[idx+1] = 25; data[idx+2] = 25; data[idx+3] = 255;
        }
    }

    const resC = detectFineDefects({ width: w, height: h, data }, datosPlomada);
    console.log(`  Resultado C: Total Detectados=${resC.count} (esperado >=2) -> ${resC.count >= 2 ? '✅ Pasa' : '❌ Fallo'}`);
    resC.defects.forEach((d, idx) => {
        console.log(`    [#${idx+1}] ${d.nombre} (${d.zona.toUpperCase()}) - Gravedad: ${d.gravedad}`);
    });

    console.log('\n🏁 Pruebas de fineDefects.js completadas.');
}

testFineDefects().catch(e => {
    console.error('❌ Error en test:', e);
    process.exit(1);
});
