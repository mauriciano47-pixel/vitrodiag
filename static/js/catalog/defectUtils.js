// --- FUNCIONES UTILITARIAS Y DE VISUALIZACIÓN DE DEFECTOS INDUSTRIALES ---
import { setSafeHTML } from "../domUtils.js";
import { DEFECTOS_DB } from "../db.js";

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
            if (!container) return;
            container.replaceChildren();
            
            if (defects.length === 0) {
                setSafeHTML(container, `<div style="text-align:center; color:var(--text-muted); padding:30px; font-size:0.9rem;">
                                            No se encontraron defectos con ese criterio.
                                       </div>`);
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

                setSafeHTML(item, `
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
                `);
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
            const searchVal = document.getElementById('searchInput')?.value.toLowerCase();
            
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

        /**
         * Genera un resumen compacto en texto de los 96 defectos para inyectar en Gemini Vision Prompt.
         * @returns {string}
         */
        export function getDefectCatalogSummary() {
            return DEFECTOS_DB.map(d => `- ID: "${d.id}" | Nombre: "${d.nombre}" | Zona: "${d.zona}" | Gravedad: "${d.gravedad}" | Descr: "${d.descripcion.slice(0, 100)}..."`).join('\n');
        }

        /**
         * Busca un defecto por ID exacto, o por coincidencias aproximadas en nombre/id.
         * @param {string} searchStr 
         * @returns {Object|null}
         */
        export function findDefectByIdOrFuzzy(searchStr) {
            if (!searchStr) return null;
            const cleanStr = searchStr.trim().toLowerCase();
            
            // 1. Coincidencia exacta por ID
            let match = DEFECTOS_DB.find(d => d.id.toLowerCase() === cleanStr);
            if (match) return match;

            // 2. Coincidencia por inclusión de ID
            match = DEFECTOS_DB.find(d => cleanStr.includes(d.id.toLowerCase()) || d.id.toLowerCase().includes(cleanStr));
            if (match) return match;

            // 3. Coincidencia por nombre
            match = DEFECTOS_DB.find(d => d.nombre.toLowerCase().includes(cleanStr) || cleanStr.includes(d.nombre.toLowerCase()));
            if (match) return match;

            // 4. Fallback: búsqueda por palabras clave de la zona
            return null;
        }

