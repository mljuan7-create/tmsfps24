import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Change default tab to 'supervision'
content = content.replace("useState<'todas' | 'supervision' | 'contenidos'>('todas')", "useState<'supervision' | 'contenidos' | 'kdms' | 'cola'>('supervision')")

# Simplify Header and Tabs
# Let's replace the whole top navigation section and the content rendering.

# Find the section to replace: from {/* HEADER PRINCIPAL */} up to {/* SECCIÓN SUPERIOR: Grid */}
regex_header_tabs = r"\{/\* HEADER PRINCIPAL \*/\}.*?\{/\* SECCIÓN SUPERIOR: Grid de 10 Salas"
new_header_tabs = """{/* HEADER PRINCIPAL MINIMALISTA */}
      <div className="bg-[#111318] border-b border-zinc-800/80 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-500/10 rounded flex items-center justify-center border border-sky-500/30">
                <Video className="w-5 h-5 text-sky-400" />
              </div>
              <h1 className="text-lg font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                TMS <span className="text-zinc-500 font-light">| PARQUE ASTUR</span>
              </h1>
            </div>

            {/* PESTAÑAS PRINCIPALES */}
            <div className="flex h-full">
              <button
                onClick={() => setPestañaActiva('supervision')}
                className={`px-5 h-full flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
                  pestañaActiva === 'supervision'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <MonitorPlay className="w-4 h-4" />
                Supervisión
              </button>
              <button
                onClick={() => setPestañaActiva('contenidos')}
                className={`px-5 h-full flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
                  pestañaActiva === 'contenidos'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Film className="w-4 h-4" />
                Contenidos
              </button>
              <button
                onClick={() => setModalKdmAbierto(true)}
                className={`px-5 h-full flex items-center gap-2 font-medium text-sm transition-colors border-b-2 border-transparent text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/30`}
              >
                <Key className="w-4 h-4" />
                Llaves (KDM)
              </button>
              <button
                onClick={() => setDrawerColaAbierto(true)}
                className={`px-5 h-full flex items-center gap-2 font-medium text-sm transition-colors border-b-2 border-transparent text-zinc-400 hover:text-red-400 hover:bg-zinc-800/30`}
              >
                <ListOrdered className="w-4 h-4" />
                Transferencias
                {cola.length > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold ml-1">{cola.length}</span>
                )}
              </button>
            </div>

            {/* Acciones Rápidas (Derecha) */}
            <div className="flex items-center gap-2">
              <button
                onClick={simularAlertaRojaIngesta}
                className="p-2 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                title="Simular protección (Alerta Roja)"
              >
                <AlertOctagon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalDocAbierto(true)}
                className="p-2 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                title="Información técnica"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-64px)] overflow-auto">
        {/* SECCIÓN SUPERIOR: Grid de 10 Salas"""
content = re.sub(regex_header_tabs, new_header_tabs, content, flags=re.DOTALL)


# Now update the conditional renders for the grids:
# {(pestañaActiva === 'todas' || pestañaActiva === 'supervision') && (
content = content.replace(
    "{(pestañaActiva === 'todas' || pestañaActiva === 'supervision') && (",
    "{pestañaActiva === 'supervision' && ("
)

# {(pestañaActiva === 'todas' || pestañaActiva === 'contenidos') && (
content = content.replace(
    "{(pestañaActiva === 'todas' || pestañaActiva === 'contenidos') && (",
    "{pestañaActiva === 'contenidos' && ("
)

# Only show the floating Ingest button when in 'contenidos'
content = content.replace(
    "<div className=\"fixed bottom-6 right-6 z-40\">",
    "{pestañaActiva === 'contenidos' && (\n      <div className=\"fixed bottom-6 right-6 z-40\">"
)
content = content.replace(
    "        </button>\n      </div>\n\n      {/* MODAL FLOTANTE DE INGESTA */}",
    "        </button>\n      </div>\n      )}\n\n      {/* MODAL FLOTANTE DE INGESTA */}"
)

# We need to wrap the whole layout to remove the outer container padding we just hardcoded in the header
# The root div has: <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-red-900/50 flex flex-col">
# Wait, let's just make sure it's correct.

with open("src/App.tsx", "w") as f:
    f.write(content)

