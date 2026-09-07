with open('src/api/tmsService.ts', 'r') as f:
    content = f.read()

# Replace the network send block
import re

network_block = r"if \(\['play', 'pause', 'stop'\]\.includes\(comando\)\) \{\s*fetch\(`/api/salas/\$\{salaId\}/comando`,\s*\{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application/json' \},\s*body: JSON\.stringify\(\{ comando \}\),\s*\}\)\.catch\(\(\) => \{\}\);\s*\}"

replacement = """
    // Enviar TODO por red al backend
    let cmdPayload = { comando: comando, valor: valorExtra };
    if (comando === 'volumen_set') {
        cmdPayload = { comando: 'volumen', valor: valorExtra };
    } else if (comando === 'lampara_toggle') {
        cmdPayload = { comando: sala.lampara_encendida ? 'lamp_on' : 'lamp_off' };
    }
    
    fetch(`/api/salas/${salaId}/comando`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmdPayload),
    }).catch((e) => console.error("Error API CMD:", e));
"""

content = re.sub(network_block, replacement, content)

with open('src/api/tmsService.ts', 'w') as f:
    f.write(content)
