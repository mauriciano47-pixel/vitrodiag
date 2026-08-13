import { state } from './state.js';
import { ARTICULOS_DEFAULT, DEFECTOS_DB, renderDefectsList, generateDefectIllustration } from './db.js';
import { startDiagnosticCamera, stopDiagnosticCamera, startScannerCamera, stopScannerCamera } from './camera.js';
import { startProcessing, stopProcessing } from './vision.js';
import { calculateSopMs } from './timing.js';
import { terminateTesseractWorker } from './ocr.js';
import { renderDatasetGallery, populateDatasetSelect } from './datasetManager.js';



function showToast(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <span>${message}</span>
                <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            `;

            container.appendChild(toast);

            // Forzar reflow para animación
            toast.offsetHeight;

            // Mostrar toast
            toast.classList.add('show');

            // Autodestrucción
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => {
                    toast.remove();
                });
            }, duration);
        }

function initArticles() {
            const saved = localStorage.getItem('vitrodiag_articulos');
            if (saved) {
                state.articulosList = JSON.parse(saved);
                
                // Forzar actualización de ssp_296 si estaba guardado con los valores antiguos (2 cavidades)
                const savedSsp = state.articulosList.find(a => a.id === "ssp_296");
                if (savedSsp && savedSsp.cavidades === 2) {
                    savedSsp.bpm = 396;
                    savedSsp.cavidades = 3;
                }

                // Si por alguna razón agregamos un artículo por defecto nuevo en el código y no está en localstorage:
                ARTICULOS_DEFAULT.forEach(defArt => {
                    if (!state.articulosList.some(a => a.id === defArt.id)) {
                        state.articulosList.push(defArt);
                    }
                });
                localStorage.setItem('vitrodiag_articulos', JSON.stringify(state.articulosList));
            } else {
                state.articulosList = JSON.parse(JSON.stringify(ARTICULOS_DEFAULT));
                localStorage.setItem('vitrodiag_articulos', JSON.stringify(state.articulosList));
            }
            
            // Cargar artículo activo
            let savedActiveId = localStorage.getItem('vitrodiag_active_article_id');
            // Si el active id no está guardado o es el viejo por defecto, cambiémoslo a ssp_296
            if (!savedActiveId || savedActiveId === "cerveza_330") {
                savedActiveId = "ssp_296";
            }
            state.activeArticle = state.articulosList.find(a => a.id === savedActiveId) || state.articulosList[0];
            localStorage.setItem('vitrodiag_active_article_id', state.activeArticle.id);

            populateArticleSelects();
            applyActiveArticleParams();
        }

function populateArticleSelects() {
            const selectActive = document.getElementById('activeArticleSelect');
            const selectModal = document.getElementById('modalSelectArticle');
            
            if (selectActive) {
                selectActive.innerHTML = state.articulosList.map(a => 
                    `<option value="${a.id}" ${a.id === state.activeArticle.id ? 'selected' : ''}>${a.nombre} (${a.proceso})</option>`
                ).join('');
            }
            if (selectModal) {
                selectModal.innerHTML = state.articulosList.map(a => 
                    `<option value="${a.id}">${a.nombre}</option>`
                ).join('');
            }
        }

function applyActiveArticleParams() {
            if (!state.activeArticle) return;

            // 1. Calculadora SOP: Cargar BPM, Secciones y Cavidades
            const calcBpm = document.getElementById('calcBpm');
            const calcSections = document.getElementById('calcSections');
            const calcCavities = document.getElementById('calcCavities');
            if (calcBpm) calcBpm.value = state.activeArticle.bpm;
            if (calcSections) calcSections.value = state.activeArticle.secciones;
            if (calcCavities) calcCavities.value = state.activeArticle.cavidades;
            if (typeof calculateSopMs === 'function') calculateSopMs();

            // 2. Temporizador Swabbing: Cargar intervalo
            const swabInterval = document.getElementById('swabInterval');
            if (swabInterval) swabInterval.value = state.activeArticle.swabInterval;

            // 3. Guías de la Cámara: Ajustar ancho y alto en píxeles basado en las cotas reales
            const guideNeck = document.querySelector('.guide-neck');
            const guideBody = document.querySelector('.guide-body');
            
            if (guideNeck && guideBody) {
                // Escala calibrada: 1mm físico = 1.1px en pantalla
                const scale = 1.1; 
                
                // Cálculo proporcional
                const neckWidthPx = state.activeArticle.diametroBoca * scale * 2.3;
                const neckHeightPx = (state.activeArticle.altura * 0.3) * scale;
                const bodyWidthPx = state.activeArticle.diametroCuerpo * scale * 2.1;
                const bodyHeightPx = (state.activeArticle.altura * 0.7) * scale;
                
                guideNeck.style.width = `${Math.round(neckWidthPx)}px`;
                guideNeck.style.height = `${Math.round(neckHeightPx)}px`;
                
                guideBody.style.width = `${Math.round(bodyWidthPx)}px`;
                guideBody.style.height = `${Math.round(bodyHeightPx)}px`;
            }
        }

function changeActiveArticle(id) {
            const article = state.articulosList.find(a => a.id === id);
            if (article) {
                state.activeArticle = article;
                localStorage.setItem('vitrodiag_active_article_id', article.id);
                applyActiveArticleParams();
                showToast(`Artículo activo cambiado: ${article.nombre}`, 'success');
            }
        }

function openArticlesModal() {
            document.getElementById('articlesModal')?.classList?.add('active');
            const selectModal = document.getElementById('modalSelectArticle');
            if (selectModal) {
                // Seleccionar por defecto el artículo activo
                selectModal.value = state.activeArticle.id;
                loadArticleInModal(state.activeArticle.id);
            }
        }

function closeArticlesModal() {
            document.getElementById('articlesModal')?.classList?.remove('active');
        }

function loadArticleInModal(id) {
            const article = state.articulosList.find(a => a.id === id);
            if (!article) return;

            document.getElementById('artId')?.value = article.id;
            document.getElementById('artNombre')?.value = article.nombre;
            document.getElementById('artBpm')?.value = article.bpm;
            document.getElementById('artSecciones')?.value = article.secciones;
            document.getElementById('artCavidades')?.value = article.cavidades;
            document.getElementById('artSwab')?.value = article.swabInterval;
            document.getElementById('artProceso')?.value = article.proceso;
            document.getElementById('artAltura')?.value = article.altura;
            document.getElementById('artCuerpo')?.value = article.diametroCuerpo;
            document.getElementById('artBoca')?.value = article.diametroBoca;
        }

function saveActiveArticleForm() {
            const id = document.getElementById('artId')?.value;
            const article = state.articulosList.find(a => a.id === id);
            
            if (!article) return;

            article.nombre = document.getElementById('artNombre')?.value;
            article.bpm = parseFloat(document.getElementById('artBpm')?.value) || 120;
            article.secciones = parseInt(document.getElementById('artSecciones')?.value) || 8;
            article.cavidades = parseInt(document.getElementById('artCavidades')?.value) || 2;
            article.swabInterval = parseInt(document.getElementById('artSwab')?.value) || 20;
            article.proceso = document.getElementById('artProceso')?.value;
            article.altura = parseFloat(document.getElementById('artAltura')?.value) || 200;
            article.diametroCuerpo = parseFloat(document.getElementById('artCuerpo')?.value) || 70;
            article.diametroBoca = parseFloat(document.getElementById('artBoca')?.value) || 26;

            localStorage.setItem('vitrodiag_articulos', JSON.stringify(state.articulosList));
            
            // Si el editado es el activo, actualizar
            if (state.activeArticle.id === id) {
                state.activeArticle = article;
                applyActiveArticleParams();
            }

            populateArticleSelects();
            // Mantener selección del modal en el editado
            document.getElementById('modalSelectArticle')?.value = id;

            showToast("Ficha técnica del artículo actualizada con éxito", "success");
            closeArticlesModal();
        }

function resetArticlesDefault() {
            if (confirm("¿Estás seguro de que deseas restaurar las fichas técnicas por defecto? Perderás cualquier cambio realizado.")) {
                state.articulosList = JSON.parse(JSON.stringify(ARTICULOS_DEFAULT));
                localStorage.setItem('vitrodiag_articulos', JSON.stringify(state.articulosList));
                
                // Mantener artículo activo si aún existe
                state.activeArticle = state.articulosList.find(a => a.id === state.activeArticle.id) || state.articulosList[0];
                localStorage.setItem('vitrodiag_active_article_id', state.activeArticle.id);
                
                populateArticleSelects();
                applyActiveArticleParams();
                loadArticleInModal(state.activeArticle.id);
                showToast("Fichas técnicas restauradas de fábrica", "info");
                closeArticlesModal();
            }
        }

function toggleDefectCard(headerElement) {
            const item = headerElement.parentElement;
            const isOpen = item.classList.contains('open');
            
            // Cerrar otros abiertos para mantener limpio
            document.querySelectorAll('.defect-item.open').forEach(el => {
                if (el !== item) el.classList.remove('open');
            });

            if (isOpen) {
                item.classList.remove('open');
            } else {
                item.classList.add('open');
            }
        }

function setFilter(zone, buttonElement) {
            // Activar botón del filtro
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            buttonElement.classList.add('active');
            
            state.currentFilterZone = zone;
            filterDefects();
        }

function filterDefects() {
            const searchVal = document.getElementById('searchInput')?.value.toLowerCase();
            
            const filtered = DEFECTOS_DB.filter(defect => {
                const matchesSearch = defect.nombre.toLowerCase().includes(searchVal) || 
                                     defect.descripcion.toLowerCase().includes(searchVal) ||
                                     defect.gravedad.toLowerCase().includes(searchVal);
                
                const matchesZone = state.currentFilterZone === "todo" || defect.zona === state.currentFilterZone;
                
                return matchesSearch && matchesZone;
            });
            
            renderDefectsList(filtered);
        }

async function switchView(viewName) {
    try {
        // 1. CAMBIO VISUAL INSTANTÁNEO EN EL DOM
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activar el botón cliqueado
        const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
            const clickAttr = btn.getAttribute('onclick');
            return clickAttr && clickAttr.includes(viewName);
        });
        if (targetBtn) targetBtn.classList.add('active');

        // Mostrar la vista seleccionada
        const targetView = document.getElementById(viewName + 'View');
        if (targetView) {
            targetView.classList.add('active');
        }

        // 2. INICIALIZAR CONTENIDO DEL MÓDULO OBJETIVO
        if (viewName === 'directory') {
            renderDefectsList(DEFECTOS_DB);
        } else if (viewName === 'dataset') {
            try {
                populateDatasetSelect();
                renderDatasetGallery();
            } catch (dsErr) {
                console.error("[NEXUS] Error cargando Banco IA:", dsErr);
            }
        }
    } catch (err) {
        console.error("[NEXUS] Error en transición de vista:", err);
    }
}

export function setupSilhouetteToggleListener() {
    const toggle = document.getElementById('silhouetteToggle');
    const webcamVideo = document.getElementById('webcam');
    const canvasOutput = document.getElementById('canvasOutput');
    const calibrationPanel = document.getElementById('calibrationPanel');

    if (toggle && webcamVideo && canvasOutput) {
        const applyToggleState = () => {
            if (toggle.checked) {
                canvasOutput.classList.remove('d-none');
                webcamVideo.style.opacity = '0';
                webcamVideo.style.pointerEvents = 'none';
                if (calibrationPanel) calibrationPanel.classList.add('visible');
            } else {
                canvasOutput.classList.add('d-none');
                webcamVideo.style.opacity = '1';
                webcamVideo.style.pointerEvents = 'auto';
                if (calibrationPanel) calibrationPanel.classList.remove('visible');
            }
        };

        // Aplicar estado inicial al arrancar la app
        applyToggleState();

        toggle.addEventListener('change', applyToggleState);
    }
}

export function switchToolTab(tabName) {
    try {
        const subtabs = document.querySelectorAll('.tool-subtab');
        subtabs.forEach(tab => {
            const onclickAttr = tab.getAttribute('onclick') || '';
            if (onclickAttr.includes(`'${tabName}'`)) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const contents = document.querySelectorAll('.tool-content');
        contents.forEach(content => {
            const targetId = `tool${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Content`;
            if (content.id.toLowerCase() === targetId.toLowerCase() || content.id === `${tabName}Content`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    } catch (err) {
        console.error("[NEXUS] Error cambiando subpestaña de herramientas:", err);
    }
}

if (typeof window !== 'undefined') {
    window.switchView = switchView;
    window.switchToolTab = switchToolTab;
    window.renderDefectsList = renderDefectsList;
    window.DEFECTOS_DB = DEFECTOS_DB;
}

export { showToast, initArticles, populateArticleSelects, applyActiveArticleParams, changeActiveArticle, openArticlesModal, closeArticlesModal, loadArticleInModal, saveActiveArticleForm, resetArticlesDefault, toggleDefectCard, setFilter, filterDefects, switchView, switchToolTab };

