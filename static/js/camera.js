import { state } from './state.js';
import { showToast } from './ui.js';

let currentFacingMode = "environment"; // "environment" (trasera) o "user" (frontal)

/**
 * Alterna entre la cámara trasera y frontal.
 */
export async function toggleCameraFacingMode() {
    currentFacingMode = (currentFacingMode === "environment") ? "user" : "environment";
    showToast(`Cambiando a cámara ${currentFacingMode === "environment" ? "trasera" : "frontal"}...`, "info");
    stopDiagnosticCamera();
    await new Promise(res => setTimeout(res, 250));
    await startDiagnosticCamera();
}

/**
 * Solicita permisos de cámara directamente al navegador Chrome mostrando el popup nativo (Allow/Block).
 */
export async function requestCameraPermissionDirectly() {
    showToast("Solicitando acceso a la cámara...", "info");
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Tu navegador no soporta WebRTC en este protocolo. Usa '📷 Foto Nativa'.", "warning");
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });

        if (stream) {
            state.diagnosticStream = stream;
            const video = document.getElementById('webcam');
            const status = document.getElementById('opencvStatus');
            const previewImg = document.getElementById('nexusPreviewImg');
            const placeholder = document.getElementById('nexusPlaceholder');
            const bboxCanvas = document.getElementById('nexusBboxCanvas');

            if (previewImg) previewImg.style.display = 'none';
            if (placeholder) placeholder.style.display = 'none';
            if (bboxCanvas) bboxCanvas.style.display = 'none';

            if (video) {
                video.srcObject = stream;
                video.setAttribute('autoplay', '');
                video.setAttribute('muted', '');
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.muted = true;
                video.volume = 0;
                video.playsInline = true;
                video.style.display = 'block';
                video.style.opacity = '1';
                await video.play().catch(e => console.warn("[Camera] Play diferido:", e));
            }
            if (status) {
                status.innerText = "Motor Visión: Cámara en Vivo Activa (Encuadra el Envase)";
                status.style.color = "#10b981";
            }
            showToast("✅ Cámara en vivo conectada con éxito.", "success");
            if (window.startProcessing) window.startProcessing();
        }
    } catch (err) {
        console.error("Error al solicitar permiso directo:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            showToast("Permiso bloqueado en el navegador. Puedes usar '📷 FOTO NATIVA'.", "warning");
            openCameraPermissionModal("🚨 Permiso de cámara bloqueado", "danger");
        } else {
            showToast("No se pudo iniciar la cámara en vivo. Usa '📷 FOTO NATIVA'.", "info");
        }
    }
}

/**
 * Inicia la cámara de diagnóstico en streaming continuo en el visor superior.
 */
export async function startDiagnosticCamera() {
    // Si ya hay un stream activo y el video está reproduciéndose, asegurar visibilidad
    const video = document.getElementById('webcam');
    const previewImg = document.getElementById('nexusPreviewImg');
    const placeholder = document.getElementById('nexusPlaceholder');
    const status = document.getElementById('opencvStatus');

    if (state.diagnosticStream && video && video.srcObject) {
        if (previewImg) previewImg.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        video.style.display = 'block';
        video.style.opacity = '1';
        try {
            await video.play();
        } catch (_) {}
        if (status) {
            status.innerText = "Motor Visión: Cámara en Vivo Activa";
            status.style.color = "#10b981";
        }
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("[Camera] mediaDevices no disponible.");
        if (status) {
            status.innerText = "Motor Visión: Listo (Usa '📸 CAPTURAR' o '📷 FOTO NATIVA')";
            status.style.color = "#f59e0b";
        }
        return;
    }

    if (status) {
        status.innerText = "Iniciando visor de cámara...";
        status.style.color = "rgba(255, 111, 0, 0.85)";
    }

    // Detener cualquier stream previo colgado
    stopDiagnosticCamera();
    await new Promise(res => setTimeout(res, 150));

    // Cascada de constraints tolerante
    const constraintLevels = [
        { video: { facingMode: { ideal: currentFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: currentFacingMode }, audio: false },
        { video: true, audio: false }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of constraintLevels) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (stream) break;
        } catch (err) {
            lastError = err;
            console.warn("[Camera] Constraint no soportado, probando fallback...", constraints, err);
        }
    }

    if (stream) {
        state.diagnosticStream = stream;
        if (typeof window !== 'undefined') window.state = state;

        if (video) {
            video.srcObject = stream;
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.muted = true;
            video.volume = 0;
            video.playsInline = true;
            video.style.display = 'block';
            video.style.opacity = '1';

            if (previewImg) previewImg.style.display = 'none';
            if (placeholder) placeholder.style.display = 'none';

            // Esperar metadata
            await new Promise((resolve) => {
                if (video.readyState >= 1) {
                    resolve();
                } else {
                    video.onloadedmetadata = () => resolve();
                    setTimeout(resolve, 600);
                }
            });

            try {
                await video.play();
            } catch (e) {
                console.warn("[Camera] Play diferido:", e);
                video.muted = true;
                await video.play().catch(() => {});
            }
        }

        if (status) {
            status.innerText = "Motor Visión: Cámara en Vivo Activa (Apuntando al Envase)";
            status.style.color = "#10b981";
        }
    } else {
        console.warn("[Camera] No se pudo obtener stream automático:", lastError);
        state.diagnosticStream = null;
        if (typeof window !== 'undefined') window.state = state;

        if (status) {
            if (lastError && (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError')) {
                status.innerText = "Cámara: Permiso Bloqueado (Toca '📷 FOTO NATIVA')";
                status.style.color = "#ef4444";
            } else {
                status.innerText = "Motor Visión: Listo para Disparo (Toca '📸 CAPTURAR VISOR')";
                status.style.color = "#10b981";
            }
        }
    }
}

/**
 * Detiene la cámara de diagnóstico y libera el hardware.
 */
export function stopDiagnosticCamera() {
    if (state.diagnosticStream) {
        try {
            state.diagnosticStream.getTracks().forEach(track => {
                track.stop();
            });
        } catch (_) {}
        state.diagnosticStream = null;
    }
    const video = document.getElementById('webcam');
    if (video) {
        video.srcObject = null;
    }
}

/**
 * Inicia la cámara para el escáner de consola BDF.
 */
export async function startScannerCamera() {
    if (state.scannerStream) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        state.scannerStream = stream;
        const video = document.getElementById('scannerVideo');
        if (video) {
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            await video.play();
        }
    } catch (e) {
        console.warn("[ScannerCamera] Falló cámara de escáner:", e);
    }
}

/**
 * Detiene la cámara del escáner.
 */
export function stopScannerCamera() {
    if (state.scannerStream) {
        try {
            state.scannerStream.getTracks().forEach(track => track.stop());
        } catch (_) {}
        state.scannerStream = null;
    }
    const video = document.getElementById('scannerVideo');
    if (video) video.srcObject = null;
}

// Liberar cámara al cambiar de app en el celular
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
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
    startDiagnosticCamera();
}

export async function checkCameraPermissions() {
    if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
    try {
        const result = await navigator.permissions.query({ name: 'camera' });
        return result.state;
    } catch (e) {
        return 'unknown';
    }
}

if (typeof window !== 'undefined') {
    window.startDiagnosticCamera = startDiagnosticCamera;
    window.stopDiagnosticCamera = stopDiagnosticCamera;
    window.toggleCameraFacingMode = toggleCameraFacingMode;
    window.requestCameraPermissionDirectly = requestCameraPermissionDirectly;
    window.openCameraPermissionModal = openCameraPermissionModal;
    window.closeCameraPermissionModal = closeCameraPermissionModal;
    window.retryCameraPermissions = retryCameraPermissions;
    window.checkCameraPermissions = checkCameraPermissions;
}
