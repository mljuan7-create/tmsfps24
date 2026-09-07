with open('main.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('@app.get("/api/librerias/contenido")'):
        lines[i] = '    ' + line
        break

with open('main.py', 'w') as f:
    f.writelines(lines)
