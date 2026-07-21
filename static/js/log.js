import { state } from './state.js';
import { showToast } from './ui.js';
import { DEFECTOS_DB } from './db.js';

function populateLogDefectSelect() {
    const select = document.getElementById('logDefectSelect');
    if (!select) return;
    select.innerHTML = DEFECTOS_DB.map(d => 
        `<option value="${d.id}">${d.nombre} (${d.zona.toUpperCase()})</option>`
    ).join('');
}

let db = null;

function initLogDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn("IndexedDB no soportado o bloqueado. La bitácora no funcionará.");
            reject(new Error("IndexedDB no soportado"));
            return;
        }
        try {
            const request = indexedDB.open('VitroDiagDB', 1);
            request.onupgradeneeded = function(e) {
                const tempDb = e.target.result;
                if (!tempDb.objectStoreNames.contains('bitacora')) {
                    tempDb.createObjectStore('bitacora', { keyPath: 'id' });
                }
            };
            request.onsuccess = function(e) {
                db = e.target.result;
                db.onerror = function(event) {
                    console.error("Database global error: ", event.target.error);
                };
                resolve(db);
            };
            request.onerror = function(e) {
                console.error("Error al abrir IndexedDB:", e);
                reject(e);
            };
        } catch (e) {
            console.error("Excepción síncrona al abrir IndexedDB:", e);
            reject(e);
        }
    });
}

async function loadBitacoraFromStorage() {
    try {
        if (!db) await initLogDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['bitacora'], 'readonly');
            const store = transaction.objectStore('bitacora');
            const request = store.getAll();
            
            request.onsuccess = function(e) {
                const data = e.target.result || [];
                // Ordenar descendente para que lo más nuevo salga primero
                data.sort((a, b) => b.id - a.id);
                state.bitacoraList = data;
                renderBitacoraList();
                resolve();
            };
            request.onerror = reject;
        });
    } catch (err) {
        console.error("Fallo al cargar bitácora de IndexedDB:", err);
    }
}

async function saveLogItemToDB(item) {
    if (!db) await initLogDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['bitacora'], 'readwrite');
        const store = transaction.objectStore('bitacora');
        const request = store.put(item);
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}

function renderBitacoraList() {
    const logListContainer = document.getElementById('logListContainer');
    if (!logListContainer) return;
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

async function deleteLogItem(id) {
    try {
        if (!db) await initLogDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['bitacora'], 'readwrite');
            const store = transaction.objectStore('bitacora');
            const request = store.delete(id);
            
            request.onsuccess = function() {
                state.bitacoraList = state.bitacoraList.filter(item => item.id !== id);
                renderBitacoraList();
                showToast("Incidencia eliminada de la bitácora.", "info");
                resolve();
            };
            request.onerror = reject;
        });
    } catch (err) {
        console.error("Error eliminando registro:", err);
    }
}

function setupLogEventListeners() {
    const btnAddLog = document.getElementById('btnAddLog');
    const btnShareLog = document.getElementById('btnShareLog');
    const logSection = document.getElementById('logSection');
    const logCavity = document.getElementById('logCavity');
    const logDefectSelect = document.getElementById('logDefectSelect');

    if (btnAddLog) {
        btnAddLog.addEventListener('click', async () => {
            const defectId = logDefectSelect.value;
            const defectObj = DEFECTOS_DB.find(d => d.id === defectId);
            
            if (!defectObj) return;

            const newItem = {
                id: Date.now(),
                section: logSection.value,
                cavity: logCavity.value,
                defectName: defectObj.nombre,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            try {
                await saveLogItemToDB(newItem);
                state.bitacoraList.unshift(newItem); // Añadir al inicio visualmente
                renderBitacoraList();
                showToast(`Registrado en sección ${newItem.section} - Gota ${newItem.cavity}: ${newItem.defectName}`, 'success');
            } catch (err) {
                console.error("Error guardando en IndexedDB:", err);
                showToast("Error al guardar la incidencia.", "danger");
            }
        });
    }

    if (btnShareLog) {
        btnShareLog.addEventListener('click', () => {
            if (state.bitacoraList.length === 0) {
                showToast("La bitácora está vacía. Registra algún defecto primero.", 'warning');
                return;
            }

            let reportText = `📋 *VITRODIAG - REPORTE DE TURNO MAQUINA I.S.*\n`;
            reportText += `_Fecha: ${new Date().toLocaleDateString()}_\n\n`;
            
            state.bitacoraList.forEach((item, index) => {
                reportText += `${index + 1}. *[Sección ${item.section} - Gota ${item.cavity}]* ➔ ${item.defectName} (${item.time})\n`;
            });
            
            reportText += `\n_Enviado desde VitroDiag (Sistema SOP / NNPB Offline)_`;

            navigator.clipboard.writeText(reportText)
            .then(() => {
                showToast("¡Reporte copiado al portapapeles! Listo para WhatsApp.", 'success');
            })
            .catch(err => {
                console.error("Error al copiar reporte: ", err);
                showToast("No se pudo copiar. Intentando compartir...", 'info');
                if (navigator.share) {
                    navigator.share({
                        title: 'Reporte de Máquina IS',
                        text: reportText
                    });
                }
            });
        });
    }
}

// Exponer deleteLogItem al ámbito global
window.deleteLogItem = deleteLogItem;

export { populateLogDefectSelect, loadBitacoraFromStorage, renderBitacoraList, setupLogEventListeners };
