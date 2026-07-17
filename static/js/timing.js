import { state } from './state.js';
import { DEFECTOS_DB } from './db.js';

function calculateSopMs() {
            // Adaptador para mantener compatibilidad con otras llamadas externas
            validateBdfTiming();
        }

function validateBdfTiming() {
            const bpm = parseFloat(document.getElementById('calcBpm').value) || 396;
            const sections = parseInt(document.getElementById('calcSections').value) || 11;
            const cavity = parseInt(document.getElementById('calcCavities').value) || 3;

            // FÓRMULA DE RELACIÓN: CPM de sección = BPM / (Secciones * Cavidades)
            const cpmSec = (bpm > 0) ? (bpm / (sections * cavity)) : 0;
            // CPM de cizalla = BPM / Cavidades
            const cpmShear = (bpm > 0) ? (bpm / cavity) : 0;

            // Duración del ciclo completo de 360° en milisegundos
            const cycleMs = (cpmSec > 0) ? ((60 / cpmSec) * 1000) : 0;
            const msPerDeg = cycleMs / 360;

            // Actualizar información superior del ciclo
            const cycleDisplay = document.getElementById('cycleTimeDisplay');
            if (cycleDisplay) {
                cycleDisplay.innerText = `Ciclo: ${cycleMs.toFixed(0)} ms | Cizalla: ${cpmShear.toFixed(0)} CPM`;
            }

            // Capturar entradas de grados
            const plungerUp = parseFloat(document.getElementById('valPlungerUp').value) || 0;
            const plungerDown = parseFloat(document.getElementById('valPlungerDown').value) || 0;
            const blankOpen = parseFloat(document.getElementById('valBlankOpen').value) || 0;
            const invertStart = parseFloat(document.getElementById('valInvertStart').value) || 0;
            const blowClose = parseFloat(document.getElementById('valBlowClose').value) || 0;
            const neckOpen = parseFloat(document.getElementById('valNeckOpen').value) || 0;
            const blowOn = parseFloat(document.getElementById('valBlowOn').value) || 0;
            const blowOff = parseFloat(document.getElementById('valBlowOff').value) || 0;

            const resultsContainer = document.getElementById('bdfValidationResults');
            if (!resultsContainer) return;

            let html = "";

            // Auxiliar para diferencia de grados con wrap-around de 360°
            function getDegDiff(start, end) {
                if (end >= start) return end - start;
                return (360 - start) + end;
            }

            // 1. Duración del Prensado del Macho (Plunger Dwell en grados)
            const plungerDwellDeg = getDegDiff(plungerUp, plungerDown);
            let plungerClass = "success";
            let plungerIcon = "🟢";
            let plungerMsg = `Prensado Macho (Dwell): ${plungerDwellDeg.toFixed(0)}°. Rango óptimo en grados: de 60° a 80° para NNPB.`;

            if (plungerDwellDeg < 60) {
                plungerClass = "warning";
                plungerIcon = "⚠️";
                plungerMsg = `Prensado Macho (Dwell) insuficiente: ${plungerDwellDeg.toFixed(0)}°. Recomendado mínimo 60° en NNPB para evitar bajo boca.`;
            } else if (plungerDwellDeg > 80) {
                plungerClass = "warning";
                plungerIcon = "⚠️";
                plungerMsg = `Prensado Macho (Dwell) excesivo: ${plungerDwellDeg.toFixed(0)}°. Recomendado máximo 80° para evitar enfriamiento excesivo del macho.`;
            }
            html += `
                <div class="validation-alert ${plungerClass}">
                    <span class="validation-alert-icon">${plungerIcon}</span>
                    <span>${plungerMsg}</span>
                </div>
            `;

            // 2. Duración del Soplado Final (en grados)
            const blowDwellDeg = getDegDiff(blowOn, blowOff);
            let blowClass = "success";
            let blowIcon = "🟢";
            let blowMsg = `Soplado Final: ${blowDwellDeg.toFixed(0)}°. Rango óptimo: de 50° a 70° del ciclo.`;

            if (blowDwellDeg < 50) {
                blowClass = "warning";
                blowIcon = "⚠️";
                blowMsg = `Soplado Final corto: ${blowDwellDeg.toFixed(0)}°. Recomendado mínimo 50° de soplado para estabilizar el envase y evitar deformaciones en el cuerpo.`;
            } else if (blowDwellDeg > 70) {
                blowClass = "warning";
                blowIcon = "⚠️";
                blowMsg = `Soplado Final largo: ${blowDwellDeg.toFixed(0)}°. Excede el rango recomendado (máx 70°) reduciendo el tiempo disponible para otros mecanismos.`;
            }
            html += `
                <div class="validation-alert ${blowClass}">
                    <span class="validation-alert-icon">${blowIcon}</span>
                    <span>${blowMsg}</span>
                </div>
            `;

            // 3. Colisión Crítica: Macho vs Inversión (en grados)
            // Comprobar si Invert Start está programado mientras el macho está arriba
            let colisionPlunger = false;
            if (plungerDown > plungerUp) {
                if (invertStart >= plungerUp && invertStart < plungerDown) colisionPlunger = true;
            } else { // Caso de wrap-around del plunger
                if (invertStart >= plungerUp || invertStart < plungerDown) colisionPlunger = true;
            }

            const plungerToInvertDeg = colisionPlunger ? 0 : getDegDiff(plungerDown, invertStart);

            if (colisionPlunger) {
                html += `
                    <div class="validation-alert danger">
                        <span class="validation-alert-icon">🚨</span>
                        <span><b>COLISIÓN ACTIVA: Macho vs Inversión</b>. La inversión inicia a los ${invertStart}° mientras el macho sigue arriba (baja a los ${plungerDown}°). Riesgo de destrucción inminente del utillaje mecánico en caliente.</span>
                    </div>
                `;
            } else if (plungerToInvertDeg < 15) {
                html += `
                    <div class="validation-alert danger">
                        <span class="validation-alert-icon">🚨</span>
                        <span><b>PELIGRO DE COLISIÓN</b>: Desfase de seguridad insuficiente de ${plungerToInvertDeg.toFixed(0)}° entre la bajada del macho (${plungerDown}°) y el inicio de inversión (${invertStart}°). Se requiere un mínimo de 15° de despeje mecánico.</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="validation-alert success">
                        <span class="validation-alert-icon">🟢</span>
                        <span>Retiro de Macho e Inversión: Margen seguro de ${plungerToInvertDeg.toFixed(0)}° de desfase (correcto).</span>
                    </div>
                `;
            }

            // 4. Caída anticipada: Anillo de Boca vs Molde Final (en grados)
            // El anillo abre a neckOpen y el molde final cierra a blowClose. El molde final debe estar cerrado antes de que abra el anillo.
            const blowToNeckDeg = getDegDiff(blowClose, neckOpen);
            let colisionNeck = false;
            
            // Si el anillo abre antes de que cierre el molde en la secuencia horaria (diferencia cíclica > 180°),
            // o si el margen de seguridad de soporte cerrado es inferior a 10 grados.
            if (blowToNeckDeg > 180 || blowToNeckDeg < 10) {
                colisionNeck = true;
            }

            if (colisionNeck) {
                const actualMargin = blowToNeckDeg > 180 ? 0 : blowToNeckDeg;
                html += `
                    <div class="validation-alert danger">
                        <span class="validation-alert-icon">🚨</span>
                        <span><b>GRAVE: Soporte Físico de Preforma Inseguro</b>. El anillo abre a los ${neckOpen}° y el molde final cierra a los ${blowClose}°. Margen cíclico real: ${actualMargin.toFixed(0)}° (mínimo seguro: 10°). La botella preforma se soltará antes de que el molde final esté cerrado, provocando colgadas en caliente.</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="validation-alert success">
                        <span class="validation-alert-icon">🟢</span>
                        <span>Soporte de Molde Final: El molde cierra antes de abrir el anillo con un margen seguro de ${blowToNeckDeg.toFixed(0)}° (correcto).</span>
                    </div>
                `;
            }

            // 5. Soplado final anticipado (Blow Head vs Blow Mold Close en grados)
            const blowToCloseDeg = getDegDiff(blowClose, blowOn);
            // El soplado final se inicia antes de que el molde cierre si el desfase cíclico es mayor a 180° o menor a 15°.
            if (blowToCloseDeg > 180 || blowToCloseDeg < 15) {
                const actualBlowMargin = blowToCloseDeg > 180 ? 0 : blowToCloseDeg;
                html += `
                    <div class="validation-alert warning">
                        <span class="validation-alert-icon">⚠️</span>
                        <span><b>Soplado final anticipado</b>: Iniciando soplado a los ${blowOn}° frente al cierre de molde a los ${blowClose}° (margen real: ${actualBlowMargin.toFixed(0)}°). Se recomienda iniciar soplado al menos 15° después del cierre del molde final para evitar fugas de presión y desgarros.</span>
                    </div>
                `;
            }

            resultsContainer.innerHTML = html;

            // --- ACTUALIZAR BARRAS GANTT DEL CICLO BDF ---
            const barPlunger = document.getElementById('barPlunger');
            const barInvert = document.getElementById('barInvert');
            const barBlowMold = document.getElementById('barBlowMold');
            const barFinalBlow = document.getElementById('barFinalBlow');

            const labelPlunger = document.getElementById('labelPlunger');
            const labelInvert = document.getElementById('labelInvert');
            const labelBlowMold = document.getElementById('labelBlowMold');
            const labelFinalBlow = document.getElementById('labelFinalBlow');

            function updateGanttBar(bar, label, start, end, color) {
                if (!bar || !label) return;
                let leftPercent = (start / 360) * 100;
                let widthPercent = 0;
                if (end >= start) {
                    widthPercent = ((end - start) / 360) * 100;
                    bar.style.left = `${leftPercent}%`;
                    bar.style.width = `${widthPercent}%`;
                    bar.style.background = color;
                } else {
                    widthPercent = (((360 - start) + end) / 360) * 100;
                    bar.style.left = `${leftPercent}%`;
                    bar.style.width = `${widthPercent}%`;
                    bar.style.background = `linear-gradient(to right, ${color}, rgba(255,255,255,0.15))`;
                }
                label.innerText = `${start.toFixed(0)}°-${end.toFixed(0)}°`;
            }

            updateGanttBar(barPlunger, labelPlunger, plungerUp, plungerDown, '#3b82f6');
            updateGanttBar(barInvert, labelInvert, invertStart, blowClose, '#a855f7');
            updateGanttBar(barBlowMold, labelBlowMold, blowClose, 330, '#10b981'); // Se asume apertura molde final a 330°
            updateGanttBar(barFinalBlow, labelFinalBlow, blowOn, blowOff, '#eab308');
        }

function getDegDiff(start, end) {
                if (end >= start) return end - start;
                return (360 - start) + end;
            }

function updateGanttBar(bar, label, start, end, color) {
                if (!bar || !label) return;
                let leftPercent = (start / 360) * 100;
                let widthPercent = 0;
                if (end >= start) {
                    widthPercent = ((end - start) / 360) * 100;
                    bar.style.left = `${leftPercent}%`;
                    bar.style.width = `${widthPercent}%`;
                    bar.style.background = color;
                } else {
                    widthPercent = (((360 - start) + end) / 360) * 100;
                    bar.style.left = `${leftPercent}%`;
                    bar.style.width = `${widthPercent}%`;
                    bar.style.background = `linear-gradient(to right, ${color}, rgba(255,255,255,0.15))`;
                }
                label.innerText = `${start.toFixed(0)}°-${end.toFixed(0)}°`;
            }

function populateDefectSelector() {
            const selector = document.getElementById('defectSelector');
            if (!selector) return;

            let html = '<option value="">-- Elegir un defecto de moldería --</option>';

            const zonas = {
                boca: "Zona de la Boca",
                cuello: "Zona del Cuello",
                hombro: "Zona del Hombro",
                cuerpo: "Zona del Cuerpo",
                fondo: "Zona del Fondo",
                general: "Otros Defectos / General"
            };

            Object.keys(zonas).forEach(zonaKey => {
                const defsZona = DEFECTOS_DB.filter(d => d.zona === zonaKey);
                if (defsZona.length > 0) {
                    html += `<optgroup label="${zonas[zonaKey]}">`;
                    defsZona.forEach(d => {
                        html += `<option value="${d.id}">${d.nombre}</option>`;
                    });
                    html += `</optgroup>`;
                }
            });

            selector.innerHTML = html;
        }

export { calculateSopMs, validateBdfTiming, getDegDiff, updateGanttBar, populateDefectSelector };
