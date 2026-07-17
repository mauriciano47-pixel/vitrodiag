import { state } from './state.js';
import { showToast } from './ui.js';
import { processFrame } from './vision.js';

const tfjsStatus = document.getElementById('tfjsStatus');
const toggle = document.getElementById('silhouetteToggle');
const btn = document.getElementById('btnDiagnosticar');
const btnReanudar = document.getElementById('btnReanudarCamara');
const card = document.getElementById('resultadoCard');
const canvas = document.getElementById('canvasOutput');

function updateConfidenceThresholdDisplay(val) {
            state.confidenceThreshold = parseInt(val);
            const badge = document.getElementById('iaConfidenceBadge');
            if (badge) badge.innerText = `Filtro: >${state.confidenceThreshold}%`;
        }

async function warmUpModel(model) {
    if (!model || typeof tf === 'undefined') return;
    try {
        tfjsStatus.innerText = "Motor IA: Compilando shaders (Warm-up)...";
        tfjsStatus.style.color = "#fbbf24";
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

            if (!jsonInput || !binInput || jsonInput.files.length === 0 || binInput.files.length === 0) {
                showToast("Debes seleccionar el archivo model.json y sus pesos (.bin)", "warning");
                return;
            }

            const modelJsonFile = jsonInput.files[0];
            const weightsFiles = Array.from(binInput.files);

            tfjsStatus.innerText = "Cargando modelo personalizado en GPU local...";
            tfjsStatus.style.color = "#fbbf24";

            try {
                // Carga dinámica local usando IndexedDB y FileReader en TF.js
                state.tfModel = await tf.loadLayersModel(tf.io.browserFiles([modelJsonFile, ...weightsFiles]));
                await warmUpModel(state.tfModel);
                tfjsStatus.innerText = "Motor IA: Red Neuronal Personalizada cargada con éxito";
                tfjsStatus.style.color = "#10b981";
                showToast("Modelo de IA personalizado conectado con éxito", "success");
            } catch (err) {
                console.error("Error al cargar modelo subido:", err);
                tfjsStatus.innerText = "Error: Fallo al cargar los archivos de la Red Neuronal";
                tfjsStatus.style.color = "#ef4444";
                showToast("Error al procesar modelo. Asegúrate que correspondan a TensorFlow.js", "danger");
            }
        }

async function loadTensorFlowModel() {
            if (typeof tf === 'undefined') {
                tfjsStatus.innerText = "Error: Librería TensorFlow.js no disponible";
                tfjsStatus.style.color = "#ef4444";
                return;
            }
            try {
                await tf.setBackend('webgl'); // Forzar explícitamente backend de GPU si está disponible
                console.log("Backend TFJS activo:", tf.getBackend());
            } catch (e) {
                console.warn("Backend WebGL no disponible, usando defecto:", e);
            }

            try {
                tfjsStatus.innerText = "Buscando modelo CNN en ./model/model.json...";
                // Carga asíncrona del modelo guardado localmente en la PWA
                state.tfModel = await tf.loadLayersModel('./model/model.json');
                await warmUpModel(state.tfModel);
                tfjsStatus.innerText = "Motor IA: Red Neuronal CNN cargada offline";
                tfjsStatus.style.color = "#10b981"; // Verde (Success)
            } catch (err) {
                console.log("No se encontró un modelo entrenado en ./model/model.json. Usando emulador de tensores.");
                tfjsStatus.innerText = "Motor IA: Modo Emulación (Listo para ./model/model.json)";
                tfjsStatus.style.color = "rgba(255, 111, 0, 0.7)"; // Naranja
            }
        }

function fallbackAlgorithmicDiagnosis() {
    tfjsStatus.innerText = "Motor IA: Emulando diagnóstico basado en asimetría OpenCV...";
    tfjsStatus.style.color = "rgba(255, 111, 0, 0.7)";
    setTimeout(() => {
        const threshold = parseInt(document.getElementById('sliderTolerance').value);
        if (state.lastProcessedBorders && state.lastProcessedBorders > (3000 - (threshold * 50))) {
            document.getElementById('diagTitulo').innerText = "❌ Defecto Crítico (Algorítmico): Cuello Torcido";
            document.getElementById('diagGravedad').className = "status-alert status-danger";
            document.getElementById('diagGravedad').style.display = "inline-block";
            document.getElementById('diagGravedad').innerText = "Rechazo Inmediato";
            document.getElementById('diagEstado').innerText = "La asimetría de contornos superó el umbral de tolerancia estructural (Opencv Canny/Sobel).";
            document.getElementById('diagAcciones').innerHTML = `
                <li><strong>Motor IS:</strong> Revisar alineación de mecanismos de cuello.</li>
                <li><strong>Molde:</strong> Inspeccionar estado de los anillos de cuello.</li>
            `;
            tfjsStatus.innerText = "Motor OpenCV: Defecto Estructural Detectado";
            tfjsStatus.style.color = "#ef4444";
        } else {
            document.getElementById('diagTitulo').innerText = "✅ Silueta dentro de tolerancias (Algorítmico)";
            document.getElementById('diagGravedad').className = "status-alert status-success";
            document.getElementById('diagGravedad').style.display = "inline-block";
            document.getElementById('diagGravedad').innerText = "Aceptable";
            document.getElementById('diagEstado').innerText = "El análisis algorítmico no detectó anomalías severas en la geometría actual.";
            document.getElementById('diagAcciones').innerHTML = `
                <li>El envase cumple con la simetría básica estructural.</li>
            `;
            tfjsStatus.innerText = "Motor OpenCV: Envase Aceptable";
            tfjsStatus.style.color = "#10b981";
        }
    }, 1000);
}

function setupAiEventListeners() {
    if(btn) {
        btn.addEventListener('click', () => {
            if (!toggle.checked) {
                showToast("Por favor, activa el 'Modo Contorno / Silueta' para congelar y diagnosticar el envase.", "warning");
                return;
            }

            if (!state.lastProcessedBorders) {
                showToast("Esperando a que la cámara detecte los bordes del envase...", "warning");
                return;
            }

            // 1. Congelar el frame actual
            state.streamActive = false; // Detiene la animación de processFrame

            // 2. Alternar visibilidad de botones
            btn.style.display = 'none';
            btnReanudar.style.display = 'block';

            // 3. Mostrar tarjeta en análisis
            card.style.display = 'block';
            document.getElementById('diagTitulo').innerText = "🤖 VitroDiag: Analizando Silueta...";
            document.getElementById('diagGravedad').className = "status-alert";
            document.getElementById('diagGravedad').style.display = "none";
            document.getElementById('diagEstado').innerText = "Analizando distribución de bordes y asimetría de la botella congelada...";
            document.getElementById('diagAcciones').innerHTML = "<li>Procesando algoritmos de visión...</li>";
            
            if (typeof tf !== 'undefined') {
                console.log("TensorFlow.js activo. Tensores iniciales en GPU:", tf.memory().numTensors);
                if (state.tfModel) {
                    tfjsStatus.innerText = "Motor IA: Ejecutando predicción en GPU (WebGL)...";
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
                        console.log(`[TF.JS] Confianza de Defecto: ${(prob*100).toFixed(2)}%`);
                        
                        inputTensor.dispose();
                        prediction.dispose();

                        const confThreshold = state.confidenceThreshold / 100;

                        if (prob > confThreshold) {
                            tfjsStatus.innerText = `⚠️ Motor IA: Defecto Confirmado (Confianza ${(prob*100).toFixed(1)}%)`;
                            tfjsStatus.style.color = "#ef4444";
                            
                            document.getElementById('diagTitulo').innerText = "❌ Defecto Crítico: Cuello Torcido";
                            document.getElementById('diagGravedad').className = "status-alert status-danger";
                            document.getElementById('diagGravedad').style.display = "inline-block";
                            document.getElementById('diagGravedad').innerText = "Rechazo Inmediato";
                            document.getElementById('diagEstado').innerText = "El motor de visión artificial ha detectado una asimetría estructural grave.";
                            document.getElementById('diagAcciones').innerHTML = `
                                <li><strong>Motor IS:</strong> Revisar alineación de mecanismos de cuello.</li>
                                <li><strong>Molde:</strong> Inspeccionar estado de los anillos de cuello.</li>
                                <li><strong>Preforma:</strong> Verificar distribución de masa en zona superior.</li>
                            `;
                        } else {
                            tfjsStatus.innerText = `✅ Motor IA: Silueta Normal (Confianza ${(prob*100).toFixed(1)}%)`;
                            tfjsStatus.style.color = "#10b981";
                            
                            document.getElementById('diagTitulo').innerText = "✅ Silueta dentro de tolerancias";
                            document.getElementById('diagGravedad').className = "status-alert status-success";
                            document.getElementById('diagGravedad').style.display = "inline-block";
                            document.getElementById('diagGravedad').innerText = "Aceptable";
                            document.getElementById('diagEstado').innerText = "El modelo no ha detectado malformaciones críticas.";
                            document.getElementById('diagAcciones').innerHTML = `
                                <li>El envase cumple con la simetría básica estructural.</li>
                            `;
                        }
                    } catch (e) {
                        console.error("Error en inferencia TFJS:", e);
                        tfjsStatus.innerText = "Error: Fallo durante inferencia neuronal";
                    }
                } else {
                    fallbackAlgorithmicDiagnosis();
                }
            } else {
                fallbackAlgorithmicDiagnosis();
            }
        });
    }

    if(btnReanudar) {
        btnReanudar.addEventListener('click', () => {
            btn.style.display = 'block';
            btnReanudar.style.display = 'none';
            card.style.display = 'none';
            state.streamActive = true;
            processFrame(); // Reanuda la captura continua de frames
        });
    }
}

export { updateConfidenceThresholdDisplay, loadCustomUploadedModel, loadTensorFlowModel, setupAiEventListeners };
