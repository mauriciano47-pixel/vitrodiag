import re
import json
import ast

with open('static/js/db.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

start_idx = js_content.find('export const DEFECTOS_DB = [')
end_idx = js_content.find('// GENERAR ILUSTRACIÓN VECTORIAL')

if start_idx != -1 and end_idx != -1:
    raw_array_str = js_content[start_idx + len('export const DEFECTOS_DB = '):end_idx].strip()
    if raw_array_str.endswith(';'):
        raw_array_str = raw_array_str[:-1].strip()
else:
    raise ValueError("Could not find DEFECTOS_DB bounds")

# Strip single line comments // ...
clean_str = re.sub(r'//.*', '', raw_array_str)

# Quote unquoted keys for JSON
py_str = re.sub(r'(\b[a-zA-Z0-9_]+\b)\s*:', r'"\1":', clean_str)

try:
    defects = json.loads(py_str)
    print("JSON parsed defects count:", len(defects))
except Exception as e:
    print("JSON parse failed, trying ast.literal_eval:", e)
    defects = ast.literal_eval(clean_str)
    print("AST parsed defects count:", len(defects))

def generate_svg(d):
    zona = (d.get('zona') or '').lower()
    nombre = (d.get('nombre') or '').lower()
    colorDefect = "#ef4444"
    colorGlass = "rgba(255, 111, 0, 0.4)"
    bottlePath = "M 42 22 L 42 12 L 58 12 L 58 22 L 68 32 L 68 84 Q 68 88 64 88 L 36 88 Q 32 88 32 84 L 32 32 Z"
    if any(k in nombre for k in ["doblado", "caída", "caído", "inclinada", "inclinado"]):
        bottlePath = "M 42 22 L 35 12 L 51 9 L 56 22 L 68 32 L 68 84 Q 68 88 64 88 L 36 88 Q 32 88 32 84 L 32 32 Z"
    
    highlightX = 50
    highlightY = 50
    if zona == 'boca': highlightY = 14
    elif zona == 'cuello': highlightY = 27
    elif zona == 'cuerpo': highlightY = 55
    elif zona == 'fondo': highlightY = 82

    extra = ""
    if any(k in nombre for k in ["grieta", "fisura", "pelo", "planchado"]):
        extra = f'<path d="M {highlightX-5} {highlightY-5} L {highlightX} {highlightY} L {highlightX-3} {highlightY+5} L {highlightX+5} {highlightY+8}" fill="none" stroke="{colorDefect}" stroke-width="2" stroke-linecap="round" />'
    elif any(k in nombre for k in ["incompleta", "incompleto", "corto"]) and zona == 'boca':
        extra = '<path d="M 39 11 L 46 11 L 43 15 Z" fill="#0e1013" stroke="none" />'
    elif any(k in nombre for k in ["sucio", "marca", "grafito", "lubricante", "carbón"]):
        extra = f'<circle cx="{highlightX-4}" cy="{highlightY-3}" r="1.5" fill="#4a5568" /><circle cx="{highlightX+3}" cy="{highlightY+1}" r="1" fill="#1a202c" /><circle cx="{highlightX}" cy="{highlightY+4}" r="2" fill="#2d3748" />'
    elif any(k in nombre for k in ["burbuja", "ampolla", "semilla"]):
        extra = f'<circle cx="{highlightX-3}" cy="{highlightY-2}" r="2.5" fill="none" stroke="{colorDefect}" stroke-width="1" /><circle cx="{highlightX+4}" cy="{highlightY+3}" r="1.5" fill="none" stroke="{colorDefect}" stroke-width="1" />'
    elif any(k in nombre for k in ["delgado", "espesor"]):
        extra = f'<path d="M 66 35 L 66 80" fill="none" stroke="{colorDefect}" stroke-width="2" stroke-dasharray="3,2" />'
    else:
        extra = f'<circle cx="{highlightX}" cy="{highlightY-4}" r="2.5" fill="{colorDefect}" /><line x1="{highlightX}" y1="{highlightY+1}" x2="{highlightX}" y2="{highlightY+7}" stroke="{colorDefect}" stroke-width="2.5" stroke-linecap="round" />'

    return f'<svg viewBox="0 0 100 100" class="defect-svg-demo"><path d="{bottlePath}" fill="none" stroke="{colorGlass}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="{highlightX}" cy="{highlightY}" r="11" fill="none" stroke="{colorDefect}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" class="pulse-ring" />{extra}</svg>'

html_cards = []
for d in defects:
    nombre = d.get('nombre', '')
    zona = d.get('zona', '')
    gravedad = d.get('gravedad', 'Menor')
    gClass = 'critico' if gravedad == 'Crítico' else ('mayor' if gravedad == 'Mayor' else 'menor')
    descr = d.get('descripcion', '')
    causas = d.get('causas', [])
    acciones = d.get('acciones', [])
    svg = generate_svg(d)

    causas_html = ''.join(f'<li>{c}</li>' for c in causas)
    acciones_html = ''.join(f'<li>{a}</li>' for a in acciones)

    card = f'''        <div class="defect-item" data-zone="{zona}">
            <div class="defect-header" onclick="toggleDefectCard(this)">
                <div class="defect-header-left">
                    <span class="defect-name">{nombre}</span>
                    <div class="defect-meta">
                        <span class="defect-zone">{zona}</span>
                        <span class="status-alert {gClass}">{gravedad}</span>
                    </div>
                </div>
                <span class="defect-arrow">▼</span>
            </div>
            <div class="defect-body">
                <div class="defect-content defect-grid-layout">
                    <div class="defect-info-col">
                        <div class="defect-desc">{descr}</div>
                        <div class="section-title">🔍 Causas Comunes:</div>
                        <ul class="list-items">
                            {causas_html}
                        </ul>
                        <div class="section-title">🛠️ Corrección en Máquina IS:</div>
                        <ul class="list-items" style="color: #cbd5e1;">
                            {acciones_html}
                        </ul>
                    </div>
                    <div class="defect-visual-col">
                        {svg}
                        <span class="defect-visual-label">Ubicación</span>
                    </div>
                </div>
            </div>
        </div>'''
    html_cards.append(card)

full_cards_html = '\n'.join(html_cards)
print("Total HTML cards generated:", len(html_cards))

for filename in ['index.html', 'templates/index.html']:
    with open(filename, 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    # Replace contents inside <div class="defects-list" id="defectsContainer">...</div>
    new_content = re.sub(
        r'(<div class="defects-list" id="defectsContainer">).*?(</div>\s*</div>\s*<!-- MODAL INTERACTIVO)',
        r'\1\n' + full_cards_html + r'\n        \2',
        file_content,
        flags=re.DOTALL
    )
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Injected static cards into {filename}")

print("Pre-rendering complete!")
