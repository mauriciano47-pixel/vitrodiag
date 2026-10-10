// --- BASE DE DATOS DE ARTÍCULOS ESTÁNDAR Y PERSONALIZADOS (MANUFACTURA VIDRIO HUECO) ---
        export const ARTICULOS_DEFAULT = [
            {
                id: "ssp_296",
                nombre: "Botella SSP 296cc (NNPB)",
                bpm: 396, // Velocidad real: 396 BPM a Triple Gota (12 ciclos/sección)
                secciones: 11,
                cavidades: 3,
                swabInterval: 20,
                altura: 244.2,
                diametroCuerpo: 57.8,
                diametroBoca: 26,
                proceso: "NNPB"
            },
            {
                id: "cerveza_330",
                nombre: "Botella Cerveza 330ml One-Way (NNPB)",
                bpm: 260,
                secciones: 10,
                cavidades: 2,
                swabInterval: 20,
                altura: 205.5,
                diametroCuerpo: 59.0,
                diametroBoca: 26,
                proceso: "NNPB"
            },
            {
                id: "cerveza_330_ret",
                nombre: "Botella Cerveza 330ml Retornable (Blow-Blow)",
                bpm: 220,
                secciones: 10,
                cavidades: 2,
                swabInterval: 20,
                altura: 216.5,
                diametroCuerpo: 61.8,
                diametroBoca: 26,
                proceso: "Blow-Blow"
            },
            {
                id: "cerveza_corona_330",
                nombre: "Botella Cerveza Corona 330ml (NNPB)",
                bpm: 320,
                secciones: 12,
                cavidades: 2,
                swabInterval: 20,
                altura: 228.0,
                diametroCuerpo: 60.5,
                diametroBoca: 26,
                proceso: "NNPB"
            },
            {
                id: "cerveza_becker_330",
                nombre: "Botella Cerveza Becker 330ml (NNPB)",
                bpm: 330,
                secciones: 12,
                cavidades: 2,
                swabInterval: 20,
                altura: 207.0,
                diametroCuerpo: 59.5,
                diametroBoca: 26,
                proceso: "NNPB"
            },
            {
                id: "cerveza_stella_330",
                nombre: "Botella Cerveza Stella Artois 330ml (NNPB)",
                bpm: 300,
                secciones: 12,
                cavidades: 2,
                swabInterval: 20,
                altura: 222.0,
                diametroCuerpo: 60.0,
                diametroBoca: 26,
                proceso: "NNPB"
            },
            {
                id: "cerveza_1000_ret",
                nombre: "Botella Cerveza 1L Retornable (Blow-Blow)",
                bpm: 140,
                secciones: 10,
                cavidades: 2,
                swabInterval: 20,
                altura: 298.5,
                diametroCuerpo: 89.2,
                diametroBoca: 26,
                proceso: "Blow-Blow"
            },
            {
                id: "vino_750",
                nombre: "Botella Vino Bordelesa Estándar 750ml (Blow-Blow)",
                bpm: 110,
                secciones: 8,
                cavidades: 2,
                swabInterval: 15,
                altura: 300.2,
                diametroCuerpo: 75.4,
                diametroBoca: 29,
                proceso: "Blow-Blow"
            },
            {
                id: "bordelesa_conica_750",
                nombre: "Botella Vino Bordelesa Cónica 750ml (Blow-Blow)",
                bpm: 90,
                secciones: 8,
                cavidades: 2,
                swabInterval: 15,
                altura: 301.5,
                diametroCuerpo: 79.4,
                diametroBoca: 29,
                proceso: "Blow-Blow"
            },
            {
                id: "pisco_750",
                nombre: "Botella Pisco 750ml (Blow-Blow)",
                bpm: 110,
                secciones: 8,
                cavidades: 2,
                swabInterval: 20,
                altura: 279.5,
                diametroCuerpo: 78.0,
                diametroBoca: 28,
                proceso: "Blow-Blow"
            },
            {
                id: "gaseosa_1250_ret",
                nombre: "Botella Gaseosa 1.25L Retornable (Blow-Blow)",
                bpm: 120,
                secciones: 10,
                cavidades: 2,
                swabInterval: 20,
                altura: 312.0,
                diametroCuerpo: 94.6,
                diametroBoca: 28,
                proceso: "Blow-Blow"
            },
            {
                id: "gaseosa_237_ow",
                nombre: "Botella Gaseosa 237ml One-Way (NNPB)",
                bpm: 360,
                secciones: 12,
                cavidades: 2,
                swabInterval: 20,
                altura: 196.2,
                diametroCuerpo: 55.8,
                diametroBoca: 26,
                proceso: "NNPB"
            },
            {
                id: "pote_conserva_250",
                nombre: "Pote Conserva 250cc (Press-Blow)",
                bpm: 180,
                secciones: 8,
                cavidades: 2,
                swabInterval: 30,
                altura: 100.0,
                diametroCuerpo: 68.0,
                diametroBoca: 58,
                proceso: "Press-Blow"
            },
            {
                id: "frasco_mermelada_370",
                nombre: "Frasco Mermelada 370ml (Press-Blow)",
                bpm: 240,
                secciones: 8,
                cavidades: 2,
                swabInterval: 30,
                altura: 112.5,
                diametroCuerpo: 76.5,
                diametroBoca: 63,
                proceso: "Press-Blow"
            }
        ];

        let articulosList = [];
        let activeArticle = null;

        // Inicializar artículos en la base de datos local
        function initArticles() {
            const saved = localStorage.getItem('vitrodiag_articulos');
            if (saved) {
                articulosList = JSON.parse(saved);
                
                // Forzar actualización de ssp_296 si estaba guardado con los valores antiguos (2 cavidades)
                const savedSsp = articulosList.find(a => a.id === "ssp_296");
                if (savedSsp && savedSsp.cavidades === 2) {
                    savedSsp.bpm = 396;
                    savedSsp.cavidades = 3;
                }

                // Si por alguna razón agregamos un artículo por defecto nuevo en el código y no está en localstorage:
                ARTICULOS_DEFAULT.forEach(defArt => {
                    if (!articulosList.some(a => a.id === defArt.id)) {
                        articulosList.push(defArt);
                    }
                });
                localStorage.setItem('vitrodiag_articulos', JSON.stringify(articulosList));
            } else {
                articulosList = JSON.parse(JSON.stringify(ARTICULOS_DEFAULT));
                localStorage.setItem('vitrodiag_articulos', JSON.stringify(articulosList));
            }
            
            // Cargar artículo activo
            let savedActiveId = localStorage.getItem('vitrodiag_active_article_id');
            // Si el active id no está guardado o es el viejo por defecto, cambiémoslo a ssp_296
            if (!savedActiveId || savedActiveId === "cerveza_330") {
                savedActiveId = "ssp_296";
            }
            activeArticle = articulosList.find(a => a.id === savedActiveId) || articulosList[0];
            localStorage.setItem('vitrodiag_active_article_id', activeArticle.id);

            populateArticleSelects();
            applyActiveArticleParams();
        }

        function populateArticleSelects() {
            const selectActive = document.getElementById('activeArticleSelect');
            const selectModal = document.getElementById('modalSelectArticle');
            
            if (selectActive) {
                setSafeHTML(selectActive, articulosList.map(a => 
                    `<option value="${a.id}" ${a.id === activeArticle.id ? 'selected' : ''}>${a.nombre} (${a.proceso})</option>`
                ).join(''));
            }
            if (selectModal) {
                setSafeHTML(selectModal, articulosList.map(a => 
                    `<option value="${a.id}">${a.nombre}</option>`
                ).join(''));
            }
        }

        // Aplicar parámetros del artículo activo en la Calculadora SOP, temporizador de Swabbing e Interfaz
        function applyActiveArticleParams() {
            if (!activeArticle) return;

            // 1. Calculadora SOP: Cargar BPM, Secciones y Cavidades
            const calcBpm = document.getElementById('calcBpm');
            const calcSections = document.getElementById('calcSections');
            const calcCavities = document.getElementById('calcCavities');
            if (calcBpm) calcBpm.value = activeArticle.bpm;
            if (calcSections) calcSections.value = activeArticle.secciones;
            if (calcCavities) calcCavities.value = activeArticle.cavidades;
            if (typeof calculateSopMs === 'function') calculateSopMs();

            // 2. Temporizador Swabbing: Cargar intervalo
            const swabInterval = document.getElementById('swabInterval');
            if (swabInterval) swabInterval.value = activeArticle.swabInterval;

            // 3. Guías de la Cámara: Ajustar ancho y alto en píxeles basado en las cotas reales
            const guideNeck = document.querySelector('.guide-neck');
            const guideBody = document.querySelector('.guide-body');
            
            if (guideNeck && guideBody) {
                // Escala calibrada: 1mm físico = 1.1px en pantalla
                const scale = 1.1; 
                
                // Cálculo proporcional
                const neckWidthPx = activeArticle.diametroBoca * scale * 2.3;
                const neckHeightPx = (activeArticle.altura * 0.3) * scale;
                const bodyWidthPx = activeArticle.diametroCuerpo * scale * 2.1;
                const bodyHeightPx = (activeArticle.altura * 0.7) * scale;
                
                guideNeck.style.width = `${Math.round(neckWidthPx)}px`;
                guideNeck.style.height = `${Math.round(neckHeightPx)}px`;
                
                guideBody.style.width = `${Math.round(bodyWidthPx)}px`;
                guideBody.style.height = `${Math.round(bodyHeightPx)}px`;
            }
        }

        function changeActiveArticle(id) {
            const article = articulosList.find(a => a.id === id);
            if (article) {
                activeArticle = article;
                localStorage.setItem('vitrodiag_active_article_id', article.id);
                applyActiveArticleParams();
                showToast(`Artículo activo cambiado: ${article.nombre}`, 'success');
            }
        }

        // Modales de Gestión de Artículos
        function openArticlesModal() {
            document.getElementById('articlesModal')?.classList?.add('active');
            const selectModal = document.getElementById('modalSelectArticle');
            if (selectModal) {
                // Seleccionar por defecto el artículo activo
                selectModal.value = activeArticle.id;
                loadArticleInModal(activeArticle.id);
            }
        }

        function closeArticlesModal() {
            document.getElementById('articlesModal')?.classList?.remove('active');
        }

        function loadArticleInModal(id) {
            const article = articulosList.find(a => a.id === id);
            if (!article) return;

            const setVal = (elId, val) => {
                const el = document.getElementById(elId);
                if (el) el.value = val !== undefined && val !== null ? val : '';
            };

            setVal('artId', article.id);
            setVal('artNombre', article.nombre);
            setVal('artBpm', article.bpm);
            setVal('artSecciones', article.secciones);
            setVal('artCavidades', article.cavidades);
            setVal('artSwab', article.swabInterval);
            setVal('artProceso', article.proceso);
            setVal('artAltura', article.altura);
            setVal('artCuerpo', article.diametroCuerpo);
            setVal('artBoca', article.diametroBoca);
        }

        function saveActiveArticleForm() {
            const id = document.getElementById('artId')?.value;
            const article = articulosList.find(a => a.id === id);
            
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

            localStorage.setItem('vitrodiag_articulos', JSON.stringify(articulosList));
            
            // Si el editado es el activo, actualizar
            if (activeArticle.id === id) {
                activeArticle = article;
                applyActiveArticleParams();
            }

            populateArticleSelects();
            // Mantener selección del modal en el editado
            const modalSel = document.getElementById('modalSelectArticle');
            if (modalSel) modalSel.value = id;

            showToast("Ficha técnica del artículo actualizada con éxito", "success");
            closeArticlesModal();
        }

        function resetArticlesDefault() {
            if (confirm("¿Estás seguro de que deseas restaurar las fichas técnicas por defecto? Perderás cualquier cambio realizado.")) {
                articulosList = JSON.parse(JSON.stringify(ARTICULOS_DEFAULT));
                localStorage.setItem('vitrodiag_articulos', JSON.stringify(articulosList));
                
                // Mantener artículo activo si aún existe
                activeArticle = articulosList.find(a => a.id === activeArticle.id) || articulosList[0];
                localStorage.setItem('vitrodiag_active_article_id', activeArticle.id);
                
                populateArticleSelects();
                applyActiveArticleParams();
                loadArticleInModal(activeArticle.id);
                showToast("Fichas técnicas restauradas de fábrica", "info");
                closeArticlesModal();
            }
        }

        // Sistema de Notificaciones Toast
        function showToast(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            setSafeHTML(toast, `
                <span>${message}</span>
                <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            `);

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

