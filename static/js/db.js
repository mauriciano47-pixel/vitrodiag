// --- BASE DE DATOS Y CATÁLOGO INDUSTRIAL DE DEFECTOS (MÁQUINAS I.S. / VIDRIO HUECO) ---
// VitroDiag NEXUS - Arquitectura Modular Desacoplada (Zero-Monolith Standard)
import { ARTICULOS_DEFAULT } from './catalog/articulosDefault.js';
import { DEFECTOS_BOCA_CUELLO } from './catalog/defectosBocaCuello.js';
import { DEFECTOS_CUERPO } from './catalog/defectosCuerpo.js';
import { DEFECTOS_FONDO_GENERAL } from './catalog/defectosFondoGeneral.js';
import {
    generateDefectIllustration,
    renderDefectsList,
    getDefectsByZone,
    getDefectById,
    getDefectCatalogSummary,
    findDefectByIdOrFuzzy
} from './catalog/defectUtils.js';

export const DEFECTOS_DB = [
    ...DEFECTOS_BOCA_CUELLO,
    ...DEFECTOS_CUERPO,
    ...DEFECTOS_FONDO_GENERAL
];

export {
    ARTICULOS_DEFAULT,
    generateDefectIllustration,
    renderDefectsList,
    getDefectsByZone,
    getDefectById,
    getDefectCatalogSummary,
    findDefectByIdOrFuzzy
};

if (typeof window !== 'undefined') {
    window.DEFECTOS_DB = DEFECTOS_DB;
    window.renderDefectsList = renderDefectsList;
}
