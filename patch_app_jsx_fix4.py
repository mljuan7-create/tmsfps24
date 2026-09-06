with open("src/App.tsx", "r") as f:
    content = f.read()

# Let's completely rewrite the render structure since regex patching caused nested unclosed tags.
# Instead of wrestling with partial replacements, let's fix it surgically.

# Line 324 error is likely the unmatched `)}` from earlier.
content = content.replace("        </button>\n      </div>\n      )}\n      {/* MODAL FLOTANTE DE INGESTA */}", "        </button>\n      </div>\n      )}\n      {/* MODAL FLOTANTE DE INGESTA */}")

# Let's find all `{` and `}` matches manually.
# Actually it's easier to just do this:
# Let's dump lines 320 to 350
