with open('main.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('if comando == "modo_automatico":'):
        lines[i] = '        ' + line

with open('main.py', 'w') as f:
    f.writelines(lines)
