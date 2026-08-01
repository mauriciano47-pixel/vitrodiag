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
 * @returns {Object} { detected: boolean, tiltAngle: number, isTilted: boolean, isAsymmetric: boolean, defect: Object|null, midpoints: Array }
 */
function detectGeometricDefects(binaryBuffer, width, height) {
    if (!binaryBuffer || width <= 0 || height <= 0) {
        return { detected: false, tiltAngle: 0, isTilted: false, isAsymmetric: false, defect: null, midpoints: [] };
    }

    const rowStep = Math.max(2, Math.floor(height / 40));
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
    // Ángulo en grados respecto a la vertical
    const tiltAngle = Math.atan(slope) * (180 / Math.PI);
    const absTilt = Math.abs(tiltAngle);

    const isTilted = absTilt > 3.0; // Umbral de botella torcida/inclinada (> 3 grados)

    // 3. Evaluar simetría entre lado izquierdo y derecho (Hombro / Cuerpo Hundido)
    let maxAsymmetry = 0;
    let asymmetricZone = '';

    for (let i = 0; i < n; i++) {
        const yFrac = rowYPositions[i] / height;
        const leftDist = midpoints[i] - leftEdges[i];
        const rightDist = rightEdges[i] - midpoints[i];
        const totalW = leftDist + rightDist;

        if (totalW > 20) {
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

    const isAsymmetric = maxAsymmetry > 0.35; // >35% de desviación especular

    // 4. Determinar si existe defecto geométrico claro
    let defect = null;

    if (isTilted) {
        defect = {
            id: 'cuerpo_torcido',
            nombre: 'Botella Torcida / Eje Inclinado',
            zona: 'cuerpo',
            gravedad: 'Crítico',
            descripcion: `Eje central inclinado ${absTilt.toFixed(1)}° respecto a la vertical nominal.`,
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
            nombre: 'Rebaba o Proyección Asimétrica en Corona',
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

export { mostrarResultadoDefecto, detectGeometricDefects };

