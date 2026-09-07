import re

with open('src/api/tmsService.ts', 'r') as f:
    content = f.read()

# Fix the map function in sincronizarConServidorReal
pattern = r"return \{\s*\.\.\.actual,\s*\.\.\.sb,\s*volumen: actual\?\.volumen \?\? 7\.0,\s*estado_luces: actual\?\.estado_luces \?\? \(sb\.estado_reproduccion === 'PLAYING' \? 'CINE' : 'SALA'\),\s*lampara_encendida: sb\.lampara_encendida \?\? actual\?\.lampara_encendida \?\? true,\s*\};"

replacement = """return {
              ...actual,
              ...sb,
              volumen: sb.volumen !== undefined ? sb.volumen : (actual?.volumen ?? 7.0),
              estado_luces: sb.estado_luces !== undefined ? sb.estado_luces : (actual?.estado_luces ?? (sb.estado_reproduccion === 'PLAYING' ? 'CINE' : 'SALA')),
              lampara_encendida: sb.lampara_encendida !== undefined ? sb.lampara_encendida : (actual?.lampara_encendida ?? true),
            };"""

new_content = re.sub(pattern, replacement, content)

with open('src/api/tmsService.ts', 'w') as f:
    f.write(new_content)
