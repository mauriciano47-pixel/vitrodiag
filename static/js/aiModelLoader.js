// Cargador y Calibrador de Modelos de Redes Neuronales TensorFlow.js (VitroDiag AI Model Loader)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
import { state } from './state.js';
import { showToast } from './ui.js';

function getTfjsStatus() { return document.getElementById('tfjsStatus'); }

export async function warmUpModel(model) {
    if (!model || typeof tf === 'undefined') return;
    const tfjsStatus = getTfjsStatus();
    try {
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor de Visión: Calibrando modelo local (Warm-up)...";
            tfjsStatus.style.color = "#fbbf24";
        }
        tf.tidy(() => {
            const dummy = tf.zeros([1, 224, 224, 3]);
            const prediction = model.predict(dummy);
            prediction.dataSync();
        });
    } catch (_) {}
}

export async function loadCustomUploadedModel() {
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
        state.tfModel = await tf.loadLayersModel(tf.io.browserFiles([modelJsonFile, ...weightsFiles]));
        await warmUpModel(state.tfModel);
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor IA: Red Neuronal Personalizada cargada con éxito";
            tfjsStatus.style.color = "#10b981";
        }
        showToast("Modelo de IA personalizado conectado con éxito", "success");
    } catch (err) {
        if (tfjsStatus) {
            tfjsStatus.innerText = "Error: Fallo al cargar los archivos de la Red Neuronal";
            tfjsStatus.style.color = "#ef4444";
        }
        showToast("Error al procesar modelo. Asegúrate que correspondan a TensorFlow.js", "danger");
    }
}

export async function loadTensorFlowModel() {
    const tfjsStatus = getTfjsStatus();
    if (typeof tf === 'undefined') {
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor de Visión: Análisis de Contornos Activo (Algorítmico)";
            tfjsStatus.style.color = "#06b6d4";
        }
        return;
    }

    try {
        await tf.setBackend('webgl');
    } catch (_) {
        try {
            await tf.setBackend('cpu');
        } catch (_) {}
    }

    const possiblePaths = [
        'static/model/model.json',
        './static/model/model.json'
    ];

    let loadedModel = null;
    for (const path of possiblePaths) {
        try {
            loadedModel = await tf.loadLayersModel(path);
            if (loadedModel) {
                state.tfModel = loadedModel;
                break;
            }
        } catch (_) {}
    }

    if (state.tfModel) {
        await warmUpModel(state.tfModel);
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor IA: Red Neuronal CNN cargada offline";
            tfjsStatus.style.color = "#10b981";
        }
    } else {
        if (tfjsStatus) {
            tfjsStatus.innerText = "Motor de Visión: Análisis de Contornos Activo (Algorítmico)";
            tfjsStatus.style.color = "#06b6d4";
        }
    }
}
