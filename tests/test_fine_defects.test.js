// scratch/test_fine_defects.js — Pruebas unitarias para el detector de calcinados y defectos finos
import fs from 'fs';

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

    // Caso D: Filamento horizontal interno en cuerpo (Columpio en Cuerpo / Body Birdswing)
    console.log('\nTest D: Botella con filamento horizontal interno (Columpio en Cuerpo, Y=420, ancho=36px, alto=4px)...');
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -18; dx <= 18; dx++) {
            const idx = ((420 + dy) * w + (200 + dx)) * 4;
            data[idx] = 28; data[idx+1] = 28; data[idx+2] = 28; data[idx+3] = 255;
        }
    }
    const resD = detectFineDefects({ width: w, height: h, data }, datosPlomada);
    const hasBirdswing = resD.defects.some(d => d.id === 'columpio_cuerpo');
    console.log(`  Resultado D: Columpio en Cuerpo detectado=${hasBirdswing} -> ${hasBirdswing ? '✅ Pasa' : '❌ Fallo'}`);
    if (!hasBirdswing) throw new Error('No se clasificó morfológicamente columpio_cuerpo');

    // Caso E: Fisura vertical en cuerpo (Grieta / Fisura Térmica, X=170, Y=260..294)
    console.log('\nTest E: Botella con fisura longitudinal vertical (Grieta en Cuerpo, X=170, alto=34px, ancho=4px)...');
    for (let dy = -17; dy <= 17; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const idx = ((280 + dy) * w + (170 + dx)) * 4;
            data[idx] = 26; data[idx+1] = 26; data[idx+2] = 26; data[idx+3] = 255;
        }
    }
    const resE = detectFineDefects({ width: w, height: h, data }, datosPlomada);
    const hasCrack = resE.defects.some(d => d.id === 'grieta_cuerpo');
    console.log(`  Resultado E: Grieta en Cuerpo detectada=${hasCrack} -> ${hasCrack ? '✅ Pasa' : '❌ Fallo'}`);
    if (!hasCrack) throw new Error('No se clasificó morfológicamente grieta_cuerpo');

    // Caso F: Inmunidad a Brillos Especulares del Envase (Reflejo de luz blanca lum=250 junto a sombra de refracción lum=80 y vidrio sano lum=130)
    console.log('\nTest F: Botella limpia con franja de brillo especular intenso (lum=250) y halo de refracción (lum=80)...');
    const glareData = new Uint8ClampedArray(w * h * 4);
    glareData.fill(240);
    for (let row = 50; row < 550; row++) {
        let halfW = row < 150 ? 25 : (row < 230 ? Math.round(25 + (row - 150) * (35 / 80)) : 60);
        for (let col = 200 - halfW; col <= 200 + halfW; col++) {
            const idx = (row * w + col) * 4;
            // Vidrio ámbar sano lum=130
            let lum = 130;
            // Franja vertical de reflejo especular brillante (X=210..216, lum=250) y borde adyacente (X=206..209, lum=80)
            if (row > 180 && row < 480) {
                if (col >= 210 && col <= 216) lum = 250;
                else if (col >= 206 && col <= 209) lum = 80;
            }
            glareData[idx] = lum; glareData[idx+1] = lum; glareData[idx+2] = lum; glareData[idx+3] = 255;
        }
    }
    const resF = detectFineDefects({ width: w, height: h, data: glareData }, datosPlomada);
    console.log(`  Resultado F (Anti-Brillo): Falsos positivos=${resF.count} (esperado 0) -> ${resF.count === 0 ? '✅ Pasa' : '❌ Fallo'}`);
    if (resF.count !== 0) throw new Error(`Falso positivo por brillo especular detectado: ${resF.count}`);

    console.log('\n🏁 Pruebas de fineDefects.js completadas.');
}

testFineDefects().catch(e => {
    console.error('❌ Error en test:', e);
    process.exit(1);
});
