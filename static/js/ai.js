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
        tfjsStatus.innerText = "Motor OpenCV: Analizando eje geométrico del cuello...";
        tfjsStatus.style.color = "#06b6d4";
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

    // Algoritmo de Eje de Simetría por Capas Horizontales (Seguimiento de Centroide Relativo)
    // 1. Analizar filas del cuerpo (zona inferior: 60% a 85% de altura) para establecer el eje de referencia
    const bodyCenters = [];
    const bodyWidths = [];
    const startBodyY = Math.floor(height * 0.60);
    const endBodyY = Math.floor(height * 0.85);

    for (let y = startBodyY; y < endBodyY; y += 4) { // Saltos de 4px para velocidad
        let leftX = -1;
        let rightX = -1;

        // Buscar borde izquierdo (hacia la derecha)
        for (let x = 0; x < width; x++) {
            if (borders[y * width + x] > 128) {
                leftX = x;
                break;
            }
        }

        // Buscar borde derecho (hacia la izquierda)
        for (let x = width - 1; x >= 0; x--) {
            if (borders[y * width + x] > 128) {
                rightX = x;
                break;
            }
        }

        // Si se encontraron ambos contornos de la botella y el ancho es coherente (> 15% del frame)
        if (leftX !== -1 && rightX !== -1 && (rightX - leftX) > (width * 0.15)) {
            bodyCenters.push((leftX + rightX) / 2);
            bodyWidths.push(rightX - leftX);
        }
    }

    // Si no logramos definir el cuerpo de la botella, alertar
    if (bodyCenters.length < 5) {
        if (diagTitulo) diagTitulo.innerText = "⚠️ DETECCIÓN INESTABLE";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Alineando";
        }
        if (diagEstado) diagEstado.innerText = "Asegúrese de que la botella esté bien contrastada respecto al fondo. Detectando bordes insuficientes.";
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>Prueba activar el 'Modo Contorno / Silueta' para verificar qué bordes ve la cámara.</li>
                <li>Asegúrese de evitar reflejos brillantes detrás de la botella.</li>
            `;
        }
        return;
    }

    // Promedio del eje central del cuerpo y ancho promedio
    const avgBodyCenter = bodyCenters.reduce((sum, val) => sum + val, 0) / bodyCenters.length;
    const avgBodyWidth = bodyWidths.reduce((sum, val) => sum + val, 0) / bodyWidths.length;

    // 2. Analizar filas de la zona del cuello (zona superior: 15% a 50% de altura)
    const neckDeviations = [];
    const startNeckY = Math.floor(height * 0.15);
    const endNeckY = Math.floor(height * 0.50);
    let validNeckLayers = 0;

    for (let y = startNeckY; y < endNeckY; y += 4) {
        let leftX = -1;
        let rightX = -1;

        for (let x = 0; x < width; x++) {
            if (borders[y * width + x] > 128) {
                leftX = x;
                break;
            }
        }

        for (let x = width - 1; x >= 0; x--) {
            if (borders[y * width + x] > 128) {
                rightX = x;
                break;
            }
        }

        // Para el cuello, el ancho debe ser menor que en el cuerpo pero mayor a 5% del frame
        if (leftX !== -1 && rightX !== -1 && (rightX - leftX) > (width * 0.05)) {
            const neckCenter = (leftX + rightX) / 2;
            const deviation = Math.abs(neckCenter - avgBodyCenter);
            neckDeviations.push(deviation);
            validNeckLayers++;
        }
    }

    // Si no logramos definir el cuello, advertir o caer en fallback
    if (validNeckLayers < 3) {
        runLegacyPixelCountDiagnosis(borders, width, height, avgBodyCenter);
        return;
    }

    // Encontrar la desviación máxima del cuello respecto al eje del cuerpo
    const maxDeviation = Math.max(...neckDeviations);
    
    // Asimetría porcentual real = (Desviación máxima / Ancho de la base) * 100
    const percentDeviation = (maxDeviation / avgBodyWidth) * 100;

    // Leer el slider de tolerancia (2% - 15%)
    const sliderVal = document.getElementById('sliderTolerance') ? document.getElementById('sliderTolerance').value : 8;
    const toleranceLimit = parseInt(sliderVal) || 8;

    console.log(`[Eje Simetría] Desviación Máxima: ${maxDeviation.toFixed(1)}px | Ancho Cuerpo: ${avgBodyWidth.toFixed(1)}px | Eje Cuerpo: ${avgBodyCenter.toFixed(1)} | Desvío Porcentual: ${percentDeviation.toFixed(2)}% | Límite Tolerancia: ${toleranceLimit}%`);

    if (percentDeviation > toleranceLimit) {
        // Cuello torcido confirmado
        if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico: Cuello Torcido / Deformado";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Rechazo Inmediato";
        }
        if (diagEstado) diagEstado.innerText = `Desviación del eje del cuello detectada: ${percentDeviation.toFixed(1)}% (Tolerancia máxima permitida: ${toleranceLimit}%).`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li><strong>Mecanismo IS:</strong> Ajustar alineación de la pinza de transferencia y brazo de soplado.</li>
                <li><strong>Moldería:</strong> Inspeccionar corona y encaje del anillo de cuello.</li>
                <li><strong>Proceso:</strong> Revisar distribución de vidrio en el parison y enfriamiento del macho.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Cuello Desviado (${percentDeviation.toFixed(1)}% / Límite ${toleranceLimit}%)`;
            tfjsStatus.style.color = "#ef4444";
        }
    } else {
        // Aceptable
        if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) diagEstado.innerText = `Simetría dentro de los parámetros: ${percentDeviation.toFixed(1)}% de desvío (Límite: ${toleranceLimit}%).`;
        if (diagAcciones) {
            diagAcciones.innerHTML = `
                <li>El envase cumple con los parámetros geométricos del artículo.</li>
                <li>Mantener velocidad nominal de producción.</li>
            `;
        }
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Envase Aceptable (Desvío: ${percentDeviation.toFixed(1)}%)`;
            tfjsStatus.style.color = "#10b981";
        }
    }
}

function runLegacyPixelCountDiagnosis(borders, width, height, avgBodyCenter) {
    const tfjsStatus = getTfjsStatus();
    const diagTitulo = document.getElementById('diagTitulo');
    const diagGravedad = document.getElementById('diagGravedad');
    const diagEstado = document.getElementById('diagEstado');
    const diagAcciones = document.getElementById('diagAcciones');
    
    let leftCount = 0;
    let rightCount = 0;
    let totalPixels = 0;

    const startY = Math.floor(height * 0.25);
    const endY = Math.floor(height * 0.75);
    const startX = Math.floor(width * 0.15);
    const endX = Math.floor(width * 0.85);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (borders[y * width + x] > 128) {
                totalPixels++;
                if (x < avgBodyCenter) {
                    leftCount++;
                } else {
                    rightCount++;
                }
            }
        }
    }

    const pixelDiff = Math.abs(leftCount - rightCount) / (totalPixels || 1);
    const sliderVal = document.getElementById('sliderTolerance') ? document.getElementById('sliderTolerance').value : 8;
    const tolerancePercent = (parseInt(sliderVal) || 8) / 100;

    if (pixelDiff > tolerancePercent) {
        if (diagTitulo) diagTitulo.innerText = "❌ Defecto Crítico (Algorítmico): Cuello Torcido";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-danger";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Rechazo Inmediato";
        }
        if (diagEstado) diagEstado.innerText = `Asimetría geométrica por densidad: ${(pixelDiff * 100).toFixed(1)}% (Límite: ${(tolerancePercent * 100).toFixed(1)}%).`;
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Defecto detectado (Desvío: ${(pixelDiff * 100).toFixed(1)}%)`;
            tfjsStatus.style.color = "#ef4444";
        }
    } else {
        if (diagTitulo) diagTitulo.innerText = "✅ Silueta dentro de tolerancias";
        if (diagGravedad) {
            diagGravedad.className = "status-alert status-success";
            diagGravedad.style.display = "inline-block";
            diagGravedad.innerText = "Aceptable";
        }
        if (diagEstado) diagEstado.innerText = `Simetría dentro de tolerancias por densidad: ${(pixelDiff * 100).toFixed(1)}% (Límite: ${(tolerancePercent * 100).toFixed(1)}%).`;
        if (tfjsStatus) {
            tfjsStatus.innerText = `Motor OpenCV: Envase Aceptable (Desvío: ${(pixelDiff * 100).toFixed(1)}%)`;
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
