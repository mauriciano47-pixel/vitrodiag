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
    
    // Grace period para liberar el hardware si se acaba de apagar otra cámara
    await new Promise(res => setTimeout(res, 350));

    const video = document.getElementById('webcam');
    const status = document.getElementById('opencvStatus');
    if (!video || !status) return;

    status.innerText = "Iniciando cámara...";
    status.style.color = "rgba(255, 111, 0, 0.7)";
    
    try {
        state.diagnosticStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
        video.srcObject = state.diagnosticStream;
        video.muted = true;
        video.volume = 0;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        await video.play().catch(e => console.log("Play webcam interrumpido:", e));
        status.innerText = "Motor Visión: Activo (Nativo)";
        status.style.color = "#10b981";
        if (btnTap) btnTap.style.display = 'none';
    } catch (err) {
        console.warn("Fallo al cargar constraints recomendados de cámara. Probando fallback...", err);
        try {
            state.diagnosticStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = state.diagnosticStream;
            video.muted = true;
            video.volume = 0;
            video.setAttribute('playsinline', '');
            video.setAttribute('muted', '');
            await video.play().catch(e => console.log("Play webcam fallback interrumpido:", e));
            status.innerText = "Motor Visión: Activo (Nativo)";
            status.style.color = "#10b981";
            if (btnTap) btnTap.style.display = 'none';
        } catch (fallbackErr) {
            console.error("No se pudo iniciar la cámara: ", fallbackErr);
            state.diagnosticStream = null;
            if (btnTap) btnTap.style.display = 'block';
            const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            if (!isSecure) {
                status.innerText = "Visión: Requiere HTTPS o Localhost";
                status.style.color = "#f59e0b";
                showToast("Para usar la cámara, abre la app desde HTTPS (GitHub Pages) o localhost.", "warning");
            } else {
                status.innerText = "Visión: Tocá para Activar Cámara";
                status.style.color = "#f59e0b";
                showToast("En tu celular, presiona el botón 'TOCAR PARA INICIAR CÁMARA' para otorgar permisos.", "info");
            }
        }
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

export { startDiagnosticCamera, stopDiagnosticCamera, startScannerCamera, stopScannerCamera };
