with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix the unclosed React expression at bottom
content = content.replace("      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}\n      {pestañaActiva === 'contenidos' && (\n      <div", "      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}\n      {pestañaActiva === 'contenidos' && (\n      <div")

# Fix the `</div>\n      </div>` issue that closed the wrong things
content = content.replace("      </div>\n      </div>\n      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}", "      </div>\n      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}")

# And make sure we close the `pestañaActiva === 'contenidos' && (` block correctly.
content = content.replace("        </button>\n      </div>\n      {/* MODAL FLOTANTE DE INGESTA */}", "        </button>\n      </div>\n      )}\n      {/* MODAL FLOTANTE DE INGESTA */}")

with open("src/App.tsx", "w") as f:
    f.write(content)
