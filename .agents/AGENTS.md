# Reglas del Workspace — VitroDiag

- **Corrección Proactiva de Lints y Advertencias**: Cada vez que se realicen cambios, auditorías o se generen archivos (código Python, JavaScript, HTML o Markdown) y el IDE/terminal reporte advertencias o problemas, el agente debe proceder de forma autónoma a corregirlos de inmediato para mantener el workspace libre de alertas, sin esperar a que el usuario lo delegue explícitamente y sin necesidad de pedir autorización o confirmación previa. Esto incluye, pero no se limita a:
  - **HTML/Accesibilidad**: Errores de tipo "Form elements must have labels" (falta de `title` o `aria-label` en `<input>`, `<select>`, `<textarea>`).
  - **CSS**: Advertencias de "CSS inline styles should not be used" (reemplazar `style="..."` por clases CSS dedicadas).
  - **Markdown**: Errores de formato `MD022`, `MD032`, `MD009` (líneas en blanco antes/después de encabezados, espacios finales).
  - **Python**: Errores de sintaxis (`SyntaxError`), imports no utilizados, variables sin uso.
  - **JavaScript**: `ReferenceError`, `TypeError`, imports rotos, variables no declaradas.

- **Verificación y Limpieza Final Obligatoria tras Cada Tarea**: Al concluir cualquier tarea o solicitud, el agente DEBE realizar una inspección de lints y advertencias del IDE (`@[current_problems]`), asegurando que todos los archivos (código Python, JavaScript, HTML, CSS y Markdown) queden 100% limpios de problemas y alertas antes de finalizar el turno.

- **Sincronización Automática de Propuesta y Documentación (VitroDiag)**: Cada vez que se implemente una nueva función, módulo, parche o cambio de versión en la aplicación, el agente DEBE actualizar automáticamente la propuesta técnica oficial (`vitrodiag_propuesta_oficial.md`), el documento de información en el Escritorio (`VitroDiag_Info.txt`), el `VERSION.txt` y `README.md`, garantizando que todas las funciones, hojas de ruta y versiones coincidan 100% con la aplicación.

- **Pruebas Autónomas (mecanico1)**: Después de realizar CUALQUIER cambio en el código fuente de las aplicaciones (frontend, backend, HTML, JS, Python, etc.), el agente debe ejecutar de forma automática y autónoma el flujo de trabajo de la habilidad `mecanico1`. Esto significa que iniciará las pruebas pertinentes de la aplicación en vivo, sin necesidad de que el usuario lo ordene explícitamente y antes de dar la tarea por concluida.

- **Seguridad Autónoma (centinela1)**: Si detectas que se ha escrito código que implique interacciones con bases de datos, APIs, manipulación de archivos, ingreso de datos de usuario o configuraciones de red, el agente debe invocar a `centinela1` de forma automática. Además, cualquier vulnerabilidad clara detectada por el IDE debe ser parcheada inmediatamente sin esperar confirmación.

- **Refactorización (arquitecto1)**: Invocado para revisar deuda técnica o rediseñar funciones grandes.
- **UI/UX (disenador1)**: Invocado al crear o modificar plantillas HTML, CSS o JS para garantizar estándares estéticos premium.
- **Documentación (escriba1)**: Invocado automáticamente tras la aprobación de nuevas funciones para redactar manuales y docstrings.
- **DevOps (piloto1)**: Invocado exclusivamente cuando el código está listo para ser preparado y desplegado a producción.
