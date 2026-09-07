with open('main.py', 'r') as f:
    lines = f.readlines()

new_lines = []
in_app_block = False
for line in lines:
    if line.startswith('@app.'):
        in_app_block = True
    if in_app_block:
        if line.startswith(' ' * 4) or line.strip() == '':
            pass # already indented or empty
        else:
            line = '    ' + line
            # Check if this is the last line of a block (we don't really know, just indent everything until if __name__ == "__main__":)
    if line.strip() == 'if __name__ == "__main__":':
        in_app_block = False
        line = line.lstrip() # remove indent if we accidentally indented it
        
    new_lines.append(line)

with open('main.py', 'w') as f:
    f.writelines(new_lines)
