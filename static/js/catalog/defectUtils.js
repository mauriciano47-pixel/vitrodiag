// --- FUNCIONES UTILITARIAS Y MOTOR DE PLANOS CAD VECTORIALES DE DEFECTOS INDUSTRIALES ---
import { setSafeHTML } from "../domUtils.js";
import { DEFECTOS_DB } from "../db.js";

/**
 * Clasifica el arquetipo morfológico del defecto para renderizar su representación física exacta en el plano CAD.
 * @param {Object} defect
 * @returns {{ type: string, label: string }}
 */
export function classifyDefectArchetype(defect) {
    const id = (defect.id || "").toLowerCase();
    const nombre = (defect.nombre || "").toLowerCase();
    const text = `${id} ${nombre}`;

    if (id.includes("columpio_cuello") || id.includes("columpio_boca") || nombre.includes("stuck plunger") || nombre.includes("columpio cuello")) {
        return { type: "COLUMPIO_CUELLO", label: "FILAMENTO EN CUELLO" };
    }
    if (id.includes("columpio_cuerpo") || id.includes("hilos_internos") || nombre.includes("birdswing") || nombre.includes("columpio cuerpo") || nombre.includes("hilos internos")) {
        return { type: "COLUMPIO_CUERPO", label: "COLUMPIO / BIRDSWING" };
    }
    if (id.includes("puntas_vidrio") || id.includes("pico_base") || id.includes("picos") || nombre.includes("puntas de vidrio") || nombre.includes("pico de base") || nombre.includes("columpio de fondo")) {
        return { type: "PUNTAS_FONDO", label: "AGUJA / PICO EN BASE" };
    }
    if (id.includes("calcinado_gollete") || nombre.includes("gollete")) {
        return { type: "CALCINADO_GOLLETE", label: "FISURA BAJO GOLLETE" };
    }
    if (text.includes("emboquillad") || text.includes("garganta_cerrada") || text.includes("perdida_diametro") || text.includes("choked") || text.includes("diámetro interno") || text.includes("diametro interno") || text.includes("obstruid") || text.includes("estrecho")) {
        return { type: "EMBOQUILLADO", label: "ESTRANGULAMIENTO INTERNO" };
    }
    if (text.includes("gota_") || text.includes("peso") || text.includes("gob")) {
        return { type: "GOTA_MASA", label: "FORMACIÓN DE GOTA / MASA" };
    }
    if (text.includes("torcid") || text.includes("doblad") || text.includes("inclinad") || text.includes("desviad") || text.includes("perpendicularidad") || text.includes("caíd") || text.includes("caid") || text.includes("desalinead") || text.includes("descentrad")) {
        return { type: "INCLINACION_AXIAL", label: "DESVIACIÓN AXIAL (Δθ)" };
    }
    if (text.includes("incomplet") || text.includes("saltad") || text.includes("desportillad") || text.includes("astillad") || text.includes("rosca_partida") || text.includes("corto") || text.includes("abertura") || text.includes("falta") || text.includes("mella") || text.includes("boca_rota") || text.includes("chipped")) {
        return { type: "FALTA_VIDRIO_ROTURA", label: "FALTA VIDRIO / FRACTURA" };
    }
    if (text.includes("rebaba") || text.includes("costura") || text.includes("platina") || text.includes("corte") || text.includes("desplazad") || text.includes("corrid") || text.includes("excentric") || text.includes("excéntric") || text.includes("encastre") || text.includes("reborde") || text.includes("anillo") || text.includes("falda")) {
        return { type: "REBABA_COSTURA", label: "REBABA / UNIÓN DE MOLDE" };
    }
    if (text.includes("hundid") || text.includes("abollad") || text.includes("plano") || text.includes("chata") || text.includes("hinchad") || text.includes("abombad") || text.includes("asiento_desparejo") || text.includes("estirad") || text.includes("deformad") || text.includes("deformacion") || text.includes("ovalad") || text.includes("chupad") || text.includes("aplastad") || text.includes("pandead")) {
        return { type: "DEFORMACION_PARED", label: "DEFORMACIÓN GEOMÉTRICA" };
    }
    if (text.includes("delgad") || text.includes("espesor") || text.includes("disparej") || text.includes("fino") || text.includes("livian") || text.includes("grues") || text.includes("pesad") || text.includes("distribucion") || text.includes("distribución") || text.includes("capacidad")) {
        return { type: "ESPESOR_PARED", label: "ASIMETRÍA DE ESPESOR" };
    }
    if (text.includes("burbuja") || text.includes("ampolla") || text.includes("semilla") || text.includes("blister") || text.includes("poro") || text.includes("espuma")) {
        return { type: "BURBUJAS_SEMILLAS", label: "INCLUSIÓN GASEOSA" };
    }
    if (text.includes("piedra") || text.includes("infundid") || text.includes("desvitrificad") || text.includes("astillas_sueltas") || text.includes("cristal") || text.includes("suelto") || text.includes("pegad") || text.includes("adherid") || text.includes("inclusi") || text.includes("nudo") || text.includes("cuerpo extraño")) {
        return { type: "PIEDRAS_INCLUSIONES", label: "CUERPO EXTRAÑO / PIEDRA" };
    }
    if (text.includes("sucio") || text.includes("sucia") || text.includes("costra") || text.includes("grafito") || text.includes("swab") || text.includes("lubricante") || text.includes("negr") || text.includes("mancha") || text.includes("carbón") || text.includes("carbon") || text.includes("aceite") || text.includes("oxido") || text.includes("óxido") || text.includes("agua") || text.includes("opac") || text.includes("iris") || text.includes("velad") || text.includes("tono") || text.includes("contamin")) {
        return { type: "MANCHA_GRAFITO", label: "CONTAMINACIÓN / SWABBING" };
    }
    if (text.includes("calcinad") || text.includes("grieta") || text.includes("fisura") || text.includes("pelo") || text.includes("check") || text.includes("crazing") || text.includes("escamad") || text.includes("estrellad") || text.includes("roto") || text.includes("rota") || text.includes("fractura") || text.includes("picad") || text.includes("choque") || text.includes("tensión") || text.includes("tension") || text.includes("recocido")) {
        return { type: "FISURA_CALCINADO", label: "FRACTURA / CALCINADO" };
    }
    return { type: "ARRUGA_TEXTURA", label: "PLIEGUE / DEFECTO SUPERFICIAL" };
}

/**
 * Genera un Plano Técnico CAD Vectorial (Cross-Section Blueprint) de alta precisión
 * mostrando la anatomía real del envase, cotas por zona y la física exacta del defecto.
 * @param {Object} defect
 * @returns {string} HTML string con el elemento <svg>
 */
export function generateDefectIllustration(defect) {
    const rawZone = (defect.zona || "general").toLowerCase();
    const nombre = (defect.nombre || "").toLowerCase();
    const gravedad = (defect.gravedad || "Mayor").toLowerCase();
    const { type, label } = classifyDefectArchetype(defect);

    // Determinar zona anatómica efectiva (si el nombre menciona hombro, destacar hombro)
    let zona = rawZone;
    if (nombre.includes("hombro") && zona === "cuerpo") {
        zona = "hombro";
    }

    // Paleta técnica según severidad
    const colorSeverity = gravedad.includes("crític") || gravedad.includes("critic")
        ? "#ef4444"
        : (gravedad.includes("mayor") ? "#f59e0b" : "#38bdf8");
    const colorGlassStroke = "rgba(245, 158, 11, 0.78)";
    const colorGlassFill = "rgba(245, 158, 11, 0.16)";
    const colorInnerWall = "rgba(251, 191, 36, 0.38)";
    const colorGrid = "rgba(148, 163, 184, 0.14)";
    const colorCyan = "#38bdf8";

    // Coordenadas de bandas anatómicas en viewBox="0 0 150 200" (Centro botella X = 64)
    const zonesMeta = {
        boca:    { y1: 18, y2: 35, cy: 26, cx: 64, tag: "BOCA" },
        cuello:  { y1: 35, y2: 68, cy: 51, cx: 64, tag: "CUELLO" },
        hombro:  { y1: 68, y2: 96, cy: 82, cx: 64, tag: "HOMBRO" },
        cuerpo:  { y1: 96, y2: 158, cy: 127, cx: 64, tag: "CUERPO" },
        fondo:   { y1: 158, y2: 180, cy: 170, cx: 64, tag: "FONDO" },
        general: { y1: 18, y2: 180, cy: 112, cx: 64, tag: "GLOBAL" }
    };
    const activeZone = zonesMeta[zona] || zonesMeta.general;
    const hx = activeZone.cx;
    const hy = activeZone.cy;

    // Silueta exterior realista de botella industrial (corona + gollete + cuello + hombro + cuerpo + talón + fondo)
    let outerBottlePath = `
        M 53 18
        Q 51 18 51 20
        L 51 24
        Q 51 25 53 25
        L 50 28
        Q 49 30 52 32
        L 53 35
        Q 53 52 49 66
        C 45 76 32 84 32 98
        L 32 164
        Q 32 178 44 178
        L 84 178
        Q 96 178 96 164
        L 96 98
        C 96 84 83 76 79 66
        Q 75 52 75 35
        L 76 32
        Q 79 30 78 28
        L 75 25
        Q 77 25 77 24
        L 77 20
        Q 77 18 75 18
        Z
    `;

    // Cavidad interior mostrando espesor real de pared vítrea y bóveda de fondo (push-up)
    let innerCavityPath = `
        M 57 20
        L 57 36
        Q 57 53 53 67
        C 49 77 37 85 37 99
        L 37 162
        Q 37 172 46 172
        Q 64 163 82 172
        Q 91 172 91 162
        L 91 99
        C 91 85 79 77 75 67
        Q 71 53 71 36
        L 71 20
        Z
    `;

    let ghostOverlay = "";
    let defectVectors = "";

    // --- RENDERIZADO ESPECÍFICO SEGÚN ARQUETIPO FÍSICO DEL DEFECTO ---
    if (type === "INCLINACION_AXIAL") {
        // Silueta nominal fantasma en cian punteado + botella o cuello inclinado + arco angular Δθ
        ghostOverlay = `<path d="${outerBottlePath}" fill="none" stroke="${colorCyan}" stroke-width="1" stroke-dasharray="3,2" opacity="0.45" />`;
        if (zona === "cuello" || zona === "boca") {
            outerBottlePath = `
                M 45 19 L 44 25 L 42 29 L 46 35
                Q 48 52 48 66
                C 45 76 32 84 32 98 L 32 164 Q 32 178 44 178 L 84 178 Q 96 178 96 164 L 96 98
                C 96 84 83 76 79 66
                Q 74 52 70 35 L 72 29 L 69 25 L 69 19 Z
            `;
            defectVectors = `
                <line x1="64" y1="68" x2="54" y2="14" stroke="${colorSeverity}" stroke-width="1.5" stroke-dasharray="3,2" />
                <path d="M 64 32 A 36 36 0 0 0 57 33" fill="none" stroke="${colorSeverity}" stroke-width="1.5" />
                <text x="40" y="15" fill="${colorSeverity}" font-size="6.5" font-weight="bold" font-family="monospace">Δθ 4.8°</text>
            `;
        } else {
            defectVectors = `
                <g transform="rotate(-5 64 175)">
                    <path d="${outerBottlePath}" fill="rgba(239, 68, 68, 0.14)" stroke="${colorSeverity}" stroke-width="1.5" />
                    <line x1="64" y1="175" x2="64" y2="14" stroke="${colorSeverity}" stroke-width="1.4" stroke-dasharray="3,2" />
                </g>
                <text x="36" y="15" fill="${colorSeverity}" font-size="6.5" font-weight="bold" font-family="monospace">EJE -5.0°</text>
            `;
        }
    } else if (type === "COLUMPIO_CUERPO") {
        // Filamento bicóncavo de vidrio estirado de pared interna izquierda a pared interna derecha
        defectVectors = `
            <!-- Nodos de anclaje menisco en pared interna -->
            <path d="M 37 118 Q 43 125 37 132 Z" fill="${colorSeverity}" />
            <path d="M 91 120 Q 85 127 91 134 Z" fill="${colorSeverity}" />
            <!-- Hebra transversal de vidrio (Birdswing) -->
            <path d="M 37 122 C 52 127, 76 128, 91 124 L 91 130 C 76 129, 52 128, 37 128 Z" fill="${colorSeverity}" opacity="0.88" />
            <path d="M 37 125 Q 64 128 91 127" fill="none" stroke="#fef08a" stroke-width="1.2" />
            <!-- Vectores de tensión -->
            <line x1="48" y1="117" x2="80" y2="118" stroke="#fca5a5" stroke-width="0.9" stroke-dasharray="2,2" />
            <circle cx="64" cy="126.5" r="3" fill="none" stroke="#fef08a" stroke-width="1" class="pulse-ring" />
            <text x="64" y="114" text-anchor="middle" fill="#fef08a" font-size="5.5" font-weight="bold" font-family="monospace">HILO DE VIDRIO</text>
        `;
    } else if (type === "COLUMPIO_CUELLO") {
        // Punzón (Plunger) retirándose de la boca y dejando hebra de vidrio en garganta del cuello
        defectVectors = `
            <!-- Punzón mecánico (Stuck Plunger) -->
            <path d="M 60 12 L 60 39 Q 64 45 68 39 L 68 12" fill="rgba(56, 189, 248, 0.2)" stroke="${colorCyan}" stroke-width="1" stroke-dasharray="2,1" />
            <line x1="64" y1="22" x2="64" y2="13" stroke="${colorCyan}" stroke-width="1.3" />
            <polygon points="64,11 61.5,15 66.5,15" fill="${colorCyan}" />
            <!-- Filamento desgarrado en el cuello -->
            <path d="M 55 48 C 60 44, 66 42, 73 49 L 73 53 C 66 47, 60 47, 55 52 Z" fill="${colorSeverity}" />
            <path d="M 64 41 L 69 51" stroke="#fef08a" stroke-width="1.3" stroke-linecap="round" />
            <circle cx="64" cy="48" r="10" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
        `;
    } else if (type === "PUNTAS_FONDO") {
        // Agujas / Picos de vidrio emergiendo desde la base interna hacia arriba
        defectVectors = `
            <polygon points="55,171 58,144 61,171" fill="${colorSeverity}" stroke="#fef08a" stroke-width="0.7" />
            <polygon points="66,170 69,151 72,170" fill="${colorSeverity}" opacity="0.85" />
            <circle cx="58" cy="144" r="2.2" fill="#fef08a" class="pulse-ring" />
            <text x="64" y="139" text-anchor="middle" fill="#fca5a5" font-size="5.5" font-weight="bold" font-family="monospace">PICO AGUDO</text>
        `;
    } else if (type === "CALCINADO_GOLLETE") {
        // Fisura térmica horizontal bajo el anillo del gollete + Lupa de aumento 2.5x
        defectVectors = `
            <!-- Fisura brillante bajo el gollete -->
            <path d="M 51 31 L 58 33 L 65 31 L 73 33 L 77 31" fill="none" stroke="#fef08a" stroke-width="2" stroke-linecap="round" />
            <path d="M 50 31 L 58 33 L 65 31 L 73 33 L 78 31" fill="none" stroke="${colorSeverity}" stroke-width="1.2" />
            <!-- Lupa de aumento lateral -->
            <line x1="52" y1="32" x2="32" y2="45" stroke="${colorCyan}" stroke-width="0.8" stroke-dasharray="2,1" />
            <circle cx="21" cy="52" r="14" fill="#0f172a" stroke="${colorCyan}" stroke-width="1.2" />
            <path d="M 14 44 L 26 44 L 28 49 L 23 53 L 24 62" fill="none" stroke="${colorGlassStroke}" stroke-width="1.5" />
            <path d="M 16 53 L 22 54 L 27 52" fill="none" stroke="${colorSeverity}" stroke-width="1.8" />
            <text x="21" y="69" text-anchor="middle" fill="${colorCyan}" font-size="5" font-family="monospace">ZOOM 2.5x</text>
        `;
    } else if (type === "EMBOQUILLADO") {
        // Estrangulamiento anular interno en boca/cuello que impide el paso del calibre
        const yBore = zona === "boca" ? 25 : 46;
        defectVectors = `
            <!-- Protuberancia interna de vidrio -->
            <path d="M 56 ${yBore - 6} Q 63 ${yBore} 56 ${yBore + 6} Z" fill="${colorSeverity}" />
            <path d="M 72 ${yBore - 6} Q 65 ${yBore} 72 ${yBore + 6} Z" fill="${colorSeverity}" />
            <!-- Flecha de calibre bloqueado -->
            <line x1="64" y1="11" x2="64" y2="${yBore - 2}" stroke="#fef08a" stroke-width="1.5" />
            <polygon points="64,${yBore} 61,${yBore - 4} 67,${yBore - 4}" fill="#fef08a" />
            <line x1="59" y1="${yBore}" x2="69" y2="${yBore}" stroke="${colorSeverity}" stroke-width="1.5" />
        `;
    } else if (type === "FALTA_VIDRIO_ROTURA") {
        // Muesca / desportillado donde falta material en la corona o zona afectada
        const ry = zona === "fondo" ? 173 : (zona === "cuerpo" ? 120 : 19);
        const rx = zona === "cuerpo" ? 32 : 53;
        defectVectors = `
            <!-- Mordida oscura que suprime el borde de vidrio -->
            <polygon points="${rx - 2},${ry - 3} ${rx + 11},${ry - 3} ${rx + 8},${ry + 6} ${rx + 2},${ry + 4}" fill="#090d16" stroke="${colorSeverity}" stroke-width="1.4" />
            <!-- Esquirlas desprendidas -->
            <polygon points="${rx - 6},${ry - 5} ${rx - 3},${ry - 7} ${rx - 2},${ry - 3}" fill="${colorSeverity}" />
            <polygon points="${rx + 4},${ry - 8} ${rx + 7},${ry - 6} ${rx + 5},${ry - 4}" fill="#fca5a5" />
            <circle cx="${rx + 4}" cy="${ry + 1}" r="9" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
        `;
    } else if (type === "REBABA_COSTURA") {
        // Aletas / rebabas sobresaliendo del perfil en boca, costura lateral o fondo
        if (zona === "boca") {
            defectVectors = `
                <polygon points="51,18 43,14 45,20 51,22" fill="${colorSeverity}" />
                <polygon points="77,18 85,14 83,20 77,22" fill="${colorSeverity}" />
                <polygon points="50,28 43,28 45,31 51,31" fill="#fca5a5" />
                <circle cx="64" cy="21" r="14" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        } else if (zona === "fondo") {
            defectVectors = `
                <line x1="36" y1="178" x2="92" y2="178" stroke="${colorSeverity}" stroke-width="2.2" stroke-dasharray="4,2" />
                <polygon points="42,178 39,185 45,185" fill="${colorSeverity}" />
                <polygon points="84,178 81,185 87,185" fill="${colorSeverity}" />
            `;
        } else {
            // Costura vertical pronunciada a lo largo del molde
            defectVectors = `
                <line x1="31" y1="68" x2="31" y2="168" stroke="${colorSeverity}" stroke-width="2.4" />
                <line x1="97" y1="68" x2="97" y2="168" stroke="${colorSeverity}" stroke-width="2.4" />
                <polygon points="31,115 25,118 31,121" fill="#fca5a5" />
                <polygon points="97,115 103,118 97,121" fill="#fca5a5" />
            `;
        }
    } else if (type === "DEFORMACION_PARED") {
        // Hundimiento / Abombamiento comparado con la silueta nominal punteada
        ghostOverlay = `<path d="${outerBottlePath}" fill="none" stroke="${colorCyan}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.65" />`;
        if (zona === "hombro") {
            // Deformar realmente la pared del hombro izquierdo hacia adentro respecto al perfil nominal punteado
            outerBottlePath = `
                M 53 18 Q 51 18 51 20 L 51 24 Q 51 25 53 25 L 50 28 Q 49 30 52 32 L 53 35
                Q 53 52 49 66
                C 52 75 46 88 32 98
                L 32 164 Q 32 178 44 178 L 84 178 Q 96 178 96 164 L 96 98
                C 96 84 83 76 79 66
                Q 75 52 75 35 L 76 32 Q 79 30 78 28 L 75 25 Q 77 25 77 24 L 77 20 Q 77 18 75 18 Z
            `;
            innerCavityPath = `
                M 57 20 L 57 36 Q 57 53 53 67
                C 56 76 50 88 37 99
                L 37 162 Q 37 172 46 172 Q 64 163 82 172 Q 91 172 91 162 L 91 99
                C 91 85 79 77 75 67 Q 71 53 71 36 L 71 20 Z
            `;
            defectVectors = `
                <!-- Resaltado de la pared de hombro hundida -->
                <path d="M 49 66 C 52 75 46 88 32 98" fill="none" stroke="${colorSeverity}" stroke-width="2.2" stroke-linecap="round" />
                <!-- Flecha de colapso perpendicular al hombro -->
                <line x1="25" y1="74" x2="43" y2="80" stroke="${colorSeverity}" stroke-width="1.6" />
                <polygon points="45,81 39,76.5 40.5,82.5" fill="${colorSeverity}" />
                <circle cx="44" cy="81" r="10" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        } else {
            const dy = hy;
            defectVectors = `
                <!-- Curva de hundimiento lateral en cuerpo -->
                <path d="M 32 ${dy - 18} C 45 ${dy - 6}, 45 ${dy + 6}, 32 ${dy + 18}" fill="#090d16" stroke="${colorSeverity}" stroke-width="2" />
                <!-- Flechas de colapso hacia el interior -->
                <line x1="18" y1="${dy}" x2="36" y2="${dy}" stroke="${colorSeverity}" stroke-width="1.6" />
                <polygon points="38,${dy} 33,${dy - 3.5} 33,${dy + 3.5}" fill="${colorSeverity}" />
                <circle cx="38" cy="${dy}" r="11" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        }
    } else if (type === "ESPESOR_PARED") {
        // Pared izquierda crítica adelgazada vs pared derecha sobre-engrosada con cotas
        innerCavityPath = `
            M 57 20 L 57 36 Q 57 53 53 67
            C 45 77 33.2 85 33.2 99
            L 33.2 162 Q 33.5 175 46 175 Q 64 166 80 170 Q 84 170 84 160
            L 84 99 C 84 85 75 77 71 67 Z
        `;
        defectVectors = `
            <!-- Zona de espesor crítico en rojo -->
            <line x1="32.5" y1="95" x2="32.5" y2="158" stroke="${colorSeverity}" stroke-width="2.5" />
            <!-- Cotas de espesor -->
            <line x1="22" y1="125" x2="31" y2="125" stroke="${colorSeverity}" stroke-width="1.2" />
            <text x="20" y="121" text-anchor="middle" fill="${colorSeverity}" font-size="5.5" font-weight="bold" font-family="monospace">0.8mm</text>
            <line x1="84" y1="125" x2="96" y2="125" stroke="${colorCyan}" stroke-width="1.2" />
            <text x="68" y="127" fill="${colorCyan}" font-size="5.5" font-weight="bold" font-family="monospace">5.4mm</text>
        `;
    } else if (type === "BURBUJAS_SEMILLAS") {
        // Racimo de burbujas / vesículas gaseosas con brillo especular
        defectVectors = `
            <ellipse cx="${hx - 8}" cy="${hy - 6}" rx="4.5" ry="6.5" fill="rgba(239, 68, 68, 0.25)" stroke="${colorSeverity}" stroke-width="1.3" />
            <circle cx="${hx - 9.5}" cy="${hy - 8.5}" r="1.2" fill="#ffffff" />
            <ellipse cx="${hx + 6}" cy="${hy + 2}" rx="3.2" ry="4.8" fill="rgba(239, 68, 68, 0.25)" stroke="${colorSeverity}" stroke-width="1.2" />
            <circle cx="${hx + 5}" cy="${hy}" r="0.9" fill="#ffffff" />
            <circle cx="${hx - 2}" cy="${hy + 8}" r="2.2" fill="none" stroke="#fca5a5" stroke-width="1" />
            <circle cx="${hx + 9}" cy="${hy - 8}" r="1.6" fill="none" stroke="#fca5a5" stroke-width="1" />
            <circle cx="${hx}" cy="${hy}" r="14" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
        `;
    } else if (type === "PIEDRAS_INCLUSIONES") {
        // Inclusión refractaria poligonal opaca con líneas radiales de tensión
        defectVectors = `
            <!-- Halo de tensión alrededor de la piedra -->
            <circle cx="${hx}" cy="${hy}" r="11" fill="rgba(239, 68, 68, 0.18)" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            <line x1="${hx - 9}" y1="${hy - 7}" x2="${hx + 9}" y2="${hy + 7}" stroke="#fca5a5" stroke-width="0.9" />
            <line x1="${hx + 8}" y1="${hy - 8}" x2="${hx - 8}" y2="${hy + 8}" stroke="#fca5a5" stroke-width="0.9" />
            <!-- Núcleo mineral refractario -->
            <polygon points="${hx - 5},${hy - 2} ${hx - 1},${hy - 6} ${hx + 5},${hy - 3} ${hx + 4},${hy + 4} ${hx - 3},${hy + 5}" fill="#fde047" stroke="${colorSeverity}" stroke-width="1.3" />
        `;
    } else if (type === "MANCHA_GRAFITO") {
        // Costra oscura de grafito/carbón por hisopeado (swabbing)
        if (zona === "boca") {
            defectVectors = `
                <!-- Costra de carbón/calcinado asentada sobre el anillo de la corona -->
                <path d="M 52 19 Q 58 17 65 19 Q 71 21 67 24 Q 59 26 53 23 Z" fill="#0f172a" stroke="${colorSeverity}" stroke-width="1.2" />
                <circle cx="57" cy="21" r="1.5" fill="#334155" />
                <circle cx="63" cy="22" r="1.4" fill="#475569" />
                <circle cx="60" cy="22" r="9" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        } else {
            defectVectors = `
                <path d="M ${hx - 11} ${hy - 4} Q ${hx - 5} ${hy - 10} ${hx + 4} ${hy - 6} Q ${hx + 12} ${hy - 2} ${hx + 7} ${hy + 5} Q ${hx - 2} ${hy + 10} ${hx - 9} ${hy + 4} Z" fill="#0f172a" stroke="${colorSeverity}" stroke-width="1.3" />
                <circle cx="${hx - 4}" cy="${hy - 2}" r="2.2" fill="#334155" />
                <circle cx="${hx + 3}" cy="${hy + 1}" r="1.8" fill="#475569" />
                <circle cx="${hx + 9}" cy="${hy - 7}" r="1.5" fill="#0f172a" stroke="#f59e0b" stroke-width="0.7" />
                <circle cx="${hx - 11}" cy="${hy + 6}" r="1.3" fill="#0f172a" stroke="#f59e0b" stroke-width="0.7" />
                <circle cx="${hx}" cy="${hy}" r="13" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        }
    } else if (type === "FISURA_CALCINADO") {
        // Fractura ramificada de choque térmico (Check / Grieta / Pelo)
        if (zona === "boca") {
            defectVectors = `
                <!-- Calcinado / Fisura térmica sobre el anillo de la corona (Boca) -->
                <path d="M 54 18 L 58 22 L 56 26 L 61 30" fill="none" stroke="${colorSeverity}" stroke-width="2.2" stroke-linecap="round" />
                <path d="M 54 18 L 58 22 L 56 26 L 61 30" fill="none" stroke="#fef08a" stroke-width="0.9" stroke-linecap="round" />
                <path d="M 58 22 L 64 20" fill="none" stroke="${colorSeverity}" stroke-width="1.4" stroke-linecap="round" />
                <circle cx="58" cy="23" r="9" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        } else {
            defectVectors = `
                <path d="M ${hx - 10} ${hy - 8} L ${hx - 2} ${hy - 2} L ${hx + 3} ${hy + 4} L ${hx + 11} ${hy + 9}" fill="none" stroke="${colorSeverity}" stroke-width="2.4" stroke-linecap="round" />
                <path d="M ${hx - 10} ${hy - 8} L ${hx - 2} ${hy - 2} L ${hx + 3} ${hy + 4} L ${hx + 11} ${hy + 9}" fill="none" stroke="#fef08a" stroke-width="1" stroke-linecap="round" />
                <!-- Ramificación secundaria -->
                <path d="M ${hx - 2} ${hy - 2} L ${hx + 7} ${hy - 6}" fill="none" stroke="${colorSeverity}" stroke-width="1.5" stroke-linecap="round" />
                <path d="M ${hx + 3} ${hy + 4} L ${hx - 5} ${hy + 8}" fill="none" stroke="${colorSeverity}" stroke-width="1.4" stroke-linecap="round" />
                <circle cx="${hx}" cy="${hy}" r="13" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
            `;
        }
    } else if (type === "GOTA_MASA") {
        // Gota de alimentación (Gob) ingresando al molde + nivel de masa
        defectVectors = `
            <path d="M 64 6 C 58 14, 57 22, 64 25 C 71 22, 70 14, 64 6 Z" fill="${colorSeverity}" stroke="#fef08a" stroke-width="1" />
            <line x1="40" y1="115" x2="88" y2="115" stroke="${colorSeverity}" stroke-width="1.2" stroke-dasharray="3,2" />
            <line x1="40" y1="140" x2="88" y2="140" stroke="${colorSeverity}" stroke-width="1.2" stroke-dasharray="3,2" />
            <text x="64" y="130" text-anchor="middle" fill="#fef08a" font-size="6" font-weight="bold" font-family="monospace">MASA / GOTA</text>
        `;
    } else {
        // ARRUGA_TEXTURA: Pliegues térmicos / Cuerdas / Ondas / Martelado
        defectVectors = `
            <path d="M ${hx - 14} ${hy - 6} Q ${hx - 7} ${hy - 10} ${hx} ${hy - 6} T ${hx + 14} ${hy - 6}" fill="none" stroke="${colorSeverity}" stroke-width="1.6" stroke-linecap="round" />
            <path d="M ${hx - 15} ${hy} Q ${hx - 7} ${hy - 4} ${hx} ${hy} T ${hx + 15} ${hy}" fill="none" stroke="#fef08a" stroke-width="1.3" stroke-linecap="round" />
            <path d="M ${hx - 14} ${hy + 6} Q ${hx - 7} ${hy + 2} ${hx} ${hy + 6} T ${hx + 14} ${hy + 6}" fill="none" stroke="${colorSeverity}" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="${hx}" cy="${hy}" r="14" fill="none" stroke="${colorSeverity}" stroke-width="1" stroke-dasharray="2,2" class="pulse-ring" />
        `;
    }

    // Construir reglas laterales de zonas anatómicas (derecha del plano X = 104..145)
    const zoneOrder = ["boca", "cuello", "hombro", "cuerpo", "fondo"];
    const zoneRulersSvg = zoneOrder.map(zKey => {
        const zm = zonesMeta[zKey];
        const isTarget = (zona === zKey) || (zona === "general");
        const strokeCol = isTarget ? colorSeverity : "rgba(148, 163, 184, 0.25)";
        const textCol = isTarget ? colorSeverity : "#64748b";
        const fontWeight = isTarget ? "bold" : "normal";
        return `
            <line x1="99" y1="${zm.y1}" x2="108" y2="${zm.y1}" stroke="${strokeCol}" stroke-width="0.8" />
            <line x1="104" y1="${zm.y1}" x2="104" y2="${zm.y2}" stroke="${strokeCol}" stroke-width="${isTarget ? "1.8" : "0.7"}" />
            <text x="110" y="${zm.cy + 2}" fill="${textCol}" font-size="6" font-weight="${fontWeight}" font-family="monospace">${zm.tag}</text>
        `;
    }).join("");

    // Línea indicadora (Callout Leader Line) desde el defecto hacia la columna de cotas
    const leaderLineSvg = `
        <line x1="${hx + 10}" y1="${hy}" x2="103" y2="${hy}" stroke="${colorSeverity}" stroke-width="0.9" stroke-dasharray="2,1" opacity="0.85" />
        <circle cx="${hx + 10}" cy="${hy}" r="1.6" fill="${colorSeverity}" />
        <circle cx="103" cy="${hy}" r="1.6" fill="${colorSeverity}" />
    `;

    return `
        <svg viewBox="0 0 150 202" class="defect-svg-demo" role="img" aria-label="Plano técnico de ubicación del defecto ${defect.nombre}">
            <!-- Fondo Blueprint CAD -->
            <rect x="1" y="1" width="148" height="200" rx="6" fill="#090d16" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1" />
            
            <!-- Encabezado de Plano I.S. -->
            <rect x="1" y="1" width="148" height="13" rx="5" fill="rgba(15, 23, 42, 0.9)" />
            <text x="7" y="10" fill="#38bdf8" font-size="5.8" font-weight="bold" font-family="monospace">CAD MOLDERÍA I.S.</text>
            <text x="143" y="10" text-anchor="end" fill="${colorSeverity}" font-size="5.8" font-weight="bold" font-family="monospace">[${activeZone.tag}]</text>

            <!-- Retícula Técnica Horizontal -->
            <line x1="8" y1="35" x2="98" y2="35" stroke="${colorGrid}" stroke-width="0.6" stroke-dasharray="2,2" />
            <line x1="8" y1="68" x2="98" y2="68" stroke="${colorGrid}" stroke-width="0.6" stroke-dasharray="2,2" />
            <line x1="8" y1="96" x2="98" y2="96" stroke="${colorGrid}" stroke-width="0.6" stroke-dasharray="2,2" />
            <line x1="8" y1="158" x2="98" y2="158" stroke="${colorGrid}" stroke-width="0.6" stroke-dasharray="2,2" />

            <!-- Banda Iluminada de la Zona Afectada -->
            <rect x="10" y="${activeZone.y1}" width="92" height="${activeZone.y2 - activeZone.y1}" fill="${colorSeverity}" opacity="0.11" rx="2" />

            <!-- Eje Central de Simetría (Plomada Nominal) -->
            <line x1="64" y1="15" x2="64" y2="183" stroke="rgba(56, 189, 248, 0.32)" stroke-width="0.8" stroke-dasharray="4,2" />

            <!-- Silueta Nominal Fantasma (si aplica) -->
            ${ghostOverlay}

            <!-- Corte Longitudinal del Envase (Pared Exterior + Espesor Vítreo) -->
            <path d="${outerBottlePath}" fill="${colorGlassFill}" stroke="${colorGlassStroke}" stroke-width="1.6" stroke-linejoin="round" />
            
            <!-- Cavidad Interna (Espesor de Pared y Push-Up del Fondo) -->
            <path d="${innerCavityPath}" fill="rgba(9, 13, 22, 0.72)" stroke="${colorInnerWall}" stroke-width="0.9" stroke-linejoin="round" />

            <!-- Brillo Especular Óptico del Envase -->
            <path d="M 35 102 L 35 156" stroke="rgba(255, 255, 255, 0.18)" stroke-width="1.5" stroke-linecap="round" />

            <!-- Regla de Cotas Anatómicas a la Derecha -->
            ${zoneRulersSvg}

            <!-- Línea Indicadora (Callout) -->
            ${leaderLineSvg}

            <!-- Vectores Físicos del Defecto -->
            ${defectVectors}

            <!-- Pie de Plano con Arquetipo Técnico -->
            <rect x="1" y="186" width="148" height="15" rx="4" fill="rgba(15, 23, 42, 0.92)" />
            <text x="75" y="196" text-anchor="middle" fill="#e2e8f0" font-size="5.6" font-weight="bold" font-family="monospace">${label}</text>
        </svg>
    `;
}

// RENDERIZAR DEFECTOS EN EL DIRECTORIO
export function renderDefectsList(defects) {
    const container = document.getElementById('defectsContainer');
    if (!container) return;
    container.replaceChildren();
    
    if (defects.length === 0) {
        setSafeHTML(container, `<div class="empty-defects-msg">
                                    No se encontraron defectos con ese criterio.
                               </div>`);
        return;
    }

    defects.forEach(defect => {
        const item = document.createElement('div');
        item.className = 'defect-item';
        const effectiveZone = (defect.nombre && defect.nombre.toLowerCase().includes('hombro') && defect.zona === 'cuerpo')
            ? 'hombro'
            : defect.zona;
        item.dataset.zone = effectiveZone;
        
        // Color según gravedad
        let gravedadClass = "menor";
        if (defect.gravedad === "Crítico") gravedadClass = "critico";
        else if (defect.gravedad === "Mayor") gravedadClass = "mayor";

        // Obtener el HTML del SVG CAD del defecto
        const svgIllustration = generateDefectIllustration(defect);

        setSafeHTML(item, `
            <div class="defect-header" onclick="toggleDefectCard(this)">
                <div class="defect-header-left">
                    <span class="defect-name">${defect.nombre}</span>
                    <div class="defect-meta">
                        <span class="defect-zone">${effectiveZone}</span>
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
                        <ul class="list-items list-items-correction">
                            ${defect.acciones.map(a => `<li>${a}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <!-- Columna Ilustración Vectorial CAD -->
                    <div class="defect-visual-col">
                        ${svgIllustration}
                        <span class="defect-visual-label">Plano de Zona: ${effectiveZone.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `);
        container.appendChild(item);
    });
}

export function getDefectsByZone(zone) {
    if (!zone || zone === 'todo') return DEFECTOS_DB;
    return DEFECTOS_DB.filter(d => d.zona.toLowerCase() === zone.toLowerCase());
}

export function getDefectById(id) {
    return DEFECTOS_DB.find(d => d.id === id) || null;
}

/**
 * Genera un resumen compacto en texto de los 147 defectos para inyectar en Gemini Vision Prompt.
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
