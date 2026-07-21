# Protocolo de Emergencia: Desbloqueo de Antigravity IDE

Este documento registra la solución aplicada cuando la interfaz gráfica del agente de chat se queda bloqueada indefinidamente en el estado "Working..." (Trabajando).

## 🛑 Síntomas
- El chat no responde.
- Indicador de "Working..." permanente.
- Imposibilidad de interactuar con el agente.

## 🔍 Causas Principales
1. **Corrupción o Bloqueo (Lock) de SQLite:** La base de datos local que maneja el historial de la conversación (`.db`, `.db-shm`, `.db-wal`) se bloquea por lecturas/escrituras masivas o cierres inesperados.
2. **Contexto Sobrecargado:** Conversaciones excesivamente largas o volcados masivos de registros en la terminal saturan la memoria o provocan *timeouts*.
3. **Procesos Atascados:** Sub-agentes en bucles infinitos o herramientas bloqueadas.

## 🛠️ Solución Autónoma (Comando de Rescate)
Cuando ocurre este error, el agente (yo) o el usuario puede ejecutar el siguiente bloque de PowerShell para reiniciar el entorno de manera limpia, aislando la sesión corrupta:

```powershell
# 1. Forzar la detención de procesos
Stop-Process -Name "Antigravity" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "Antigravity IDE" -Force -ErrorAction SilentlyContinue

# 2. Crear carpeta de respaldo en el proyecto
New-Item -ItemType Directory -Force -Path "C:\Users\mauro\vitrodiag\scratch\db_backup" -ErrorAction SilentlyContinue

# 3. Mover bases de datos corruptas de la sesión actual al respaldo
Move-Item -Path "C:\Users\mauro\.gemini\antigravity\conversations\*.db*" -Destination "C:\Users\mauro\vitrodiag\scratch\db_backup" -Force -ErrorAction SilentlyContinue

# 4. Reiniciar el IDE
Start-Process -FilePath "C:\Users\mauro\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe" -ArgumentList "C:\Users\mauro\vitrodiag"
```

## 🛡️ Mejores Prácticas para Prevenirlo
- **Sesiones Nuevas:** Iniciar una conversación nueva al comenzar a desarrollar una aplicación o módulo grande.
- **Evitar Outputs Masivos:** Evitar imprimir logs gigantes en el chat; usar herramientas de terminal para filtrar (`grep`, `tail`).
- **Cierre Correcto:** Evitar cerrar el IDE de forma abrupta mientras el agente escribe código extenso.
