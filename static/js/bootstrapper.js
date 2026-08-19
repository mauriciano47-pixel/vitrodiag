// VitroDiag Always-Live Micro-Bootstrapper & Auto-Hot-Reload (Zero-SW / Zero-Cache)
(async function initVitroDiagBootstrapper() {
    // 1. Desregistrar cualquier Service Worker residual y purgar CacheStorage
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
                await reg.unregister();
                console.log('[VitroDiag Bootstrapper] Service Worker desregistrado.');
            }
        }
        if ('caches' in window) {
            const keys = await caches.keys();
            for (const key of keys) {
                await caches.delete(key);
                console.log('[VitroDiag Bootstrapper] CacheStorage purgado:', key);
            }
        }
    } catch (swErr) {
        console.warn('[VitroDiag Bootstrapper] Limpieza SW:', swErr);
    }

    // 2. Obtener versión viva desde el servidor
    let currentBuildTime = Date.now();
    let currentVersion = '2.2.0';

    try {
        const res = await fetch('version.json?_t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
            const meta = await res.json();
            currentVersion = meta.version || currentVersion;
            currentBuildTime = meta.buildTime || currentBuildTime;
            window.__VITRODIAG_META__ = meta;
        }
    } catch (err) {
        console.warn('[VitroDiag Bootstrapper] No se pudo leer version.json, usando timestamp:', err);
    }

    window.__VITRODIAG_VERSION__ = currentVersion;
    console.log(`%c[VitroDiag v${currentVersion}] Modo Always-Live (Zero-Cache Shield Activo)`, 'color: #3fb950; font-weight: bold; background: #0d1117; padding: 4px 8px; border-radius: 4px;');

    // 3. Inyectar el script principal con cache-busting estricto
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `static/js/main.js?v=${currentVersion}_${currentBuildTime}`;
    script.onerror = function() {
        console.error('[VitroDiag Bootstrapper] Falló la carga del módulo principal. Reintentando...');
        const retryScript = document.createElement('script');
        retryScript.type = 'module';
        retryScript.src = `static/js/main.js?retry=${Date.now()}`;
        document.body.appendChild(retryScript);
    };
    document.body.appendChild(script);

    // 4. Vigilante de actualizaciones en vivo (Monitoreo cada 60 segundos)
    setInterval(async () => {
        try {
            const pollRes = await fetch('version.json?_t=' + Date.now(), { cache: 'no-store' });
            if (pollRes.ok) {
                const pollMeta = await pollRes.json();
                if (pollMeta.buildTime && pollMeta.buildTime !== currentBuildTime) {
                    mostrarToastActualizacion(pollMeta.version || 'Nueva');
                }
            }
        } catch (_) {}
    }, 60000);
})();

/**
 * Notificación visual no invasiva de actualización en caliente.
 * @param {string} newVer 
 */
function mostrarToastActualizacion(newVer) {
    if (document.getElementById('vitrodiag-live-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'vitrodiag-live-update-banner';
    banner.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#161b22;border:1px solid #3fb950;color:#f0f6fc;padding:14px 20px;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;gap:14px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;animation:fadeIn 0.3s ease;';
    banner.innerHTML = `
        <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">✨</span>
            <span>Nueva versión <strong>v${newVer}</strong> disponible en vivo.</span>
        </span>
        <button id="btnActualizarVitroDiag" style="background:#238636;color:#ffffff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:background 0.2s;">
            Actualizar ahora
        </button>
    `;
    document.body.appendChild(banner);

    const btn = document.getElementById('btnActualizarVitroDiag');
    if (btn) {
        btn.onclick = function() {
            window.location.reload(true);
        };
    }
}
