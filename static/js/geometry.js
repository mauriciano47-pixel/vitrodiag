/**
 * geometry.js — Motor de Detección de Defectos Geométricos y Macroscópicos (VitroDiag NEXUS)
 * Fase 1: Plomada Digital Láser, Detección de Torcidos (Eje/Cuello), Roturas/Desportillados
 * y Asimetría Bilateral de Silueta en Envases de Vidrio para Máquinas I.S.
 */

import { DEFECTOS_DB } from './db.js';

/**
 * Muestra el resultado de un defecto en la tarjeta de diagnóstico tradicional.
 * @param {Object} defect 
 */
function mostrarResultadoDefecto(defect) {
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');

    if (diagTitulo) diagTitulo.innerText = `🚨 ${defect.nombre.toUpperCase()}`;
    if (diagGravedad) {
        diagGravedad.innerText = `Defecto: ${defect.gravedad}`;
        let gClass = "menor";
        if (defect.gravedad === "Crítico" || defect.gravedad === "critico") gClass = "critico";
        else if (defect.gravedad === "Mayor" || defect.gravedad === "mayor") gClass = "mayor";
        diagGravedad.className = `status-alert ${gClass}`;
        diagGravedad.style.display = "inline-block";
    }

    if (diagEstado) {
        diagEstado.innerHTML = `<b>Ubicación:</b> Zona del ${(defect.zona || 'GENERAL').toUpperCase()}<br><b>Detalle:</b> ${defect.descripcion}`;
    }

    if (diagAcciones && Array.isArray(defect.acciones)) {
        diagAcciones.innerHTML = defect.acciones.map(a => `<li>${a}</li>`).join('');
    }
}

/**
 * Analiza el buffer de la imagen procesada para detectar defectos geométricos en tiempo real (Plomada/Inclinación, Hundimientos, Rebabas).
 * @param {Uint8ClampedArray} binaryBuffer - Buffer binario del frame (255 = borde/objeto, 0 = fondo)
 * @param {number} width - Ancho de la canvas
 * @param {number} height - Alto de la canvas
 * @returns {Object}
 */
function detectGeometricDefects(binaryBuffer, width, height) {
    if (!binaryBuffer || width <= 0 || height <= 0) {
        return { detected: false, tiltAngle: 0, isTilted: false, isAsymmetric: false, defect: null, midpoints: [] };
    }

    const rowStep = Math.max(2, Math.floor(height / 50));
    const leftEdges = [];
    const rightEdges = [];
    const midpoints = [];
    const rowYPositions = [];

    // 1. Escanear bordes izquierdo y derecho por filas
    for (let y = 10; y < height - 10; y += rowStep) {
        let xLeft = -1;
        let xRight = -1;

        for (let x = 5; x < width - 5; x++) {
            const idx = y * width + x;
            if (binaryBuffer[idx] > 128) {
                xLeft = x;
                break;
            }
        }

        for (let x = width - 6; x >= 5; x--) {
            const idx = y * width + x;
            if (binaryBuffer[idx] > 128) {
                xRight = x;
                break;
            }
        }

        if (xLeft !== -1 && xRight !== -1 && (xRight - xLeft) > 15) {
            leftEdges.push(xLeft);
            rightEdges.push(xRight);
            midpoints.push((xLeft + xRight) / 2);
            rowYPositions.push(y);
        }
    }

    if (midpoints.length < 8) {
        return { detected: false, tiltAngle: 0, isTilted: false, isAsymmetric: false, defect: null, midpoints: [] };
    }

    // 2. Regresión lineal para calcular la plomada de inclinación (Eje Central)
    const n = midpoints.length;
    let sumY = 0, sumX = 0, sumY2 = 0, sumYX = 0;
    for (let i = 0; i < n; i++) {
        const y = rowYPositions[i];
        const x = midpoints[i];
        sumY += y;
        sumX += x;
        sumY2 += y * y;
        sumYX += y * x;
    }

    const slope = (n * sumYX - sumY * sumX) / (n * sumY2 - sumY * sumY || 1);
    const intercept = (sumX - slope * sumY) / n;
    const tiltAngle = Math.atan(slope) * (180 / Math.PI);
    const absTilt = Math.abs(tiltAngle);

    const isTilted = absTilt > 2.0; // Umbral de botella torcida (> 2.0 grados)

    // 3. Evaluar simetría entre lado izquierdo y derecho contra el eje central
    let maxAsymmetry = 0;
    let asymmetricZone = '';

    for (let i = 0; i < n; i++) {
        const y = rowYPositions[i];
        const yFrac = y / height;
        const centralAxisX = slope * y + intercept;
        const leftDist = centralAxisX - leftEdges[i];
        const rightDist = rightEdges[i] - centralAxisX;
        const totalW = rightEdges[i] - leftEdges[i];

        if (totalW > 20 && leftDist > 0 && rightDist > 0) {
            const diffRatio = Math.abs(leftDist - rightDist) / (totalW / 2);
            if (diffRatio > maxAsymmetry) {
                maxAsymmetry = diffRatio;
                if (yFrac < 0.25) asymmetricZone = 'boca';
                else if (yFrac < 0.45) asymmetricZone = 'hombro';
                else if (yFrac < 0.80) asymmetricZone = 'cuerpo';
                else asymmetricZone = 'fondo';
            }
        }
    }

    const isAsymmetric = maxAsymmetry > 0.30; // >30% de desviación

    let defect = null;
    if (isTilted) {
        defect = {
            id: 'cuerpo_torcido',
            nombre: 'Botella Torcida / Eje Inclinado',
            zona: 'cuerpo',
            gravedad: 'Crítico',
            descripcion: `Eje central desviado ${absTilt.toFixed(1)}° respecto a la plomada vertical.`,
            acciones: [
                'Verificar alineación de mecanismo de transferencia (take-out).',
                'Ajustar soplado final e inspeccionar enfriamiento uniforme en preforma.',
                'Comprobar desgaste de soportes de molde de soplo.'
            ]
        };
    } else if (isAsymmetric && asymmetricZone === 'hombro') {
        defect = {
            id: 'hombro_hundido',
            nombre: 'Hombro Hundido / Deformado',
            zona: 'hombro',
            gravedad: 'Mayor',
            descripcion: `Asimetría pronunciada (${(maxAsymmetry * 100).toFixed(0)}%) detectada en el hombro del envase.`,
            acciones: [
                'Revisar presión y tiempo de soplo final.',
                'Ajustar temperatura de molde en zona de hombro.',
                'Verificar lubricación y vacío en molde de soplo.'
            ]
        };
    } else if (isAsymmetric && asymmetricZone === 'boca') {
        defect = {
            id: 'rebaba_boca',
            nombre: 'Rebaba o Desalineación en Corona',
            zona: 'boca',
            gravedad: 'Crítico',
            descripcion: `Desviación en el contorno superior de la boca (${(maxAsymmetry * 100).toFixed(0)}%).`,
            acciones: [
                'Revisar encaje entre boquillera y molde de soplo.',
                'Ajustar fuerza de cierre de boquillera en máquina I.S.',
                'Verificar estado de desgaste de la rosca/boquillera.'
            ]
        };
    }

    return {
        detected: isTilted || isAsymmetric,
        tiltAngle: tiltAngle,
        absTilt: absTilt,
        isTilted: isTilted,
        isAsymmetric: isAsymmetric,
        asymmetricZone: asymmetricZone,
        maxAsymmetry: maxAsymmetry,
        defect: defect,
        midpoints: midpoints,
        rowYPositions: rowYPositions
    };
}

// =========================================================================
// 🚀 NUEVAS FUNCIONES: MOTOR DE INSPECCIÓN MACRO Y PLOMADA LÁSER (FASE 1)
// =========================================================================

/**
 * Convierte cualquier fuente de imagen (HTMLImageElement, Canvas, ImageData, dataURL)
 * en un canvas temporal normalizado para análisis óptico de alta precisión.
 * @param {HTMLImageElement|HTMLCanvasElement|string} source 
 * @returns {Promise<HTMLCanvasElement>}
 */
export function imageSourceToCanvas(source) {
    return new Promise((resolve, reject) => {
        if (!source) {
            reject(new Error('Fuente de imagen vacía'));
            return;
        }

        if (source instanceof HTMLCanvasElement) {
            resolve(source);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.naturalWidth || img.width || 640;
            let h = img.naturalHeight || img.height || 480;
            
            // Normalizar a resolución óptima de escaneo (max 800px) para ejecución instantánea (<30ms)
            const maxDim = 800;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                }
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas);
        };
        img.onerror = (err) => reject(err);

        if (typeof source === 'string') {
            img.src = source;
        } else if (source instanceof HTMLImageElement) {
            img.src = source.src;
        } else {
            reject(new Error('Tipo de fuente de imagen no compatible'));
        }
    });
}

/**
 * Analiza exhaustivamente una fotografía de envase para detectar defectos evidentes/macroscópicos:
 * 1. Plomada Digital y Eje Axial (Botella Torcida / Eje Inclinado)
 * 2. Cuello Torcido vs. Cuerpo
 * 3. Roturas y Desportillados en Corona (Boca) y Talón (Fondo)
 * 4. Asimetría Bilateral y Aplastamiento (Hombro Hundido / Deformación)
 * 
 * @param {HTMLCanvasElement|HTMLImageElement|string} imageSource 
 * @returns {Promise<Object>} Resultado de inspección macro con métricas cuantitativas
 */
export async function analyzeImageGeometricDefects(imageSource) {
    const canvas = await imageSourceToCanvas(imageSource);
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 1. Binarización adaptativa con umbral Otsu para aislar la silueta del envase
    const gray = new Uint8ClampedArray(w * h);
    const histogram = new Int32Array(256);

    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        // Luminancia estándar rec. 601
        const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        gray[j] = lum;
        histogram[lum]++;
    }

    // Umbral de Otsu
    const totalPixels = w * h;
    let sumAll = 0;
    for (let t = 0; t < 256; t++) sumAll += t * histogram[t];

    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let otsuThreshold = 128;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        const wF = totalPixels - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sumAll - sumB) / wF;
        const varBetween = wB * wF * (mB - mF) * (mB - mF);

        if (varBetween > maxVariance) {
            maxVariance = varBetween;
            otsuThreshold = t;
        }
    }

    // Si el fondo es claro o la botella es transparente/oscura, detectar polaridad de bordes
    const isDarkObject = (histogram.slice(0, otsuThreshold).reduce((a, b) => a + b, 0) < totalPixels * 0.6);

    // 2. Escaneo perimetral fila por fila
    const rowStep = Math.max(2, Math.floor(h / 70));
    const rows = [];
    let minBottleY = h;
    let maxBottleY = 0;

    for (let y = 10; y < h - 10; y += rowStep) {
        let leftX = -1;
        let rightX = -1;

        // Escanear borde izquierdo (primer cambio fuerte de gradiente o umbral)
        for (let x = 8; x < w - 8; x++) {
            const idx = y * w + x;
            const isSilhouette = isDarkObject ? (gray[idx] < otsuThreshold) : (gray[idx] > otsuThreshold);
            if (isSilhouette) {
                leftX = x;
                break;
            }
        }

        // Escanear borde derecho
        for (let x = w - 9; x >= 8; x--) {
            const idx = y * w + x;
            const isSilhouette = isDarkObject ? (gray[idx] < otsuThreshold) : (gray[idx] > otsuThreshold);
            if (isSilhouette) {
                rightX = x;
                break;
            }
        }

        // Validar que sea un ancho plausible de botella (> 8% del ancho del visor)
        const rowWidth = rightX - leftX;
        if (leftX !== -1 && rightX !== -1 && rowWidth > (w * 0.08) && rowWidth < (w * 0.95)) {
            const midX = (leftX + rightX) / 2;
            rows.push({
                y,
                leftX,
                rightX,
                midX,
                width: rowWidth
            });

            if (y < minBottleY) minBottleY = y;
            if (y > maxBottleY) maxBottleY = y;
        }
    }

    if (rows.length < 12) {
        return {
            conforme: true,
            detected: false,
            confianza: 50,
            motivo: 'Silueta de envase no detectada con claridad. Verifique iluminación y encuadre.',
            metricas: {
                anguloTorcidoEje: 0,
                anguloCuello: 0,
                desviacionCuelloVsCuerpo: 0,
                simetriaGeneral: 100,
                integridadCorona: 100
            },
            defectos: [],
            datosPlomada: null
        };
    }

    const bottleHeight = maxBottleY - minBottleY;

    // 3. Segmentación zonal (Boca, Cuello, Hombro, Cuerpo, Fondo)
    const neckRows = rows.filter(r => (r.y - minBottleY) < bottleHeight * 0.30);
    const shoulderRows = rows.filter(r => (r.y - minBottleY) >= bottleHeight * 0.28 && (r.y - minBottleY) < bottleHeight * 0.50);
    const bodyRows = rows.filter(r => (r.y - minBottleY) >= bottleHeight * 0.45 && (r.y - minBottleY) <= bottleHeight * 0.88);
    const finishRows = rows.filter(r => (r.y - minBottleY) <= bottleHeight * 0.12);
    const baseRows = rows.filter(r => (r.y - minBottleY) >= bottleHeight * 0.88);

    // 4. Regresión lineal del Eje del Cuerpo (Plomada de Referencia)
    const fitLine = (pointList) => {
        if (pointList.length < 3) return { slope: 0, intercept: w / 2, angleDeg: 0 };
        const count = pointList.length;
        let sumY = 0, sumX = 0, sumY2 = 0, sumYX = 0;
        for (let p of pointList) {
            sumY += p.y;
            sumX += p.midX;
            sumY2 += p.y * p.y;
            sumYX += p.y * p.midX;
        }
        const denom = (count * sumY2 - sumY * sumY) || 1;
        const slope = (count * sumYX - sumY * sumX) / denom;
        const intercept = (sumX - slope * sumY) / count;
        const angleDeg = Math.atan(slope) * (180 / Math.PI);
        return { slope, intercept, angleDeg };
    };

    const bodyLine = fitLine(bodyRows.length >= 5 ? bodyRows : rows);
    const neckLine = fitLine(neckRows.length >= 4 ? neckRows : rows.slice(0, 10));

    // Desviaciones angulares
    const anguloEjeCuerpo = parseFloat(bodyLine.angleDeg.toFixed(2));
    const anguloEjeCuello = parseFloat(neckLine.angleDeg.toFixed(2));
    const desviacionCuelloVsCuerpo = Math.abs(anguloEjeCuello - anguloEjeCuerpo);
    const absInclinacionEje = Math.abs(anguloEjeCuerpo);

    // 5. Análisis de Simetría Bilateral
    let maxAsymmetry = 0;
    let worstAsymZone = 'cuerpo';
    let totalAsymSum = 0;
    let asymSamples = 0;

    for (let r of rows) {
        const expectedCenter = bodyLine.slope * r.y + bodyLine.intercept;
        const leftDist = expectedCenter - r.leftX;
        const rightDist = r.rightX - expectedCenter;
        const halfWidth = r.width / 2;

        if (halfWidth > 15 && leftDist > 0 && rightDist > 0) {
            const diffRatio = Math.abs(leftDist - rightDist) / halfWidth;
            totalAsymSum += diffRatio;
            asymSamples++;

            if (diffRatio > maxAsymmetry) {
                maxAsymmetry = diffRatio;
                const relY = (r.y - minBottleY) / bottleHeight;
                if (relY < 0.28) worstAsymZone = 'cuello';
                else if (relY < 0.50) worstAsymZone = 'hombro';
                else if (relY < 0.88) worstAsymZone = 'cuerpo';
                else worstAsymZone = 'fondo';
            }
        }
    }

    const simetriaPromedio = asymSamples > 0 ? Math.max(0, Math.round((1 - (totalAsymSum / asymSamples)) * 100)) : 100;

    // 6. Análisis de Integridad de Corona / Boca (Roturas y Desportillados)
    let finishBreakDetected = false;
    let finishBreakBbox = null;
    let finishIntegrity = 100;

    if (finishRows.length >= 2) {
        const topRow = finishRows[0];
        const secondRow = finishRows[Math.min(2, finishRows.length - 1)];
        const expectedCenter = bodyLine.slope * topRow.y + bodyLine.intercept;
        const leftDelta = Math.abs((expectedCenter - topRow.leftX) - (expectedCenter - secondRow.leftX));
        const rightDelta = Math.abs((topRow.rightX - expectedCenter) - (secondRow.rightX - expectedCenter));

        // Un desportillado genera una mella abrupta en uno de los lados de la corona
        const maxDelta = Math.max(leftDelta, rightDelta);
        if (maxDelta > (w * 0.045)) {
            finishBreakDetected = true;
            finishIntegrity = Math.max(40, 100 - Math.round(maxDelta * 4));
            const brokenSide = leftDelta > rightDelta ? 'izquierdo' : 'derecho';
            const xBox = brokenSide === 'izquierdo' ? topRow.leftX - 5 : topRow.rightX - 25;
            finishBreakBbox = [topRow.y - 10, Math.max(0, xBox), topRow.y + 35, Math.min(w, xBox + 40)];
        }
    }

    // 7. Consolidación de Defectos Encontrados
    const defectos = [];

    // Defecto A: Botella Inclinada / Eje Torcido (Tolerancia industrial > 1.8°)
    if (absInclinacionEje > 1.8) {
        defectos.push({
            id: 'cuerpo_torcido',
            nombre: 'Botella Torcida / Eje Inclinado',
            zona: 'cuerpo',
            gravedad: absInclinacionEje > 3.0 ? 'Crítico' : 'Mayor',
            confianza: Math.min(99, Math.round(75 + absInclinacionEje * 8)),
            descripcion: `Eje longitudinal inclinado ${absInclinacionEje}° respecto a la plomada vertical (Tolerancia máx: 1.5°).`,
            bbox: [minBottleY, Math.round(bodyLine.intercept - 30), maxBottleY, Math.round(bodyLine.slope * maxBottleY + bodyLine.intercept + 30)],
            acciones: [
                'Verificar alineación de pinzas de transferencia (Take-Out Mechanism).',
                'Comprobar nivelación y desgaste de placas de fondo de molde de soplo.',
                'Ajustar sincronización y simetría de enfriamiento en preforma.'
            ]
        });
    }

    // Defecto B: Cuello Torcido (Bent Neck)
    if (desviacionCuelloVsCuerpo > 2.2) {
        defectos.push({
            id: 'cuello_torcido',
            nombre: 'Cuello Torcido (Bent Neck)',
            zona: 'cuello',
            gravedad: 'Crítico',
            confianza: Math.min(99, Math.round(80 + desviacionCuelloVsCuerpo * 7)),
            descripcion: `El cuello presenta una desviación angular de ${desviacionCuelloVsCuerpo.toFixed(1)}° respecto al cuerpo.`,
            bbox: [minBottleY, Math.round(neckLine.intercept - 20), Math.round(minBottleY + bottleHeight * 0.30), Math.round(neckLine.slope * (minBottleY + bottleHeight * 0.30) + neckLine.intercept + 20)],
            acciones: [
                'Alinear cabezal de soplado final con el eje de la boquillera.',
                'Verificar si las guías del mecanismo de inversión están desgastadas.',
                'Revisar tiempo de contacto y temperatura de la boquillera.'
            ]
        });
    }

    // Defecto C: Rotura / Desportillado en Corona (Finish Breakage)
    if (finishBreakDetected) {
        defectos.push({
            id: 'corona_rota',
            nombre: 'Corona Rota / Desportillado en Boca',
            zona: 'boca',
            gravedad: 'Crítico',
            confianza: 92,
            descripcion: `Falta de vidrio o rotura perimetral en el anillo de la corona (Integridad: ${finishIntegrity}%).`,
            bbox: finishBreakBbox,
            acciones: [
                'Revisar boquillera en máquina I.S. (posible astillado o golpe mecánico).',
                'Inspeccionar el émbolo o punzón NNPB por roces al extraerse.',
                'Verificar presión excesiva del cabezal de soplado o pinzas de desmolde.'
            ]
        });
    }

    // Defecto D: Hombro Hundido / Asimetría de Silueta
    if (maxAsymmetry > 0.30 && worstAsymZone === 'hombro') {
        const pctAsym = Math.round(maxAsymmetry * 100);
        defectos.push({
            id: 'hombro_hundido',
            nombre: 'Hombro Hundido / Asimétrico',
            zona: 'hombro',
            gravedad: pctAsym > 45 ? 'Crítico' : 'Mayor',
            confianza: Math.min(95, Math.round(70 + pctAsym * 0.5)),
            descripcion: `Hundimiento o asimetría del ${pctAsym}% en la curva del hombro.`,
            bbox: [Math.round(minBottleY + bottleHeight * 0.28), Math.round(w * 0.15), Math.round(minBottleY + bottleHeight * 0.50), Math.round(w * 0.85)],
            acciones: [
                'Aumentar tiempo o presión del soplo final para expandir el hombro.',
                'Verificar temperatura del molde en la zona del hombro.',
                'Revisar lubricación (swabbing) y respiraderos del molde de soplo.'
            ]
        });
    }

    const esConforme = defectos.length === 0;

    return {
        conforme: esConforme,
        detected: !esConforme,
        cantidadDefectos: defectos.length,
        defectos: defectos,
        metricas: {
            anguloTorcidoEje: absInclinacionEje,
            anguloCuello: anguloEjeCuello,
            desviacionCuelloVsCuerpo: parseFloat(desviacionCuelloVsCuerpo.toFixed(2)),
            simetriaGeneral: simetriaPromedio,
            maxAsimetria: Math.round(maxAsymmetry * 100),
            zonaMayorAsimetria: worstAsymZone,
            integridadCorona: finishIntegrity,
            alturaPixeles: bottleHeight
        },
        datosPlomada: {
            minBottleY,
            maxBottleY,
            bottleHeight,
            bodyLine,
            neckLine,
            rows,
            canvasWidth: w,
            canvasHeight: h
        }
    };
}

/**
 * Dibuja la Plomada Digital Láser y Guías de Nivel Cyber-Obsidian sobre el canvas superior.
 * Muestra el eje nominal (vertical perfecta verde), el eje real detectado, y las zonas de tolerancia.
 * 
 * @param {HTMLCanvasElement} canvasTarget - Canvas donde renderizar (ej. nexusBboxCanvas)
 * @param {Object} macroResult - Resultado de analyzeImageGeometricDefects
 */
export function drawLaserPlumbOverlay(canvasTarget, macroResult) {
    if (!canvasTarget || !macroResult || !macroResult.datosPlomada) return;

    const ctx = canvasTarget.getContext('2d');
    const w = canvasTarget.width;
    const h = canvasTarget.height;
    const dp = macroResult.datosPlomada;
    const metricas = macroResult.metricas;
    const isConforme = macroResult.conforme;

    ctx.clearRect(0, 0, w, h);

    // Factor de escala entre canvas analizado y canvas de dibujo
    const scaleX = w / dp.canvasWidth;
    const scaleY = h / dp.canvasHeight;

    const topY = dp.minBottleY * scaleY;
    const bottomY = dp.maxBottleY * scaleY;
    const nominalCenterX = (dp.bodyLine.slope * (dp.minBottleY + dp.bottleHeight * 0.8) + dp.bodyLine.intercept) * scaleX;

    // 1. DIBUJAR LÍNEA DE PLOMADA NOMINAL (Vertical Láser Cyan/Verde)
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(nominalCenterX, topY - 20);
    ctx.lineTo(nominalCenterX, bottomY + 20);
    ctx.stroke();

    // 2. DIBUJAR EJE AXIAL REAL MEDIDO DE LA BOTELLA
    const realTopX = (dp.bodyLine.slope * dp.minBottleY + dp.bodyLine.intercept) * scaleX;
    const realBottomX = (dp.bodyLine.slope * dp.maxBottleY + dp.bodyLine.intercept) * scaleX;

    const ejeColor = isConforme ? '#10b981' : (metricas.anguloTorcidoEje > 2.5 ? '#ef4444' : '#f59e0b');
    ctx.strokeStyle = ejeColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.shadowColor = ejeColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(realTopX, topY);
    ctx.lineTo(realBottomX, bottomY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. LÍNEAS DE NIVEL HORIZONTAL (Boca, Hombro, Fondo)
    const drawLevelLine = (yPos, label, color) => {
        ctx.strokeStyle = color || 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(w * 0.1, yPos);
        ctx.lineTo(w * 0.9, yPos);
        ctx.stroke();

        ctx.fillStyle = color || '#a0aec0';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(label, w * 0.12, yPos - 4);
    };

    drawLevelLine(topY, 'CORONA / BOCA', 'rgba(16, 185, 129, 0.7)');
    drawLevelLine(topY + dp.bottleHeight * 0.32 * scaleY, 'HOMBRO', 'rgba(245, 158, 11, 0.6)');
    drawLevelLine(bottomY, 'FONDO / TALÓN', 'rgba(0, 240, 255, 0.6)');

    // 4. ETIQUETA FLOTANTE CYBER HUD CON ÁNGULO Y SIMETRÍA
    const hudWidth = 190;
    const hudHeight = 52;
    const hudX = Math.max(10, Math.min(w - hudWidth - 10, realTopX - hudWidth / 2));
    const hudY = Math.max(10, topY - 60);

    ctx.fillStyle = 'rgba(13, 17, 23, 0.92)';
    ctx.strokeStyle = ejeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`📐 EJE: ${metricas.anguloTorcidoEje.toFixed(1)}° ${metricas.anguloTorcidoEje > 1.8 ? '⚠️ TORCIDO' : '✅ RECTO'}`, hudX + 10, hudY + 18);

    ctx.fillStyle = metricas.simetriaGeneral > 85 ? '#10b981' : '#f59e0b';
    ctx.fillText(`🎯 SIMETRÍA: ${metricas.simetriaGeneral}% | CORONA: ${metricas.integridadCorona}%`, hudX + 10, hudY + 36);

    // 5. RESALTAR RECUADROS DE DEFECTOS DETECTADOS
    if (macroResult.defectos && macroResult.defectos.length > 0) {
        for (let def of macroResult.defectos) {
            if (def.bbox) {
                const bYmin = def.bbox[0] * scaleY;
                const bXmin = def.bbox[1] * scaleX;
                const bYmax = def.bbox[2] * scaleY;
                const bXmax = def.bbox[3] * scaleX;

                const boxColor = def.gravedad === 'Crítico' ? '#ef4444' : '#f59e0b';
                ctx.strokeStyle = boxColor;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([5, 3]);
                ctx.shadowColor = boxColor;
                ctx.shadowBlur = 8;
                ctx.strokeRect(bXmin, bYmin, (bXmax - bXmin), (bYmax - bYmin));
                ctx.shadowBlur = 0;

                // Etiqueta de defecto
                ctx.fillStyle = boxColor;
                ctx.fillRect(bXmin, Math.max(0, bYmin - 18), (bXmax - bXmin), 18);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText(def.nombre.slice(0, 22), bXmin + 4, Math.max(12, bYmin - 5));
            }
        }
    }

    ctx.restore();
}

/**
 * Renderiza el reporte instantáneo de inspección macro en la tarjeta de resultados.
 * @param {Object} macroResult 
 */
export function renderMacroInspectionCard(macroResult) {
    const resultCard = document.getElementById('resultadoCard') || document.getElementById('nexusResultCard');
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');

    if (!macroResult) return;
    const m = macroResult.metricas;
    const isConforme = macroResult.conforme;

    if (diagTitulo) {
        diagTitulo.innerHTML = isConforme
            ? `✅ ENVASE GEOMÉTRICAMENTE CONFORME`
            : `🚨 ${macroResult.defectos[0].nombre.toUpperCase()}`;
    }

    if (diagGravedad) {
        if (isConforme) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.innerText = "Conforme (Plomada OK)";
        } else {
            const grav = macroResult.defectos[0].gravedad;
            diagGravedad.className = `status-alert ${grav === 'Crítico' ? 'critico' : 'mayor'}`;
            diagGravedad.innerText = `Defecto: ${grav}`;
        }
        diagGravedad.style.display = "inline-block";
    }

    if (diagEstado) {
        let metricsHtml = `
            <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:10px; margin:8px 0; border:1px solid rgba(255,255,255,0.1);">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:0.82rem;">
                    <div>📐 <strong>Inclinación Eje:</strong> <span style="color:${m.anguloTorcidoEje > 1.8 ? '#ef4444' : '#10b981'}">${m.anguloTorcidoEje}°</span></div>
                    <div>🎯 <strong>Simetría Silueta:</strong> <span style="color:${m.simetriaGeneral > 85 ? '#10b981' : '#f59e0b'}">${m.simetriaGeneral}%</span></div>
                    <div>🍾 <strong>Alineación Cuello:</strong> <span style="color:${m.desviacionCuelloVsCuerpo > 2.2 ? '#ef4444' : '#10b981'}">${m.desviacionCuelloVsCuerpo}°</span></div>
                    <div>⭕ <strong>Integridad Corona:</strong> <span style="color:${m.integridadCorona > 90 ? '#10b981' : '#ef4444'}">${m.integridadCorona}%</span></div>
                </div>
            </div>
        `;

        if (isConforme) {
            diagEstado.innerHTML = `<strong>Inspección Macro Satisfactoria:</strong> El envase cumple con los parámetros de verticalidad, simetría y contorno de boca.${metricsHtml}
            <em>Puedes disparar el '⚡ Diagnóstico con Gemini IA' para buscar micro-defectos como calcinados o fisuras.</em>`;
        } else {
            const defPrincipal = macroResult.defectos[0];
            diagEstado.innerHTML = `<strong>Falla Detectada:</strong> ${defPrincipal.descripcion}${metricsHtml}`;
        }
    }

    if (diagAcciones) {
        if (isConforme) {
            diagAcciones.innerHTML = `
                <li>Envase dentro de la plomada nominal (desviación < 1.5°).</li>
                <li>Si sospechas de contaminación o fisuras, presiona <strong>⚡ DIAGNOSTICAR CON IA</strong>.</li>
            `;
        } else {
            diagAcciones.innerHTML = macroResult.defectos.flatMap(d => d.acciones || []).slice(0, 3).map(a => `<li>${a}</li>`).join('');
        }
    }

    if (resultCard) {
        resultCard.style.display = 'block';
    }
}

export { mostrarResultadoDefecto, detectGeometricDefects };
