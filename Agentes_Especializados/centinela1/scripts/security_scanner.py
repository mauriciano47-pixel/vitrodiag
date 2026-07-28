import subprocess
import json
import os
import sys

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def run_bandit():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    
    # Run bandit module if installed via python -m bandit or bandit CLI
    cmd = [
        sys.executable, "-m", "bandit",
        "-r", project_root,
        "-f", "json",
        "-x", ".venv,env,venv,.agents,Agentes_Especializados,static,js,scratch,db.sqlite3"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        
        try:
            report = json.loads(result.stdout)
        except json.JSONDecodeError:
            # Fallback to bandit binary directly if python -m bandit failed
            cmd_cli = [
                "bandit",
                "-r", project_root,
                "-f", "json",
                "-x", ".venv,env,venv,.agents,Agentes_Especializados,static,js,scratch,db.sqlite3"
            ]
            try:
                result = subprocess.run(cmd_cli, capture_output=True, text=True, encoding='utf-8', errors='replace')
                report = json.loads(result.stdout)
            except Exception:
                print("[!] Centinela1: Bandit output could not be parsed as JSON or bandit is not installed.")
                return

        issues = report.get('results', [])
        
        if not issues:
            print("[OK] Centinela1 Reporte: No se encontraron vulnerabilidades en el escaneo de Python.")
            return
            
        print(f"[!] Centinela1 encontro {len(issues)} posibles observaciones de seguridad:\n")
        
        for issue in issues:
            severity = issue.get('issue_severity', 'UNKNOWN')
            if severity == 'HIGH':
                icon = "[HIGH]"
            elif severity == 'MEDIUM':
                icon = "[MED]"
            else:
                icon = "[LOW]"
                
            print(f"{icon} Severidad: {severity} | Archivo: {issue.get('filename')}:{issue.get('line_number')}")
            print(f"   Problema: {issue.get('issue_text')}")
            print(f"   Codigo afectado: {issue.get('code', '').strip()}")
            print("-" * 50)
            
        print("\n[*] Instruccion para el agente: Analiza cada uno de estos reportes y aplica el parche adecuado en el codigo fuente de forma autonoma.")
            
    except Exception as e:
        print(f"[!] Centinela1 Scanner info: {e}")

if __name__ == "__main__":
    run_bandit()

