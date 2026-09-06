with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "{/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}",
    "</div>\n\n      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
