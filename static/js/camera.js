/**
 * camera.js — Motor Visión & Gestión de Hardware de Cámara (VitroDiag)
 * Implementa control táctico de streaming WebRTC con activación explícita (User-Gesture First),
 * captura de fotogramas en alta resolución, rotación de lentes (trasera/frontal) y tolerancia de permisos.
 */

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
    await startDiagnosticCamera(true);
}

/**
 * Actualiza los botones de control y el estado visual de la cámara en la UI.
 */
export function updateCameraControlsUI() {
    const video = document.getElementById('webcam');
    const previewImg = document.getElementById('nexusPreviewImg');
    const placeholder = document.getElementById('nexusPlaceholder');
    const status = document.getElementById('opencvStatus');
    const btnShot = document.getElementById('btnNexusPrimaryAction');

    const isStreaming = Boolean(state.diagnosticStream && video && video.srcObject);

    if (isStreaming) {
        if (video) {
            video.style.display = 'block';
            video.style.opacity = '1';
        }
        if (previewImg) previewImg.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';

        if (status) {
            status.innerText = "🟢 Motor Visión: Cámara en Vivo Activa (Encuadra el Envase)";
            status.style.color = "#10b981";
            status.style.borderColor = "rgba(16, 185, 129, 0.4)";
        }

        if (btnShot) {
            btnShot.innerHTML = "📸 CAPTURAR FOTOGRAMA";
            btnShot.style.background = "linear-gradient(135deg, #10b981, #059669)";
            btnShot.title = "Capturar fotograma del video en vivo";
        }
    } else {
        if (video) video.style.display = 'none';
        if (placeholder && (!previewImg || previewImg.style.display === 'none' || !previewImg.src)) {
            placeholder.style.display = 'flex';
        }

        if (status) {
            status.innerText = "🟡 Motor Visión: Listo (Toca '🎥 ENCENDER CÁMARA' o '📷 FOTO NATIVA')";
            status.style.color = "#f59e0b";
            status.style.borderColor = "rgba(245, 158, 11, 0.4)";
        }

        if (btnShot) {
            btnShot.innerHTML = "🎥 ENCENDER CÁMARA EN VIVO";
            btnShot.style.background = "linear-gradient(135deg, #ff6f00, #ea580c)";
            btnShot.title = "Toca para encender el visor de cámara en streaming";
        }
    }
}

/**
 * Captura el fotograma actual del video de cámara en vivo y devuelve Base64 JPEG.
 * @returns {string|null}
 */
export function captureCurrentVideoFrameBase64() {
    const video = document.getElementById('webcam');
    if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Aplicar filtros ópticos si están activos
        const activeFilter = window.currentOpticalFilter || 'normal';
        if (activeFilter === 'polarized') {
            ctx.filter = 'contrast(1.75) saturate(1.35) brightness(0.9)';
        } else if (activeFilter === 'carbon') {
            ctx.filter = 'contrast(2.4) grayscale(0.6) brightness(0.82)';
        } else if (activeFilter === 'cracks') {
            ctx.filter = 'invert(0.9) hue-rotate(180deg) contrast(1.8)';
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.90);
    } catch (err) {
        console.error("[Camera] Error capturando frame:", err);
        return null;
    }
}

/**
 * Acción táctica primaria del visor:
 * - Si la cámara está apagada: la enciende (gesto de usuario).
 * - Si la cámara está encendida: captura el fotograma y congela la imagen.
 */
export async function toggleNexusCameraStream() {
    const isStreaming = Boolean(state.diagnosticStream);
    if (!isStreaming) {
        showToast("Iniciando cámara en vivo...", "info");
        await startDiagnosticCamera(true);
    } else {
        if (window.nexusSnapLiveWebcam) {
            window.nexusSnapLiveWebcam();
        }
    }
}

/**
 * Inicia la cámara de diagnóstico en streaming continuo en el visor superior.
 * @param {boolean} isUserGesture - Indica si fue disparado por clic del usuario.
 */
export async function startDiagnosticCamera(isUserGesture = false) {
    const video = document.getElementById('webcam');
    const status = document.getElementById('opencvStatus');

    // Si ya está transmitiendo
    if (state.diagnosticStream && video && video.srcObject) {
        updateCameraControlsUI();
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("[Camera] mediaDevices no disponible en este protocolo/navegador.");
        updateCameraControlsUI();
        return;
    }

    if (status) {
        status.innerText = "⏳ Conectando sensor de cámara...";
        status.style.color = "rgba(255, 111, 0, 0.9)";
    }

    // Detener cualquier stream anterior
    stopDiagnosticCamera();
    await new Promise(res => setTimeout(res, 120));

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
            console.warn("[Camera] Constraint rechazado, intentando fallback:", constraints, err.name);
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

        updateCameraControlsUI();
        showToast("🎥 Cámara en vivo activa. Encuadra la botella con la retícula.", "success");
    } else {
        console.warn("[Camera] No se pudo obtener stream automático:", lastError);
        state.diagnosticStream = null;
        if (typeof window !== 'undefined') window.state = state;
        updateCameraControlsUI();

        if (isUserGesture && lastError) {
            if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
                showToast("Permiso de cámara bloqueado en el navegador. Usa '📷 FOTO NATIVA'.", "warning");
                openCameraPermissionModal("🚨 Permiso de Cámara Denegado", "danger");
            } else {
                showToast("No se pudo iniciar el video en vivo. Puedes usar '📷 FOTO NATIVA'.", "info");
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
    updateCameraControlsUI();
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
    startDiagnosticCamera(true);
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
    window.toggleNexusCameraStream = toggleNexusCameraStream;
    window.captureCurrentVideoFrameBase64 = captureCurrentVideoFrameBase64;
    window.updateCameraControlsUI = updateCameraControlsUI;
    window.openCameraPermissionModal = openCameraPermissionModal;
    window.closeCameraPermissionModal = closeCameraPermissionModal;
    window.retryCameraPermissions = retryCameraPermissions;
    window.checkCameraPermissions = checkCameraPermissions;
}
