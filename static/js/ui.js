import { state } from './state.js';
import { ARTICULOS_DEFAULT, DEFECTOS_DB, renderDefectsList, generateDefectIllustration } from './db.js';
import { startDiagnosticCamera, stopDiagnosticCamera, startScannerCamera, stopScannerCamera } from './camera.js';
import { startProcessing, stopProcessing } from './vision.js';
import { calculateSopMs } from './timing.js';



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
            document.getElementById('articlesModal').classList.add('active');
            const selectModal = document.getElementById('modalSelectArticle');
            if (selectModal) {
                // Seleccionar por defecto el artículo activo
                selectModal.value = state.activeArticle.id;
                loadArticleInModal(state.activeArticle.id);
            }
        }

function closeArticlesModal() {
            document.getElementById('articlesModal').classList.remove('active');
        }

function loadArticleInModal(id) {
            const article = state.articulosList.find(a => a.id === id);
            if (!article) return;

            document.getElementById('artId').value = article.id;
            document.getElementById('artNombre').value = article.nombre;
            document.getElementById('artBpm').value = article.bpm;
            document.getElementById('artSecciones').value = article.secciones;
            document.getElementById('artCavidades').value = article.cavidades;
            document.getElementById('artSwab').value = article.swabInterval;
            document.getElementById('artProceso').value = article.proceso;
            document.getElementById('artAltura').value = article.altura;
            document.getElementById('artCuerpo').value = article.diametroCuerpo;
            document.getElementById('artBoca').value = article.diametroBoca;
        }

function saveActiveArticleForm() {
            const id = document.getElementById('artId').value;
            const article = state.articulosList.find(a => a.id === id);
            
            if (!article) return;

            article.nombre = document.getElementById('artNombre').value;
            article.bpm = parseFloat(document.getElementById('artBpm').value) || 120;
            article.secciones = parseInt(document.getElementById('artSecciones').value) || 8;
            article.cavidades = parseInt(document.getElementById('artCavidades').value) || 2;
            article.swabInterval = parseInt(document.getElementById('artSwab').value) || 20;
            article.proceso = document.getElementById('artProceso').value;
            article.altura = parseFloat(document.getElementById('artAltura').value) || 200;
            article.diametroCuerpo = parseFloat(document.getElementById('artCuerpo').value) || 70;
            article.diametroBoca = parseFloat(document.getElementById('artBoca').value) || 26;

            localStorage.setItem('vitrodiag_articulos', JSON.stringify(state.articulosList));
            
            // Si el editado es el activo, actualizar
            if (state.activeArticle.id === id) {
                state.activeArticle = article;
                applyActiveArticleParams();
            }

            populateArticleSelects();
            // Mantener selección del modal en el editado
            document.getElementById('modalSelectArticle').value = id;

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
            const searchVal = document.getElementById('searchInput').value.toLowerCase();
            
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
            if (state.isCameraTransitioning) {
                console.log("Cámara ocupada liberando/adquiriendo hardware. Ignorando cambio de pestaña.");
                return;
            }
            state.isCameraTransitioning = true;
            let activeViewId;

            try {
                // Ocultar todas las vistas
                document.querySelectorAll('.view-content').forEach(view => {
                    view.classList.remove('active');
                });
                // Desactivar todos los botones
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Encontrar botón cliqueado por onclick de forma segura
                const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
                    const clickAttr = btn.getAttribute('onclick');
                    return clickAttr && clickAttr.includes(viewName);
                });
                if (targetBtn) targetBtn.classList.add('active');

                // Mostrar la vista objetivo
                const targetView = document.getElementById(viewName + 'View');
                if (targetView) {
                    targetView.classList.add('active');
                    activeViewId = viewName + 'View';
                }

                // Gestión y liberación cruzada de hardware de cámaras para evitar congelamiento
                if (viewName === 'live') {
                    stopScannerCamera(); // Detener cámara de escáner al volver a Diagnóstico
                    await new Promise(resolve => setTimeout(resolve, 350)); // Delay para asegurar liberacion de hardware
                    await startDiagnosticCamera(); // Iniciar cámara de diagnóstico bajo demanda
                    const silhouetteToggle = document.getElementById('silhouetteToggle');
                    if (silhouetteToggle && silhouetteToggle.checked) startProcessing();
                } else if (viewName === 'scanner') {
                    stopProcessing(); 
                    stopDiagnosticCamera(); // Apagar cámara de diagnóstico al entrar a Escáner
                    await new Promise(resolve => setTimeout(resolve, 350)); // Delay para asegurar liberacion de hardware
                    // Encender la cámara del escáner si está en modo cámara activo
                    const btnCam = document.getElementById('btnScannerUseCam');
                    if (btnCam && btnCam.classList.contains('active')) {
                        await startScannerCamera();
                    }
                } else {
                    // Detener ambas cámaras para ahorrar CPU y RAM en el móvil
                    stopProcessing();
                    stopDiagnosticCamera();
                    stopScannerCamera();
                }

                // Al cambiar a directorio, renderizar la lista completa
                if (viewName === 'directory') {
                    renderDefectsList(DEFECTOS_DB);
                }

                // Delay de estabilización física del hardware de cámara antes de liberar el semáforo
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (err) {
                console.error("Error en transición de hardware de cámara:", err);
            } finally {
                state.isCameraTransitioning = false;
            }
        }

export function setupSilhouetteToggleListener() {
    const toggle = document.getElementById('silhouetteToggle');
    const webcamVideo = document.getElementById('webcam');
    const canvasOutput = document.getElementById('canvasOutput');
    const calibrationPanel = document.getElementById('calibrationPanel');

    if (toggle && webcamVideo && canvasOutput) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                canvasOutput.classList.remove('d-none');
                webcamVideo.classList.add('d-none');
                if (calibrationPanel) calibrationPanel.style.display = 'flex';
                startProcessing();
            } else {
                canvasOutput.classList.add('d-none');
                webcamVideo.classList.remove('d-none');
                if (calibrationPanel) calibrationPanel.style.display = 'none';
                stopProcessing();
            }
        });
    }
}

export { showToast, initArticles, populateArticleSelects, applyActiveArticleParams, changeActiveArticle, openArticlesModal, closeArticlesModal, loadArticleInModal, saveActiveArticleForm, resetArticlesDefault, toggleDefectCard, setFilter, filterDefects, switchView };

