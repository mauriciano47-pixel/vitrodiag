import subprocess
import json
import os
import sys

def run_bandit():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    
    # Run bandit on the root excluding envs and agents
    cmd = [
        "bandit",
        "-r", project_root,
        "-f", "json",
        "-x", ".venv,env,venv,.agents,Agentes_Especializados,static,js",
        "-lll" # Only report High severity for automated patches, or maybe just default. Let's do default for all.
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        # Bandit returns non-zero exit code if issues are found
        
        try:
            report = json.loads(result.stdout)
        except json.JSONDecodeError:
            print("Error parsing Bandit output.")
            print(result.stdout)
            return

        issues = report.get('results', [])
        
        if not issues:
            print("✅ Centinela1 Reporte: No se encontraron vulnerabilidades en el escaneo de Python.")
            return
            
        print(f"⚠️ Centinela1 encontró {len(issues)} posibles vulnerabilidades de seguridad:\n")
        
        for issue in issues:
            severity = issue.get('issue_severity', 'UNKNOWN')
            if severity == 'HIGH':
                icon = "🔴"
            elif severity == 'MEDIUM':
                icon = "🟠"
            else:
                icon = "🟡"
                
            print(f"{icon} Severidad: {severity} | Archivo: {issue.get('filename')}:{issue.get('line_number')}")
            print(f"   Problema: {issue.get('issue_text')}")
            print(f"   Código afectado: {issue.get('code', '').strip()}")
            print("-" * 50)
            
        print("\n🔍 Instrucción para el agente: Analiza cada uno de estos reportes y aplica el parche adecuado en el código fuente de forma autónoma.")
            
    except FileNotFoundError:
        print("❌ Error: 'bandit' no está instalado en el entorno. Por favor, ejecuta 'pip install bandit'.")

if __name__ == "__main__":
    run_bandit()
