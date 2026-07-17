import { state } from './state.js';

function updateSwabCountdown() {
            const diff = swabEndTime - Date.now();
            
            if (diff <= 0) {
                clearInterval(swabTimer);
                swabWidgetTime.innerText = "0s";
                triggerSwabAlarm();
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            
            // Actualizar widget
            swabWidgetTime.innerText = `${mins}m ${secs}s`;
        }

function triggerSwabAlarm() {
            swabWidget.classList.add('alarm-active');
            
            // Generar pitido agudo periódico usando Web Audio API (funciona 100% offline sin archivos de red)
            if (!state.audioCtx) {
                state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            alarmInterval = setInterval(() => {
                if (state.audioCtx.state === 'suspended') {
                    state.audioCtx.resume();
                }
                
                // Sintetizar tono
                let osc = state.audioCtx.createOscillator();
                let gain = state.audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = 1600; // Pitido agudo industrial
                
                gain.gain.setValueAtTime(0.3, state.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, state.audioCtx.currentTime + 0.4);
                
                osc.connect(gain);
                gain.connect(state.audioCtx.destination);
                
                osc.start();
                osc.stop(state.audioCtx.currentTime + 0.4);
            }, 1000);
        }

export { updateSwabCountdown, triggerSwabAlarm };
