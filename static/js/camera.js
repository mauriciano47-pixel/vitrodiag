import { state } from './state.js';
import { showToast } from './ui.js';

const cameraConstraints = {
    video: { 
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }, 
    audio: false 
};

async function startDiagnosticCamera() {
    const btnTap = document.getElementById('btnTapCameraStart');
    if (state.diagnosticStream) {
        if (btnTap) btnTap.style.display = 'none';
        return;
    }

    if (btnTap) {
        btnTap.innerText = "⏳ Conectando cámara en Chrome...";
        btnTap.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
    }
    
    // Detener cualquier stream anterior colgado
    stopDiagnosticCamera();
    await new Promise(res => setTimeout(res, 200));

    const video = document.getElementById('webcam');
    const status = document.getElementById('opencvStatus');
    if (!video || !status) return;

    status.innerText = "Iniciando cámara en Chrome...";
    status.style.color = "rgba(255, 111, 0, 0.7)";

    // Cascada de 3 niveles de constraints para compatibilidad 100% en Chrome Android/iOS
    const constraintLevels = [
        { video: { facingMode: { exact: "environment" } }, audio: false },
        { video: { facingMode: "environment" }, audio: false },
        { video: true, audio: false }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of constraintLevels) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (stream) break; // Conexión exitosa
        } catch (err) {
            lastError = err;
            console.warn("[Camera] Constraint fallido en Chrome, intentando siguiente nivel...", constraints, err);
        }
    }

    if (stream) {
        state.diagnosticStream = stream;
        video.muted = true;
        video.volume = 0;
        video.playsInline = true;
        video.srcObject = stream;

        // Esperar metadata en Android 14 (Motorola Moto G85) para evitar fallos de play()
        await new Promise((resolve) => {
            if (video.readyState >= 1) {
                resolve();
            } else {
                video.onloadedmetadata = () => resolve();
                setTimeout(resolve, 800);
            }
        });

        try {
            await video.play();
        } catch (e) {
            console.warn("[Camera] Play webcam diferido en Chrome, reintentando...", e);
            video.muted = true;
            await video.play().catch(err => console.error("[Camera] Error final en play():", err));
        }

        status.innerText = "Motor Visión: Cámara en Vivo Activa (Chrome)";
        status.style.color = "#10b981";
        if (btnTap) btnTap.style.display = 'none';
        showToast("🎥 Cámara en vivo activada correctamente.", "success");
    } else {
        console.error("Chrome denegó o no pudo acceder a la cámara WebRTC:", lastError);
        state.diagnosticStream = null;
        
        if (btnTap) {
            btnTap.style.display = 'block';
            btnTap.innerText = "📸 TOCAR AQUÍ PARA TOMAR FOTO CON CELULAR (MODO DIRECTO)";
            btnTap.style.background = "linear-gradient(135deg, #10b981, #059669)";
            btnTap.onclick = () => {
                triggerLiveNativeFileSelect();
            };
        }

        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isSecure) {
            status.innerText = "Cámara: Requiere HTTPS (GitHub Pages)";
            status.style.color = "#f59e0b";
            showToast("Abre la app desde la URL HTTPS oficial para activar la cámara en vivo.", "warning");
        } else if (lastError && (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError')) {
            status.innerText = "Cámara Chrome: Permiso Bloqueado (Usa 'Tomar Foto')";
            status.style.color = "#ef4444";
            showToast("Chrome tiene la cámara bloqueada. Usa el botón '📸 Tomar Foto' que funciona sin permisos.", "info");
        } else {
            status.innerText = "Cámara: Modo Fotográfico Directo Activo";
            status.style.color = "#10b981";
            showToast("Usa '📸 Tomar Foto' para capturar fotos en alta resolución sin depender de WebRTC.", "info");
        }
    }
}

// Escuchar cambios de visibilidad para liberar el hardware al cambiar de app en el celular (Motorola Android 14)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log("[Camera] App en segundo plano. Liberando hardware de cámara...");
        stopDiagnosticCamera();
        stopScannerCamera();
    }
});

document.addEventListener('pagehide', () => {
    stopDiagnosticCamera();
    stopScannerCamera();
});



export function openCameraPermissionModal(customMessage = null, statusType = 'warning') {
    const modal = document.getElementById('cameraPermissionModal');
    const badge = document.getElementById('permStatusBadge');
    if (badge) {
        if (customMessage) badge.innerText = customMessage;
        badge.className = `perm-status-badge perm-${statusType}`;
    }
    if (modal) modal.classList.add('active');
}

export function closeCameraPermissionModal() {
    const modal = document.getElementById('cameraPermissionModal');
    if (modal) modal.classList.remove('active');
}

export function retryCameraPermissions() {
    closeCameraPermissionModal();
    forceRetryCamera();
}

export async function checkCameraPermissions() {
    if (!navigator.permissions || !navigator.permissions.query) {
        return 'unknown';
    }
    try {
        const result = await navigator.permissions.query({ name: 'camera' });
        return result.state; // 'granted', 'prompt', 'denied'
    } catch (e) {
        return 'unknown';
    }
}


export function forceRetryCamera() {
    state.diagnosticStream = null;
    startDiagnosticCamera();
    if (window.startProcessing) window.startProcessing();
}

function stopDiagnosticCamera() {
    if (state.diagnosticStream) {
        state.diagnosticStream.getTracks().forEach(track => track.stop());
        state.diagnosticStream = null;
    }
    const video = document.getElementById('webcam');
    if (video) {
        video.srcObject = null;
        try { video.load(); } catch (e) {}
    }
}

function stopScannerCamera() {
    if (state.scannerStream) {
        state.scannerStream.getTracks().forEach(track => track.stop());
        state.scannerStream = null;
    }
    const video = document.getElementById('scannerVideo');
    if (video) {
        video.srcObject = null;
        try { video.load(); } catch (e) {}
    }
}


async function startScannerCamera() {
    const video = document.getElementById('scannerVideo');
    if (!video) return;

    if (state.scannerStream) stopScannerCamera();
    
    // Grace period para liberar el hardware de cámaras anteriores
    await new Promise(res => setTimeout(res, 350));

    try {
        const scannerConstraints = {
            video: { 
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        state.scannerStream = await navigator.mediaDevices.getUserMedia(scannerConstraints);
        video.srcObject = state.scannerStream;
        video.setAttribute('playsinline', '');
        await video.play().catch(e => console.log("Play scanner interrumpido:", e));
        showToast("Cámara de escáner iniciada.", "success");
    } catch (err) {
        console.warn("Fallo al iniciar cámara de escáner con constraints. Usando fallback...", err);
        try {
            state.scannerStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = state.scannerStream;
            video.setAttribute('playsinline', '');
            await video.play().catch(e => console.log("Play scanner fallback interrumpido:", e));
            showToast("Cámara de escáner iniciada (fallback).", "success");
        } catch (fallbackErr) {
            console.error("No se pudo iniciar la cámara de escáner: ", fallbackErr);
            showToast("No se pudo iniciar la cámara del escáner.", "error");
        }
    }
}

/**
 * Dispara el input de archivo de cámara nativa del celular.
 */
export function triggerLiveNativeFileSelect() {
    const input = document.getElementById('liveNativeFileInput');
    if (input) input.click();
}

/**
 * Procesa la fotografía tomada por la cámara nativa del smartphone sobre el motor de visión.
 * @param {Event} event 
 */
export function handleLiveNativeFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Seleccione un archivo de imagen válido.', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('canvasOutput');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = 320;
                canvas.height = Math.round(320 * (img.height / img.width));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                showToast('Fotografía cargada en el motor de visión.', 'success');
                if (window.runDeepDiagnosis) {
                    window.runDeepDiagnosis(e.target.result);
                }
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

export { startDiagnosticCamera, stopDiagnosticCamera, startScannerCamera, stopScannerCamera };
