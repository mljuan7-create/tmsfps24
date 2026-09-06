import os
import re

# 1. Update tmsService.ts
tms_path = "src/api/tmsService.ts"
with open(tms_path, "r") as f:
    tms_content = f.read()

if "public enviarComando(" not in tms_content:
    new_method = """
  public enviarComando(salaId: number, comando: string): boolean {
    const sala = this.salas.find((s) => s.id === salaId);
    if (!sala) return false;
    
    if (comando === 'play') sala.estado_reproduccion = 'PLAYING';
    if (comando === 'stop') sala.estado_reproduccion = 'IDLE';
    if (comando === 'pause') sala.estado_reproduccion = 'PAUSED';
    
    // Si se detiene, reiniciamos minutaje para simular
    if (comando === 'stop') {
      sala.minutaje_actual_min = 0;
      sala.tiempo_restante_min = sala.duracion_total_min || 0;
    }
    
    this.persist();
    return true;
  }
"""
    # Insert before the end of the class
    tms_content = tms_content.replace("public getKdms(): KdmInventario[] {", new_method + "\n  public getKdms(): KdmInventario[] {")
    with open(tms_path, "w") as f:
        f.write(tms_content)


# 2. Update App.tsx
app_path = "src/App.tsx"
with open(app_path, "r") as f:
    app_content = f.read()

if "const enviarComandoSala =" not in app_content:
    # Add enviarComandoSala
    app_content = app_content.replace(
        "const toggleEstadoSala = (id: number) => {",
        """const enviarComandoSala = (id: number, comando: 'play' | 'pause' | 'stop') => {
    tmsApi.enviarComando(id, comando);
    actualizarDatos();
    mostrarToast(`Comando '${comando.toUpperCase()}' enviado a la sala ${id}`, 'info');
  };

  const toggleEstadoSala = (id: number) => {"""
    )
    
    # Update SalasGrid props
    app_content = app_content.replace(
        "onToggleEstadoSala={toggleEstadoSala}",
        "onToggleEstadoSala={toggleEstadoSala}\n          onEnviarComandoSala={enviarComandoSala}"
    )
    with open(app_path, "w") as f:
        f.write(app_content)


# 3. Update SalasGrid.tsx
grid_path = "src/components/SalasGrid.tsx"
with open(grid_path, "r") as f:
    grid_content = f.read()

if "onEnviarComandoSala" not in grid_content:
    # Update props interface
    grid_content = grid_content.replace(
        "onToggleEstadoSala: (id: number) => void;",
        "onToggleEstadoSala: (id: number) => void;\n  onEnviarComandoSala?: (id: number, comando: 'play'|'pause'|'stop') => void;"
    )
    
    # Update component signature
    grid_content = grid_content.replace(
        "onToggleEstadoSala,\n}:",
        "onToggleEstadoSala,\n  onEnviarComandoSala,\n}:"
    )
    
    # Import Pause icon
    if "Pause," not in grid_content:
        grid_content = grid_content.replace("Play,", "Play, Pause,")
    
    # Replace the single button with the control strip
    old_button_regex = r"\{/\* Estado de Reproducción con botón de alternancia \*/\}.*?</button>"
    
    new_buttons = """{/* Controles de Reproducción Reales */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 ${
                      isPlaying
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                        : sala.estado_reproduccion === 'PAUSED'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}>
                      {isPlaying && <Play className="w-2.5 h-2.5 fill-emerald-400" />}
                      {sala.estado_reproduccion === 'PAUSED' && <Pause className="w-2.5 h-2.5 fill-amber-400" />}
                      {!isPlaying && sala.estado_reproduccion !== 'PAUSED' && <Square className="w-2.5 h-2.5 fill-zinc-500" />}
                      <span>{sala.estado_reproduccion}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => onEnviarComandoSala && onEnviarComandoSala(sala.id, 'play')}
                        className="p-1.5 rounded bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/80 transition"
                        title="Reproducir (Play)"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      <button 
                        onClick={() => onEnviarComandoSala && onEnviarComandoSala(sala.id, 'pause')}
                        className="p-1.5 rounded bg-amber-950/80 text-amber-400 hover:bg-amber-900 border border-amber-800/80 transition"
                        title="Pausar (Pause)"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                      </button>
                      <button 
                        onClick={() => onEnviarComandoSala && onEnviarComandoSala(sala.id, 'stop')}
                        className="p-1.5 rounded bg-red-950/80 text-red-400 hover:bg-red-900 border border-red-800/80 transition"
                        title="Detener (Stop)"
                      >
                        <Square className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>"""
    
    grid_content = re.sub(old_button_regex, new_buttons, grid_content, flags=re.DOTALL)
    
    with open(grid_path, "w") as f:
        f.write(grid_content)

print("UI Patched Successfully")
