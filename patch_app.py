with open("src/App.tsx", "r") as f:
    content = f.read()

# Modify background classes
content = content.replace('bg-zinc-950', 'bg-[#0d0d0d]')
content = content.replace('bg-zinc-900', 'bg-[#121212]')

with open("src/App.tsx", "w") as f:
    f.write(content)
