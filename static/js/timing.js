import { state } from './state.js';
import { DEFECTOS_DB } from './db.js';

function calculateSopMs() {
            // Adaptador para mantener compatibilidad con otras llamadas externas
            validateBdfTiming();
        }

function validateBdfTiming() {
            const bpm = parseFloat(document.getElementById('calcBpm')?.value) || 396;
            const sections = parseInt(document.getElementById('calcSections')?.value) || 11;
            const cavity = parseInt(document.getElementById('calcCavities')?.value) || 3;

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
            const plungerUp = parseFloat(document.getElementById('valPlungerUp')?.value) || 0;
            const plungerDown = parseFloat(document.getElementById('valPlungerDown')?.value) || 0;
            const blankOpen = parseFloat(document.getElementById('valBlankOpen')?.value) || 0;
            const invertStart = parseFloat(document.getElementById('valInvertStart')?.value) || 0;
            const blowClose = parseFloat(document.getElementById('valBlowClose')?.value) || 0;
            const neckOpen = parseFloat(document.getElementById('valNeckOpen')?.value) || 0;
            const blowOn = parseFloat(document.getElementById('valBlowOn')?.value) || 0;
            const blowOff = parseFloat(document.getElementById('valBlowOff')?.value) || 0;

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

/**
 * Carga un preset de escenario BDF en los inputs de la calculadora.
 * Parámetros: plungerUp, plungerDown, blankOpen, invertStart,
 *             blowClose, neckOpen, blowOn, blowOff (todos en grados 0-360)
 */
function loadBdfPreset(plungerUp, plungerDown, blankOpen, invertStart, blowClose, neckOpen, blowOn, blowOff) {
    const fields = {
        valPlungerUp:   plungerUp,
        valPlungerDown: plungerDown,
        valBlankOpen:   blankOpen,
        valInvertStart: invertStart,
        valBlowClose:   blowClose,
        valNeckOpen:    neckOpen,
        valBlowOn:      blowOn,
        valBlowOff:     blowOff
    };

    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    // Recalcular y actualizar el diagrama Gantt automáticamente
    validateBdfTiming();
}

/**
 * Mapa de defectos de moldería con título, descripción física y acción correctiva BDF.
 */
const DEFECT_REMEDY_MAP = {
    bajo_boca: {
        titulo: '⚠️ Boca Incompleta / Bajo Boca (NNPB)',
        descripcion: 'La preforma llega fría al molde de boca o el plunger sube demasiado tarde, dejando vidrio insuficiente en la zona de la corona.',
        accion: 'Adelantar Plunger Up 3–5°. Aumentar temperatura de gota 2–3°C. Verificar temperatura del molde de boca.'
    },
    cuello_torcido: {
        titulo: '🔴 Botella Colgada / Cuello Torcido',
        descripcion: 'La inversión ocurre antes de que el plunger haya bajado completamente, causando arrastre mecánico del cuello.',
        accion: 'Retrasar Invert Start mínimo 15° después de Plunger Down. Verificar desfase mecánico sección a sección.'
    },
    espesor_desigual: {
        titulo: '⚠️ Espesor de Pared Desigual / Parison Frío',
        descripcion: 'La gota llega fría al molde de soplo o el soplado final es insuficiente para distribuir el vidrio uniformemente.',
        accion: 'Aumentar Blow On 5–8° antes. Verificar temperatura de moldes de soplo. Ajustar posición del Baffle.'
    },
    rebaba_boca: {
        titulo: '🔴 Rebaba en Molde de Boca (NNPB)',
        descripcion: 'El plunger sube tarde o el Blank Open es prematuro, permitiendo que el vidrio fluya fuera del molde de boca.',
        accion: 'Retrasar Blank Open 3–5°. Verificar fuerza de cierre de molde de boca. Revisar estado de sellos.'
    },
    fondo_deforme: {
        titulo: '⚠️ Fondo Deformado, Hundido o Caído',
        descripcion: 'El soplado final llega tarde o el molde de soplo abre antes de que el vidrio esté estabilizado.',
        accion: 'Adelantar Blow On 3°. Verificar presión de soplado final. Retrasar la apertura del Blow Mold 5°.'
    },
    grieta_cuello: {
        titulo: '🔴 Grietas o Fisuras en el Cuello',
        descripcion: 'El anillo de boca (Neck Ring) abre antes de que el molde de soplo esté cerrado, sometiendo el vidrio caliente a tensión.',
        accion: 'Adelantar Blow Close 5–10° para cerrar el molde antes del Neck Open. Verificar sincronía de inversión.'
    },
    boca_hinchada: {
        titulo: '⚠️ Boca Hinchada o Deformada',
        descripcion: 'Exceso de vidrio en la zona de boca por Plunger Up tardío o temperatura excesiva.',
        accion: 'Retrasar Plunger Up 2–3°. Reducir temperatura de gota 1–2°C. Verificar longitud de corte.'
    },
    rosca_partida: {
        titulo: '🔴 Rosca Partida (Split Thread)',
        descripcion: 'El plunger ejerce presión excesiva sobre la boca del molde, o la sincronía de apertura del Blank es incorrecta.',
        accion: 'Verificar presión del plunger. Retrasar Blank Open 3–5°. Inspeccionar desgaste del molde de boca.'
    },
    boca_ovalada: {
        titulo: '⚠️ Boca Ovalada (Out of Round Finish)',
        descripcion: 'El molde de boca (Neck Ring) abre demasiado pronto cuando el vidrio aún está blando.',
        accion: 'Retrasar Neck Open 5–8° hasta que el vidrio esté más rígido. Reducir temperatura del enfriamiento de boca.'
    },
    hombro_caido: {
        titulo: '⚠️ Hombro Caído / Pliegues en Hombro',
        descripcion: 'Tiempo insuficiente de soplado final o temperatura excesiva en zona de hombro.',
        accion: 'Aumentar duración de Blow On–Off 5°. Verificar distribución de vidrio en preforma. Ajustar temperatura.'
    },
    heavy_joint: {
        titulo: '⚠️ Costura de Cuerpo Sobresaliente (Heavy Joint)',
        descripcion: 'Las mitades del molde de soplo no cierran con suficiente fuerza o hay desgaste en las guías.',
        accion: 'Verificar fuerza de cierre del Blow Mold. Adelantar Blow Close 3°. Revisar desgaste de las caras de cierre.'
    },
    thin_bottom: {
        titulo: '🔴 Fondo Delgado (Thin Bottom)',
        descripcion: 'El vidrio no llega suficientemente al fondo del molde durante el soplado final.',
        accion: 'Aumentar presión de soplado final. Adelantar Blow On 5°. Verificar temperatura del molde de fondo.'
    },
    neck_wave: {
        titulo: '⚠️ Pliegue u Onda en el Cuello (Neck Wave)',
        descripcion: 'La inversión es demasiado rápida o el vidrio en el cuello está demasiado frío al momento de la inversión.',
        accion: 'Retrasar Invert Start 3–5°. Aumentar temperatura de gota 1–2°C. Verificar tiempo de enfriamiento del Baffle.'
    },
    marcas_vacio: {
        titulo: '⚠️ Marcas de Vacío en Boca (Vacuum Marks)',
        descripcion: 'El sistema de vacío del molde de boca es insuficiente o el vidrio está demasiado viscoso.',
        accion: 'Verificar tuberías de vacío (presión mínima 0.5 bar). Aumentar temperatura de gota 2°C. Revisar sellos.'
    },
    grieta_boca: {
        titulo: '🔴 Grieta en la Boca o Corona (Corkage Check)',
        descripcion: 'El Neck Ring abre demasiado pronto causando tensión térmica en la corona, o hay desgaste del molde de boca.',
        accion: 'Retrasar Neck Open 5–10°. Verificar temperatura de enfriamiento del molde de boca. Inspeccionar molde.'
    }
};

/**
 * Muestra la tarjeta de diagnóstico y corrección BDF del defecto seleccionado en el Asistente Expert.
 */
function showDefectRemedy() {
    const selector = document.getElementById('defectSelector');
    const card = document.getElementById('defectRemedyCard');
    const titleEl = document.getElementById('remedyTitle');
    const descEl = document.getElementById('remedyDescription');
    const actionEl = document.getElementById('remedyAction');
    const applyBtn = document.getElementById('applyRemedyBtn');

    if (!selector || !card) return;

    const defectId = selector.value;
    if (!defectId || !DEFECT_REMEDY_MAP[defectId]) {
        card.style.display = 'none';
        return;
    }

    const remedy = DEFECT_REMEDY_MAP[defectId];

    if (titleEl)  titleEl.innerText  = remedy.titulo;
    if (descEl)   descEl.innerText   = remedy.descripcion;
    if (actionEl) actionEl.innerText = remedy.accion;

    card.style.display = 'block';

    // Botón "Simular Ajuste en Ciclo": re-ejecuta la validación para refrescar el diagrama Gantt
    if (applyBtn) {
        applyBtn.onclick = () => {
            validateBdfTiming();
        };
    }
}

if (typeof window !== 'undefined') {
    window.calculateSopMs = calculateSopMs;
    window.validateBdfTiming = validateBdfTiming;
    window.populateDefectSelector = populateDefectSelector;
    window.loadBdfPreset = loadBdfPreset;
    window.showDefectRemedy = showDefectRemedy;
}

export { calculateSopMs, validateBdfTiming, populateDefectSelector, loadBdfPreset, showDefectRemedy };
