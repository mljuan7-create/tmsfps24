import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace the tab button text
content = content.replace("<span>📺 Pestaña 1: Supervisión (10 Cabinas)</span>", "<span>Supervisión</span>")
content = content.replace("<span>📦 Pestaña 2: Contenidos (LMS Ymagis)</span>", "<span>Contenidos</span>")
content = content.replace("<span>🔑 Pestaña 3: Llaves KDMs (Dolby SMI)</span>", "<span>Llaves KDM</span>")
content = content.replace("<span>📥 Cola de Ingestas & Protección ({cola.length})</span>", "<span>Transferencias ({cola.length})</span>")

# Remove the "Vista Conjunta" tab entirely since we only want Supervision and Contenidos
tab_vista_conjunta = r"<button\s+onClick=\{\(\) => setPestañaActiva\('todas'\)\}.*?<span>Vista Conjunta \(Dashboard Completo\)</span>\s*</button>"
content = re.sub(tab_vista_conjunta, "", content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

