# Reglas del Workspace — VitroDiag

- **Corrección Proactiva de Lints y Advertencias**: Cada vez que se realicen cambios, auditorías o se generen archivos (código Python, JavaScript, HTML o Markdown) y el IDE/terminal reporte advertencias o problemas, el agente debe proceder de forma autónoma a corregirlos de inmediato para mantener el workspace libre de alertas, sin esperar a que el usuario lo delegue explícitamente y sin necesidad de pedir autorización o confirmación previa. Esto incluye, pero no se limita a:
  - **HTML/Accesibilidad**: Errores de tipo "Form elements must have labels" (falta de `title` o `aria-label` en `<input>`, `<select>`, `<textarea>`).
  - **CSS**: Advertencias de "CSS inline styles should not be used" (reemplazar `style="..."` por clases CSS dedicadas).
  - **Markdown**: Errores de formato `MD022`, `MD032`, `MD009` (líneas en blanco antes/después de encabezados, espacios finales).
  - **Python**: Errores de sintaxis (`SyntaxError`), imports no utilizados, variables sin uso.
  - **JavaScript**: `ReferenceError`, `TypeError`, imports rotos, variables no declaradas.
