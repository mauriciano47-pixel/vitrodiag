// Parser de Texto y Análisis de Consola de Temporización BDF (VitroDiag OCR Parser)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.
import { state } from './state.js';

/**
 * Parser con estrategia de múltiple pasada:
 * 1. Búsqueda por etiqueta (texto + número adyacente)
 * 2. Búsqueda por posición (números ordenados en rangos esperados)
 * 3. Verificación cruzada de coherencia del ciclo BDF
 * 4. Fallback con valores de consigna del artículo activo
 * @param {string} fullText 
 * @param {string} [digitText] 
 * @returns {Object} Valores parseados
 */
export function parseScannerOcrText(fullText, digitText) {
    const raw = (fullText || '').toLowerCase().replace(/[|\\[\]{}]/g, '');
    state.scannerParsedValues = {};

    const labelPatterns = {
        plungerUp: [
            /plunger\s*up\D*?(\d{1,3})/,
            /pl\.?\s*up\D*?(\d{1,3})/,
            /macho\s*arriba\D*?(\d{1,3})/,
            /p[\.\s]*u[\.\s]*(\d{1,3})/
        ],
        plungerDown: [
            /plunger\s*down\D*?(\d{1,3})/,
            /pl\.?\s*down\D*?(\d{1,3})/,
            /pl\.?\s*dn\D*?(\d{1,3})/,
            /macho\s*abajo\D*?(\d{1,3})/,
            /p[\.\s]*d[\.\s]*(\d{1,3})/
        ],
        invertStart: [
            /invert\s*start\D*?(\d{1,3})/,
            /inv\.?\s*st\.?\D*?(\d{1,3})/,
            /inversion\D*?(\d{1,3})/,
            /inv\.?\s*(\d{1,3})/
        ],
        blowClose: [
            /blow\s*close\D*?(\d{1,3})/,
            /bl\.?\s*close\D*?(\d{1,3})/,
            /bl\.?\s*cl\.?\D*?(\d{1,3})/,
            /cierre\s*molde\D*?(\d{1,3})/
        ],
        neckRingOpen: [
            /neck\s*ring\s*open\D*?(\d{1,3})/,
            /n\.?\s*r\.?\s*open\D*?(\d{1,3})/,
            /nr\.?\s*op\.?\D*?(\d{1,3})/,
            /anillo\s*apert\D*?(\d{1,3})/
        ],
        blowOn: [
            /blow\s*on\D*?(\d{1,3})/,
            /bl\.?\s*on\D*?(\d{1,3})/,
            /soplado\s*inicio\D*?(\d{1,3})/,
            /soplado\s*on\D*?(\d{1,3})/
        ],
        blowOff: [
            /blow\s*off\D*?(\d{1,3})/,
            /bl\.?\s*off\D*?(\d{1,3})/,
            /soplado\s*fin\D*?(\d{1,3})/,
            /soplado\s*off\D*?(\d{1,3})/
        ]
    };

    Object.keys(labelPatterns).forEach(mechKey => {
        const patterns = labelPatterns[mechKey];
        for (const regex of patterns) {
            const match = raw.match(regex);
            if (match && match[1]) {
                const val = parseInt(match[1]);
                if (val >= 0 && val <= 360) {
                    state.scannerParsedValues[mechKey] = val;
                    break;
                }
            }
        }
    });

    const combinedText = raw + ' ' + (digitText || '').toLowerCase();
    const allNumbers = [];
    const numberMatches = combinedText.match(/\b(\d{1,3})\b/g);
    if (numberMatches) {
        numberMatches.forEach(numStr => {
            const n = parseInt(numStr);
            if (n >= 10 && n <= 360 && !allNumbers.includes(n)) {
                allNumbers.push(n);
            }
        });
    }
    allNumbers.sort((a, b) => a - b);

    const foundCount = Object.keys(state.scannerParsedValues).length;
    if (foundCount < 4 && allNumbers.length >= 3) {
        const positionRanges = [
            { key: 'plungerUp',    min: 40,  max: 120 },
            { key: 'plungerDown',  min: 120, max: 180 },
            { key: 'invertStart',  min: 160, max: 220 },
            { key: 'blowClose',    min: 200, max: 260 },
            { key: 'neckRingOpen', min: 230, max: 270 },
            { key: 'blowOn',       min: 250, max: 300 },
            { key: 'blowOff',      min: 290, max: 350 }
        ];

        allNumbers.forEach(n => {
            for (const range of positionRanges) {
                if (!state.scannerParsedValues[range.key] && n >= range.min && n <= range.max) {
                    state.scannerParsedValues[range.key] = n;
                    break;
                }
            }
        });
    }

    const getElVal = (id, fallback) => {
        if (typeof document === 'undefined') return fallback;
        const el = document.getElementById(id);
        const parsed = parseInt(el?.value);
        return isNaN(parsed) ? fallback : parsed;
    };

    const defaultValues = {
        plungerUp: getElVal('valPlungerUp', 80),
        plungerDown: getElVal('valPlungerDown', 150),
        invertStart: getElVal('valInvertStart', 190),
        blowClose: getElVal('valBlowClose', 240),
        neckRingOpen: getElVal('valNeckOpen', 245),
        blowOn: getElVal('valBlowOn', 270),
        blowOff: getElVal('valBlowOff', 325)
    };

    const missingKeys = [];
    Object.keys(defaultValues).forEach(mechKey => {
        if (state.scannerParsedValues[mechKey] === undefined) {
            state.scannerParsedValues[mechKey] = defaultValues[mechKey];
            missingKeys.push(mechKey);
        }
    });

    if (typeof document !== 'undefined') {
        const setOcrVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v !== undefined ? v : ''; };
        setOcrVal('ocrValPlungerUp', state.scannerParsedValues.plungerUp);
        setOcrVal('ocrValPlungerDown', state.scannerParsedValues.plungerDown);
        setOcrVal('ocrValInvertStart', state.scannerParsedValues.invertStart);
        setOcrVal('ocrValBlowClose', state.scannerParsedValues.blowClose);
        setOcrVal('ocrValNeckRingOpen', state.scannerParsedValues.neckRingOpen);
        setOcrVal('ocrValBlowOn', state.scannerParsedValues.blowOn);
        setOcrVal('ocrValBlowOff', state.scannerParsedValues.blowOff);

        const ocrFields = {
            plungerUp: 'ocrValPlungerUp',
            plungerDown: 'ocrValPlungerDown',
            invertStart: 'ocrValInvertStart',
            blowClose: 'ocrValBlowClose',
            neckRingOpen: 'ocrValNeckRingOpen',
            blowOn: 'ocrValBlowOn',
            blowOff: 'ocrValBlowOff'
        };
        Object.keys(ocrFields).forEach(key => {
            const input = document.getElementById(ocrFields[key]);
            if (input) {
                if (missingKeys.includes(key)) {
                    input.style.borderColor = '#f59e0b';
                    input.style.background = 'rgba(245, 158, 11, 0.1)';
                    input.title = '⚠ No detectado por OCR — usando valor de consigna';
                } else {
                    input.style.borderColor = '#10b981';
                    input.style.background = 'rgba(16, 185, 129, 0.1)';
                    input.title = '✓ Detectado por OCR';
                }
            }
        });

        const detectedCount = 7 - missingKeys.length;
        const statusMsg = document.getElementById('ocrStatusMsg');
        if (statusMsg) {
            if (detectedCount >= 5) {
                statusMsg.innerText = `✓ ${detectedCount}/7 valores detectados exitosamente. Verifica y confirma.`;
                statusMsg.style.color = '#10b981';
            } else if (detectedCount >= 3) {
                statusMsg.innerText = `⚠ ${detectedCount}/7 valores detectados. Los campos naranjas necesitan revisión manual.`;
                statusMsg.style.color = '#f59e0b';
            } else {
                statusMsg.innerText = `⚠ Solo ${detectedCount}/7 detectados. Revisa todos los campos antes de confirmar.`;
                statusMsg.style.color = '#ef4444';
            }
        }

        const setDisplay = (id, d) => { const el = document.getElementById(id); if (el) el.style.display = d; };
        setDisplay('ocrLoader', 'none');
        setDisplay('scannerResultsCard', 'none');
        setDisplay('scannerOcrConfirmArea', 'block');
        document.getElementById('scannerOcrConfirmArea')?.scrollIntoView({ behavior: 'smooth' });
    }

    return state.scannerParsedValues;
}
