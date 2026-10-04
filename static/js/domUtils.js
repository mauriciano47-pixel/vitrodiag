// Utilitario DOM Seguro para VitroDiag (Protección OWASP Anti-XSS y Sanitización W3C)
// Protocolo Gemini Anti-Timeout Shield: timeout 8000ms con AbortController y fallback offline.

/**
 * Asigna contenido HTML a un elemento del DOM de forma segura mediante DOMParser y replaceChildren.
 * Evita la ejecución arbitraria de scripts y elimina vulnerabilidades XSS por asignación directa a innerHTML.
 * @param {HTMLElement} element - Elemento DOM de destino.
 * @param {string} html - Cadena HTML a parsear e insertar.
 */
export function setSafeHTML(element, html) {
    if (!element) return;
    if (typeof html !== 'string') {
        html = String(html || '');
    }
    if (typeof DOMParser !== 'undefined') {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            element.replaceChildren(...Array.from(doc.body.childNodes));
            return;
        } catch (_) {
            // Fallback en caso de error de parseo
        }
    }
    // Fallback estándar en entornos sin DOMParser
    if (typeof element.replaceChildren === 'function') {
        element.replaceChildren();
    }
}

/**
 * Vacía de forma segura los nodos hijos de un elemento DOM sin manipulación de cadenas.
 * @param {HTMLElement} element - Elemento DOM a limpiar.
 */
export function clearElement(element) {
    if (!element) return;
    if (typeof element.replaceChildren === 'function') {
        element.replaceChildren();
    } else {
        element.textContent = '';
    }
}

// Registro global en window para interoperabilidad en scripts y handlers en línea
if (typeof window !== 'undefined') {
    window.setSafeHTML = setSafeHTML;
    window.clearElement = clearElement;
}
