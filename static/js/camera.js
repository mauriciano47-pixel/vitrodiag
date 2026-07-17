import { state } from './state.js';
import { showToast } from './ui.js';

const video = document.getElementById('webcam');
const status = document.getElementById('opencvStatus');
const cameraConstraints = {
    video: { 
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }, 
    audio: false 
};

async function startDiagnosticCamera() {
            if (state.diagnosticStream) return;
            
            status.innerText = "Iniciando cámara...";
            status.style.color = "rgba(255, 111, 0, 0.7)";
            
            try {
                state.diagnosticStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
                video.srcObject = state.diagnosticStream;
                video.setAttribute('playsinline', '');
                video.play();
                status.innerText = "Motor Visión: Activo (Nativo)";
                status.style.color = "#10b981";
            } catch (err) {
                console.warn("Fallo al cargar constraints recomendados de cámara. Probando fallback...", err);
                try {
                    state.diagnosticStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    video.srcObject = state.diagnosticStream;
                    video.setAttribute('playsinline', '');
                    video.play();
                    status.innerText = "Motor Visión: Activo (Nativo)";
                    status.style.color = "#10b981";
                } catch (fallbackErr) {
                    console.error("No se pudo iniciar la cámara: ", fallbackErr);
                    status.innerText = "Visión: Sin cámara";
                    status.style.color = "#ef4444";
                    showToast("No se pudo acceder a la cámara trasera. Otorga los permisos en tu navegador.", "warning");
                }
            }
        }

function stopDiagnosticCamera() {
            if (state.diagnosticStream) {
                state.diagnosticStream.getTracks().forEach(track => track.stop());
                state.diagnosticStream = null;
            }
            video.srcObject = null;
        }

async function startScannerCamera() {
            const video = document.getElementById('scannerVideo');
            if (!video) return;

            if (state.scannerStream) stopScannerCamera();

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
                video.play();
                showToast("Cámara de escáner iniciada.", "success");
            } catch (err) {
                console.warn("Fallo al iniciar cámara de escáner con constraints. Usando fallback...", err);
                try {
                    state.scannerStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    video.srcObject = state.scannerStream;
                    video.setAttribute('playsinline', '');
                    video.play();
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
            if (video) video.srcObject = null;
        }

window.startScannerCamera = startScannerCamera;
window.stopScannerCamera = stopScannerCamera;

export { startDiagnosticCamera, stopDiagnosticCamera, startScannerCamera, stopScannerCamera };
