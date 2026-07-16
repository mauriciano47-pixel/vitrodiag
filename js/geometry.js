import { state } from './state.js';
import { showToast } from './ui.js';

function mostrarResultadoDefecto(defect) {
            document.getElementById('diagTitulo').innerText = `🚨 ${defect.nombre.toUpperCase()}`;
            document.getElementById('diagGravedad').innerText = `Defecto: ${defect.gravedad}`;
            
            let gClass = "menor";
            if (defect.gravedad === "Crítico") gClass = "critico";
            else if (defect.gravedad === "Mayor") gClass = "mayor";
            
            document.getElementById('diagGravedad').className = `status-alert ${gClass}`;
            document.getElementById('diagGravedad').style.display = "inline-block";
            
            document.getElementById('diagEstado').innerHTML = `<b>Ubicación:</b> Zona del ${defect.zona.toUpperCase()}<br><b>Detalle:</b> ${defect.descripcion}`;
            
            // Renderizar las acciones correctivas
            document.getElementById('diagAcciones').innerHTML = defect.acciones.map(a => `<li>${a}</li>`).join('');
        }

export { mostrarResultadoDefecto };
