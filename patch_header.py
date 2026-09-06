import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove the red top header completely
header_regex = r"\{/\* HEADER PRINCIPAL \*/\}.*?\{/\* Pestañas de Navegación del Sistema"
new_content = re.sub(header_regex, "{/* Pestañas de Navegación del Sistema", content, flags=re.DOTALL)

if content != new_content:
    with open("src/App.tsx", "w") as f:
        f.write(new_content)
    print("Header patched")
else:
    print("Header regex failed")

