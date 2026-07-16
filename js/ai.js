import { state } from './state.js';
import { showToast } from './ui.js';

function updateConfidenceThresholdDisplay(val) {
            state.confidenceThreshold = parseInt(val);
            const badge = document.getElementById('iaConfidenceBadge');
            if (badge) badge.innerText = `Filtro: >${state.confidenceThreshold}%`;
        }

function loadCustomUploadedModel() {
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

function loadTensorFlowModel() {
            if (typeof tf === 'undefined') {
                tfjsStatus.innerText = "Error: Librería TensorFlow.js no disponible";
                tfjsStatus.style.color = "#ef4444";
                return;
            }
            try {
                tfjsStatus.innerText = "Buscando modelo CNN en ./model/model.json...";
                // Carga asíncrona del modelo guardado localmente en la PWA
                state.tfModel = await tf.loadLayersModel('./model/model.json');
                tfjsStatus.innerText = "Motor IA: Red Neuronal CNN cargada offline";
                tfjsStatus.style.color = "#10b981"; // Verde (Success)
            } catch (err) {
                console.log("No se encontró un modelo entrenado en ./model/model.json. Usando emulador de tensores.");
                tfjsStatus.innerText = "Motor IA: Modo Emulación (Listo para ./model/model.json)";
                tfjsStatus.style.color = "rgba(255, 111, 0, 0.7)"; // Naranja
            }
        }

export { updateConfidenceThresholdDisplay, loadCustomUploadedModel, loadTensorFlowModel };
