import { state } from './state.js';
import { showToast } from './ui.js';

function populateLogDefectSelect() {
            logDefectSelect.innerHTML = DEFECTOS_DB.map(d => 
                `<option value="${d.id}">${d.nombre} (${d.zona.toUpperCase()})</option>`
            ).join('');
        }

function loadBitacoraFromStorage() {
            const saved = localStorage.getItem('vitrodiag_bitacora');
            if (saved) {
                state.bitacoraList = JSON.parse(saved);
                renderBitacoraList();
            }
        }

function renderBitacoraList() {
            if (state.bitacoraList.length === 0) {
                logListContainer.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:10px;">Sin incidencias registradas en el turno.</div>';
                return;
            }

            logListContainer.innerHTML = state.bitacoraList.map(item => `
                <div class="log-item">
                    <div class="log-info">
                        <div style="font-weight:bold;color:#fff;">${item.defectName}</div>
                        <div class="log-meta">Sección ${item.section} | Cavidad ${item.cavity}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="log-meta">${item.time}</span>
                        <button class="btn-delete-log" onclick="deleteLogItem(${item.id})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

export { populateLogDefectSelect, loadBitacoraFromStorage, renderBitacoraList };
