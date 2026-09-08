// Estado Global Compartido de la Aplicación (ES Modules)
export const state = {
    articulosList: [],
    activeArticle: null,
    bitacoraList: [],
    scannerParsedValues: {},
    scannerImageBase64: null,
    diagnosticStream: null,
    scannerStream: null,
    streamActive: false,
    animationFrameId: null,
    tfModel: null,
    confidenceThreshold: 75,
    currentVisionMode: 'fine', // 'fine', 'sobel', 'thermal'
    isCameraTransitioning: false,
    lastProcessedBorders: null,
    lastBordersWidth: 0,
    lastBordersHeight: 0,
    currentFilterZone: "todo",
    
    // Temporizador de Swabbing
    swabTimerId: null,
    swabTimeLeft: 0,
    audioCtx: null,

    // Motor Híbrido de Detección (Gemini Vision + Algorítmico)
    geminiApiKey: null,
    isOnline: (typeof navigator !== 'undefined' && navigator.onLine) ? true : false,
    lastGeminiResult: null,
    geminiAnalyzing: false
};

const stateListeners = new Set();

/**
 * Suscribe un callback a cualquier cambio de estado reactivo.
 * @param {Function} listener
 * @returns {Function} Función para desuscribirse
 */
export function subscribe(listener) {
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
}

/**
 * Actualiza parcialmente el estado global y notifica a los suscriptores.
 * @param {Object} partialState
 */
export function updateState(partialState) {
    if (partialState && typeof partialState === 'object') {
        Object.assign(state, partialState);
        stateListeners.forEach(fn => {
            try { fn(state); } catch (err) { console.error('[State] Error en suscriptor:', err); }
        });
    }
}

if (typeof window !== 'undefined') {
    window.appState = state;
    window.subscribeState = subscribe;
    window.updateAppState = updateState;
}

