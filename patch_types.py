with open("src/types.ts", "r") as f:
    content = f.read()

if "modo_automatico?:" not in content:
    content = content.replace("tiempo_restante_min?: number;", "tiempo_restante_min?: number;\n  volumen?: number;\n  modo_automatico?: number;\n  luces_estado?: string;")
    with open("src/types.ts", "w") as f:
        f.write(content)
