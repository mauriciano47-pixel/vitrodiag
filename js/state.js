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
    audioCtx: null
};
