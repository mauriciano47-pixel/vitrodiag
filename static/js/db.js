        // --- BASE DE DATOS DE ARTÍCULOS ESTÁNDAR Y PERSONALIZADOS ---
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
                selectActive.innerHTML = articulosList.map(a => 
                    `<option value="${a.id}" ${a.id === activeArticle.id ? 'selected' : ''}>${a.nombre} (${a.proceso})</option>`
                ).join('');
            }
            if (selectModal) {
                selectModal.innerHTML = articulosList.map(a => 
                    `<option value="${a.id}">${a.nombre}</option>`
                ).join('');
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
            document.getElementById('articlesModal').classList.add('active');
            const selectModal = document.getElementById('modalSelectArticle');
            if (selectModal) {
                // Seleccionar por defecto el artículo activo
                selectModal.value = activeArticle.id;
                loadArticleInModal(activeArticle.id);
            }
        }

        function closeArticlesModal() {
            document.getElementById('articlesModal').classList.remove('active');
        }

        function loadArticleInModal(id) {
            const article = articulosList.find(a => a.id === id);
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
            const article = articulosList.find(a => a.id === id);
            
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

            localStorage.setItem('vitrodiag_articulos', JSON.stringify(articulosList));
            
            // Si el editado es el activo, actualizar
            if (activeArticle.id === id) {
                activeArticle = article;
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

        // BASE DE DATOS DE 32 DEFECTOS DE MÁQUINA I.S. (Clasificación de Emhart y Cristalerías)
        export const DEFECTOS_DB = [
            // --- BOCA (18 defectos) ---
            {
                id: "rebaba_boca",
                nombre: "Rebaba en la Boca (Overpressed Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Exceso de vidrio proyectado hacia arriba o a los lados en la cara de sellado de la boca, resultando en un borde filoso que puede causar cortes al consumidor o fugas en el taponado.",
                causas: [
                    "Sobrepeso persistente en la gota de vidrio fundido.",
                    "El macho de prensar (plunger) está desalineado o sube con exceso de fuerza.",
                    "El anillo de guía o el molde de boca están gastados, sucios o mal encastrados."
                ],
                acciones: [
                    "Reducir el peso de la gota regulando el tubo o aguja en el alimentador.",
                    "Disminuir la presión del aire de prensado o retardar el tiempo de plunger ON.",
                    "Cambiar o limpiar las platinas y la moldería de boca."
                ]
            },
            {
                id: "bajo_boca",
                nombre: "Boca Incompleta (Underfilled Finish / Bajo Boca)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Falta de vidrio en el contorno superior de la boca. La rosca o la cara de sellado quedan incompletas, impidiendo el correcto hermetismo del envase.",
                causas: [
                    "Gota de vidrio con peso inferior al rango nominal.",
                    "Presión de vacío de boca (Vacuum Fill) muy baja o nula.",
                    "Macho de prensar trabajando excesivamente frío o con carrera muy corta."
                ],
                acciones: [
                    "Aumentar el peso de la gota en el alimentador.",
                    "Verificar y aumentar la presión de vacío de boca en la sección.",
                    "Calentar el macho de la sección o aumentar la presión de aire de prensado."
                ]
            },
            {
                id: "grieta_boca",
                nombre: "Grieta en la Boca (Corkage Check)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Fisuras pequeñas en la parte interna o externa del labio de la boca. Suelen ser transparentes y difíciles de detectar a simple vista, pero debilitan la boca.",
                causas: [
                    "Choque térmico drástico debido a enfriamiento de boca excesivo.",
                    "Contacto violento del mecanismo de las pinzas de traspaso (Takeout).",
                    "El macho de prensado está muy frío en relación con el vidrio."
                ],
                acciones: [
                    "Disminuir la presión del enfriamiento de la moldería de boca.",
                    "Ajustar las pinzas del takeout para evitar golpear el envase recién formado.",
                    "Controlar la temperatura de los machos (swabbing correcto o menor aire interno)."
                ]
            },
            {
                id: "boca_inclinada",
                nombre: "Boca Inclinada (Crooked Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La boca está inclinada respecto al eje vertical de la botella, lo cual afecta el roscado automático.",
                causas: [
                    "Enfriamiento deficiente de la boca antes del traspaso.",
                    "El mecanismo de inversión (Invert) trabaja a velocidad excesiva.",
                    "Exceso de calor en el vidrio del parison."
                ],
                acciones: [
                    "Aumentar el tiempo o caudal de enfriamiento en el molde de boca.",
                    "Suavizar el movimiento del cilindro de inversión ajustando las válvulas amortiguadoras.",
                    "Reducir la temperatura global del alimentador de vidrio."
                ]
            },
            {
                id: "boca_hinchada",
                nombre: "Boca Hinchada (Bulged Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "El diámetro externo de la boca está sobredimensionado debido a deformación plástica posterior al prensado.",
                causas: [
                    "Vidrio del cuello demasiado caliente.",
                    "Presión interna de aire aplicada antes de que la boca esté lo suficientemente fría.",
                    "Falta de enfriamiento local."
                ],
                acciones: [
                    "Incrementar el flujo de aire de enfriamiento al molde de boca.",
                    "Ajustar los tiempos de soplado (Settle Blow / Blow Back) para enfriar el parison."
                ]
            },
            {
                id: "rosca_partida",
                nombre: "Rosca Partida (Split Thread)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Fisura o rotura en los hilos de la rosca del envase que impide un taponado firme.",
                causas: [
                    "El molde de boca abre de forma brusca o descalibrada.",
                    "El vidrio se adhiere a la rosca del molde por falta de lubricación."
                ],
                acciones: [
                    "Ajustar la apertura y alineación de los brazos del molde de boca.",
                    "Realizar un hisopeado (swabbing) limpio en la zona de la rosca."
                ]
            },
            {
                id: "boca_excentrica",
                nombre: "Boca Excéntrica (Offset Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La boca de la botella no está centrada con respecto al eje del cuerpo, viéndose desplazada lateralmente.",
                causas: [
                    "Los brazos del molde de boca no cierran simétricamente.",
                    "Holguras mecánicas severas en el cabezal de inversión de la sección."
                ],
                acciones: [
                    "Corregir el desgaste mecánico de los brazos porta-moldes.",
                    "Ajustar el alineado y la carrera de los mecanismos de la sección."
                ]
            },
            {
                id: "marcas_vacio",
                nombre: "Marcas de Vacío en Boca (Vacuum Marks)",
                zona: "boca",
                gravedad: "Menor",
                descripcion: "Líneas o arrugas en la superficie de la boca. Es un defecto estético común originado por la succión.",
                causas: [
                    "Aplicación del vacío de boca demasiado temprano.",
                    "Acople imperfecto entre la platina y el molde de boca."
                ],
                acciones: [
                    "Ajustar el tiempo de vacío para que comience exactamente con la caída de la gota.",
                    "Revisar el estado físico de la junta y platinas."
                ]
            },
            {
                id: "rosca_incompleta",
                nombre: "Rosca Incompleta (Unfilled Thread)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Falta de vidrio en el contorno del hilo de la rosca, lo cual debilita el cierre metálico o plástico de la tapa.",
                causas: [
                    "Insuficiente presión de aire durante el settle blow.",
                    "Vidrio frío en la punta de la gota o mala distribución de temperatura.",
                    "Desgaste físico o suciedad en las cavidades del molde de boca."
                ],
                acciones: [
                    "Incrementar la presión de aire del settle blow.",
                    "Ajustar la temperatura de los quemadores de canal para homogeneizar el vidrio.",
                    "Limpiar y sopletear la moldería de boca."
                ]
            },
            {
                id: "grieta_interna_boca",
                nombre: "Boca Fisurada Interna (Inside Corkage Check)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Fisura en el interior del orificio de la boca del envase, que puede desprender astillas de vidrio al introducir un corcho o cánula.",
                causas: [
                    "El macho de prensar (plunger) está descalibrado, frío o roza fuertemente contra el orificio.",
                    "Contacto drástico térmico al enfriar el punzón."
                ],
                acciones: [
                    "Centrar y alinear el cilindro de machos de la sección.",
                    "Reducir el caudal de aire de enfriamiento del macho."
                ]
            },
            {
                id: "boca_astillada",
                nombre: "Boca Astillada (Chipped Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Falta un fragmento de vidrio en la cara de sellado o rosca de la boca, comúnmente causado por golpes mecánicos.",
                causas: [
                    "Apertura brusca del molde de boca o del mecanismo de inversión.",
                    "Golpes de la botella caliente contra los deflectores o transportadores debido a mala sincronía."
                ],
                acciones: [
                    "Verificar y amortiguar los movimientos de inversión y apertura.",
                    "Sincronizar la velocidad de los empujadores en la salida."
                ]
            },
            {
                id: "rosca_desalineada",
                nombre: "Rosca Desalineada (Mismatched Thread)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Los hilos de la rosca muestran un escalón o desfase horizontal en la línea de costura del molde de boca.",
                causas: [
                    "Los brazos del molde de boca cierran desalineados por holgura mecánica.",
                    "Diferencia dimensional o desgaste en las platinas de cuello."
                ],
                acciones: [
                    "Ajustar y calibrar el juego en las bisagras porta-moldes.",
                    "Reemplazar platinas y alinear la moldería."
                ]
            },
            {
                id: "linea_sobre_boca",
                nombre: "Línea sobre la Boca (Line Over Sealing Surface)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Una ranura o línea delgada horizontal que cruza la cara de sellado de la boca, provocando fugas de gas o líquido.",
                causas: [
                    "Marca originada por rasguño o daño físico en el macho o platinas.",
                    "Vidrio frío acumulado que no se fundió completamente."
                ],
                acciones: [
                    "Reemplazar el macho de la sección por uno pulido.",
                    "Subir temperatura en la gota de vidrio."
                ]
            },
            {
                id: "rosca_chata",
                nombre: "Rosca Chata / Cara Plana (Flat Sealing Surface)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La cara superior de sellado de la boca presenta una zona achatada o hundida que no permite el contacto uniforme con la junta de la tapa.",
                causas: [
                    "Presión insuficiente del aire de settle blow en el premolde.",
                    "Macho de prensar gastado o desalineado."
                ],
                acciones: [
                    "Aumentar el tiempo o la presión del settle blow.",
                    "Verificar y cambiar el macho si su cara de asiento está plana o deformada."
                ]
            },
            {
                id: "boca_ondulada",
                nombre: "Boca Ondulada (Wavy Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La superficie superior de la boca no es plana y horizontal, sino que presenta ondulaciones que provocan pérdidas de hermeticidad.",
                causas: [
                    "Enfriamiento de boca desigual en el premolde.",
                    "La gota cae de lado impidiendo que el vidrio llene el molde uniformemente."
                ],
                acciones: [
                    "Ajustar y alinear la entrega de la gota en el embudo.",
                    "Revisar el caudal de aire de enfriamiento del molde de boca."
                ]
            },
            {
                id: "boca_escamada",
                nombre: "Boca Escamada (Scaly Finish / Crazing)",
                zona: "boca",
                gravedad: "Menor",
                descripcion: "Microfisuras superficiales en el vidrio del anillo de boca que le dan un aspecto áspero o escamoso.",
                causas: [
                    "Moldería de boca excesivamente fría en el ciclo.",
                    "Hisopeado con desmoldante que contiene trazas de agua."
                ],
                acciones: [
                    "Reducir el caudal de enfriamiento del molde de boca.",
                    "Asegurar que el lubricante y el hisopo estén limpios y libres de agua."
                ]
            },
            {
                id: "split_finish_radial",
                nombre: "Fisura Radial de Boca (Split Finish - Radial)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Fisura fina y lineal que se propaga radialmente desde el orificio interno de la boca hacia el exterior de la rosca.",
                causas: [
                    "El macho de prensado roza de lado la pared interna del molde de boca.",
                    "Traspaso (Invert) violento o mal amortiguado."
                ],
                acciones: [
                    "Centrar perfectamente el mecanismo del plunger.",
                    "Ajustar la amortiguación del cilindro de inversión."
                ]
            },
            {
                id: "marca_cizalla_boca",
                nombre: "Marca de Cizalla en Boca (Shear Mark on Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Línea o corte en la superficie de sellado superior de la boca, originado por una gota de vidrio mal cortada.",
                causas: [
                    "Las cuchillas de la cizalla están desafiladas u oxidadas.",
                    "Mala sincronía en el corte de la gota."
                ],
                acciones: [
                    "Cambiar o rectificar el filo de las cuchillas.",
                    "Sincronizar el ciclo de corte del alimentador."
                ]
            },
            {
                id: "boca_incompleta_bead",
                nombre: "Anillo de Boca Incompleto (Underfilled Bead)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Falta de llenado de vidrio en el labio o anillo inferior del perfil de la boca.",
                causas: [
                    "Aire atrapado por vacío de boca deficiente.",
                    "Poca presión de soplado inicial."
                ],
                acciones: [
                    "Asegurar el correcto funcionamiento de las líneas de vacío de la sección.",
                    "Incrementar soplado inicial."
                ]
            },
            {
                id: "grieta_vert_boca",
                nombre: "Grieta Vertical de Boca (Vertical Split Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Fisura vertical completa en los hilos de la rosca del envase.",
                causas: [
                    "El molde de boca se abre con excesiva violencia.",
                    "Falta de lubricación en las platinas."
                ],
                acciones: [
                    "Regular la amortiguación del mecanismo de apertura de cuello.",
                    "Hisopar las platinas regularmente."
                ]
            },

            // --- CUELLO (12 defectos) ---
            {
                id: "cuello_doblado",
                nombre: "Cuello Doblado (Bent Neck)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "El cuello de la botella se dobla ligeramente hacia un lado después de salir del molde final.",
                causas: [
                    "Parison o cuello demasiado caliente al desmoldar.",
                    "Las pinzas de traspaso jalan de lado o están mal alineadas con el molde final.",
                    "Tiempo de soplado final demasiado corto."
                ],
                acciones: [
                    "Aumentar el enfriamiento del cuello o del molde final.",
                    "Verificar el centrado y la velocidad del takeout.",
                    "Ajustar el soplado final para enfriar la estructura interna."
                ]
            },
            {
                id: "costura_cuello_alta",
                nombre: "Costura de Cuello Alta (High Neck Seam)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Un relieve de vidrio pronunciado que sobresale en la línea de unión vertical de los moldes de cuello.",
                causas: [
                    "Los moldes de cuello no cierran herméticamente.",
                    "Presión de cierre de moldes de la sección muy débil."
                ],
                acciones: [
                    "Limpiar los encastres de las hojas del molde.",
                    "Incrementar la presión en el cilindro de cierre de moldes."
                ]
            },
            {
                id: "estrias_cuello",
                nombre: "Estrías en el Cuello (Neck Ring Laps)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Ondas concéntricas o arrugas horizontales en la superficie del cuello del envase.",
                causas: [
                    "Gota de vidrio ingresando fría en la zona superior.",
                    "Lubricante excesivo o muy concentrado en el molde de boca."
                ],
                acciones: [
                    "Ajustar la temperatura en el canal y boquillas.",
                    "Lubricar de forma más fina y espaciada."
                ]
            },
            {
                id: "cuello_obstruido",
                nombre: "Cuello Obstruido / Estrecho (Choked Neck)",
                zona: "cuello",
                gravedad: "Crítico",
                descripcion: "Reducción del diámetro interno del cuello del envase que impide el paso de la cánula de llenado o del corcho.",
                causas: [
                    "Vidrio caliente acumulado en la zona del cuello que colapsa hacia adentro.",
                    "Exceso de soplado o re-calentamiento prolongado del parison."
                ],
                acciones: [
                    "Disminuir la temperatura del vidrio.",
                    "Optimizar el tiempo de recalentamiento reduciendo el retardo del soplado final."
                ]
            },
            {
                id: "anillo_excentrico",
                nombre: "Anillo de Boca Excéntrico (Offset Neck Ring)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "La moldería de cuello y boca no está alineada concéntricamente con el hombro, dejando un escalón visible.",
                causas: [
                    "El cabezal de inversión o los brazos porta-moldes tienen desalineamiento físico.",
                    "Instalación incorrecta de la moldería."
                ],
                acciones: [
                    "Calibrar y ajustar la concentricidad del cabezal inversor.",
                    "Revisar el encastre del molde de boca con los premoldes."
                ]
            },
            {
                id: "pliegue_cuello",
                nombre: "Pliegue de Cuello (Neck Fold)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Arruga o doblez de vidrio en el exterior del cuello producido por un parison que colapsó antes del soplado.",
                causas: [
                    "Recalentamiento excesivo del cuello en el traspaso.",
                    "El parison es demasiado largo y se dobla por su propio peso."
                ],
                acciones: [
                    "Aumentar enfriamiento local al parison.",
                    "Reducir el tiempo de recalentamiento adelantando el soplado final."
                ]
            },
            {
                id: "garganta_cerrada",
                nombre: "Garganta Cerrada (Choked Bore)",
                zona: "cuello",
                gravedad: "Crítico",
                descripcion: "El diámetro interno del orificio está obstruido por una costra o burbuja de vidrio fundido.",
                causas: [
                    "El macho sube descentrado dañando las paredes internas.",
                    "Gota de vidrio excesivamente caliente que se expande hacia adentro."
                ],
                acciones: [
                    "Centrar los machos and verificar la carrera del cilindro.",
                    "Controlar la temperatura del vidrio en el canal."
                ]
            },
            {
                id: "costura_anillo_desfasada",
                nombre: "Costura del Anillo Desfasada (Offset Neck Ring Seam)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Desalineamiento horizontal visible entre la junta del molde final y el anillo de cuello.",
                causas: [
                    "Pernos guía o encastres del soporte de cuello desgastados.",
                    "Macho de la sección empujando fuera de eje."
                ],
                acciones: [
                    "Reemplazar los pernos de alineación y guías.",
                    "Centrar el pistón del macho."
                ]
            },
            {
                id: "cuello_estirado",
                nombre: "Cuello Estirado (Stretched Neck)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "La longitud del cuello es superior a la especificación debido a un estiramiento mecánico cuando el vidrio aún estaba muy maleable.",
                causas: [
                    "Vidrio de cuello excesivamente caliente.",
                    "El mecanismo de takeout extrae el envase con un jalón muy rápido."
                ],
                acciones: [
                    "Aumentar el enfriamiento de moldes en la zona del cuello.",
                    "Suavizar el arranque y temporización del cilindro de takeout."
                ]
            },
            {
                id: "cuello_fisurado_ext",
                nombre: "Cuello Fisurado Exterior (Exterior Neck Check)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Grieta externa transparente localizada en el exterior del cuello, cerca del hombro.",
                causas: [
                    "El molde de cuello está demasiado frío.",
                    "Las hojas del molde final golpean el cuello al cerrar."
                ],
                acciones: [
                    "Reducir el caudal de enfriamiento del molde.",
                    "Ajustar amortiguadores de cierre de molde final."
                ]
            },
            {
                id: "perdida_diametro_cuello",
                nombre: "Pérdida de Diámetro en Cuello (Choked Neck - Ring)",
                zona: "cuello",
                gravedad: "Crítico",
                descripcion: "Estrechamiento del orificio del cuello justo debajo del labio de la boca.",
                causas: [
                    "Macho de prensado muy caliente o lubricación en exceso que expande el parison en esa zona antes del soplado."
                ],
                acciones: [
                    "Aumentar el enfriamiento interno del macho.",
                    "Reducir la lubricación del macho."
                ]
            },
            {
                id: "platina_fria",
                nombre: "Marca de Platina Fría (Cold Neck Ring Mark)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Relieve irregular en el cuello originado por el contacto directo con una platina muy fría en el ciclo.",
                causas: [
                    "Falta de precalentamiento en la platina de cuello al arrancar la sección.",
                    "Caudal de aire de enfriamiento desmedido."
                ],
                acciones: [
                    "Precalentar las platinas antes de operar.",
                    "Reducir el caudal del aire."
                ]
            },
            {
                id: "desgaste_molde_cuello",
                nombre: "Desgaste del Encastre del Cuello (Mismatched Joint Line)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Línea de costura muy pronunciada en la unión entre el cuello y la boca.",
                causas: [
                    "La platina de cuello está mal acoplada con el molde final.",
                    "Suciedad en la junta."
                ],
                acciones: [
                    "Limpiar y raspar las caras de encastre.",
                    "Alinear el cabezal de inversión."
                ]
            },

            // --- CUERPO (30 defectos) ---
            {
                id: "columpio",
                nombre: "Columpio / Pelo en el Cuerpo (Birdswing / Birdcage)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Un filamento o hilo de vidrio que cruza de pared a pared por el interior de la botella. Es un defecto muy peligroso de descarte inmediato.",
                causas: [
                    "Vidrio excesivamente caliente y fluido.",
                    "Presión de prensado baja (bajo los 15 psi) que deforma mal el parison.",
                    "Hisopeado (lubricación) muy cargado que colapsa el parison internamente."
                ],
                acciones: [
                    "Aumentar el enfriamiento de los premoldes.",
                    "Asegurar una presión de prensado constante y correcta.",
                    "Moderar la cantidad de aceite y frecuencia de la lubricación manual."
                ]
            },
            {
                id: "pared_delgada",
                nombre: "Pared Delgada / Mala Distribución (Thin Wall)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Zonas de la botella con espesor de vidrio extremadamente bajo, haciéndolas susceptibles a estallar por la presión del llenado.",
                causas: [
                    "Estiramiento disparejo del parison por falta de enfriamiento uniforme.",
                    "Gota desviada al caer en el premolde."
                ],
                acciones: [
                    "Corregir el flujo de enfriamiento de aire en los moldes.",
                    "Alinear los deflectores para centrar la caída de la gota en el premolde."
                ]
            },
            {
                id: "costura_saliente",
                nombre: "Costura de Molde Saliente (Mismatched Mold)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Desfase o desalineación visible y palpable en la costura de las dos hojas del molde final en el cuerpo de la botella.",
                causas: [
                    "Mecanismos porta-moldes gastados con juego mecánico.",
                    "Cierre de moldes asimétrico."
                ],
                acciones: [
                    "Reemplazar los pernos de alineación y bujes porta-moldes.",
                    "Verificar y corregir el paralelismo en el cierre."
                ]
            },
            {
                id: "ondas_frias",
                nombre: "Ondas Frías / Pliegues (Cold Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Superficie corrugada u ondas marcadas en el exterior de la botella. Indica enfriamiento disparejo del vidrio antes del soplado.",
                causas: [
                    "Vidrio enfriado prematuramente al tocar las paredes metálicas frías.",
                    "Velocidad de carga de la gota muy lenta."
                ],
                acciones: [
                    "Aumentar la temperatura de los premoldes disminuyendo el aire de enfriamiento.",
                    "Limpiar y ajustar el canal de caída de gota."
                ]
            },
            {
                id: "burbujas",
                nombre: "Burbujas / Blisters (Blisters & Seeds)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Cavidades gaseosas atrapadas dentro de la pared de vidrio. Si son grandes (blisters) o están cerca de la superficie, debilitan el envase.",
                causas: [
                    "Aire atrapado en la caída de la gota debido a mala forma.",
                    "Problemas de refinación en el horno de fundición (semillas finas)."
                ],
                acciones: [
                    "Ajustar el peso, longitud y forma de la gota en la cizalla.",
                    "Informar a control de calidad y operador de horno para revisar la combustión."
                ]
            },
            {
                id: "piedras",
                nombre: "Piedras en el Vidrio (Stones / Inclusions)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Partículas sólidas de material refractario o vidrio no fundido incrustadas en el envase, propensas a que la botella estalle.",
                causas: [
                    "Desprendimiento de material de las paredes del horno de vidrio fundido.",
                    "Presencia de contaminantes no metálicos en la materia prima."
                ],
                acciones: [
                    "Detener el envase, reportar y enviar muestra para análisis petrográfico.",
                    "Controlar el porcentaje y calidad de calcín (vidrio reciclado) usado."
                ]
            },
            {
                id: "marcas_punzon",
                nombre: "Marcas de Punzón (Plunger Marks)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Manchas opacas o marcas verticales internas en la zona donde el macho / plunger hace contacto directo.",
                causas: [
                    "Punzón muy caliente o con lubricación quemada.",
                    "Vidrio muy caliente."
                ],
                acciones: [
                    "Lubricar el punzón de manera limpia.",
                    "Bajar la temperatura del punzón aumentando su aire interno de enfriamiento."
                ]
            },
            {
                id: "arrastre_cepillo",
                nombre: "Marcas de Arrastre (Brush / Drag Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Líneas finas verticales sobre la superficie del hombro o cuerpo de la botella.",
                causas: [
                    "El parison roza contra las paredes internas del molde final durante el traspaso."
                ],
                acciones: [
                    "Ajustar la sincronización del Invert/Traspaso para un movimiento limpio y centrado.",
                    "Controlar la holgura en el mecanismo."
                ]
            },
            {
                id: "vidrio_sucio",
                nombre: "Vidrio Sucio (Dirty Ware)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Acumulación de depósitos oscuros o carbonosos incrustados en la superficie externa del vidrio.",
                causas: [
                    "Exceso de aceite e hisopado excesivo que quema el lubricante en el molde.",
                    "Moldería sucia con residuos de grasa."
                ],
                acciones: [
                    "Moderar la cantidad de desmoldante aplicada.",
                    "Limpiar los moldes con un cepillo adecuado o cambiarlos."
                ]
            },
            {
                id: "grieta_hombro",
                nombre: "Grieta en Hombro (Shoulder Check)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Fisura en el hombro de la botella. Puede ser transparente y romperse fácilmente.",
                causas: [
                    "El brazo del molde o las guías finales tocan con fuerza el hombro al abrir."
                ],
                acciones: [
                    "Ajustar amortiguación y velocidad de apertura en el lado moldes."
                ]
            },
            {
                id: "hombro_hundido",
                nombre: "Hombro Hundido (Sunken Shoulder)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "El hombro de la botella se colapsa hacia adentro perdiendo su perfil de diseño.",
                causas: [
                    "Vidrio excesivamente caliente al desmoldar en la zona superior del cuerpo.",
                    "El soplado final no se mantuvo el tiempo necesario para solidificar la silueta."
                ],
                acciones: [
                    "Incrementar enfriamiento en la sección del molde correspondiente al hombro.",
                    "Prolongar el tiempo de soplado final retardando el Blow Off."
                ]
            },
            {
                id: "costura_vertical_saliente",
                nombre: "Costura Vertical Saliente (High Joint)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Un escalón o rebaba lineal vertical muy pronunciada a lo largo del cuerpo de la botella.",
                causas: [
                    "Desgaste físico en las guías de encastre de las hojas del molde final.",
                    "Presión de cierre insuficiente."
                ],
                acciones: [
                    "Mandar a rectificar o cambiar los moldes finales.",
                    "Ajustar los cilindros del mecanismo de cierre."
                ]
            },
            {
                id: "pared_delgada_hombro",
                nombre: "Hombro Delgado (Thin Shoulder)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Espesor de vidrio críticamente bajo en el hombro de la botella en comparación con el cuerpo.",
                causas: [
                    "El parison se estira excesivamente arriba por temperatura alta local.",
                    "Gota cayendo descentrada."
                ],
                acciones: [
                    "Ajustar la distribución de calor en el parison regulando el enfriamiento axial del premolde.",
                    "Centrar deflectores de gota."
                ]
            },
            {
                id: "vidrio_escamoso",
                nombre: "Vidrio Escamoso (Scaly Glass)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Textura exterior áspera o con pequeñas escamas superficiales que opacan el envase.",
                causas: [
                    "Moldería excesivamente fría o húmeda.",
                    "Exceso de lubricante emulsionado con agua en el hisopo."
                ],
                acciones: [
                    "Reducir enfriamiento local para subir temperatura de moldes.",
                    "Utilizar hisopos limpios y secos para aplicar el desmoldante."
                ]
            },
            {
                id: "mancha_oxido",
                nombre: "Mancha de Óxido (Rust Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Manchas rojizas o marrones oscuras incrustadas en el vidrio.",
                causas: [
                    "Partículas de hierro oxidado provenientes de las pinzas o guías metálicas calientes.",
                    "Desgaste abrasivo de componentes de la sección."
                ],
                acciones: [
                    "Limpiar y revestir las pinzas del takeout con material grafito/carbono.",
                    "Reemplazar guías desgastadas."
                ]
            },
            {
                id: "marca_planchado",
                nombre: "Marca de Planchado (Iron Mark)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Zona opaca, rugosa o quemada en el exterior del vidrio debido al contacto metálico abrasivo.",
                causas: [
                    "El molde final está muy seco o sobrecalentado localmente.",
                    "El parison roza mecánicamente contra las bisagras."
                ],
                acciones: [
                    "Aplicar un hisopeado ligero con desmoldante grafito.",
                    "Alinear el mecanismo de inversión para evitar el roce."
                ]
            },
            {
                id: "estrias_cuerpo",
                nombre: "Estría de Cuerpo (Laps)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Pliegues o líneas onduladas en espiral que se aprecian en las paredes de la botella.",
                causas: [
                    "Gota de vidrio muy fría al ingresar en el premolde.",
                    "La gota cae girando o rozando los deflectores."
                ],
                acciones: [
                    "Aumentar la temperatura de la gota.",
                    "Limpiar y alinear el canal de entrega de gota."
                ]
            },
            {
                id: "hombro_sucio",
                nombre: "Hombro Sucio (Dirty Shoulder / Carbon Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Manchas negras o costras opacas de carbón localizadas específicamente en la zona del hombro.",
                causas: [
                    "Lubricación manual excesiva del premolde que se quema y es arrastrada.",
                    "Macho sucio con acumulación de grafito."
                ],
                acciones: [
                    "Optimizar el ciclo de swabbing en moldes y premoldes.",
                    "Limpiar el macho con cepillo de alambre blando."
                ]
            },
            {
                id: "hombro_desalineado",
                nombre: "Hombro Desalineado (Mismatched Shoulder)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Un escalón o reborde horizontal en la zona donde une el cuello con el hombro.",
                causas: [
                    "El molde final está montado desalineado respecto al soporte del cuello.",
                    "Holguras mecánicas porta-moldes."
                ],
                acciones: [
                    "Ajustar el centrado de los moldes finales.",
                    "Eliminar juego mecánico en las bisagras porta-moldes."
                ]
            },
            {
                id: "gota_desviada",
                nombre: "Gota de Vidrio Desviada (Missed Gob Mark)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Marcas o estrías longitudinales causadas porque la gota rozó el embudo o las guías de caída.",
                causas: [
                    "Deflectores sucios, desalineados o secos.",
                    "Presión del aire de soplado de canal incorrecta."
                ],
                acciones: [
                    "Alinear el sistema de distribución de gota.",
                    "Limpiar e hisopar el canal con grafito en suspensión."
                ]
            },
            {
                id: "vidrio_hundido",
                nombre: "Vidrio Hundido / Chupado (Sunken Sidewall)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Depresión cóncava en las paredes de la botella que deforma el contorno circular del envase.",
                causas: [
                    "Enfriamiento deficiente de los moldes finales.",
                    "La botella sale muy caliente y colapsa por vacío interno al enfriar."
                ],
                acciones: [
                    "Aumentar el caudal de aire de enfriamiento al molde final.",
                    "Ampliar el tiempo de soplado final."
                ]
            },
            {
                id: "pliegue_carga",
                nombre: "Pliegue de Carga (Loading Lap / Gob Mark)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Doblezo pliegue de vidrio visible en el cuerpo que debilita la resistencia mecánica del envase.",
                causas: [
                    "La gota cae de lado o mal orientada en el premolde.",
                    "Premoldes excesivamente fríos."
                ],
                acciones: [
                    "Corregir la alineación del embudo de carga.",
                    "Reducir enfriamiento local de los premoldes."
                ]
            },
            {
                id: "burbujas_superficie",
                nombre: "Burbujas en Superficie (Surface Blisters)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Burbujas con pared de vidrio muy delgada en el exterior o interior del envase que se rompen con facilidad.",
                causas: [
                    "Aire atrapado durante la carga por caída tosca de la gota.",
                    "Horno de vidrio con mala refinación."
                ],
                acciones: [
                    "Suavizar y centrar la carga de la gota.",
                    "Revisar parámetros de combustión y tiro de chimeneas del horno."
                ]
            },
            {
                id: "costra_molde",
                nombre: "Costra de Molde (Mold Paste Scale)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Incrustaciones rugosas y grises de óxido metálico o carbón en la superficie de la botella.",
                causas: [
                    "Moldería vieja u oxidada.",
                    "Uso de desmoldante inadecuado que deja residuos sólidos."
                ],
                acciones: [
                    "Mandar los moldes a limpieza por chorreado (blasting).",
                    "Utilizar desmoldante grafito de calidad homologada."
                ]
            },
            {
                id: "hilos_internos",
                nombre: "Hilos Internos de Vidrio (Tears / Thread in Bottle)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Finísimos filamentos de vidrio sueltos o adheridos al interior del envase.",
                causas: [
                    "La gota de vidrio se desgarra o estira al cortarse en la cizalla.",
                    "Vidrio frío en el alimentador."
                ],
                acciones: [
                    "Alinear cizallas y asegurar lubricación con agua constante.",
                    "Aumentar temperatura del vidrio en el alimentador."
                ]
            },
            {
                id: "cuerpo_ovalado",
                nombre: "Cuerpo Deformado Ovalado (Out of Round)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "La botella pierde su geometría circular y adquiere sección elíptica u ovalada.",
                causas: [
                    "Extracción a alta temperatura y manipulación tosca del transportador.",
                    "Las hojas del molde final no cierran simétricamente."
                ],
                acciones: [
                    "Ajustar velocidad del takeout y enfriar más el cuerpo.",
                    "Corregir el cierre del molde."
                ]
            },
            {
                id: "grieta_impacto",
                nombre: "Grieta de Impacto (Impact Check)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Fisura en forma de estrella o media luna en la pared de la botella provocada por golpes mecánicos.",
                causas: [
                    "Choques violentos entre botellas en el transportador caliente.",
                    "Golpes contra las barandas del transportador."
                ],
                acciones: [
                    "Sincronizar la velocidad de la correa de salida.",
                    "Revestir barandas de guía con carburo o materiales no abrasivos calientes."
                ]
            },
            {
                id: "crazing_body",
                nombre: "Vidrio Escamado en Cuerpo (Crazing / Scaly Body)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Textura exterior quebradiza y microfisurada en una zona amplia del cuerpo del envase.",
                causas: [
                    "Molde final extremadamente frío en relación al vidrio fundido.",
                    "Exceso de agua en el aire de enfriamiento."
                ],
                acciones: [
                    "Disminuir aire de enfriamiento exterior.",
                    "Instalar trampas de humedad en la línea de aire de la sección."
                ]
            },
            {
                id: "marca_soplo",
                nombre: "Marca de Plato de Soplo (Blowhead Mark)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Aro circular o relieve marcado en la zona de transición cuello-hombro.",
                causas: [
                    "El cabezal de soplado (Blowhead) baja descentrado o ejerce excesiva presión mecánica."
                ],
                acciones: [
                    "Alinear el brazo del cabezal de soplado y ajustar su carrera/presión."
                ]
            },
            {
                id: "marca_empujador",
                nombre: "Marca de Empujador (Pusher Mark)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Rasguño o marca estética opaca en el lateral del cuerpo de la botella caliente.",
                causas: [
                    "Las almohadillas del empujador (Pusher) están desgastadas, sucias o descentradas.",
                    "Sincronía tosca de empuje."
                ],
                acciones: [
                    "Reemplazar o limpiar los insertos del empujador.",
                    "Suavizar el perfil de movimiento neumático."
                ]
            },

            // --- FONDO (15 defectos) ---
            {
                id: "fondo_delgado",
                nombre: "Fondo Delgado (Thin Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Espesor de vidrio críticamente bajo en la base de la botella, lo cual compromete su estabilidad.",
                causas: [
                    "El parison está muy estirado verticalmente por exceso de calor en el fondo.",
                    "Retardo excesivo en el inicio del soplado final."
                ],
                acciones: [
                    "Reducir temperatura del fondo del parison regulando el soplado interno.",
                    "Adelantar el inicio del soplado final para fijar la base antes."
                ]
            },
            {
                id: "grieta_base",
                nombre: "Grieta en la Base (Bottom Check)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Fisuras que se extienden en la base o asiento del envase. Riesgo alto de rotura al apoyar la botella.",
                causas: [
                    "El fondo del molde final está excesivamente frío.",
                    "Golpe o caída brusca al depositar la botella en la placa muerta (Dead Plate)."
                ],
                acciones: [
                    "Disminuir enfriamiento en la placa de fondo del molde.",
                    "Ajustar la suavidad de las pinzas del takeout al soltar el envase."
                ]
            },
            {
                id: "asiento_desparejo",
                nombre: "Asiento Desparejo / Tambaleo (Rocking Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La botella no se apoya firmemente en una superficie plana y se tambalea.",
                causas: [
                    "La base de la botella está demasiado blanda/caliente al desmoldar y se deforma por la gravedad o por el flujo de aire.",
                    "El aire de la placa muerta (Dead Plate) está mal direccionado."
                ],
                acciones: [
                    "Aumentar el tiempo de soplado final o el enfriamiento del fondo del molde.",
                    "Ajustar la presión de los sopladores en el Dead Plate para un enfriamiento parejo."
                ]
            },
            {
                id: "rebaba_fondo",
                nombre: "Rebaba de Fondo / Marca de Fondo (High Baffle Mark)",
                zona: "fondo",
                gravedad: "Menor",
                descripcion: "Relieve de vidrio filoso o excesivo alrededor de la costura circular del fondo del molde.",
                causas: [
                    "El fondo del molde no cierra al ras con las hojas de molde.",
                    "Desgaste físico en la moldería de fondo."
                ],
                acciones: [
                    "Verificar y ajustar la altura y encastre del fondo del molde.",
                    "Reemplazar el fondo desgastado."
                ]
            },
            {
                id: "fondo_hundido",
                nombre: "Fondo Hundido (Sunken Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La base de la botella se hunde hacia adentro por succión o deformación plástica.",
                causas: [
                    "Base del parison excesivamente caliente y falta de presión en el soplado final."
                ],
                acciones: [
                    "Ajustar la presión de aire de soplado final.",
                    "Mejorar enfriamiento local de la base."
                ]
            },
            {
                id: "pico_base",
                nombre: "Pico de Base (Base Spike)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "Un pequeño filamento o aguja de vidrio filoso que sobresale internamente desde el fondo hacia arriba.",
                causas: [
                    "Punzón o aguja del macho desgastados o con rebabas metálicas.",
                    "Vidrio frío en el extremo inferior de la gota que se desgarra al presionar."
                ],
                acciones: [
                    "Inspeccionar, pulir o reemplazar la punta del punzón de prensado.",
                    "Asegurar un corte cizalla limpio y temperatura uniforme."
                ]
            },
            {
                id: "fondo_inclinado",
                nombre: "Fondo Inclinado (Crooked Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La superficie de apoyo inferior de la botella no es paralela a la horizontal, inclinando la botella entera.",
                causas: [
                    "El fondo del molde está desalineado o suelto en su soporte.",
                    "Enfriamiento muy descompensado (un lado de la base está mucho más caliente)."
                ],
                acciones: [
                    "Alinear y fijar firmemente el fondo del molde.",
                    "Ajustar el aire de enfriamiento del fondo."
                ]
            },
            {
                id: "costura_fondo_saliente",
                nombre: "Costura de Fondo Saliente (High Bottom Joint)",
                zona: "fondo",
                gravedad: "Menor",
                descripcion: "Un reborde pronunciado de vidrio en la línea circular donde une la placa del fondo con las dos hojas del molde.",
                causas: [
                    "El fondo está montado muy abajo o las hojas del molde no cierran correctamente sobre él.",
                    "Diferencia dimensional en la moldería."
                ],
                acciones: [
                    "Subir o ajustar la placa de fondo en su base porta-fondos.",
                    "Limpiar canales y juntas."
                ]
            },
            {
                id: "fondo_deformado",
                nombre: "Fondo Deformado (Deformed Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Deformación plástica severa de la base de la botella ocurrida durante el desmoldeo.",
                causas: [
                    "Las pinzas de extracción tiran del envase antes de que la base solidifique.",
                    "El soplado final terminó antes de tiempo."
                ],
                acciones: [
                    "Retardar ligeramente el movimiento del takeout.",
                    "Incrementar la duración del soplado final."
                ]
            },
            {
                id: "fondo_abombado",
                nombre: "Fondo Abombado / Saliente (Bulged Bottom)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "El fondo del envase sobresale hacia afuera impidiendo que la botella se pare de forma estable.",
                causas: [
                    "Soplado final muy corto o presión de soplado insuficiente.",
                    "La base de la botella está demasiado caliente al desmoldar."
                ],
                acciones: [
                    "Aumentar el tiempo del soplado final.",
                    "Enfriar más la placa de fondo regulando los caudales de aire."
                ]
            },
            {
                id: "fondo_excentrico",
                nombre: "Fondo Excéntrico (Offset Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La placa del fondo queda desplazada horizontalmente con respecto al eje de la botella.",
                causas: [
                    "Los brazos del molde no cierran centrados sobre el fondo.",
                    "Ajuste e instalación deficiente de la placa del fondo."
                ],
                acciones: [
                    "Verificar y centrar el soporte de la placa de fondo.",
                    "Eliminar juegos mecánicos."
                ]
            },
            {
                id: "desgaste_talon",
                nombre: "Desgaste en Talón del Fondo (Chipped Heel)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "Falta un fragmento de vidrio en la arista de la base de la botella, debilitando el apoyo.",
                causas: [
                    "Golpes en los transportadores debido a mala transferencia.",
                    "Apertura brusca del molde final."
                ],
                acciones: [
                    "Ajustar amortiguación de apertura de moldes.",
                    "Corregir la alineación del takeout y velocidad de la correa."
                ]
            },
            {
                id: "high_baffle_seam",
                nombre: "Costura Saliente Circular (High Baffle Seam)",
                zona: "fondo",
                gravedad: "Menor",
                descripcion: "Un filo sobresaliente circular en la base de la botella en la costura fondo-molde.",
                causas: [
                    "Placa de fondo con desgaste físico en los bordes de asiento.",
                    "Cierre incompleto de moldes."
                ],
                acciones: [
                    "Reemplazar la placa de fondo gastada.",
                    "Aumentar presión de cierre de moldes."
                ]
            },
            {
                id: "fondo_delgado_localizado",
                nombre: "Fondo Delgado Localizado (Spotty Thin Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Punto específico en la base de la botella con espesor de vidrio extremadamente bajo.",
                causas: [
                    "Gota cayendo ladeada y descentrada en el premolde.",
                    "Temperatura del fondo del premolde desigual."
                ],
                acciones: [
                    "Centrar deflectores de carga.",
                    "Revisar el circuito de enfriamiento de la placa de fondo."
                ]
            },
            {
                id: "fisura_interna_fondo",
                nombre: "Fisura Interna de Fondo (Inside Bottom Check)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "Fisura en la superficie interna del fondo de la botella que puede causar fallas catastróficas por presión interna.",
                causas: [
                    "El punzón del macho golpea el fondo con exceso de fuerza o desalineado.",
                    "Choque térmico en el desmolde."
                ],
                acciones: [
                    "Alinear el plunger de prensado.",
                    "Moderar enfriamiento de la base del molde."
                ]
            },
            {
                id: "fisura_talon",
                nombre: "Fisura en Talón del Fondo (Heel Check)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Fisura transparente y delgada que recorre la arista curva de la base del envase.",
                causas: [
                    "Contacto de la botella caliente con metales fríos en el transportador.",
                    "Fondo del molde frío."
                ],
                acciones: [
                    "Precalentar las guías y empujadores.",
                    "Reducir enfriamiento del fondo del molde."
                ]
            },

            // --- GENERALES (25 defectos) ---
            {
                id: "botella_deformada",
                nombre: "Botella Deformada / Leaner (Out of Shape)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La botella pierde su geometría cilíndrica o se inclina, excediendo la tolerancia de verticalidad.",
                causas: [
                    "El envase sale demasiado blando y caliente del molde final.",
                    "Velocidad del transportador muy alta que deforma la botella caliente por inercia.",
                    "Enfriamiento deficiente de los moldes."
                ],
                acciones: [
                    "Reducir velocidad del alimentador o aumentar el enfriamiento general.",
                    "Incrementar el flujo de aire de enfriamiento del molde.",
                    "Ajustar guías y velocidad del transportador."
                ]
            },
            {
                id: "vidrio_frio",
                nombre: "Piel de Naranja / Vidrio Frío (Orange Peel)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Textura rugosa en la superficie de la botella parecida a la piel de una naranja. Afecta la estética y transparencia.",
                causas: [
                    "Temperatura del vidrio fundido en el alimentador está muy baja.",
                    "Moldería excesivamente fría."
                ],
                acciones: [
                    "Subir la temperatura de la gota ajustando los quemadores del canal.",
                    "Reducir el enfriamiento de los moldes de la sección."
                ]
            },
            {
                id: "vidrio_caliente",
                nombre: "Deformación por Vidrio Caliente (Hot Glass Deformation)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "El envase se deforma en el cuello, cuerpo u hombro por falta de rigidez estructural tras salir de la moldería.",
                causas: [
                    "Temperatura global del vidrio muy elevada.",
                    "Ciclo de la máquina IS demasiado rápido, impidiendo el enfriamiento óptimo."
                ],
                acciones: [
                    "Disminuir la temperatura del alimentador de vidrio.",
                    "Ajustar la temporización reduciendo velocidad (ciclos/minuto) si es crítico."
                ]
            },
            {
                id: "corte_cizalla",
                nombre: "Marca de Cizalla (Shear Mark)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Una cicatriz oscura con forma de 'C' en el fondo o boca de la botella, que puede iniciar una fisura.",
                causas: [
                    "Cuchillas de la cizalla desafiladas, mal lubricadas o desalineadas.",
                    "El agua de enfriamiento de la cizalla cae de forma dispareja."
                ],
                acciones: [
                    "Cambiar o afilar las cuchillas de cizalla.",
                    "Alinear el chorro de agua lubricante para un enfriamiento uniforme sobre las cuchillas."
                ]
            },
            {
                id: "envases_pegados",
                nombre: "Envases Pegados (Stuck Glass)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Botellas que se tocan y se fusionan o marcan entre sí en el transportador caliente.",
                causas: [
                    "Alineamiento incorrecto del empujador (Pusher).",
                    "Falta de espacio o sincronía de salida en la correa."
                ],
                acciones: [
                    "Ajustar y sincronizar los tiempos del empujador neumático/eléctrico.",
                    "Regular la velocidad del transportador de botellas calientes."
                ]
            },
            {
                id: "corte_cizalla_desviado",
                nombre: "Corte Cizalla Excéntrico (Off-Center Shear Mark)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La marca o línea de corte de cizalla aparece desplazada hacia un lado de la base del envase.",
                causas: [
                    "Las cuchillas de la cizalla no están centradas respecto al orificio de la boquilla.",
                    "La gota cae con inclinación."
                ],
                acciones: [
                    "Alinear y centrar el mecanismo de corte de la cizalla.",
                    "Ajustar el tubo y las guías de caída."
                ]
            },
            {
                id: "choque_termico",
                nombre: "Fisura por Choque Térmico (Thermal Shock Crack)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Roturas o grietas grandes en las botellas que ocurren tras salir del túnel de recocido (Lehr).",
                causas: [
                    "Diferencia térmica extrema en el túnel de recocido.",
                    "Presencia de tensiones internas severas en el vidrio por enfriamiento muy rápido en la máquina IS."
                ],
                acciones: [
                    "Controlar la curva de temperaturas del Lehr (túnel de recocido).",
                    "Ajustar el templado y la velocidad de enfriamiento de la botella en el transportador."
                ]
            },
            {
                id: "deformacion_correa",
                nombre: "Deformación en Correa (Conveyor Deformation)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Aplastamientos u óvalos en el cuerpo del envase al chocar contra barandas o contra otras botellas.",
                causas: [
                    "Guiado tosco o barandas muy cerradas.",
                    "El vidrio se mantiene plástico por alta temperatura."
                ],
                acciones: [
                    "Alinear barandas del transportador y recubrirlas con material blando.",
                    "Disminuir la temperatura del vidrio."
                ]
            },
            {
                id: "vidrio_desvitrificado",
                nombre: "Vidrio Desvitrificado (Devitrified Glass)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Zonas opacas, blanquecinas o rugosas en el envase por cristalización local del vidrio.",
                causas: [
                    "Composición química descompensada del vidrio (exceso de sílice o cal).",
                    "Permanencia prolongada del vidrio a temperatura de cristalización en el alimentador."
                ],
                acciones: [
                    "Ajustar la formulación química del vidrio (calcín e ingredientes).",
                    "Subir temperatura en las zonas frías del canal para fundir cristales."
                ]
            },
            {
                id: "lineas_tension",
                nombre: "Líneas de Tensión (Cord / Tension Lines)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Líneas invisibles a simple vista (visibles con polaroscopio) que indican tensiones internas peligrosas que rompen el vidrio.",
                causas: [
                    "Mala homogeneización química o térmica del vidrio fundido.",
                    "Diferencias locales de viscosidad."
                ],
                acciones: [
                    "Ajustar los agitadores mecánicos del alimentador (stirrers).",
                    "Estabilizar la combustión del horno."
                ]
            },
            {
                id: "color_fuera_tono",
                nombre: "Color fuera de Tono (Color Tint Variation)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "El color final del vidrio no se ajusta al tono de la campaña estándar.",
                causas: [
                    "Dosificación incorrecta de colorantes (óxido de hierro, cobalto, selenio).",
                    "Atmósfera de combustión del horno muy reductora u oxidante."
                ],
                acciones: [
                    "Corregir el flujo de aditivos en el cargador.",
                    "Ajustar la relación aire/gas en los quemadores del horno."
                ]
            },
            {
                id: "astillas_sueltas",
                nombre: "Astillas de Vidrio en Interior (Loose Glass Splinters)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Presencia de virutas, astillas o trozos sueltos de vidrio dentro de la botella.",
                causas: [
                    "Envases rotos aguas arriba en la cinta transportadora que salpican a otros.",
                    "Corte cizalla defectuoso."
                ],
                acciones: [
                    "Instalar un sistema de soplado/volteo de botellas para limpieza interna.",
                    "Mejorar el control e inspección automática en línea."
                ]
            },
            {
                id: "deformacion_takeout",
                nombre: "Deformación por Takeout (Takeout Mark)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Marcas o deformaciones en la boca o cuello causadas por las pinzas del extractor.",
                causas: [
                    "Las pinzas aprietan muy fuerte o abren a destiempo.",
                    "Las mordazas de la pinza están calientes o desgastadas."
                ],
                acciones: [
                    "Ajustar la presión neumática de cierre de la pinza.",
                    "Reemplazar los insertos de grafito de la pinza."
                ]
            },
            {
                id: "patinazo_correa",
                nombre: "Patinazo en Correa (Belt Scuffs)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Líneas grises o rayaduras horizontales en el cuerpo debido a fricción continua.",
                causas: [
                    "Velocidad del transportador descompensada con respecto a la máquina.",
                    "Guiado muy ajustado."
                ],
                acciones: [
                    "Sincronizar las velocidades de los transportadores.",
                    "Ajustar el ancho de las barandas de guía."
                ]
            },
            {
                id: "exceso_peso",
                nombre: "Exceso de Peso (Overweight)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La botella pesa más de la especificación tolerada, consumiendo más vidrio de lo presupuestado.",
                causas: [
                    "Gota de vidrio excesivamente pesada.",
                    "Regulación incorrecta del alimentador."
                ],
                acciones: [
                    "Subir el tubo del alimentador o regular la aguja para achicar la gota."
                ]
            },
            {
                id: "capacidad_incorrecta",
                nombre: "Capacidad Volumétrica Incorrecta",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La capacidad interna de la botella (en ml) no corresponde al volumen especificado para comercialización.",
                causas: [
                    "Espesor de pared excesivo (envase pesado).",
                    "Moldería con dimensiones internas incorrectas."
                ],
                acciones: [
                    "Verificar el peso del envase y ajustarlo.",
                    "Revisar el plano y las cotas de la moldería."
                ]
            },
            {
                id: "rebaba_cizalla",
                nombre: "Rebaba de Cizalla (Shear Mark Flange)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Una lengüeta de vidrio saliente en la base de la botella, justo sobre la cicatriz del corte.",
                causas: [
                    "Las cuchillas de la cizalla están desalineadas horizontalmente.",
                    "Falta de lubricación en la cizalla."
                ],
                acciones: [
                    "Ajustar la presión de corte y la superposición de las cuchillas.",
                    "Aumentar el caudal de agua de lubricación."
                ]
            },
            {
                id: "gota_fria",
                nombre: "Gota Fría (Cold Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Una porción del envase queda opaca o incompleta por la caída de una gota con temperatura baja.",
                causas: [
                    "Baja temperatura en el tazón del alimentador o canal.",
                    "Quemadores apagados."
                ],
                acciones: [
                    "Encender o regular los quemadores del alimentador.",
                    "Verificar el control de temperatura automático del canal."
                ]
            },
            {
                id: "gota_caliente",
                nombre: "Gota Caliente (Hot Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La botella colapsa o se deforma plásticamente por ingresar una gota demasiado caliente y fluida.",
                causas: [
                    "Exceso de calor en el canal o tazón del alimentador."
                ],
                acciones: [
                    "Reducir la combustión en el canal del alimentador."
                ]
            },
            {
                id: "gota_larga",
                nombre: "Gota Larga (Long Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Gota muy delgada y larga que cae enrollándose en el premolde, produciendo pliegues en espiral.",
                causas: [
                    "Ajuste inadecuado de la carrera de la aguja y temporización de la cizalla.",
                    "Vidrio muy caliente."
                ],
                acciones: [
                    "Disminuir la carrera de la aguja del alimentador.",
                    "Reducir temperatura del tazón."
                ]
            },
            {
                id: "gota_corta",
                nombre: "Gota Corta (Short Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Gota muy gruesa y corta que no alcanza a cargar adecuadamente la moldería de boca.",
                causas: [
                    "Aguja del alimentador muy arriba o carrera corta.",
                    "Vidrio frío."
                ],
                acciones: [
                    "Aumentar la carrera de la aguja.",
                    "Subir temperatura en el alimentador."
                ]
            },
            {
                id: "marca_aguja",
                nombre: "Marca de Aguja (Feeder Mark)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Una cicatriz opaca o estría en la parte interna del fondo del envase.",
                causas: [
                    "La aguja (plunger) del alimentador roza el orificio de la boquilla.",
                    "Aguja descentrada."
                ],
                acciones: [
                    "Centrar la aguja con respecto a la boquilla del alimentador."
                ]
            },
            {
                id: "vidrio_opaco",
                nombre: "Vidrio Opaco / Nublado (Cloudy Glass)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Pérdida de la transparencia cristalina del envase, viéndose nublado o turbio.",
                causas: [
                    "Presencia de humedad o gases reductores excesivos en el horno.",
                    "Contaminación en el calcín."
                ],
                acciones: [
                    "Mejorar el control del aire en la combustión del horno.",
                    "Controlar la procedencia y limpieza del calcín."
                ]
            },
            {
                id: "bajo_peso",
                nombre: "Bajo Peso (Underweight)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "El envase pesa menos de la especificación nominal, comprometiendo su espesor y resistencia.",
                causas: [
                    "Gota de vidrio de bajo peso.",
                    "Regulación del alimentador deficiente."
                ],
                acciones: [
                    "Ajustar el alimentador para incrementar el volumen de la gota."
                ]
            },
            {
                id: "marca_deflector",
                nombre: "Marca de Deflector (Deflector Mark)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Líneas oscuras o rugosas en el hombro de la botella por fricción durante la entrega de la gota.",
                causas: [
                    "Deflectores del canal de entrega sucios, desalineados o sin grafito."
                ],
                acciones: [
                    "Limpiar y pintar con grafito seco los deflectores de la sección."
                ]
            }
        ];

                // GENERAR ILUSTRACIÓN VECTORIAL SVG DINÁMICA DE DEFECTO EN CALIENTE
        export function generateDefectIllustration(defect) {
            const zona = defect.zona.toLowerCase();
            const nombre = defect.nombre.toLowerCase();
            
            // Colores base
            const colorDefect = "#ef4444"; // Rojo de advertencia para fallas
            const colorGlass = "rgba(255, 111, 0, 0.4)"; // Naranja simulando vidrio fundido
            
            // Silueta geométrica estándar de la botella
            let bottlePath = "M 42 22 L 42 12 L 58 12 L 58 22 L 68 32 L 68 84 Q 68 88 64 88 L 36 88 Q 32 88 32 84 L 32 32 Z";
            
            // Si el defecto implica deformación de silueta (ej: cuello doblado), modificamos los vectores
            if (nombre.includes("doblado") || nombre.includes("caída") || nombre.includes("caído") || nombre.includes("inclinada") || nombre.includes("inclinado")) {
                bottlePath = "M 42 22 L 35 12 L 51 9 L 56 22 L 68 32 L 68 84 Q 68 88 64 88 L 36 88 Q 32 88 32 84 L 32 32 Z";
            }
            
            let extraSvg = "";
            let highlightX = 50;
            let highlightY = 50;
            
            // Determinar coordenadas de la zona del defecto
            if (zona === 'boca') {
                highlightX = 50;
                highlightY = 14;
            } else if (zona === 'cuello') {
                highlightX = 50;
                highlightY = 27;
            } else if (zona === 'cuerpo') {
                highlightX = 50;
                highlightY = 55;
            } else if (zona === 'fondo') {
                highlightX = 50;
                highlightY = 82;
            }

            // Inyectar detalles vectoriales según el nombre del defecto
            if (nombre.includes("grieta") || nombre.includes("fisura") || nombre.includes("pelo") || nombre.includes("planchado")) {
                // Rayo rojo quebradizo para fisura
                extraSvg += `<path d="M ${highlightX-5} ${highlightY-5} L ${highlightX} ${highlightY} L ${highlightX-3} ${highlightY+5} L ${highlightX+5} ${highlightY+8}" fill="none" stroke="${colorDefect}" stroke-width="2" stroke-linecap="round" />`;
            } else if (nombre.includes("incompleta") || nombre.includes("incompleto") || nombre.includes("corto")) {
                // Eliminar esquina en la boca
                if (zona === 'boca') {
                    extraSvg += `<path d="M 39 11 L 46 11 L 43 15 Z" fill="#0e1013" stroke="none" />`;
                }
            } else if (nombre.includes("sucio") || nombre.includes("marca") || nombre.includes("grafito") || nombre.includes("lubricante") || nombre.includes("carbón")) {
                // Puntillismo oscuro de lubricación quemada
                extraSvg += `
                    <circle cx="${highlightX-4}" cy="${highlightY-3}" r="1.5" fill="#4a5568" />
                    <circle cx="${highlightX+3}" cy="${highlightY+1}" r="1" fill="#1a202c" />
                    <circle cx="${highlightX}" cy="${highlightY+4}" r="2" fill="#2d3748" />
                `;
            } else if (nombre.includes("burbuja") || nombre.includes("ampolla") || nombre.includes("semilla")) {
                // Trazados circulares huecos
                extraSvg += `
                    <circle cx="${highlightX-3}" cy="${highlightY-2}" r="2.5" fill="none" stroke="${colorDefect}" stroke-width="1" />
                    <circle cx="${highlightX+4}" cy="${highlightY+3}" r="1.5" fill="none" stroke="${colorDefect}" stroke-width="1" />
                `;
            } else if (nombre.includes("delgado") || nombre.includes("espesor")) {
                // Pared discontinua
                extraSvg += `
                    <path d="M 66 35 L 66 80" fill="none" stroke="${colorDefect}" stroke-width="2" stroke-dasharray="3,2" />
                `;
            } else {
                // Advertencia general (Signo de Exclamación en rojo)
                extraSvg += `
                    <circle cx="${highlightX}" cy="${highlightY-4}" r="2.5" fill="${colorDefect}" />
                    <line x1="${highlightX}" y1="${highlightY+1}" x2="${highlightX}" y2="${highlightY+7}" stroke="${colorDefect}" stroke-width="2.5" stroke-linecap="round" />
                `;
            }

            return `
                <svg viewBox="0 0 100 100" class="defect-svg-demo">
                    <!-- Botella -->
                    <path d="${bottlePath}" fill="none" stroke="${colorGlass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    
                    <!-- Halo de Zona Pulsante -->
                    <circle cx="${highlightX}" cy="${highlightY}" r="11" fill="none" stroke="${colorDefect}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" class="pulse-ring" />
                    
                    <!-- Trazados de Fallas -->
                    ${extraSvg}
                </svg>
            `;
        }

        // RENDERIZAR DEFECTOS EN EL DIRECTORIO
        export function renderDefectsList(defects) {
            const container = document.getElementById('defectsContainer');
            container.innerHTML = "";
            
            if (defects.length === 0) {
                container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-size:0.9rem;">
                                            No se encontraron defectos con ese criterio.
                                       </div>`;
                return;
            }

            defects.forEach(defect => {
                const item = document.createElement('div');
                item.className = 'defect-item';
                item.dataset.zone = defect.zona;
                
                // Color según gravedad
                let gravedadClass = "menor";
                if (defect.gravedad === "Crítico") gravedadClass = "critico";
                else if (defect.gravedad === "Mayor") gravedadClass = "mayor";

                // Obtener el HTML del SVG del defecto
                const svgIllustration = generateDefectIllustration(defect);

                item.innerHTML = `
                    <div class="defect-header" onclick="toggleDefectCard(this)">
                        <div class="defect-header-left">
                            <span class="defect-name">${defect.nombre}</span>
                            <div class="defect-meta">
                                <span class="defect-zone">${defect.zona}</span>
                                <span class="status-alert ${gravedadClass}">${defect.gravedad}</span>
                            </div>
                        </div>
                        <span class="defect-arrow">▼</span>
                    </div>
                    <div class="defect-body">
                        <div class="defect-content defect-grid-layout">
                            <!-- Columna Información -->
                            <div class="defect-info-col">
                                <div class="defect-desc">${defect.descripcion}</div>
                                
                                <div class="section-title">🔍 Causas Comunes:</div>
                                <ul class="list-items">
                                    ${defect.causas.map(c => `<li>${c}</li>`).join('')}
                                </ul>
                                
                                <div class="section-title">🛠️ Corrección en Máquina IS:</div>
                                <ul class="list-items" style="color: #cbd5e1;">
                                    ${defect.acciones.map(a => `<li>${a}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <!-- Columna Ilustración Vectorial -->
                            <div class="defect-visual-col">
                                ${svgIllustration}
                                <span class="defect-visual-label">Ubicación</span>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        // CONTROLAR APERTURA DE ACORDEÓN
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

        // CAMBIAR ENTRE PESTAÑAS (VISTAS) - MANEJADO POR WINDOW.SWITCHVIEW EXPANDIDO MÁS ADELANTE

        // FILTRADO DEL DIRECTORIO (BUSCADOR Y BOTONES RÁPIDOS)
        let currentFilterZone = "todo";

        function setFilter(zone, buttonElement) {
            // Activar botón del filtro
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            buttonElement.classList.add('active');
            
            currentFilterZone = zone;
            filterDefects();
        }

        function filterDefects() {
            const searchVal = document.getElementById('searchInput').value.toLowerCase();
            
            const filtered = DEFECTOS_DB.filter(defect => {
                const matchesSearch = defect.nombre.toLowerCase().includes(searchVal) || 
                                     defect.descripcion.toLowerCase().includes(searchVal) ||
                                     defect.gravedad.toLowerCase().includes(searchVal);
                
                const matchesZone = currentFilterZone === "todo" || defect.zona === currentFilterZone;
                
                return matchesSearch && matchesZone;
            });
            
            renderDefectsList(filtered);
        }

        export function getDefectsByZone(zone) {
            if (!zone || zone === 'todo') return DEFECTOS_DB;
            return DEFECTOS_DB.filter(d => d.zona.toLowerCase() === zone.toLowerCase());
        }

        export function getDefectById(id) {
            return DEFECTOS_DB.find(d => d.id === id) || null;
        }

