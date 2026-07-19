import { state } from './state.js';
import { showToast } from './ui.js';
import { processFrame } from './vision.js';

// ⚠️ FIX #4: Referencias DOM obtenidas de forma lazy dentro de las funciones
// para evitar crash cuando el módulo se importa antes de DOMContentLoaded.
function getTfjsStatus() { return document.getElementById('tfjsStatus'); }
function getBtnDiagnosticar() { return document.getElementById('btnDiagnosticar'); }
function getBtnReanudar() { return document.getElementById('btnReanudarCamara'); }
function getCard() { return document.getElementById('resultadoCard'); }
function getCanvas() { return document.getElementById('canvasOutput'); }

function updateConfidenceThresholdDisplay(val) {
            state.confidenceThreshold = parseInt(val);
            const badge = document.getElementById('iaConfidenceBadge');
            if (badge) badge.innerText = `Filtro: >${state.confidenceThreshold}%`;
        }

async function warmUpModel(model) {
    if (!model || typeof tf === 'undefined') return;
    const tfjsStatus = getTfjsStatus();
    try {
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor de Visión: Calibrando modelo local (Warm-up)...";
            tfjsStatus.style.color = "#fbbf24";
        }
        const dummy = tf.tidy(() => tf.zeros([1, 224, 224, 3]));
        const prediction = model.predict(dummy);
        prediction.dataSync(); // Fuerza la ejecución sincrona para compilar shaders
        dummy.dispose();
        prediction.dispose();
        console.log("TFJS: Warm-up completado.");
    } catch (e) {
        console.warn("TFJS: Warm-up omitido o fallido: ", e);
    }
}

async function loadCustomUploadedModel() {
            const jsonInput = document.getElementById('uploadModelJson');
            const binInput = document.getElementById('uploadModelBin');
            const tfjsStatus = getTfjsStatus();

            if (!jsonInput || !binInput || jsonInput.files.length === 0 || binInput.files.length === 0) {
                showToast("Debes seleccionar el archivo model.json y sus pesos (.bin)", "warning");
                return;
            }

            const modelJsonFile = jsonInput.files[0];
            const weightsFiles = Array.from(binInput.files);

            if (tfjsStatus) {
                tfjsStatus.innerText = "Cargando modelo personalizado en GPU local...";
                tfjsStatus.style.color = "#fbbf24";
            }

            try {
                // Carga dinámica local usando IndexedDB y FileReader en TF.js
                state.tfModel = await tf.loadLayersModel(tf.io.browserFiles([modelJsonFile, ...weightsFiles]));
                await warmUpModel(state.tfModel);
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Motor IA: Red Neuronal Personalizada cargada con éxito";
                    tfjsStatus.style.color = "#10b981";
                }
                showToast("Modelo de IA personalizado conectado con éxito", "success");
            } catch (err) {
                console.error("Error al cargar modelo subido:", err);
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Error: Fallo al cargar los archivos de la Red Neuronal";
                    tfjsStatus.style.color = "#ef4444";
                }
                showToast("Error al procesar modelo. Asegúrate que correspondan a TensorFlow.js", "danger");
            }
        }

async function loadTensorFlowModel() {
            const tfjsStatus = getTfjsStatus();
            if (typeof tf === 'undefined') {
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Visión: Librerías de red neuronal no cargadas";
                    tfjsStatus.style.color = "#ef4444";
                }
                return;
            }
            try {
                await tf.setBackend('webgl'); // Forzar explícitamente backend de GPU si está disponible
                console.log("Backend TFJS activo:", tf.getBackend());
            } catch (e) {
                console.warn("Backend WebGL no disponible, usando defecto:", e);
            }

            try {
                const isGithubPages = window.location.hostname.includes('github.io') || window.location.pathname.includes('/vitrodiag');
                const modelPath = isGithubPages ? 'model/model.json' : '/static/model/model.json';
                if (tfjsStatus) {
                    tfjsStatus.innerText = `Buscando modelo en ${modelPath}...`;
                }
                // Carga asíncrona del modelo guardado localmente en la PWA
                state.tfModel = await tf.loadLayersModel(modelPath);
                await warmUpModel(state.tfModel);
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Motor IA: Red Neuronal CNN cargada offline";
                    tfjsStatus.style.color = "#10b981"; // Verde (Success)
                }
            } catch (err) {
                console.log("No se encontró un modelo entrenado en /static/model/model.json. Usando diagnóstico de contornos.");
                if (tfjsStatus) {
                    tfjsStatus.innerText = "Motor de Visión: Análisis de Contornos Activo (Algorítmico)";
                    tfjsStatus.style.color = "#06b6d4"; // Cyan
                }
            }
        }

function fallbackAlgorithmicDiagnosis() {
    const tfjsStatus = getTfjsStatus();
    if (tfjsStatus) {
        tfjsStatus.innerText = "Motor OpenCV: Analizando contorno de la silueta...";
        tfjsStatus.style.color = "#10b981";
    }
    
    const borders = state.lastProcessedBorders;
    const width = state.lastBordersWidth;
    const height = state.lastBordersHeight;

    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');

    if (!borders || width === 0 || height === 0) {
        if (diagTitulo) diagTitulo.innerText = "⚠️ SILUETA NO DETECTADA";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Inconcluso";
        }
        if (diagEstado) diagEstado.innerText = "El sistema no detecta suficientes bordes para realizar la comparación geométrica.";
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>Comprobar alineación de la botella respecto al molde patrón.</li>
                <li>Asegurarse de activar el 'Modo Contorno / Silueta'.</li>
            `;
        }
        return;
    }

    let leftCount = 0;
    let rightCount = 0;
    let totalPixels = 0;

    // Escanear la región de interés central (20% a 80% de altura, 10% a 90% de ancho)
    const startY = Math.floor(height * 0.2);
    const endY = Math.floor(height * 0.8);
    const startX = Math.floor(width * 0.1);
    const endX = Math.floor(width * 0.9);
    const midX = Math.floor(width / 2);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const pixelVal = borders[y * width + x];
            if (pixelVal > 128) {
                totalPixels++;
                if (x < midX) {
                    leftCount++;
                } else {
                    rightCount++;
                }
            }
        }
    }

    // Si detectamos menos de 100 píxeles de bordes, no es una silueta válida
    if (totalPixels < 100) {
        if (diagTitulo) diagTitulo.innerText = "⚠️ SILUETA NO DETECTADA";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Inconcluso";
        }
        if (diagEstado) diagEstado.innerText = "El sistema detecta una cantidad de bordes demasiado baja (" + totalPixels + ") para comparación.";
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>Intenta incrementar el 'Filtro de Contraste' o ajustar el 'Umbral Canny'.</li>
                <li>Verificar que haya suficiente contraste detrás de la botella.</li>
            `;
        }
        return;
    }

    // Medimos la asimetría horizontal (desvío porcentual)
    const pixelDiff = Math.abs(leftCount - rightCount) / (totalPixels || 1);
    
    // Obtener la tolerancia recomendada (porcentaje de desvío aceptable)
    const sliderVal = document.getElementById('sliderTolerance') ? document.getElementById('sliderTolerance').value : 8;
    const tolerancePercent = (parseInt(sliderVal) || 8) / 100; // Ej: 8% (0.08)

    console.log(`[OpenCV] Izquierda: ${leftCount} | Derecha: ${rightCount} | Total: ${totalPixels} | Asimetría: ${(pixelDiff * 100).toFixed(2)}% | Tolerancia: ${(tolerancePercent * 100).toFixed(1)}%`);

    if (pixelDiff > tolerancePercent) {
        // Asimetría superior a la tolerancia: Defecto detectado
        if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico (Algorítmico): Cuello Torcido / Deformado";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Rechazo Inmediato";
        }
        if (diagEstado) diagEstado.innerText = `Asimetría geométrica detectada: ${(pixelDiff * 100).toFixed(1)}% (Tolerancia máxima permitida: ${(tolerancePercent * 100).toFixed(1)}%).`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li><strong>Mecanismo IS:</strong> Ajustar alineación de la pinza de transferencia y brazo de soplado.</li>
                <li><strong>Moldería:</strong> Inspeccionar corona y encaje del anillo de cuello.</li>
                <li><strong>Proceso:</strong> Revisar distribución de vidrio en el parison.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor de Visión: Defecto detectado (Desvío: ${(pixelDiff * 100).toFixed(1)}%)`;
            tfjsStatus.style.color = "#ef4444";
        }
    } else {
        // Simétrico: Botella conforme
        if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) diagEstado.innerText = `Simetría dentro de los parámetros: ${(pixelDiff * 100).toFixed(1)}% de desvío (Límite: ${(tolerancePercent * 100).toFixed(1)}%).`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>El envase cumple con los parámetros básicos de simetría estructural.</li>
                <li>Mantener velocidad nominal de producción.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor de Visión: Envase Aceptable (Desvío: ${(pixelDiff * 100).toFixed(1)}%)`;
            tfjsStatus.style.color = "#10b981";
        }
    }
}


export function runLiveDiagnosis() {
    const canvas = getCanvas();
    const tfjsStatus = getTfjsStatus();
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');

    if (!state.lastProcessedBorders) {
        if (diagTitulo) diagTitulo.innerText = "📷 Alineando Botella...";
        if (diagGravedad) {
            diagGravedad.style.display = "none";
        }
        if (diagEstado) diagEstado.innerText = "Esperando que el envase se alinee con las guías de la cámara.";
        if (diagAcciones) diagAcciones.innerHTML = "<li>Alinea el cuello y cuerpo de la botella dentro de las guías verdes de alineación.</li>";
        return;
    }

    // Ejecutar diagnóstico en caliente
    if (typeof tf !== 'undefined' && state.tfModel && canvas) {
        try {
            const inputTensor = tf.tidy(() => {
                const img = tf.browser.fromPixels(canvas);
                const resized = tf.image.resizeBilinear(img, [224, 224]);
                const normalized = resized.div(255.0);
                return normalized.expandDims(0);
            });

            const prediction = state.tfModel.predict(inputTensor);
            const data = prediction.dataSync();
            const prob = data[0];
            
            inputTensor.dispose();
            prediction.dispose();

            const confThreshold = state.confidenceThreshold / 100;

            if (prob > confThreshold) {
                if (tfjsStatus) {
                    tfjsStatus.innerText = `⚠️ Motor IA: Defecto Confirmado (Confianza ${(prob*100).toFixed(1)}%)`;
                    tfjsStatus.style.color = "#ef4444";
                }
                
                if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico: Cuello Torcido";
                if (diagGravedad) {
                    diagGravedad.className = "status-alert status-danger";
                    diagGravedad.style.display = "inline-block";
                    diagGravedad.innerText = "Rechazo Inmediato";
                }
                if (diagEstado) diagEstado.innerText = "El motor de visión artificial ha detectado una asimetría estructural grave.";
                if (diagAcciones) {
                    diagAcciones.innerHTML = `
                        <li><strong>Motor IS:</strong> Revisar alineación de mecanismos de cuello.</li>
                        <li><strong>Molde:</strong> Inspeccionar estado de los anillos de cuello.</li>
                        <li><strong>Preforma:</strong> Verificar distribución de masa en zona superior.</li>
                    `;
                }
            } else {
                if (tfjsStatus) {
                    tfjsStatus.innerText = `✅ Motor IA: Silueta Normal (Confianza ${(prob*100).toFixed(1)}%)`;
                    tfjsStatus.style.color = "#10b981";
                }
                
                if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
                if (diagGravedad) {
                    diagGravedad.className = "status-alert status-success";
                    diagGravedad.style.display = "inline-block";
                    diagGravedad.innerText = "Aceptable";
                }
                if (diagEstado) diagEstado.innerText = "El modelo no ha detectado malformaciones críticas.";
                if (diagAcciones) {
                    diagAcciones.innerHTML = `
                        <li>El envase cumple con la simetría básica estructural.</li>
                    `;
                }
            }
        } catch (e) {
            console.error("Error en inferencia TFJS en tiempo real:", e);
            fallbackAlgorithmicDiagnosis();
        }
    } else {
        fallbackAlgorithmicDiagnosis();
    }
}

export { updateConfidenceThresholdDisplay, loadCustomUploadedModel, loadTensorFlowModel };
