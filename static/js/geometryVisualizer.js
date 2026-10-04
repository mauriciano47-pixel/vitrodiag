// Visualizador y Renderizado Gráfico de Plomada Digital Láser (VitroDiag Geometry Visualizer)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
import { setSafeHTML } from './domUtils.js';

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

    const scaleX = (dp.canvasWidth && dp.canvasWidth > 0) ? (w / dp.canvasWidth) : 1;
    const scaleY = (dp.canvasHeight && dp.canvasHeight > 0) ? (h / dp.canvasHeight) : 1;

    const topY = dp.minBottleY * scaleY;
    const bottomY = dp.maxBottleY * scaleY;
    const nominalCenterX = (dp.bodyLine.slope * (dp.minBottleY + dp.bottleHeight * 0.8) + dp.bodyLine.intercept) * scaleX;

    // 1. DIBUJAR LÍNEA DE PLOMADA NOMINAL
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(nominalCenterX, topY - 20);
    ctx.lineTo(nominalCenterX, bottomY + 20);
    ctx.stroke();

    // 2. DIBUJAR EJE AXIAL REAL MEDIDO
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

    // 3. LÍNEAS DE NIVEL HORIZONTAL
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

    // 4. ETIQUETA FLOTANTE HUD
    const hudWidth = 190;
    const hudHeight = 52;
    const hudX = Math.max(10, Math.min(w - hudWidth - 10, realTopX - hudWidth / 2));
    const hudY = Math.max(10, topY - 60);

    ctx.fillStyle = 'rgba(13, 17, 23, 0.92)';
    ctx.strokeStyle = ejeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 8);
    } else {
        const r = 8;
        ctx.moveTo(hudX + r, hudY);
        ctx.lineTo(hudX + hudWidth - r, hudY);
        ctx.arcTo(hudX + hudWidth, hudY, hudX + hudWidth, hudY + r, r);
        ctx.lineTo(hudX + hudWidth, hudY + hudHeight - r);
        ctx.arcTo(hudX + hudWidth, hudY + hudHeight, hudX + hudWidth - r, hudY + hudHeight, r);
        ctx.lineTo(hudX + r, hudY + hudHeight);
        ctx.arcTo(hudX, hudY + hudHeight, hudX, hudY + hudHeight - r, r);
        ctx.lineTo(hudX, hudY + r);
        ctx.arcTo(hudX, hudY, hudX + r, hudY, r);
    }
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
        if (isConforme) {
            diagTitulo.textContent = "✅ ENVASE GEOMÉTRICAMENTE CONFORME";
        } else {
            const count = macroResult.defectos.length;
            const extra = count > 1 ? ` (+${count - 1} DEFECTO${count > 2 ? 'S' : ''})` : '';
            diagTitulo.textContent = `🚨 ${macroResult.defectos[0].nombre.toUpperCase()}${extra}`;
        }
    }

    if (diagGravedad) {
        if (isConforme) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.innerText = "Conforme (Plomada y Textura OK)";
        } else {
            const hasCritico = macroResult.defectos.some(d => d.gravedad === 'Crítico');
            diagGravedad.className = `status-alert ${hasCritico ? 'critico' : 'mayor'}`;
            diagGravedad.innerText = `Defecto: ${hasCritico ? 'Crítico' : 'Mayor'} (${macroResult.defectos.length} fallo${macroResult.defectos.length > 1 ? 's' : ''})`;
        }
        diagGravedad.style.display = "inline-block";
    }

    if (diagEstado) {
        const calcinadosCount = macroResult.calcinados?.count || 0;
        let metricsHtml = `
            <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:10px; margin:8px 0; border:1px solid rgba(255,255,255,0.1);">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:0.82rem;">
                    <div>📐 <strong>Inclinación Eje:</strong> <span style="color:${m.anguloTorcidoEje > 1.8 ? '#ef4444' : '#10b981'}">${m.anguloTorcidoEje}°</span></div>
                    <div>🎯 <strong>Simetría Silueta:</strong> <span style="color:${m.simetriaGeneral > 85 ? '#10b981' : '#f59e0b'}">${m.simetriaGeneral}%</span></div>
                    <div>🍾 <strong>Alineación Cuello:</strong> <span style="color:${m.desviacionCuelloVsCuerpo > 2.2 ? '#ef4444' : '#10b981'}">${m.desviacionCuelloVsCuerpo}°</span></div>
                    <div>⭕ <strong>Integridad Corona:</strong> <span style="color:${m.integridadCorona > 90 ? '#10b981' : '#ef4444'}">${m.integridadCorona}%</span></div>
                    ${calcinadosCount > 0 ? `<div style="grid-column: 1 / -1; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.15);">⚫ <strong>Calcinados / Puntos de Grafito:</strong> <span style="color:#f59e0b; font-weight:bold;">${calcinadosCount} detectado(s)</span></div>` : ''}
                </div>
            </div>
        `;

        if (isConforme) {
            setSafeHTML(diagEstado, `<strong>Inspección Macro y Textural Satisfactoria:</strong> El envase cumple con los parámetros de verticalidad, simetría, contorno de boca y ausencia de calcinados.${metricsHtml}
            <em>Puedes disparar el '⚡ Diagnóstico con Gemini IA' para un análisis multimodal profundo con Few-Shot RAG.</em>`);
        } else {
            let defectsListHtml = macroResult.defectos.map((d, idx) => `
                <div style="margin-top:6px; padding:8px; background:rgba(0,0,0,0.3); border-left:3px solid ${d.gravedad === 'Crítico' ? '#ef4444' : '#f59e0b'}; border-radius:4px; font-size:0.8rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>#${idx + 1} [${d.zona.toUpperCase()}] ${d.nombre}</strong>
                        <span style="font-size:0.7rem; color:${d.gravedad === 'Crítico' ? '#ef4444' : '#f59e0b'}; font-weight:bold;">${d.gravedad}</span>
                    </div>
                    <div style="margin-top:2px; color:var(--text-muted);">${d.descripcion}</div>
                    <div style="margin-top:6px; display:flex; gap:6px;">
                        <button onclick="if(window.nexusSaveToDataset) window.nexusSaveToDataset('${d.id}', '${d.nombre.replace(/'/g, "\\'")}');" style="background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#10b981; font-size:0.72rem; padding:3px 8px; border-radius:4px; cursor:pointer;" title="Guardar esta foto en el banco IA con esta etiqueta para entrenar a Gemini">
                            🏷️ Alimentar a Banco IA
                        </button>
                    </div>
                </div>
            `).join('');

            setSafeHTML(diagEstado, `<strong>Fallas Detectadas (${macroResult.defectos.length}):</strong>${defectsListHtml}${metricsHtml}`);
        }
    }

    if (diagAcciones) {
        if (isConforme) {
            setSafeHTML(diagAcciones, `
                <li>Envase dentro de la plomada nominal (desviación < 1.5°).</li>
                <li>Ausencia de calcinados o inclusiones visibles.</li>
                <li>Si sospechas de micro-fisuras internas, presiona <strong>⚡ DIAGNOSTICAR CON IA</strong>.</li>
            `);
        } else {
            setSafeHTML(diagAcciones, macroResult.defectos.flatMap(d => d.acciones || []).slice(0, 4).map(a => `<li>${a}</li>`).join(''));
        }
    }

    if (resultCard) {
        resultCard.style.display = 'block';
    }
}
