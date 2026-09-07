with open('main.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip().startswith('if comando == "lamp_on"'):
        start_idx = i
        break
        
for i in range(start_idx+1, len(lines)):
    if lines[i].strip() == 'if __name__ == "__main__":':
        break
    if lines[i].strip() != '':
        lines[i] = '    ' + lines[i]

with open('main.py', 'w') as f:
    f.writelines(lines)
