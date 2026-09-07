with open('main.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('    @app.post("/api/kdms/cargar")'):
        for j in range(i+2, len(lines)):
            if lines[j].strip() == '':
                continue
            if not lines[j].startswith(' ' * 8):
                if lines[j].startswith('    '):
                    lines[j] = '    ' + lines[j] # add 4 more spaces
                else:
                    lines[j] = '        ' + lines[j]

with open('main.py', 'w') as f:
    f.writelines(lines)
