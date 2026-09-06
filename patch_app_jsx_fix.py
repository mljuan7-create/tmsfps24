import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# We need to make sure the main container div is closed properly.
# The error says line 224 `<div className="min-h-screen...` has no closing tag.
# In `patch_clean_header.py`, we replaced `header_and_tabs_regex` (which included `{/* Header Principal */}` to `{/* SECCIÓN SUPERIOR: Grid`)
# Let's check how the file ends.

content = content.replace("  );\n}", "  );\n};\n\nexport default App;")

if "</div>\n    </div>\n  );\n}" in content:
    # Too many divs closed? No, the issue is that we probably missed closing a div inside the header replacement.
    pass

# Let's look at what we injected in `patch_clean_header.py`:
# <div className="bg-[#111318] ...>
#   <div className="max-w-[1800px] ...>
#     <div className="flex items-center ...>
# ...
#          </div>
#        </div>
#      </div>
#      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-6">

# Wait, the last `div` we opened in the patch was `<div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-6">`
# This div wraps the rest of the application (SalasGrid, Contenidos, Modals) and was never closed!

# Let's add the closing tag before the toast block or right at the end of the return statement.
# The original structure before patch was:
# </div> (closing something)
# {/* TOAST */}
# </div> (closing main min-h-screen)
# );

# Let's close that wrapper div right before the fixed floating elements (like modals or toast).
# Or just right before the final closing div.

# Let's find the end of the ContenidosAccordion
fix_regex = r"(\{/\* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' \*/\})"
content = re.sub(fix_regex, r"</div>\n      \1", content)

# Also let's fix the extra `}` at line 403
# The error says TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
content = content.replace("      )}\n\n      {/* MODAL FLOTANTE DE INGESTA */}", "      {/* MODAL FLOTANTE DE INGESTA */}")

with open("src/App.tsx", "w") as f:
    f.write(content)
