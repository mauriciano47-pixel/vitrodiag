import { state } from './state.js';
import { showToast } from './ui.js';
import { validateBdfTiming } from './timing.js';

function getOcrWorker(statusElement) {
            if (ocrWorker) return ocrWorker;
            statusElement.innerText = "Inicializando Worker OCR local (WebAssembly)...";
            ocrWorker = await Tesseract.createWorker('spa');
            return ocrWorker;
        }

window.runScannerOcr = async function() {
            const loader = document.getElementById('ocrLoader');
            const statusMsg = document.getElementById('ocrStatusMsg');
            const resultsCard = document.getElementById('scannerResultsCard');

            if (!state.scannerImageBase64) return;

            resultsCard.style.display = 'none';
            loader.style.display = 'block';

            // Timeout ampliado a 20 segundos para la primera inicialización lenta (luego es inmediato)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Timeout de digitalización OCR (20 segundos superado)")), 20000);
            });

            const ocrPromise = (async () => {
                statusMsg.innerText = "Digitalizando caracteres e interpretando texto del panel...";
                const ret = await Tesseract.recognize(state.scannerImageBase64, 'spa');
                const text = ret.data.text;
                console.log("Texto extraído por OCR del panel:", text);
                return text;
            })();

            try {
                // Competencia entre el OCR y el Timeout
                const text = await Promise.race([ocrPromise, timeoutPromise]);

                statusMsg.innerText = "Interpretando datos de grados de la consola BDF...";
                parseScannerOcrText(text);

                loader.style.display = 'none';
                runOcrBtn.removeAttribute('disabled');
            } catch (err) {
                console.error("Error o timeout en motor OCR Tesseract.js:", err);
                loader.style.display = 'none';
                runOcrBtn.removeAttribute('disabled');
                
                let errorMsg = "Error al digitalizar imagen. Intenta con mejor enfoque o luz.";
                if (err.message && err.message.includes("Timeout")) {
                    errorMsg = "Tiempo de espera agotado. Verifica tu conexión de red para la primera carga de OCR o re-intenta.";
                }
                showToast(errorMsg, "danger");
            }
        }

function parseScannerOcrText(text) {
            const raw = text.toLowerCase();
            state.scannerParsedValues = {};

            const keys = {
                plungerUp: [/plunger\s*up/g, /macho\s*arriba/g, /pl\s*up/g, /pl\s*u/g, /up/g],
                plungerDown: [/plunger\s*down/g, /macho\s*abajo/g, /pl\s*down/g, /pl\s*d/g, /down/g],
                invertStart: [/invert\s*start/g, /inversion\s*inicio/g, /inv\s*st/g, /inv\s*s/g, /invert/g],
                blowClose: [/blow\s*close/g, /molde\s*cierre/g, /bl\s*cl/g, /bl\s*c/g, /close/g],
                neckRingOpen: [/neck\s*ring\s*open/g, /anillo\s*apertura/g, /nr\s*op/g, /nr\s*o/g, /neck/g],
                blowOn: [/blow\s*on/g, /soplado\s*inicio/g, /bl\s*on/g, /bl\s*o/g, /soplado/g],
                blowOff: [/blow\s*off/g, /soplado\s*fin/g, /bl\s*off/g, /bl\s*f/g, /off/g]
            };

            Object.keys(keys).forEach(mechKey => {
                const regexes = keys[mechKey];
                for (let r of regexes) {
                    const match = raw.match(new RegExp(r.source + '\\D*(\\d{1,3})'));
                    if (match && match[1]) {
                        const val = parseInt(match[1]);
                        if (val >= 0 && val <= 360) {
                            state.scannerParsedValues[mechKey] = val;
                            break;
                        }
                    }
                }
            });

            const allNumbers = [];
            const numberMatches = raw.match(/\b\d{1,3}\b/g);
            if (numberMatches) {
                numberMatches.forEach(numStr => {
                    const n = parseInt(numStr);
                    if (n >= 0 && n <= 360 && !allNumbers.includes(n)) {
                        allNumbers.push(n);
                    }
                });
            }

            console.log("Números crudos filtrados en rango de grados [0-360] en OCR:", allNumbers);

            if (Object.keys(state.scannerParsedValues).length < 3 && allNumbers.length >= 4) {
                allNumbers.sort((a, b) => a - b);
                
                allNumbers.forEach(n => {
                    if (n >= 50 && n <= 100 && !state.scannerParsedValues.plungerUp) state.scannerParsedValues.plungerUp = n;
                    else if (n >= 130 && n <= 165 && !state.scannerParsedValues.plungerDown) state.scannerParsedValues.plungerDown = n;
                    else if (n >= 170 && n <= 210 && !state.scannerParsedValues.invertStart) state.scannerParsedValues.invertStart = n;
                    else if (n >= 215 && n <= 250 && !state.scannerParsedValues.blowClose) {
                        state.scannerParsedValues.blowClose = n;
                        state.scannerParsedValues.neckRingOpen = n + 5;
                    }
                    else if (n >= 251 && n <= 290 && !state.scannerParsedValues.blowOn) state.scannerParsedValues.blowOn = n;
                    else if (n >= 291 && n <= 345 && !state.scannerParsedValues.blowOff) state.scannerParsedValues.blowOff = n;
                });
            }

            const defaultValues = {
                plungerUp: parseInt(document.getElementById('valPlungerUp').value) || 80,
                plungerDown: parseInt(document.getElementById('valPlungerDown').value) || 150,
                invertStart: parseInt(document.getElementById('valInvertStart').value) || 190,
                blowClose: parseInt(document.getElementById('valBlowClose').value) || 240,
                neckRingOpen: parseInt(document.getElementById('valNeckOpen').value) || 245,
                blowOn: parseInt(document.getElementById('valBlowOn').value) || 270,
                blowOff: parseInt(document.getElementById('valBlowOff').value) || 325
            };

            Object.keys(defaultValues).forEach(mechKey => {
                if (state.scannerParsedValues[mechKey] === undefined) {
                    state.scannerParsedValues[mechKey] = defaultValues[mechKey];
                }
            });

            // Cargar los valores detectados al asistente de confirmación interactiva
            document.getElementById('ocrValPlungerUp').value = state.scannerParsedValues.plungerUp;
            document.getElementById('ocrValPlungerDown').value = state.scannerParsedValues.plungerDown;
            document.getElementById('ocrValInvertStart').value = state.scannerParsedValues.invertStart;
            document.getElementById('ocrValBlowClose').value = state.scannerParsedValues.blowClose;
            document.getElementById('ocrValNeckRingOpen').value = state.scannerParsedValues.neckRingOpen;
            document.getElementById('ocrValBlowOn').value = state.scannerParsedValues.blowOn;

            // Mostrar el panel de confirmación y ocultar loader/tarjeta de resultados previa
            document.getElementById('ocrLoader').style.display = 'none';
            document.getElementById('scannerResultsCard').style.display = 'none';
            document.getElementById('scannerOcrConfirmArea').style.display = 'block';
            document.getElementById('scannerOcrConfirmArea').scrollIntoView({ behavior: 'smooth' });
        }

window.confirmOcrAndCompare = function() {
            // Leer valores validados por el operador
            state.scannerParsedValues = {
                plungerUp: parseInt(document.getElementById('ocrValPlungerUp').value) || 80,
                plungerDown: parseInt(document.getElementById('ocrValPlungerDown').value) || 150,
                invertStart: parseInt(document.getElementById('ocrValInvertStart').value) || 190,
                blowClose: parseInt(document.getElementById('ocrValBlowClose').value) || 240,
                neckRingOpen: parseInt(document.getElementById('ocrValNeckRingOpen').value) || 245,
                blowOn: parseInt(document.getElementById('ocrValBlowOn').value) || 270,
                blowOff: parseInt(document.getElementById('ocrValBlowOn').value) + 55 // Asignar desfase por defecto para Blow Off
            };

            const defaultValues = {
                plungerUp: parseInt(document.getElementById('valPlungerUp').value) || 80,
                plungerDown: parseInt(document.getElementById('valPlungerDown').value) || 150,
                invertStart: parseInt(document.getElementById('valInvertStart').value) || 190,
                blowClose: parseInt(document.getElementById('valBlowClose').value) || 240,
                neckRingOpen: parseInt(document.getElementById('valNeckOpen').value) || 245,
                blowOn: parseInt(document.getElementById('valBlowOn').value) || 270,
                blowOff: parseInt(document.getElementById('valBlowOff').value) || 325
            };

            // Ocultar confirmación y renderizar la comparación final
            document.getElementById('scannerOcrConfirmArea').style.display = 'none';
            renderScannerComparisonTable(defaultValues);
            
            showToast("Lectura validada con éxito por operador.", "success");
        }

function renderScannerComparisonTable(defaults) {
            const tableBody = document.getElementById('scannerComparisonBody');
            const badge = document.getElementById('scannerArticleBadge');
            const alertContainer = document.getElementById('scannerSafetyAlert');
            const resultsCard = document.getElementById('scannerResultsCard');

            if (!tableBody || !badge || !alertContainer || !resultsCard) return;

            // Fallback de contingencia si no hay articulo activo (Bug 1 Fix)
            if (!defaults) {
                defaults = (window.sopPresets && window.sopPresets.safe) ? window.sopPresets.safe : {
                    plungerUp: 80,
                    plungerDown: 140,
                    neckRingOpen: 245,
                    invertStart: 180,
                    blowClose: 240,
                    blowOn: 270,
                    blowOff: 310
                };
            }

            badge.innerText = state.activeArticle ? state.activeArticle.nombre : "SSP 296";

            const mechanisms = [
                { key: "plungerUp", name: "Plunger Up (Macho Arriba)" },
                { key: "plungerDown", name: "Plunger Down (Macho Abajo)" },
                { key: "invertStart", name: "Invert Start (Inversión)" },
                { key: "blowClose", name: "Blow Close (Cierre Molde)" },
                { key: "neckRingOpen", name: "Neck Ring Open (Abre Anillo)" },
                { key: "blowOn", name: "Blow ON (Soplado)" },
                { key: "blowOff", name: "Blow OFF (Fin Soplado)" }
            ];

            let html = "";
            let maxDeviation = 0;
            let criticalDeviation = false;

            mechanisms.forEach(m => {
                const readVal = state.scannerParsedValues[m.key];
                const theoryVal = defaults[m.key];
                const diff = readVal - theoryVal;
                
                let diffText = "";
                let diffStyle = "color: var(--text-muted);";

                if (diff > 0) {
                    diffText = `+${diff}°`;
                    diffStyle = "color: var(--warning);";
                } else if (diff < 0) {
                    diffText = `${diff}°`;
                    diffStyle = "color: #60a5fa;";
                } else {
                    diffText = "0°";
                    diffStyle = "color: var(--success);";
                }

                if (Math.abs(diff) > maxDeviation) maxDeviation = Math.abs(diff);
                if (Math.abs(diff) >= 15) criticalDeviation = true;

                html += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem;">
                        <td style="padding: 8px 0; font-weight: bold; color: var(--text-main);">${m.name}</td>
                        <td style="padding: 8px 0; text-align: center; font-family: monospace; font-weight: bold; color: #06b6d4;">${readVal}°</td>
                        <td style="padding: 8px 0; text-align: center; font-family: monospace; color: var(--text-muted);">${theoryVal}°</td>
                        <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; ${diffStyle}">${diffText}</td>
                    </tr>
                `;
            });

            tableBody.innerHTML = html;

            const marginInvert = state.scannerParsedValues.invertStart - state.scannerParsedValues.plungerDown;
            if (marginInvert < 15) {
                alertContainer.style.background = "rgba(239, 68, 68, 0.15)";
                alertContainer.style.borderLeft = "4px solid #ef4444";
                alertContainer.style.color = "#fca5a5";
                alertContainer.innerHTML = `
                    <b>🚨 INFORME CRÍTICO: Peligro de colisión mecánica.</b><br>
                    El margen entre Plunger Down (${state.scannerParsedValues.plungerDown}°) e Invert Start (${state.scannerParsedValues.invertStart}°) es de solo <b>${marginInvert}°</b> (Mínimo seguro: 15°). Si cargas esta configuración, el anillo de boca iniciará la inversión antes de que el macho termine de bajar, lo que provocará colisión física del herramental.
                `;
            } else if (criticalDeviation) {
                alertContainer.style.background = "rgba(245, 158, 11, 0.15)";
                alertContainer.style.borderLeft = "4px solid #f59e0b";
                alertContainer.style.color = "#fde047";
                alertContainer.innerHTML = `
                    <b>⚠️ ADVERTENCIA: Desvíos severos de temporización.</b><br>
                    Se detectaron desvíos superiores a 15° en el ciclo respecto a la consigna nominal del artículo. Esto puede generar deformaciones en la corona o hombro por estiramiento térmico descontrolado.
                `;
            } else {
                alertContainer.style.background = "rgba(16, 185, 129, 0.15)";
                alertContainer.style.borderLeft = "4px solid #10b981";
                alertContainer.style.color = "#a7f3d0";
                alertContainer.innerHTML = `
                    <b>🟢 CICLO COMPATIBLE Y SEGURO.</b><br>
                    Las temporizaciones leídas de la consola física están dentro de los límites seguros. No se detectaron riesgos de colisiones o interferencias en el ciclo de 360°.
                `;
            }

            resultsCard.style.display = 'block';
            resultsCard.scrollIntoView({ behavior: 'smooth' });
        }

window.applyScannerValuesToCalculator = function() {
            if (!state.scannerParsedValues || Object.keys(state.scannerParsedValues).length === 0) return;

            document.getElementById('valPlungerUp').value = state.scannerParsedValues.plungerUp;
            document.getElementById('valPlungerDown').value = state.scannerParsedValues.plungerDown;
            document.getElementById('valInvertStart').value = state.scannerParsedValues.invertStart;
            document.getElementById('valBlowClose').value = state.scannerParsedValues.blowClose;
            document.getElementById('valNeckOpen').value = state.scannerParsedValues.neckRingOpen;
            document.getElementById('valBlowOn').value = state.scannerParsedValues.blowOn;
            document.getElementById('valBlowOff').value = state.scannerParsedValues.blowOff;

            showToast("Valores escaneados de grados cargados en la calculadora", "success");
            
            validateBdfTiming();

            window.switchView('sop');
        }

window.resetScannerReport = function() {
            const resultsCard = document.getElementById('scannerResultsCard');
            if (resultsCard) resultsCard.style.display = 'none';
            resetScannerImage();
        }


window.setScannerSource = function(source) {
            const btnCam = document.getElementById('btnScannerUseCam');
            const btnFile = document.getElementById('btnScannerUseFile');
            const btnManual = document.getElementById('btnScannerUseManual');
            
            const camArea = document.getElementById('scannerCameraArea');
            const uploadArea = document.getElementById('scannerUploadArea');
            const manualArea = document.getElementById('scannerManualArea');
            const resultsCard = document.getElementById('scannerResultsCard');

            // Limpiar resultados anteriores al cambiar de modo
            if (resultsCard) resultsCard.style.display = 'none';

            if (source === 'camera') {
                btnCam.classList.add('active');
                btnFile.classList.remove('active');
                btnManual.classList.remove('active');
                
                camArea.style.display = 'flex';
                uploadArea.style.display = 'none';
                manualArea.style.display = 'none';
                
                window.startScannerCamera();
            } else if (source === 'file') {
                btnCam.classList.remove('active');
                btnFile.classList.add('active');
                btnManual.classList.remove('active');
                
                camArea.style.display = 'none';
                uploadArea.style.display = 'block';
                manualArea.style.display = 'none';
                
                window.stopScannerCamera();
            } else {
                // Modo Manual
                btnCam.classList.remove('active');
                btnFile.classList.remove('active');
                btnManual.classList.add('active');
                
                camArea.style.display = 'none';
                uploadArea.style.display = 'none';
                manualArea.style.display = 'block';
                
                window.stopScannerCamera();
            }
        }

window.captureScannerSnapshot = function() {
            const video = document.getElementById('scannerVideo');
            const canvas = document.getElementById('scannerCanvas');
            const previewArea = document.getElementById('scannerPreviewArea');
            const previewImg = document.getElementById('scannerPreviewImg');
            const runOcrBtn = document.getElementById('btnRunOcr');
            const camArea = document.getElementById('scannerCameraArea');

            if (!video || !canvas || !previewImg) return;

            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            state.scannerImageBase64 = canvas.toDataURL('image/jpeg');
            previewImg.src = state.scannerImageBase64;

            camArea.style.display = 'none';
            previewArea.style.display = 'block';
            stopScannerCamera();

            runOcrBtn.style.display = 'block';
            runScannerOcr();
        }

window.handleScannerFileSelect = function(input) {
            const previewArea = document.getElementById('scannerPreviewArea');
            const previewImg = document.getElementById('scannerPreviewImg');
            const runOcrBtn = document.getElementById('btnRunOcr');

            if (!input.files || input.files.length === 0 || !previewImg) return;

            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                state.scannerImageBase64 = e.target.result;
                previewImg.src = state.scannerImageBase64;
                previewArea.style.display = 'block';
                
                runOcrBtn.style.display = 'block';
                runScannerOcr();
            };

            reader.readAsDataURL(file);
        }

window.resetScannerImage = function() {
            const previewArea = document.getElementById('scannerPreviewArea');
            const previewImg = document.getElementById('scannerPreviewImg');
            const runOcrBtn = document.getElementById('btnRunOcr');
            const camArea = document.getElementById('scannerCameraArea');
            const btnCam = document.getElementById('btnScannerUseCam');

            if (previewArea) previewArea.style.display = 'none';
            if (previewImg) previewImg.src = "";
            state.scannerImageBase64 = null;

            document.getElementById('scannerOcrConfirmArea').style.display = 'none';
            document.getElementById('scannerResultsCard').style.display = 'none';

            if (runOcrBtn) {
                runOcrBtn.style.display = 'none';
            }

            if (btnCam && btnCam.classList.contains('active')) {
                camArea.style.display = 'flex';
                window.startScannerCamera();
            }
        }

window.runScannerManualComparison = function() {
            const plungerUp = parseInt(document.getElementById('manualPlungerUp').value);
            const plungerDown = parseInt(document.getElementById('manualPlungerDown').value);
            const neckRingOpen = parseInt(document.getElementById('manualNeckOpen').value);
            const invertStart = parseInt(document.getElementById('manualInvertStart').value);
            const blowClose = parseInt(document.getElementById('manualBlowClose').value);
            const blowOn = parseInt(document.getElementById('manualBlowOn').value);
            const blowOff = parseInt(document.getElementById('manualBlowOff').value);

            if (isNaN(plungerUp) || isNaN(plungerDown) || isNaN(neckRingOpen) || isNaN(invertStart) || isNaN(blowClose) || isNaN(blowOn) || isNaN(blowOff)) {
                showToast("Por favor, ingresa los grados (0-360) para todas las variables del panel.", "warning");
                return;
            }

            if ([plungerUp, plungerDown, neckRingOpen, invertStart, blowClose, blowOn, blowOff].some(v => v < 0 || v > 360)) {
                showToast("Los valores ingresados deben estar entre 0° y 360°.", "danger");
                return;
            }

            state.scannerParsedValues = {
                plungerUp: plungerUp,
                plungerDown: plungerDown,
                neckRingOpen: neckRingOpen,
                invertStart: invertStart,
                blowClose: blowClose,
                blowOn: blowOn,
                blowOff: blowOff
            };

            // Ejecutar la comparación contra la consigna del artículo activo
            renderScannerComparisonTable(state.activeArticle ? state.activeArticle.defaultParams : null);

            // Mostrar el contenedor de resultados de comparación
            const resultsCard = document.getElementById('scannerResultsCard');
            if (resultsCard) resultsCard.style.display = 'block';

            showToast("Comparación de panel manual generada correctamente.", "success");
        }

export {
  setScannerSource,
  captureScannerSnapshot,
  handleScannerFileSelect,
  resetScannerImage,
  runScannerManualComparison,
 getOcrWorker, runScannerOcr, parseScannerOcrText, confirmOcrAndCompare, renderScannerComparisonTable, applyScannerValuesToCalculator, resetScannerReport };
