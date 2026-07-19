import { state } from './state.js';
import { showToast } from './ui.js';

let swabEndTime = 0;
let swabTimer = null;
let alarmInterval = null;

// ⚠️ FIX #2: Las refs DOM se resuelven de forma lazy (dentro de initSwabModule)
// para garantizar que el DOM esté disponible antes de acceder a los elementos.
let swabWidget = null;
let swabWidgetTime = null;

function updateSwabCountdown() {
    const diff = swabEndTime - Date.now();
    
    if (diff <= 0) {
        clearInterval(swabTimer);
        swabTimer = null;
        if (swabWidgetTime) swabWidgetTime.innerText = "0s";
        triggerSwabAlarm();
        return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    
    if (swabWidgetTime) swabWidgetTime.innerText = `${mins}m ${secs}s`;
}

function triggerSwabAlarm() {
    if (swabWidget) swabWidget.classList.add('alarm-active');
    
    // Alarma solo visual a petición del usuario.
    showToast("¡Tiempo de Swabbing alcanzado! Por favor, lubrique el equipo.", "danger");
    
    alarmInterval = setInterval(() => {
        if (swabWidget) {
            swabWidget.classList.toggle('alarm-active');
        }
    }, 500);
}

function stopSwabAlarm() {
    // ⚠️ FIX #12: También limpiar swabTimer para evitar intervalos duplicados
    if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
    if (swabTimer) { clearInterval(swabTimer); swabTimer = null; }
    if (swabWidget) {
        swabWidget.classList.remove('alarm-active');
        swabWidget.classList.add('d-none');
    }
}

export function initSwabModule() {
    // Resolver refs DOM aquí, cuando el DOM ya está disponible
    swabWidget = document.getElementById('swabWidget');
    swabWidgetTime = document.getElementById('swabWidgetTime');

    const btnStartSwab = document.getElementById('btnStartSwab');
    const swabInterval = document.getElementById('swabInterval');
    const swabLastTime = document.getElementById('swabLastTime');
    
    if (swabWidget) {
        swabWidget.addEventListener('click', () => {
            stopSwabAlarm();
            showToast("Alarma de swabbing silenciada y detenida.", "success");
        });
    }

    if (btnStartSwab && swabInterval) {
        btnStartSwab.addEventListener('click', () => {
            const minutes = parseInt(swabInterval.value) || 15;
            swabEndTime = Date.now() + (minutes * 60 * 1000);
            
            // Detener cualquier ciclo previo antes de iniciar uno nuevo
            if (swabTimer) { clearInterval(swabTimer); swabTimer = null; }
            if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
            if (swabWidget) {
                swabWidget.classList.remove('alarm-active');
                swabWidget.classList.remove('d-none');
            }
            
            swabTimer = setInterval(updateSwabCountdown, 1000);
            updateSwabCountdown();
            
            const now = new Date();
            if (swabLastTime) swabLastTime.innerText = `Último Swabbing registrado: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            showToast(`Temporizador de swabbing iniciado por ${minutes} minutos.`, "success");
        });
    }
}
