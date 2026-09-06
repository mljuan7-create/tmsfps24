import re

with open("src/components/SalaControlModal.tsx", "r") as f:
    content = f.read()
content = content.replace("SalaCabina", "Sala")
with open("src/components/SalaControlModal.tsx", "w") as f:
    f.write(content)

with open("src/components/SalasGrid.tsx", "r") as f:
    content = f.read()
content = content.replace("SalaCabina", "Sala")
with open("src/components/SalasGrid.tsx", "w") as f:
    f.write(content)
